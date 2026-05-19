package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"sync"
	"time"

	"github.com/quic-go/webtransport-go"
)

const maxMessageSize = 1024 * 1024

type Message struct {
	Type      string          `json:"type"`
	RoomID    string          `json:"roomId"`
	UserID    string          `json:"userId"`
	Timestamp int64           `json:"timestamp"`
	Payload   json.RawMessage `json:"payload"`
}

type User struct {
	ID       string
	Session  *webtransport.Session
	Stream   webtransport.Stream
	RoomID   string
}

type Room struct {
	ID          string
	Users       map[string]*User
	Mutex       sync.RWMutex
	Scene       map[string]interface{}
	Groups      map[string]interface{}
	ObjectLocks map[string]string
}

type Server struct {
	Rooms    map[string]*Room
	RoomsMux sync.RWMutex
	WTServer *webtransport.Server
}

func NewServer() *Server {
	return &Server{
		Rooms: make(map[string]*Room),
	}
}

func (s *Server) getOrCreateRoom(roomID string) *Room {
	s.RoomsMux.Lock()
	defer s.RoomsMux.Unlock()
	
	if room, exists := s.Rooms[roomID]; exists {
		return room
	}
	
	room := &Room{
		ID:          roomID,
		Users:       make(map[string]*User),
		Scene:       make(map[string]interface{}),
		Groups:      make(map[string]interface{}),
		ObjectLocks: make(map[string]string),
	}
	s.Rooms[roomID] = room
	log.Printf("Created new room: %s", roomID)
	return room
}

func (s *Server) sendToUser(roomID, userID string, msg Message) {
	s.RoomsMux.RLock()
	room, exists := s.Rooms[roomID]
	s.RoomsMux.RUnlock()
	
	if !exists {
		return
	}
	
	room.Mutex.RLock()
	user, userExists := room.Users[userID]
	room.Mutex.RUnlock()
	
	if !userExists {
		return
	}
	
	msgData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}
	
	user.Stream.Write(msgData)
}

func (s *Server) broadcastToRoom(roomID, excludeUserID string, msg Message) {
	s.RoomsMux.RLock()
	room, exists := s.Rooms[roomID]
	s.RoomsMux.RUnlock()
	
	if !exists {
		return
	}
	
	room.Mutex.RLock()
	defer room.Mutex.RUnlock()
	
	msgData, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Failed to marshal message: %v", err)
		return
	}
	
	for userID, user := range room.Users {
		if userID == excludeUserID {
			continue
		}
		_, err := user.Stream.Write(msgData)
		if err != nil {
			log.Printf("Failed to send to user %s: %v", userID, err)
		}
	}
}

