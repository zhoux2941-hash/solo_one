package websocket

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"llm-load-test/internal/models"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Server struct {
	clients      map[*Client]bool
	broadcast    chan interface{}
	register     chan *Client
	unregister   chan *Client
	mu           sync.RWMutex
	testMetrics  map[string][]*models.AggregatedMetrics
	workerStatus map[string]*models.WorkerStatus
}

type Client struct {
	conn   *websocket.Conn
	send   chan interface{}
	server *Server
}

func NewServer() *Server {
	return &Server{
		clients:      make(map[*Client]bool),
		broadcast:    make(chan interface{}, 1000),
		register:     make(chan *Client),
		unregister:   make(chan *Client),
		testMetrics:  make(map[string][]*models.AggregatedMetrics),
		workerStatus: make(map[string]*models.WorkerStatus),
	}
}

func (s *Server) Start() {
	go s.run()
}

func (s *Server) run() {
	for {
		select {
		case client := <-s.register:
			s.mu.Lock()
			s.clients[client] = true
			s.mu.Unlock()
			s.sendInitialState(client)

		case client := <-s.unregister:
			s.mu.Lock()
			if _, ok := s.clients[client]; ok {
				delete(s.clients, client)
				close(client.send)
			}
			s.mu.Unlock()

		case message := <-s.broadcast:
			s.handleMessage(message)
			s.broadcastToClients(message)
		}
	}
}

func (s *Server) handleMessage(message interface{}) {
	s.mu.Lock()
	defer s.mu.Unlock()

	switch msg := message.(type) {
	case *models.AggregatedMetrics:
		s.testMetrics[msg.TestID] = append(s.testMetrics[msg.TestID], msg)
		if len(s.testMetrics[msg.TestID]) > 1000 {
			s.testMetrics[msg.TestID] = s.testMetrics[msg.TestID][len(s.testMetrics[msg.TestID])-1000:]
		}
	case *models.WorkerStatus:
		s.workerStatus[msg.ID] = msg
	case *models.LoadTest:
	}
}

func (s *Server) broadcastToClients(message interface{}) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for client := range s.clients {
		select {
		case client.send <- message:
		default:
			close(client.send)
			delete(s.clients, client)
		}
	}
}

func (s *Server) sendInitialState(client *Client) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, metricsList := range s.testMetrics {
		for _, m := range metricsList {
			select {
			case client.send <- m:
			default:
			}
		}
	}

	for _, status := range s.workerStatus {
		select {
		case client.send <- status:
		default:
		}
	}
}

func (s *Server) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &Client{
		conn:   conn,
		send:   make(chan interface{}, 256),
		server: s,
	}

	s.register <- client

	go client.readPump()
	go client.writePump()
}

func (c *Client) readPump() {
	defer func() {
		c.server.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(512)
	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, _, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
			}
			break
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			data, err := json.Marshal(message)
			if err != nil {
				continue
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, data); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (s *Server) Broadcast(message interface{}) {
	s.broadcast <- message
}

func (s *Server) BroadcastMetrics(metrics *models.AggregatedMetrics) {
	s.Broadcast(metrics)
}

func (s *Server) BroadcastWorkerStatus(status *models.WorkerStatus) {
	s.Broadcast(status)
}

func (s *Server) BroadcastTestStatus(test *models.LoadTest) {
	s.Broadcast(test)
}

func (s *Server) GetTestMetrics(testID string) []*models.AggregatedMetrics {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.testMetrics[testID]
}
