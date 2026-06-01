package store

import (
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	_ "github.com/mattn/go-sqlite3"

	bpfpb "github.com/ebpf-net-audit/audit-engine/user/bpf"
)

type Store struct {
	db    *sql.DB
	mu    sync.Mutex
	batch []*ConnectionRecord
	batchSize int
}

type ConnectionRecord struct {
	Timestamp   time.Time
	PID         uint32
	UID         uint32
	Comm        string
	SourceIP    string
	DestIP      string
	SourcePort  uint16
	DestPort    uint16
	Protocol    string
	TCPFlags    string
	PacketSize  uint16
	Direction   uint8
	EventType   uint8
}

type BlockRecord struct {
	Timestamp   time.Time
	PID         uint32
	UID         uint32
	Comm        string
	SourceIP    string
	DestIP      string
	SourcePort  uint16
	DestPort    uint16
	Protocol    string
	RuleType    uint8
	RuleID      uint32
	Reason      string
}

type SampleRecord struct {
	Timestamp   time.Time
	PID         uint32
	UID         uint32
	Comm        string
	SourceIP    string
	DestIP      string
	SourcePort  uint16
	DestPort    uint16
	Protocol    string
	PayloadLen  uint16
	Payload     string
}

type RuleRecord struct {
	ID          uint32
	Type        uint8
	Action      uint8
	Enabled     bool
	Comm        string
	IP          string
	Mask        uint32
	Port        uint16
	Protocol    uint8
	Domain      string
	CreatedAt   time.Time
}

type QueryFilter struct {
	Comm       string
	SourceIP   string
	DestIP     string
	SourcePort uint16
	DestPort   uint16
	Protocol   string
	StartTime  time.Time
	EndTime    time.Time
	Limit      int
	Offset     int
}

func NewStore(dbPath string, batchSize int) (*Store, error) {
	db, err := sql.Open("sqlite3", dbPath+"?_journal_mode=WAL&_busy_timeout=5000&_cache_size=-64000")
	if err != nil {
		return nil, fmt.Errorf("open db: %w", err)
	}

	s := &Store{
		db:        db,
		batchSize: batchSize,
		batch:     make([]*ConnectionRecord, 0, batchSize),
	}

	if err := s.initSchema(); err != nil {
		return nil, fmt.Errorf("init schema: %w", err)
	}

	go s.flushLoop()

	return s, nil
}

