package fuzzer

import (
	"context"
	"fmt"
	"log"
	"mqtt-fuzzer/internal/mqtt"
	"mqtt-fuzzer/internal/storage"
	"net"
	"runtime"
	"sync"
	"sync/atomic"
	"syscall"
	"time"
)

type Duration time.Duration

func (d Duration) MarshalYAML() (interface{}, error) {
	return int(d), nil
}

func (d *Duration) UnmarshalYAML(unmarshal func(interface{}) error) error {
	var v int
	if err := unmarshal(&v); err != nil {
		return err
	}
	*d = Duration(v)
	return nil
}

type Config struct {
	TargetHost     string `yaml:"target_host"`
	TargetPort     int    `yaml:"target_port"`
	MQTTVersion    string `yaml:"mqtt_version"`
	ClientIDPrefix string `yaml:"client_id_prefix"`
	Username       string `yaml:"username"`
	Password       string `yaml:"password"`

	ConcurrentConnections int `yaml:"concurrent_connections"`

	ShortTimeout      Duration `yaml:"short_timeout"`
	LongTimeout       Duration `yaml:"long_timeout"`
	Timeout           Duration `yaml:"timeout"`

	TestIterations       int `yaml:"test_iterations"`
	ConnectionReuseCount int `yaml:"connection_reuse_count"`

	EnabledPacketTypes   []string `yaml:"enabled_packet_types"`
	EnabledMutationTypes []string `yaml:"enabled_mutation_types"`
}

func (c *Config) GetTimeout(mutation MutationType) time.Duration {
	switch mutation.Category() {
	case CategoryLengthRelated:
		if c.ShortTimeout > 0 {
			return time.Duration(c.ShortTimeout) * time.Second
		}
		return 2 * time.Second
	case CategoryProtocolState:
		if c.LongTimeout > 0 {
			return time.Duration(c.LongTimeout) * time.Second
		}
		return 30 * time.Second
	default:
		if c.Timeout > 0 {
			return time.Duration(c.Timeout) * time.Second
		}
		return 5 * time.Second
	}
}

type PooledConnection struct {
	conn       net.Conn
	connID     int
	lastUsed   time.Time
	usageCount int
	mu         sync.Mutex
}

func (pc *PooledConnection) Close() {
	pc.mu.Lock()
	defer pc.mu.Unlock()
	if pc.conn != nil {
		pc.conn.Close()
		pc.conn = nil
	}
}

func (pc *PooledConnection) IsValid() bool {
	pc.mu.Lock()
	defer pc.mu.Unlock()
	return pc.conn != nil
}

func (pc *PooledConnection) SetDeadlines(timeout time.Duration) {
	pc.mu.Lock()
	defer pc.mu.Unlock()
	if tc, ok := pc.conn.(*net.TCPConn); ok {
		tc.SetReadDeadline(time.Now().Add(timeout))
		tc.SetWriteDeadline(time.Now().Add(timeout))
	}
}

type ConnectionPool struct {
	addr        string
	timeout     time.Duration
	maxReuse    int
	connections chan *PooledConnection
	mu          sync.Mutex
	connCount   int32
}

func NewConnectionPool(addr string, maxConns int, timeout time.Duration, maxReuse int) *ConnectionPool {
	if maxReuse <= 0 {
		maxReuse = 100
	}
	return &ConnectionPool{
		addr:        addr,
		timeout:     timeout,
		maxReuse:    maxReuse,
		connections: make(chan *PooledConnection, maxConns),
	}
}

func (cp *ConnectionPool) Get(connID int) (*PooledConnection, error) {
	select {
	case pc := <-cp.connections:
		if pc != nil && pc.IsValid() && pc.usageCount < cp.maxReuse {
			return pc, nil
		}
		if pc != nil {
			pc.Close()
		}
	default:
	}

	return cp.createNew(connID)
}

func (cp *ConnectionPool) createNew(connID int) (*PooledConnection, error) {
	conn, err := net.DialTimeout("tcp", cp.addr, cp.timeout)
	if err != nil {
		return nil, err
	}

	atomic.AddInt32(&cp.connCount, 1)
	return &PooledConnection{
		conn:       conn,
		connID:     connID,
		lastUsed:   time.Now(),
		usageCount: 0,
	}, nil
}

func (cp *ConnectionPool) Put(pc *PooledConnection) {
	if pc == nil || !pc.IsValid() {
		atomic.AddInt32(&cp.connCount, -1)
		return
	}

	pc.usageCount++
	pc.lastUsed = time.Now()

	select {
	case cp.connections <- pc:
	default:
		pc.Close()
		atomic.AddInt32(&cp.connCount, -1)
	}
}

