package storage

import (
	"database/sql"
	"fmt"
	_ "github.com/mattn/go-sqlite3"
	"mqtt-fuzzer/internal/fuzzer"
	"time"
)

type TestResult string

const (
	ResultNormalResponse TestResult = "normal_response"
	ResultDisconnect     TestResult = "disconnect"
	ResultTimeout        TestResult = "timeout"
	ResultCrash          TestResult = "crash"
)

type SeverityLevel string

const (
	SeverityCritical SeverityLevel = "CRITICAL"
	SeverityHigh     SeverityLevel = "HIGH"
	SeverityMedium   SeverityLevel = "MEDIUM"
	SeverityLow      SeverityLevel = "LOW"
)

type TestCaseRecord struct {
	ID             int64
	TestSessionID  string
	ConnectionID   int
	PacketType     string
	MutationType   fuzzer.MutationType
	Description    string
	Result         TestResult
	ResponseTimeMs int64
	RawPacket      []byte
	ErrorMessage   string
	Timestamp      time.Time
	Severity       SeverityLevel
}

type TestSession struct {
	ID            string
	TargetHost    string
	TargetPort    int
	MQTTVersion   string
	StartTime     time.Time
	EndTime       *time.Time
	TotalCases    int
	CompletedCases int
	Status        string
}

type Storage struct {
	db *sql.DB
}

func NewStorage(dbPath string) (*Storage, error) {
	db, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}

	s := &Storage{db: db}
	if err := s.initSchema(); err != nil {
		return nil, fmt.Errorf("init schema: %w", err)
	}

	return s, nil
}

func (s *Storage) initSchema() error {
	schema := `
	CREATE TABLE IF NOT EXISTS test_sessions (
		id TEXT PRIMARY KEY,
		target_host TEXT NOT NULL,
		target_port INTEGER NOT NULL,
		mqtt_version TEXT NOT NULL,
		start_time DATETIME NOT NULL,
		end_time DATETIME,
		total_cases INTEGER DEFAULT 0,
		completed_cases INTEGER DEFAULT 0,
		status TEXT NOT NULL
	);

	CREATE TABLE IF NOT EXISTS test_case_records (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		test_session_id TEXT NOT NULL,
		connection_id INTEGER NOT NULL,
		packet_type TEXT NOT NULL,
		mutation_type TEXT NOT NULL,
		description TEXT,
		result TEXT NOT NULL,
		response_time_ms INTEGER,
		raw_packet BLOB,
		error_message TEXT,
		timestamp DATETIME NOT NULL,
		severity TEXT NOT NULL,
		FOREIGN KEY (test_session_id) REFERENCES test_sessions(id)
	);

	CREATE INDEX IF NOT EXISTS idx_records_session ON test_case_records(test_session_id);
	CREATE INDEX IF NOT EXISTS idx_records_result ON test_case_records(result);
	CREATE INDEX IF NOT EXISTS idx_records_severity ON test_case_records(severity);
	`

	_, err := s.db.Exec(schema)
	return err
}

func (s *Storage) Close() error {
	return s.db.Close()
}

func (s *Storage) CreateSession(session *TestSession) error {
	_, err := s.db.Exec(`
		INSERT INTO test_sessions (id, target_host, target_port, mqtt_version, start_time, status)
		VALUES (?, ?, ?, ?, ?, ?)
	`, session.ID, session.TargetHost, session.TargetPort, session.MQTTVersion, session.StartTime, session.Status)
	return err
}

func (s *Storage) UpdateSessionProgress(sessionID string, completedCases int) error {
	_, err := s.db.Exec(`
		UPDATE test_sessions SET completed_cases = ? WHERE id = ?
	`, completedCases, sessionID)
	return err
}

func (s *Storage) CompleteSession(sessionID string, totalCases int) error {
	now := time.Now()
	_, err := s.db.Exec(`
		UPDATE test_sessions SET end_time = ?, total_cases = ?, completed_cases = ?, status = 'completed' WHERE id = ?
	`, now, totalCases, totalCases, sessionID)
	return err
}

func (s *Storage) StopSession(sessionID string) error {
	now := time.Now()
	_, err := s.db.Exec(`
		UPDATE test_sessions SET end_time = ?, status = 'stopped' WHERE id = ?
	`, now, sessionID)
	return err
}

func (s *Storage) GetSession(sessionID string) (*TestSession, error) {
	var session TestSession
	var endTime sql.NullTime

	err := s.db.QueryRow(`
		SELECT id, target_host, target_port, mqtt_version, start_time, end_time, total_cases, completed_cases, status
		FROM test_sessions WHERE id = ?
	`, sessionID).Scan(
		&session.ID, &session.TargetHost, &session.TargetPort, &session.MQTTVersion,
		&session.StartTime, &endTime, &session.TotalCases, &session.CompletedCases, &session.Status,
	)

	if err != nil {
		return nil, err
	}

	if endTime.Valid {
		session.EndTime = &endTime.Time
	}

	return &session, nil
}