func (s *Store) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS connections (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME NOT NULL,
		pid INTEGER NOT NULL,
		uid INTEGER NOT NULL,
		comm TEXT NOT NULL,
		source_ip TEXT NOT NULL,
		dest_ip TEXT NOT NULL,
		source_port INTEGER NOT NULL,
		dest_port INTEGER NOT NULL,
		protocol TEXT NOT NULL,
		tcp_flags TEXT,
		packet_size INTEGER NOT NULL,
		direction INTEGER NOT NULL,
		event_type INTEGER NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_conn_timestamp ON connections(timestamp);
	CREATE INDEX IF NOT EXISTS idx_conn_comm ON connections(comm);
	CREATE INDEX IF NOT EXISTS idx_conn_source_ip ON connections(source_ip);
	CREATE INDEX IF NOT EXISTS idx_conn_dest_ip ON connections(dest_ip);
	CREATE INDEX IF NOT EXISTS idx_conn_protocol ON connections(protocol);
	CREATE INDEX IF NOT EXISTS idx_conn_dest_port ON connections(dest_port);

	CREATE TABLE IF NOT EXISTS blocked_connections (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME NOT NULL,
		pid INTEGER NOT NULL,
		uid INTEGER NOT NULL,
		comm TEXT NOT NULL,
		source_ip TEXT NOT NULL,
		dest_ip TEXT NOT NULL,
		source_port INTEGER NOT NULL,
		dest_port INTEGER NOT NULL,
		protocol TEXT NOT NULL,
		rule_type INTEGER NOT NULL,
		rule_id INTEGER NOT NULL,
		reason TEXT NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_blocked_timestamp ON blocked_connections(timestamp);
	CREATE INDEX IF NOT EXISTS idx_blocked_comm ON blocked_connections(comm);
	CREATE INDEX IF NOT EXISTS idx_blocked_dest_ip ON blocked_connections(dest_ip);

	CREATE TABLE IF NOT EXISTS samples (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME NOT NULL,
		pid INTEGER NOT NULL,
		uid INTEGER NOT NULL,
		comm TEXT NOT NULL,
		source_ip TEXT NOT NULL,
		dest_ip TEXT NOT NULL,
		source_port INTEGER NOT NULL,
		dest_port INTEGER NOT NULL,
		protocol TEXT NOT NULL,
		payload_len INTEGER NOT NULL,
		payload BLOB NOT NULL
	);

	CREATE INDEX IF NOT EXISTS idx_samples_timestamp ON samples(timestamp);
	CREATE INDEX IF NOT EXISTS idx_samples_comm ON samples(comm);

	CREATE TABLE IF NOT EXISTS rules (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		type INTEGER NOT NULL,
		action INTEGER NOT NULL,
		enabled INTEGER NOT NULL DEFAULT 1,
		comm TEXT,
		ip TEXT,
		mask INTEGER,
		port INTEGER,
		protocol INTEGER,
		domain TEXT,
		created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS stats (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		total_connections INTEGER NOT NULL DEFAULT 0,
		blocked_connections INTEGER NOT NULL DEFAULT 0,
		samples_collected INTEGER NOT NULL DEFAULT 0,
		cpu_usage REAL NOT NULL DEFAULT 0,
		mem_usage INTEGER NOT NULL DEFAULT 0
	);
	`

	_, err := s.db.Exec(schema)
	return err
}

func (s *Store) InsertConnection(event *bpfpb.ConnectionEvent) {
	rec := &ConnectionRecord{
		Timestamp:  time.Unix(0, int64(event.Meta.Timestamp)),
		PID:        event.Meta.PID,
		UID:        event.Meta.UID,
		Comm:       event.CommString(),
		SourceIP:   event.Meta.SourceIP().String(),
		DestIP:     event.Meta.DestIP().String(),
		SourcePort: event.Meta.SourcePort(),
		DestPort:   event.Meta.DestPort(),
		Protocol:   event.Meta.ProtocolName(),
		TCPFlags:   event.Meta.TCPFlagsString(),
		PacketSize: event.Meta.PktSize,
		Direction:  event.Direction,
		EventType:  event.EventType,
	}

	s.mu.Lock()
	s.batch = append(s.batch, rec)
	if len(s.batch) >= s.batchSize {
		s.flushBatchLocked()
	}
	s.mu.Unlock()
}

func (s *Store) InsertBlock(event *bpfpb.BlockEvent) {
	rec := &BlockRecord{
		Timestamp:  time.Unix(0, int64(event.Meta.Timestamp)),
		PID:        event.Meta.PID,
		UID:        event.Meta.UID,
		Comm:       event.CommString(),
		SourceIP:   event.Meta.SourceIP().String(),
		DestIP:     event.Meta.DestIP().String(),
		SourcePort: event.Meta.SourcePort(),
		DestPort:   event.Meta.DestPort(),
		Protocol:   event.Meta.ProtocolName(),
		RuleType:   event.RuleType,
		RuleID:     event.RuleID,
		Reason:     event.ReasonString(),
	}

	go func() {
		_, err := s.db.Exec(`
			INSERT INTO blocked_connections (
				timestamp, pid, uid, comm, source_ip, dest_ip,
				source_port, dest_port, protocol, rule_type, rule_id, reason
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, rec.Timestamp, rec.PID, rec.UID, rec.Comm, rec.SourceIP, rec.DestIP,
			rec.SourcePort, rec.DestPort, rec.Protocol, rec.RuleType, rec.RuleID, rec.Reason)
		if err != nil {
			log.Printf("Insert block error: %v", err)
		}
	}()
}

func (s *Store) InsertSample(event *bpfpb.SampleEvent) {
	rec := &SampleRecord{
		Timestamp:  time.Unix(0, int64(event.Meta.Timestamp)),
		PID:        event.Meta.PID,
		UID:        event.Meta.UID,
		Comm:       string(event.Meta.Comm[:clen(event.Meta.Comm[:])]),
		SourceIP:   event.Meta.SourceIP().String(),
		DestIP:     event.Meta.DestIP().String(),
		SourcePort: event.Meta.SourcePort(),
		DestPort:   event.Meta.DestPort(),
		Protocol:   event.Meta.ProtocolName(),
		PayloadLen: event.PayloadLen,
		Payload:    hex.EncodeToString(event.Payload[:event.PayloadLen]),
	}

	go func() {
		_, err := s.db.Exec(`
			INSERT INTO samples (
				timestamp, pid, uid, comm, source_ip, dest_ip,
				source_port, dest_port, protocol, payload_len, payload
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, rec.Timestamp, rec.PID, rec.UID, rec.Comm, rec.SourceIP, rec.DestIP,
			rec.SourcePort, rec.DestPort, rec.Protocol, rec.PayloadLen, rec.Payload)
		if err != nil {
			log.Printf("Insert sample error: %v", err)
		}
	}()
}

func (s *Store) flushLoop() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		if len(s.batch) > 0 {
			s.flushBatchLocked()
		}
		s.mu.Unlock()
	}
}

func (s *Store) flushBatchLocked() {
	if len(s.batch) == 0 {
		return
	}

	tx, err := s.db.Begin()
	if err != nil {
		log.Printf("Begin tx error: %v", err)
		return
	}

	stmt, err := tx.Prepare(`
		INSERT INTO connections (
			timestamp, pid, uid, comm, source_ip, dest_ip,
			source_port, dest_port, protocol, tcp_flags, packet_size,
			direction, event_type
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		tx.Rollback()
		log.Printf("Prepare stmt error: %v", err)
		return
	}
	defer stmt.Close()

	for _, rec := range s.batch {
		_, err := stmt.Exec(
			rec.Timestamp, rec.PID, rec.UID, rec.Comm,
			rec.SourceIP, rec.DestIP, rec.SourcePort, rec.DestPort,
			rec.Protocol, rec.TCPFlags, rec.PacketSize,
			rec.Direction, rec.EventType,
		)
		if err != nil {
			log.Printf("Insert conn error: %v", err)
		}
	}

	if err := tx.Commit(); err != nil {
		log.Printf("Commit tx error: %v", err)
	}

	s.batch = s.batch[:0]
}

func (s *Store) QueryConnections(filter QueryFilter) ([]ConnectionRecord, int64, error) {
	query := `SELECT timestamp, pid, uid, comm, source_ip, dest_ip,
		source_port, dest_port, protocol, tcp_flags, packet_size,
		direction, event_type FROM connections WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM connections WHERE 1=1`
	args := []interface{}{}
	countArgs := []interface{}{}
	argIdx := 1

	if filter.Comm != "" {
		query += fmt.Sprintf(" AND comm = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND comm = $%d", argIdx)
		args = append(args, filter.Comm)
		countArgs = append(countArgs, filter.Comm)
		argIdx++
	}

	if filter.SourceIP != "" {
		query += fmt.Sprintf(" AND source_ip = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND source_ip = $%d", argIdx)
		args = append(args, filter.SourceIP)
		countArgs = append(countArgs, filter.SourceIP)
		argIdx++
	}

	if filter.DestIP != "" {
		query += fmt.Sprintf(" AND dest_ip = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND dest_ip = $%d", argIdx)
		args = append(args, filter.DestIP)
		countArgs = append(countArgs, filter.DestIP)
		argIdx++
	}

	if filter.DestPort > 0 {
		query += fmt.Sprintf(" AND dest_port = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND dest_port = $%d", argIdx)
		args = append(args, filter.DestPort)
		countArgs = append(countArgs, filter.DestPort)
		argIdx++
	}

	if filter.Protocol != "" {
		query += fmt.Sprintf(" AND protocol = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND protocol = $%d", argIdx)
		args = append(args, filter.Protocol)
		countArgs = append(countArgs, filter.Protocol)
		argIdx++
	}

	if !filter.StartTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp >= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND timestamp >= $%d", argIdx)
		args = append(args, filter.StartTime)
		countArgs = append(countArgs, filter.StartTime)
		argIdx++
	}

	if !filter.EndTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp <= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND timestamp <= $%d", argIdx)
		args = append(args, filter.EndTime)
		countArgs = append(countArgs, filter.EndTime)
		argIdx++
	}

	query += " ORDER BY timestamp DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", filter.Limit)
	}
	if filter.Offset > 0 {
		query += fmt.Sprintf(" OFFSET %d", filter.Offset)
	}

	var total int64
	if err := s.db.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count: %w", err)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var records []ConnectionRecord
	for rows.Next() {
		var rec ConnectionRecord
		err := rows.Scan(
			&rec.Timestamp, &rec.PID, &rec.UID, &rec.Comm,
			&rec.SourceIP, &rec.DestIP, &rec.SourcePort, &rec.DestPort,
			&rec.Protocol, &rec.TCPFlags, &rec.PacketSize,
			&rec.Direction, &rec.EventType,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan: %w", err)
		}
		records = append(records, rec)
	}

	return records, total, nil
}

