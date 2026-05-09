package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Client struct {
	ID         string
	Conn       *websocket.Conn
	Send       chan []byte
	Subscribed map[string]bool
	mu         sync.RWMutex
}

type Hub struct {
	Clients    map[*Client]bool
	Broadcast  chan []byte
	Register   chan *Client
	Unregister chan *Client
	Stocks     map[string]map[*Client]bool
	mu         sync.RWMutex
}

type Message struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

var hub = NewHub()

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Broadcast:  make(chan []byte, 256),
		Register:   make(chan *Client, 128),
		Unregister: make(chan *Client, 128),
		Stocks:     make(map[string]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.mu.Lock()
			h.Clients[client] = true
			h.mu.Unlock()
			log.Printf("Client connected: %s, total: %d", client.ID, len(h.Clients))

		case client := <-h.Unregister:
			h.mu.Lock()
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
				
				client.mu.Lock()
				for code := range client.Subscribed {
					if clients, ok := h.Stocks[code]; ok {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.Stocks, code)
						}
					}
				}
				client.mu.Unlock()
				
				log.Printf("Client disconnected: %s, total: %d", client.ID, len(h.Clients))
			}
			h.mu.Unlock()

		case message := <-h.Broadcast:
			h.mu.RLock()
			for client := range h.Clients {
				select {
				case client.Send <- message:
				default:
					close(client.Send)
					delete(h.Clients, client)
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) BroadcastToStock(code string, message []byte) {
	h.mu.RLock()
	clients, ok := h.Stocks[code]
	if !ok {
		h.mu.RUnlock()
		return
	}
	
	for client := range clients {
		select {
		case client.Send <- message:
		default:
			close(client.Send)
			delete(h.Clients, client)
		}
	}
	h.mu.RUnlock()
}

func (c *Client) ReadPump() {
	defer func() {
		hub.Unregister <- c
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Failed to parse WebSocket message: %v", err)
			continue
		}

		c.handleMessage(&msg)
	}
}

func (c *Client) handleMessage(msg *Message) {
	switch msg.Type {
	case "subscribe":
		c.handleSubscribe(msg.Payload)
	case "unsubscribe":
		c.handleUnsubscribe(msg.Payload)
	case "ping":
		c.handlePing(msg.Payload)
	}
}

func (c *Client) handleSubscribe(payload interface{}) {
	data, ok := payload.(map[string]interface{})
	if !ok {
		return
	}

	codesRaw, ok := data["codes"].([]interface{})
	if !ok {
		return
	}

	hub.mu.Lock()
	defer hub.mu.Unlock()

	c.mu.Lock()
	for _, codeRaw := range codesRaw {
		code, ok := codeRaw.(string)
		if !ok {
			continue
		}

		c.Subscribed[code] = true

		if hub.Stocks[code] == nil {
			hub.Stocks[code] = make(map[*Client]bool)
		}
		hub.Stocks[code][c] = true
	}
	c.mu.Unlock()
}

func (c *Client) handleUnsubscribe(payload interface{}) {
	data, ok := payload.(map[string]interface{})
	if !ok {
		return
	}

	codesRaw, ok := data["codes"].([]interface{})
	if !ok {
		return
	}

	hub.mu.Lock()
	defer hub.mu.Unlock()

	c.mu.Lock()
	for _, codeRaw := range codesRaw {
		code, ok := codeRaw.(string)
		if !ok {
			continue
		}

		delete(c.Subscribed, code)

		if clients, ok := hub.Stocks[code]; ok {
			delete(clients, c)
			if len(clients) == 0 {
				delete(hub.Stocks, code)
			}
		}
	}
	c.mu.Unlock()
}

func (c *Client) handlePing(payload interface{}) {
	response := Message{
		Type:    "pong",
		Payload: payload,
	}
	
	data, _ := json.Marshal(response)
	select {
	case c.Send <- data:
	default:
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)

			n := len(c.Send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.Send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func HandleWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("Failed to upgrade WebSocket: %v", err)
		return
	}

	clientID := generateClientID()
	client := &Client{
		ID:         clientID,
		Conn:       conn,
		Send:       make(chan []byte, 256),
		Subscribed: make(map[string]bool),
	}

	hub.Register <- client

	go client.WritePump()
	go client.ReadPump()
}

func generateClientID() string {
	return time.Now().Format("20060102150405") + "-" + randomString(8)
}

func randomString(n int) string {
	const letters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[time.Now().UnixNano()%int64(len(letters))]
	}
	return string(b)
}

func BroadcastPriceUpdate(code string, data interface{}) {
	message := Message{
		Type:    "price_update",
		Payload: data,
	}

	bytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal price update: %v", err)
		return
	}

	hub.BroadcastToStock(code, bytes)
}

func Init() {
	go hub.Run()
}