func (s *Storage) GetActiveSession() (*TestSession, error) {
	var session TestSession
	var endTime sql.NullTime

	err := s.db.QueryRow(`
		SELECT id, target_host, target_port, mqtt_version, start_time, end_time, total_cases, completed_cases, status
		FROM test_sessions WHERE status = 'running' ORDER BY start_time DESC LIMIT 1
	`).Scan(
		&session.ID, &session.TargetHost, &session.TargetPort, &session.MQTTVersion,
		&session.StartTime, &endTime, &session.TotalCases, &session.CompletedCases, &session.Status,
	)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	if endTime.Valid {
		session.EndTime = &endTime.Time
	}

	return &session, nil
}

func calculateSeverity(result TestResult) SeverityLevel {
	switch result {
	case ResultCrash:
		return SeverityCritical
	case ResultDisconnect:
		return SeverityHigh
	case ResultTimeout:
		return SeverityMedium
	default:
		return SeverityLow
	}
}

func (s *Storage) InsertRecord(record *TestCaseRecord) error {
	if record.Severity == "" {
		record.Severity = calculateSeverity(record.Result)
	}
	if record.Timestamp.IsZero() {
		record.Timestamp = time.Now()
	}

	_, err := s.db.Exec(`
		INSERT INTO test_case_records (
			test_session_id, connection_id, packet_type, mutation_type, description,
			result, response_time_ms, raw_packet, error_message, timestamp, severity
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, record.TestSessionID, record.ConnectionID, record.PacketType, record.MutationType,
		record.Description, record.Result, record.ResponseTimeMs, record.RawPacket,
		record.ErrorMessage, record.Timestamp, record.Severity)
	return err
}

func (s *Storage) GetRecordsBySession(sessionID string) ([]*TestCaseRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, test_session_id, connection_id, packet_type, mutation_type, description,
		       result, response_time_ms, error_message, timestamp, severity
		FROM test_case_records WHERE test_session_id = ? ORDER BY timestamp DESC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*TestCaseRecord
	for rows.Next() {
		r := &TestCaseRecord{}
		err := rows.Scan(&r.ID, &r.TestSessionID, &r.ConnectionID, &r.PacketType,
			&r.MutationType, &r.Description, &r.Result, &r.ResponseTimeMs,
			&r.ErrorMessage, &r.Timestamp, &r.Severity)
		if err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, nil
}

func (s *Storage) GetCrashRecords(sessionID string) ([]*TestCaseRecord, error) {
	rows, err := s.db.Query(`
		SELECT id, test_session_id, connection_id, packet_type, mutation_type, description,
		       result, response_time_ms, error_message, timestamp, severity
		FROM test_case_records WHERE test_session_id = ? AND result = ? ORDER BY timestamp DESC
	`, sessionID, ResultCrash)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*TestCaseRecord
	for rows.Next() {
		r := &TestCaseRecord{}
		err := rows.Scan(&r.ID, &r.TestSessionID, &r.ConnectionID, &r.PacketType,
			&r.MutationType, &r.Description, &r.Result, &r.ResponseTimeMs,
			&r.ErrorMessage, &r.Timestamp, &r.Severity)
		if err != nil {
			return nil, err
		}
		records = append(records, r)
	}
	return records, nil
}

type MutationStats struct {
	MutationType  string
	TotalCount    int
	AnomalyCount  int
	CrashCount    int
	AnomalyRate   float64
}

func (s *Storage) GetMutationStats(sessionID string) ([]*MutationStats, error) {
	rows, err := s.db.Query(`
		SELECT mutation_type,
		       COUNT(*) as total,
		       SUM(CASE WHEN result IN ('disconnect', 'timeout', 'crash') THEN 1 ELSE 0 END) as anomalies,
		       SUM(CASE WHEN result = 'crash' THEN 1 ELSE 0 END) as crashes
		FROM test_case_records
		WHERE test_session_id = ?
		GROUP BY mutation_type
		ORDER BY anomalies DESC
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stats []*MutationStats
	for rows.Next() {
		ms := &MutationStats{}
		err := rows.Scan(&ms.MutationType, &ms.TotalCount, &ms.AnomalyCount, &ms.CrashCount)
		if err != nil {
			return nil, err
		}
		if ms.TotalCount > 0 {
			ms.AnomalyRate = float64(ms.AnomalyCount) / float64(ms.TotalCount) * 100
		}
		stats = append(stats, ms)
	}
	return stats, nil
}

func (s *Storage) GetResultCounts(sessionID string) (map[TestResult]int, error) {
	rows, err := s.db.Query(`
		SELECT result, COUNT(*) FROM test_case_records WHERE test_session_id = ? GROUP BY result
	`, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	counts := make(map[TestResult]int)
	for rows.Next() {
		var result TestResult
		var count int
		if err := rows.Scan(&result, &count); err != nil {
			return nil, err
		}
		counts[result] = count
	}
	return counts, nil
}
