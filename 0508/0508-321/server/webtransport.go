package server

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/quic-go/webtransport-go"
)

type WebTransportServer struct {
	rm         *RoomManager
	server     *webtransport.Server
	clientIDGen int
	mu         sync.Mutex
}

func NewWebTransportServer(rm *RoomManager) *WebTransportServer {
	return &WebTransportServer{
		rm: rm,
		server: &webtransport.Server{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (wts *WebTransportServer) HandleWebTransport(w http.ResponseWriter, r *http.Request) {
	session, err := wts.server.Upgrade(w, r)
	if err != nil {
		log.Printf("WebTransport upgrade failed: %v", err)
		return
	}
	defer session.CloseWithError(0, "closing")

	roomID := r.URL.Query().Get("room")
	if roomID == "" {
		roomID = "default"
	}

	clientID := wts.generateClientID()

	client := &Client{
		ID:         clientID,
		RoomID:     roomID,
		SendChan:   make(chan []byte, 100),
		LastActive: time.Now(),
	}

	room := wts.rm.GetOrCreateRoom(roomID)
	room.AddClient(client)
	defer room.RemoveClient(clientID)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	go wts.sendLoop(ctx, session, client)

	wts.receiveLoop(session, client, room)
}

func (wts *WebTransportServer) sendLoop(ctx context.Context, session *webtransport.Session, client *Client) {
	for {
		select {
		case <-ctx.Done():
			return
		case msg := <-client.SendChan:
			stream, err := session.OpenUniStream()
			if err != nil {
				log.Printf("Open stream error: %v", err)
				return
			}
			_, err = stream.Write(msg)
			if err != nil {
				log.Printf("Write error: %v", err)
			}
			stream.Close()
		}
	}
}

func (wts *WebTransportServer) receiveLoop(session *webtransport.Session, client *Client, room *Room) {
	for {
		stream, err := session.AcceptUniStream(context.Background())
		if err != nil {
			log.Printf("Accept stream error: %v", err)
			return
		}

		go wts.handleStream(stream, client, room)
	}
}

func (wts *WebTransportServer) handleStream(stream webtransport.ReceiveStream, client *Client, room *Room) {
	buf := make([]byte, 4096)
	n, err := stream.Read(buf)
	if err != nil {
		log.Printf("Read error: %v", err)
		return
	}

	var op Operation
	if err := json.Unmarshal(buf[:n], &op); err != nil {
		log.Printf("JSON unmarshal error: %v", err)
		return
	}

	op.ClientID = client.ID
	op.Timestamp = time.Now().UnixNano()

	room.HandleOperation(op)
}

func (wts *WebTransportServer) generateClientID() string {
	wts.mu.Lock()
	defer wts.mu.Unlock()
	wts.clientIDGen++
	return time.Now().Format("20060102150405") + "-" + string(rune('A'+wts.clientIDGen%26))
}