func (s *Server) handleMessage(user *User, msg Message) {
	msg.Timestamp = time.Now().UnixMilli()
	
	switch msg.Type {
	case "join":
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.Lock()
		user.RoomID = msg.RoomID
		room.Users[user.ID] = user
		userCount := len(room.Users)
		room.Mutex.Unlock()
		
		log.Printf("User %s joined room %s (total: %d)", user.ID, msg.RoomID, userCount)
		
		room = s.getOrCreateRoom(msg.RoomID)
		room.Mutex.RLock()
		scenePayload, _ := json.Marshal(room.Scene)
		groupsPayload, _ := json.Marshal(room.Groups)
		locksPayload, _ := json.Marshal(room.ObjectLocks)
		room.Mutex.RUnlock()
		
		sceneMsg := Message{
			Type:      "scene_sync",
			RoomID:    msg.RoomID,
			UserID:    "server",
			Timestamp: time.Now().UnixMilli(),
			Payload:   scenePayload,
		}
		sceneMsgData, _ := json.Marshal(sceneMsg)
		user.Stream.Write(sceneMsgData)
		
		groupsMsg := Message{
			Type:      "groups_sync",
			RoomID:    msg.RoomID,
			UserID:    "server",
			Timestamp: time.Now().UnixMilli(),
			Payload:   groupsPayload,
		}
		groupsMsgData, _ := json.Marshal(groupsMsg)
		user.Stream.Write(groupsMsgData)
		
		locksMsg := Message{
			Type:      "locks_sync",
			RoomID:    msg.RoomID,
			UserID:    "server",
			Timestamp: time.Now().UnixMilli(),
			Payload:   locksPayload,
		}
		locksMsgData, _ := json.Marshal(locksMsg)
		user.Stream.Write(locksMsgData)
		
		s.broadcastToRoom(msg.RoomID, user.ID, msg)
		
	case "leave":
		s.removeUser(user)
		s.broadcastToRoom(msg.RoomID, user.ID, msg)
		
	case "lock_object":
		var lockData struct {
			ObjectID string `json:"objectId"`
		}
		json.Unmarshal(msg.Payload, &lockData)
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.Lock()
		
		currentLock, locked := room.ObjectLocks[lockData.ObjectID]
		granted := false
		
		if !locked || currentLock == user.ID {
			room.ObjectLocks[lockData.ObjectID] = user.ID
			granted = true
		}
		
		room.Mutex.Unlock()
		
		if granted {
			log.Printf("User %s locked object %s in room %s", user.ID, lockData.ObjectID, msg.RoomID)
			s.broadcastToRoom(msg.RoomID, "", msg)
		} else {
			denyMsg := Message{
				Type:      "lock_denied",
				RoomID:    msg.RoomID,
				UserID:    "server",
				Timestamp: time.Now().UnixMilli(),
				Payload:   msg.Payload,
			}
			s.sendToUser(msg.RoomID, user.ID, denyMsg)
		}
		
	case "unlock_object":
		var lockData struct {
			ObjectID string `json:"objectId"`
		}
		json.Unmarshal(msg.Payload, &lockData)
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.Lock()
		
		if room.ObjectLocks[lockData.ObjectID] == user.ID {
			delete(room.ObjectLocks, lockData.ObjectID)
			log.Printf("User %s unlocked object %s in room %s", user.ID, lockData.ObjectID, msg.RoomID)
		}
		
		room.Mutex.Unlock()
		s.broadcastToRoom(msg.RoomID, user.ID, msg)
		
	case "create_object":
		s.broadcastToRoom(msg.RoomID, user.ID, msg)
		
		var obj map[string]interface{}
		json.Unmarshal(msg.Payload, &obj)
		if id, ok := obj["id"].(string); ok {
			room := s.getOrCreateRoom(msg.RoomID)
			room.Mutex.Lock()
			room.Scene[id] = obj
			room.Mutex.Unlock()
		}
		
	case "update_object":
		var obj map[string]interface{}
		json.Unmarshal(msg.Payload, &obj)
		objectID := ""
		if id, ok := obj["id"].(string); ok {
			objectID = id
		}
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.RLock()
		lockOwner, locked := room.ObjectLocks[objectID]
		room.Mutex.RUnlock()
		
		if !locked || lockOwner == user.ID {
			s.broadcastToRoom(msg.RoomID, user.ID, msg)
			
			room.Mutex.Lock()
			room.Scene[objectID] = obj
			room.Mutex.Unlock()
		}
		
	case "delete_object":
		var obj map[string]interface{}
		json.Unmarshal(msg.Payload, &obj)
		objectID := ""
		if id, ok := obj["id"].(string); ok {
			objectID = id
		}
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.RLock()
		lockOwner, locked := room.ObjectLocks[objectID]
		room.Mutex.RUnlock()
		
		if !locked || lockOwner == user.ID {
			s.broadcastToRoom(msg.RoomID, user.ID, msg)
			
			room.Mutex.Lock()
			delete(room.Scene, objectID)
			delete(room.ObjectLocks, objectID)
			room.Mutex.Unlock()
		}
		
	case "create_group":
		s.broadcastToRoom(msg.RoomID, user.ID, msg)
		
		var group map[string]interface{}
		json.Unmarshal(msg.Payload, &group)
		if id, ok := group["id"].(string); ok {
			room := s.getOrCreateRoom(msg.RoomID)
			room.Mutex.Lock()
			room.Groups[id] = group
			room.Mutex.Unlock()
		}
		
	case "update_group":
		var group map[string]interface{}
		json.Unmarshal(msg.Payload, &group)
		groupID := ""
		if id, ok := group["id"].(string); ok {
			groupID = id
		}
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.RLock()
		lockOwner, locked := room.ObjectLocks[groupID]
		room.Mutex.RUnlock()
		
		if !locked || lockOwner == user.ID {
			s.broadcastToRoom(msg.RoomID, user.ID, msg)
			
			room.Mutex.Lock()
			room.Groups[groupID] = group
			room.Mutex.Unlock()
		}
		
	case "delete_group":
		var group map[string]interface{}
		json.Unmarshal(msg.Payload, &group)
		groupID := ""
		if id, ok := group["id"].(string); ok {
			groupID = id
		}
		
		room := s.getOrCreateRoom(msg.RoomID)
		room.Mutex.RLock()
		lockOwner, locked := room.ObjectLocks[groupID]
		room.Mutex.RUnlock()
		
		if !locked || lockOwner == user.ID {
			s.broadcastToRoom(msg.RoomID, user.ID, msg)
			
			room.Mutex.Lock()
			delete(room.Groups, groupID)
			delete(room.ObjectLocks, groupID)
			room.Mutex.Unlock()
		}
	}
}