func (cp *ConnectionPool) Close() {
	close(cp.connections)
	for pc := range cp.connections {
		if pc != nil {
			pc.Close()
		}
	}
}

func (cp *ConnectionPool) ActiveCount() int32 {
	return atomic.LoadInt32(&cp.connCount)
}

type Engine struct {
	config  *Config
	storage *storage.Storage
	mutator *Mutator
	pool    *ConnectionPool

	running    atomic.Bool
	sessionID  string
	cancelFunc context.CancelFunc

	completedCases atomic.Int64
	totalCases     int64

	mu sync.Mutex
}

func SetFileDescriptorLimit(limit uint64) error {
	if runtime.GOOS != "linux" && runtime.GOOS != "darwin" {
		log.Printf("Warning: setting file descriptor limit is only supported on Linux/macOS")
		return nil
	}

	var rLimit syscall.Rlimit
	if err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rLimit); err != nil {
		return fmt.Errorf("get rlimit: %w", err)
	}

	log.Printf("Current file descriptor limit: soft=%d, hard=%d", rLimit.Cur, rLimit.Max)

	if rLimit.Max < limit {
		log.Printf("Warning: requested limit %d exceeds hard limit %d, using hard limit", limit, rLimit.Max)
		limit = rLimit.Max
	}

	rLimit.Cur = limit
	if err := syscall.Setrlimit(syscall.RLIMIT_NOFILE, &rLimit); err != nil {
		return fmt.Errorf("set rlimit: %w", err)
	}

	if err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rLimit); err == nil {
		log.Printf("Updated file descriptor limit: soft=%d, hard=%d", rLimit.Cur, rLimit.Max)
	}

	return nil
}

func NewEngine(config *Config, store *storage.Storage) *Engine {
	if config.ConnectionReuseCount <= 0 {
		config.ConnectionReuseCount = 100
	}

	if err := SetFileDescriptorLimit(65535); err != nil {
		log.Printf("Warning: failed to set file descriptor limit: %v", err)
	}

	return &Engine{
		config:  config,
		storage: store,
		mutator: NewMutator(),
	}
}

func (e *Engine) Start(ctx context.Context) (string, error) {
	if e.running.Load() {
		return "", fmt.Errorf("fuzzer is already running")
	}

	sessionID := fmt.Sprintf("session_%d", time.Now().UnixNano())

	version := "3.1.1"
	if e.config.MQTTVersion == "5.0" {
		version = "5.0"
	}

	session := &storage.TestSession{
		ID:           sessionID,
		TargetHost:   e.config.TargetHost,
		TargetPort:   e.config.TargetPort,
		MQTTVersion:  version,
		StartTime:    time.Now(),
		Status:       "running",
	}

	if err := e.storage.CreateSession(session); err != nil {
		return "", fmt.Errorf("create session: %w", err)
	}

	ctx, cancel := context.WithCancel(ctx)

	e.sessionID = sessionID
	e.cancelFunc = cancel
	e.running.Store(true)
	e.completedCases.Store(0)

	addr := fmt.Sprintf("%s:%d", e.config.TargetHost, e.config.TargetPort)
	connTimeout := 5 * time.Second
	if e.config.Timeout > 0 {
		connTimeout = time.Duration(e.config.Timeout) * time.Second
	}
	e.pool = NewConnectionPool(
		addr,
		e.config.ConcurrentConnections,
		connTimeout,
		e.config.ConnectionReuseCount,
	)

	totalMutations := e.calculateTotalMutations()
	e.totalCases = int64(e.config.TestIterations) * int64(e.config.ConcurrentConnections) * int64(totalMutations)

	log.Printf("Starting fuzzing session: %s", sessionID)
	log.Printf("Target: %s, MQTT %s", addr, version)
	log.Printf("Concurrent connections: %d, Test iterations: %d", e.config.ConcurrentConnections, e.config.TestIterations)
	log.Printf("Total test cases: %d", e.totalCases)
	log.Printf("Connection reuse count: %d", e.config.ConnectionReuseCount)

	go e.runFuzzing(ctx)

	return sessionID, nil
}

func (e *Engine) Stop() error {
	if !e.running.Load() {
		return fmt.Errorf("fuzzer is not running")
	}

	if e.cancelFunc != nil {
		e.cancelFunc()
	}

	e.running.Store(false)
	e.storage.StopSession(e.sessionID)

	if e.pool != nil {
		e.pool.Close()
	}

	return nil
}

