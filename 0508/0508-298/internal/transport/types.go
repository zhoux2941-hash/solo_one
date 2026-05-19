package transport

import "net"

type Transport interface {
	Listen() error
	Connect(addr string) (net.Conn, error)
	Send(addr string, msg []byte) error
	Receive() ([]byte, error)
	Close() error
}

type Message struct {
	Type    string
	From    string
	To      string
	Payload []byte
}

type RPCRequest struct {
	Method string
	Args   interface{}
}

type RPCResponse struct {
	Reply interface{}
	Error string
}