func (s *Store) QueryBlocked(filter QueryFilter) ([]BlockRecord, int64, error) {
	query := `SELECT timestamp, pid, uid, comm, source_ip, dest_ip,
		source_port, dest_port, protocol, rule_type, rule_id, reason
		FROM blocked_connections WHERE 1=1`
	countQuery := `SELECT COUNT(*) FROM blocked_connections WHERE 1=1`
	args := []interface{}{}
	countArgs := []interface{}{}
	argIdx := 1

	if filter.Comm != "" {
		query += fmt.Sprintf(" AND comm = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND comm = $%d", argIdx)
		args = append(args, filter.Comm)
		countArgs = append(countArgs, filter.Comm)
		argIdx++
	}

	if filter.DestIP != "" {
		query += fmt.Sprintf(" AND dest_ip = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND dest_ip = $%d", argIdx)
		args = append(args, filter.DestIP)
		countArgs = append(countArgs, filter.DestIP)
		argIdx++
	}

	if !filter.StartTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp >= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND timestamp >= $%d", argIdx)
		args = append(args, filter.StartTime)
		countArgs = append(countArgs, filter.StartTime)
		argIdx++
	}

	if !filter.EndTime.IsZero() {
		query += fmt.Sprintf(" AND timestamp <= $%d", argIdx)
		countQuery += fmt.Sprintf(" AND timestamp <= $%d", argIdx)
		args = append(args, filter.EndTime)
		countArgs = append(countArgs, filter.EndTime)
		argIdx++
	}

	query += " ORDER BY timestamp DESC"

	if filter.Limit > 0 {
		query += fmt.Sprintf(" LIMIT %d", filter.Limit)
	}

	var total int64
	if err := s.db.QueryRow(countQuery, countArgs...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count: %w", err)
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query: %w", err)
	}
	defer rows.Close()

	var records []BlockRecord
	for rows.Next() {
		var rec BlockRecord
		err := rows.Scan(
			&rec.Timestamp, &rec.PID, &rec.UID, &rec.Comm,
			&rec.SourceIP, &rec.DestIP, &rec.SourcePort, &rec.DestPort,
			&rec.Protocol, &rec.RuleType, &rec.RuleID, &rec.Reason,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan: %w", err)
		}
		records = append(records, rec)
	}

	return records, total, nil
}

