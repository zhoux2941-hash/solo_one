package server

import (
	"encoding/json"
	"log"
	"sync"
	"time"
)

type Client struct {
	ID         string
	RoomID     string
	SendChan   chan []byte
	LastActive time.Time
}

type Room struct {
	ID         string
	mu         sync.RWMutex
	Clients    map[string]*Client
	Document   *CRDTDocument
	Broadcast  chan []byte
	UndoStack  []UndoEntry
	RedoStack  []UndoEntry
}

type UndoEntry struct {
	Operations []Operation
}

type RoomManager struct {
	mu    sync.RWMutex
	Rooms map[string]*Room
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		Rooms: make(map[string]*Room),
	}
}

func (rm *RoomManager) GetOrCreateRoom(roomID string) *Room {
	rm.mu.Lock()
	defer rm.mu.Unlock()

	if room, exists := rm.Rooms[roomID]; exists {
		return room
	}

	room := &Room{
		ID:        roomID,
		Clients:   make(map[string]*Client),
		Document:  NewCRDTDocument(),
		Broadcast: make(chan []byte, 1000),
		UndoStack: make([]UndoEntry, 0, 50),
		RedoStack: make([]UndoEntry, 0, 50),
	}
	rm.Rooms[roomID] = room

	go room.broadcastLoop()
	return room
}

func (r *Room) broadcastLoop() {
	for msg := range r.Broadcast {
		r.mu.RLock()
		for _, client := range r.Clients {
			select {
			case client.SendChan <- msg:
			default:
				log.Printf("Client %s send buffer full, dropping message", client.ID)
			}
		}
		r.mu.RUnlock()
	}
}

func (r *Room) AddClient(client *Client) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.Clients[client.ID] = client
	client.LastActive = time.Now()

	stateMsg, _ := json.Marshal(map[string]interface{}{
		"type":  "full_state",
		"state": r.Document.GetState(),
	})
	client.SendChan <- stateMsg
}

func (r *Room) RemoveClient(clientID string) {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.Clients, clientID)
}

func (r *Room) HandleOperation(op Operation) {
	if r.Document.ApplyOperation(op) {
		opMsg, _ := op.ToJSON()
		r.Broadcast <- opMsg
	}
}

func (r *Room) PushUndo(ops []Operation) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if len(r.UndoStack) >= 50 {
		r.UndoStack = r.UndoStack[1:]
	}
	r.UndoStack = append(r.UndoStack, UndoEntry{Operations: ops})
	r.RedoStack = r.RedoStack[:0]
}