func (s *Server) removeUser(user *User) {
	if user.RoomID == "" {
		return
	}
	
	s.RoomsMux.RLock()
	room, exists := s.Rooms[user.RoomID]
	s.RoomsMux.RUnlock()
	
	if exists {
		room.Mutex.Lock()
		delete(room.Users, user.ID)
		
		unlockedObjects := []string{}
		for objID, lockOwner := range room.ObjectLocks {
			if lockOwner == user.ID {
				delete(room.ObjectLocks, objID)
				unlockedObjects = append(unlockedObjects, objID)
			}
		}
		
		userCount := len(room.Users)
		room.Mutex.Unlock()
		
		log.Printf("User %s left room %s (remaining: %d)", user.ID, user.RoomID, userCount)
		
		for _, objID := range unlockedObjects {
			unlockMsg := Message{
				Type:      "unlock_object",
				RoomID:    user.RoomID,
				UserID:    user.ID,
				Timestamp: time.Now().UnixMilli(),
			}
			unlockMsg.Payload, _ = json.Marshal(map[string]string{"objectId": objID})
			s.broadcastToRoom(user.RoomID, "", unlockMsg)
		}
		
		if userCount == 0 {
			s.RoomsMux.Lock()
			delete(s.Rooms, user.RoomID)
			s.RoomsMux.Unlock()
			log.Printf("Room %s deleted (empty)", user.RoomID)
		}
	}
	
	user.RoomID = ""
}

func (s *Server) handleSession(session *webtransport.Session) {
	log.Printf("New session from %s", session.RemoteAddr())
	
	stream, err := session.AcceptStream(context.Background())
	if err != nil {
		log.Printf("Failed to accept stream: %v", err)
		return
	}
	defer stream.Close()
	
	userID := fmt.Sprintf("user_%d", time.Now().UnixNano())
	user := &User{
		ID:      userID,
		Session: session,
		Stream:  stream,
	}
	
	defer func() {
		s.removeUser(user)
		session.CloseWithError(0, "")
	}()
	
	welcomeMsg := Message{
		Type:      "welcome",
		UserID:    userID,
		Timestamp: time.Now().UnixMilli(),
	}
	welcomeData, _ := json.Marshal(welcomeMsg)
	stream.Write(welcomeData)
	
	buf := make([]byte, maxMessageSize)
	decoder := json.NewDecoder(stream)
	
	for {
		var msg Message
		err := decoder.Decode(&msg)
		if err != nil {
			log.Printf("User %s disconnected: %v", userID, err)
			break
		}
		msg.UserID = userID
		s.handleMessage(user, msg)
		
		_ = buf
	}
}

func generateTLSConfig() *tls.Config {
	key, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatal(err)
	}
	
	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			Organization: []string{"WebTransport Collab Editor"},
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,
	}
	
	certDER, err := x509.CreateCertificate(rand.Reader, &template, &template, &key.PublicKey, key)
	if err != nil {
		log.Fatal(err)
	}
	
	return &tls.Config{
		Certificates: []tls.Certificate{{
			Certificate: [][]byte{certDER},
			PrivateKey:  key,
		}},
	}
}

func main() {
	server := NewServer()
	
	wtServer := &webtransport.Server{
		TLSConfig: generateTLSConfig(),
		QUICConfig: webtransport.DefaultQUICConfig,
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}
	server.WTServer = wtServer
	
	http.HandleFunc("/webtransport", func(w http.ResponseWriter, r *http.Request) {
		session, err := wtServer.Upgrade(w, r)
		if err != nil {
			log.Printf("Upgrade failed: %v", err)
			return
		}
		go server.handleSession(session)
	})
	
	fs := http.FileServer(http.Dir("../frontend"))
	http.Handle("/", fs)
	
	port := ":4433"
	log.Printf("Server starting on https://localhost%s", port)
	log.Fatal(wtServer.ListenAndServeTLS(port, "", ""))
}