func (e *Engine) GetProgress() (float64, int64, int64) {
	if e.totalCases == 0 {
		return 0, 0, 0
	}
	completed := e.completedCases.Load()
	progress := float64(completed) / float64(e.totalCases) * 100
	return progress, completed, e.totalCases
}

func (e *Engine) IsRunning() bool {
	return e.running.Load()
}

func (e *Engine) SessionID() string {
	return e.sessionID
}

func (e *Engine) ActiveConnections() int32 {
	if e.pool != nil {
		return e.pool.ActiveCount()
	}
	return 0
}

func (e *Engine) calculateTotalMutations() int {
	count := 0
	for _, pt := range e.config.EnabledPacketTypes {
		var packetType byte
		switch pt {
		case "CONNECT":
			packetType = mqtt.PacketTypeCONNECT
		case "PUBLISH":
			packetType = mqtt.PacketTypePUBLISH
		case "SUBSCRIBE":
			packetType = mqtt.PacketTypeSUBSCRIBE
		case "UNSUBSCRIBE":
			packetType = mqtt.PacketTypeUNSUBSCRIBE
		case "DISCONNECT":
			packetType = mqtt.PacketTypeDISCONNECT
		case "PINGREQ":
			packetType = mqtt.PacketTypePINGREQ
		default:
			continue
		}
		mutations := GetAvailableMutations(packetType)
		count += len(mutations)
	}
	return count
}

func (e *Engine) runFuzzing(ctx context.Context) {
	var wg sync.WaitGroup
	semaphore := make(chan struct{}, e.config.ConcurrentConnections)

	for connID := 0; connID < e.config.ConcurrentConnections; connID++ {
		wg.Add(1)
		semaphore <- struct{}{}

		go func(connID int) {
			defer wg.Done()
			defer func() { <-semaphore }()

			for iter := 0; iter < e.config.TestIterations; iter++ {
				select {
				case <-ctx.Done():
					return
				default:
				}

				e.runConnectionTests(ctx, connID)
			}
		}(connID)
	}

	wg.Wait()
	e.running.Store(false)
	e.storage.CompleteSession(e.sessionID, int(e.completedCases.Load()))

	if e.pool != nil {
		e.pool.Close()
	}

	log.Printf("Fuzzing session completed: %s", e.sessionID)
}

func (e *Engine) runConnectionTests(ctx context.Context, connID int) {
	for _, packetTypeStr := range e.config.EnabledPacketTypes {
		select {
		case <-ctx.Done():
			return
		default:
		}

		var packetType byte
		switch packetTypeStr {
		case "CONNECT":
			packetType = mqtt.PacketTypeCONNECT
		case "PUBLISH":
			packetType = mqtt.PacketTypePUBLISH
		case "SUBSCRIBE":
			packetType = mqtt.PacketTypeSUBSCRIBE
		case "UNSUBSCRIBE":
			packetType = mqtt.PacketTypeUNSUBSCRIBE
		case "DISCONNECT":
			packetType = mqtt.PacketTypeDISCONNECT
		case "PINGREQ":
			packetType = mqtt.PacketTypePINGREQ
		default:
			continue
		}

		mutations := GetAvailableMutations(packetType)
		for _, mutation := range mutations {
			select {
			case <-ctx.Done():
				return
			default:
			}

			e.runSingleTest(ctx, connID, packetType, mutation)
			e.completedCases.Add(1)

			if e.completedCases.Load()%1000 == 0 {
				e.storage.UpdateSessionProgress(e.sessionID, int(e.completedCases.Load()))
				log.Printf("Progress: %.2f%% (%d/%d), Active conns: %d",
					float64(e.completedCases.Load())/float64(e.totalCases)*100,
					e.completedCases.Load(), e.totalCases,
					e.ActiveConnections())
			}
		}
	}
}