func (s *Store) InsertRule(rule *RuleRecord) (uint32, error) {
	res, err := s.db.Exec(`
		INSERT INTO rules (type, action, enabled, comm, ip, mask, port, protocol, domain)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, rule.Type, rule.Action, rule.Enabled, rule.Comm, rule.IP,
		rule.Mask, rule.Port, rule.Protocol, rule.Domain)
	if err != nil {
		return 0, err
	}
	id, err := res.LastInsertId()
	return uint32(id), err
}

func (s *Store) DeleteRule(id uint32) error {
	_, err := s.db.Exec("DELETE FROM rules WHERE id = ?", id)
	return err
}

func (s *Store) ListRules() ([]RuleRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, type, action, enabled, comm, ip, mask, port, protocol, domain, created_at
		FROM rules ORDER BY id
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rules []RuleRecord
	for rows.Next() {
		var rule RuleRecord
		err := rows.Scan(&rule.ID, &rule.Type, &rule.Action, &rule.Enabled,
			&rule.Comm, &rule.IP, &rule.Mask, &rule.Port, &rule.Protocol,
			&rule.Domain, &rule.CreatedAt)
		if err != nil {
			return nil, err
		}
		rules = append(rules, rule)
	}
	return rules, nil
}

func (s *Store) InsertStats(totalConns, blockedConns, samples int64, cpuUsage float64, memUsage int64) error {
	_, err := s.db.Exec(`
		INSERT INTO stats (total_connections, blocked_connections, samples_collected, cpu_usage, mem_usage)
		VALUES (?, ?, ?, ?, ?)
	`, totalConns, blockedConns, samples, cpuUsage, memUsage)
	return err
}

func (s *Store) Close() error {
	s.mu.Lock()
	s.flushBatchLocked()
	s.mu.Unlock()
	return s.db.Close()
}

func clen(b []byte) int {
	for i, v := range b {
		if v == 0 {
			return i
		}
	}
	return len(b)
}

func intToIP(ip uint32) []byte {
	return []byte{
		byte(ip >> 24),
		byte(ip >> 16),
		byte(ip >> 8),
		byte(ip),
	}
}

func ntohs(port uint16) uint16 {
	return (port >> 8) | (port << 8)
}