func (e *Engine) runSingleTest(ctx context.Context, connID int, packetType byte, mutation MutationType) {
	timeout := e.config.GetTimeout(mutation)

	pc, err := e.pool.Get(connID)
	if err != nil {
		record := &storage.TestCaseRecord{
			TestSessionID: e.sessionID,
			ConnectionID:  connID,
			PacketType:    mqtt.PacketTypeNames[packetType],
			MutationType:  mutation,
			Description:   "Connection pool get failed",
			Result:        storage.ResultCrash,
			ErrorMessage:  err.Error(),
		}
		e.storage.InsertRecord(record)
		return
	}

	defer func() {
		e.pool.Put(pc)
	}()

	pc.SetDeadlines(timeout)

	var mutatedPacket *MutatedPacket
	var basePacket mqtt.Packet

	switch packetType {
	case mqtt.PacketTypeCONNECT:
		version := mqtt.ProtocolVersion311
		if e.config.MQTTVersion == "5.0" {
			version = mqtt.ProtocolVersion50
		}
		basePacket = &mqtt.ConnectPacket{
			ProtocolName:    "MQTT",
			ProtocolVersion: version,
			ClientID:        fmt.Sprintf("%s_%d_%d", e.config.ClientIDPrefix, connID, time.Now().UnixNano()),
			CleanSession:    true,
			KeepAlive:       60,
			Username:        e.config.Username,
			Password:        []byte(e.config.Password),
		}
		mutatedPacket, err = e.mutator.MutateConnect(basePacket.(*mqtt.ConnectPacket), mutation)

	case mqtt.PacketTypePUBLISH:
		basePacket = &mqtt.PublishPacket{
			TopicName: "test/topic",
			QoS:       1,
			PacketID:  uint16(connID + 1),
			Payload:   []byte("test payload"),
		}
		mutatedPacket, err = e.mutator.MutatePublish(basePacket.(*mqtt.PublishPacket), mutation)

	case mqtt.PacketTypeSUBSCRIBE:
		basePacket = &mqtt.SubscribePacket{
			PacketID: uint16(connID + 1),
			Subscriptions: []mqtt.Subscription{
				{TopicFilter: "test/#", QoS: 1},
			},
		}
		mutatedPacket, err = e.mutator.MutateSubscribe(basePacket.(*mqtt.SubscribePacket), mutation)

	case mqtt.PacketTypeUNSUBSCRIBE:
		basePacket = &mqtt.UnsubscribePacket{
			PacketID:     uint16(connID + 1),
			TopicFilters: []string{"test/#"},
		}
		mutatedPacket, err = e.mutator.MutateUnsubscribe(basePacket.(*mqtt.UnsubscribePacket), mutation)

	case mqtt.PacketTypeDISCONNECT:
		basePacket = &mqtt.DisconnectPacket{ReasonCode: 0}
		mutatedPacket, err = e.mutator.MutateDisconnect(basePacket.(*mqtt.DisconnectPacket), mutation)

	case mqtt.PacketTypePINGREQ:
		basePacket = &mqtt.PingreqPacket{}
		mutatedPacket, err = e.mutator.MutatePingreq(basePacket.(*mqtt.PingreqPacket), mutation)
	}

	if err != nil {
		record := &storage.TestCaseRecord{
			TestSessionID: e.sessionID,
			ConnectionID:  connID,
			PacketType:    mqtt.PacketTypeNames[packetType],
			MutationType:  mutation,
			Description:   "Packet mutation failed",
			Result:        storage.ResultNormalResponse,
			ErrorMessage:  err.Error(),
		}
		e.storage.InsertRecord(record)
		return
	}

	pc.mu.Lock()
	startTime := time.Now()
	_, err = pc.conn.Write(mutatedPacket.MutatedData)
	pc.mu.Unlock()

	var result storage.TestResult
	var errorMsg string
	var responseTime int64

	if err != nil {
		result = storage.ResultDisconnect
		errorMsg = err.Error()
		pc.Close()
	} else {
		pc.mu.Lock()
		responseType, _, readErr := mqtt.ReadPacket(pc.conn)
		pc.mu.Unlock()
		responseTime = time.Since(startTime).Milliseconds()

		if readErr != nil {
			if netErr, ok := readErr.(net.Error); ok && netErr.Timeout() {
				result = storage.ResultTimeout
				errorMsg = "timeout waiting for response"
			} else {
				result = storage.ResultDisconnect
				errorMsg = readErr.Error()
				pc.Close()
			}
		} else if responseType == 0 {
			result = storage.ResultCrash
			errorMsg = "connection closed unexpectedly"
			pc.Close()
		} else {
			result = storage.ResultNormalResponse
		}
	}

	record := &storage.TestCaseRecord{
		TestSessionID:  e.sessionID,
		ConnectionID:   connID,
		PacketType:     mutatedPacket.PacketType,
		MutationType:   mutatedPacket.MutationType,
		Description:    mutatedPacket.Description,
		Result:         result,
		ResponseTimeMs: responseTime,
		RawPacket:      mutatedPacket.MutatedData,
		ErrorMessage:   errorMsg,
	}
	e.storage.InsertRecord(record)
}
