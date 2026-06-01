package mqtt

import (
	"encoding/binary"
	"errors"
	"fmt"
)

const (
	PacketTypeCONNECT     = 1
	PacketTypeCONNACK     = 2
	PacketTypePUBLISH     = 3
	PacketTypePUBACK      = 4
	PacketTypePUBREC      = 5
	PacketTypePUBREL      = 6
	PacketTypePUBCOMP     = 7
	PacketTypeSUBSCRIBE   = 8
	PacketTypeSUBACK      = 9
	PacketTypeUNSUBSCRIBE = 10
	PacketTypeUNSUBACK    = 11
	PacketTypePINGREQ     = 12
	PacketTypePINGRESP    = 13
	PacketTypeDISCONNECT  = 14
	PacketTypeAUTH        = 15

	ProtocolVersion311 = 4
	ProtocolVersion50  = 5

	QoS0 = 0
	QoS1 = 1
	QoS2 = 2
)

type Packet interface {
	Type() byte
	Encode() ([]byte, error)
}

type FixedHeader struct {
	PacketType     byte
	Flags          byte
	RemainingLength int
}

type ConnectPacket struct {
	ProtocolName     string
	ProtocolVersion  byte
	ConnectFlags     byte
	KeepAlive        uint16
	ClientID         string
	WillTopic        string
	WillPayload      []byte
	WillQoS          byte
	WillRetain       bool
	CleanSession     bool
	Username         string
	Password         []byte
	Properties       map[uint32][]byte
}

type PublishPacket struct {
	Dup       bool
	QoS       byte
	Retain    bool
	TopicName string
	PacketID  uint16
	Payload   []byte
}

type SubscribePacket struct {
	PacketID     uint16
	Subscriptions []Subscription
}

type Subscription struct {
	TopicFilter string
	QoS         byte
}

type UnsubscribePacket struct {
	PacketID     uint16
	TopicFilters []string
}

type DisconnectPacket struct {
	ReasonCode byte
}

type PingreqPacket struct{}

var PacketTypeNames = map[byte]string{
	PacketTypeCONNECT:     "CONNECT",
	PacketTypeCONNACK:     "CONNACK",
	PacketTypePUBLISH:     "PUBLISH",
	PacketTypePUBACK:      "PUBACK",
	PacketTypePUBREC:      "PUBREC",
	PacketTypePUBREL:      "PUBREL",
	PacketTypePUBCOMP:     "PUBCOMP",
	PacketTypeSUBSCRIBE:   "SUBSCRIBE",
	PacketTypeSUBACK:      "SUBACK",
	PacketTypeUNSUBSCRIBE: "UNSUBSCRIBE",
	PacketTypeUNSUBACK:    "UNSUBACK",
	PacketTypePINGREQ:     "PINGREQ",
	PacketTypePINGRESP:    "PINGRESP",
	PacketTypeDISCONNECT:  "DISCONNECT",
	PacketTypeAUTH:        "AUTH",
}

func (p *ConnectPacket) Type() byte     { return PacketTypeCONNECT }
func (p *PublishPacket) Type() byte     { return PacketTypePUBLISH }
func (p *SubscribePacket) Type() byte   { return PacketTypeSUBSCRIBE }
func (p *UnsubscribePacket) Type() byte { return PacketTypeUNSUBSCRIBE }
func (p *DisconnectPacket) Type() byte  { return PacketTypeDISCONNECT }
func (p *PingreqPacket) Type() byte     { return PacketTypePINGREQ }

func encodeString(s string) []byte {
	buf := make([]byte, 2+len(s))
	binary.BigEndian.PutUint16(buf[0:2], uint16(len(s)))
	copy(buf[2:], s)
	return buf
}

func encodeRemainingLength(length int) []byte {
	var result []byte
	for {
		encodedByte := byte(length % 128)
		length = length / 128
		if length > 0 {
			encodedByte |= 0x80
		}
		result = append(result, encodedByte)
		if length == 0 {
			break
		}
	}
	return result
}

func (p *ConnectPacket) Encode() ([]byte, error) {
	var payload []byte

	payload = append(payload, encodeString(p.ClientID)...)

	if p.WillTopic != "" {
		payload = append(payload, encodeString(p.WillTopic)...)
		payload = append(payload, encodeString(string(p.WillPayload))...)
	}

	if p.Username != "" {
		payload = append(payload, encodeString(p.Username)...)
	}

	if len(p.Password) > 0 {
		payload = append(payload, encodeString(string(p.Password))...)
	}

	var variableHeader []byte
	variableHeader = append(variableHeader, encodeString(p.ProtocolName)...)
	variableHeader = append(variableHeader, p.ProtocolVersion)

	connectFlags := byte(0)
	if p.CleanSession {
		connectFlags |= 0x02
	}
	if p.WillTopic != "" {
		connectFlags |= 0x04
		connectFlags |= (p.WillQoS & 0x03) << 3
		if p.WillRetain {
			connectFlags |= 0x20
		}
	}
	if p.Username != "" {
		connectFlags |= 0x80
	}
	if len(p.Password) > 0 {
		connectFlags |= 0x40
	}
	variableHeader = append(variableHeader, connectFlags)

	keepAliveBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(keepAliveBytes, p.KeepAlive)
	variableHeader = append(variableHeader, keepAliveBytes...)

	remainingLength := len(variableHeader) + len(payload)
	remainingLengthBytes := encodeRemainingLength(remainingLength)

	fixedHeader := byte(PacketTypeCONNECT << 4)

	packet := make([]byte, 0, 1+len(remainingLengthBytes)+len(variableHeader)+len(payload))
	packet = append(packet, fixedHeader)
	packet = append(packet, remainingLengthBytes...)
	packet = append(packet, variableHeader...)
	packet = append(packet, payload...)

	return packet, nil
}

func (p *PublishPacket) Encode() ([]byte, error) {
	var flags byte
	if p.Dup {
		flags |= 0x08
	}
	flags |= (p.QoS & 0x03) << 1
	if p.Retain {
		flags |= 0x01
	}

	var variableHeader []byte
	variableHeader = append(variableHeader, encodeString(p.TopicName)...)

	if p.QoS > 0 {
		packetIDBytes := make([]byte, 2)
		binary.BigEndian.PutUint16(packetIDBytes, p.PacketID)
		variableHeader = append(variableHeader, packetIDBytes...)
	}

	payload := p.Payload
	remainingLength := len(variableHeader) + len(payload)
	remainingLengthBytes := encodeRemainingLength(remainingLength)

	fixedHeader := byte(PacketTypePUBLISH<<4) | flags

	packet := make([]byte, 0, 1+len(remainingLengthBytes)+len(variableHeader)+len(payload))
	packet = append(packet, fixedHeader)
	packet = append(packet, remainingLengthBytes...)
	packet = append(packet, variableHeader...)
	packet = append(packet, payload...)

	return packet, nil
}

func (p *SubscribePacket) Encode() ([]byte, error) {
	var variableHeader []byte
	packetIDBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(packetIDBytes, p.PacketID)
	variableHeader = append(variableHeader, packetIDBytes...)

	var payload []byte
	for _, sub := range p.Subscriptions {
		payload = append(payload, encodeString(sub.TopicFilter)...)
		payload = append(payload, sub.QoS)
	}

	remainingLength := len(variableHeader) + len(payload)
	remainingLengthBytes := encodeRemainingLength(remainingLength)

	fixedHeader := byte(PacketTypeSUBSCRIBE<<4) | 0x02

	packet := make([]byte, 0, 1+len(remainingLengthBytes)+len(variableHeader)+len(payload))
	packet = append(packet, fixedHeader)
	packet = append(packet, remainingLengthBytes...)
	packet = append(packet, variableHeader...)
	packet = append(packet, payload...)

	return packet, nil
}

func (p *UnsubscribePacket) Encode() ([]byte, error) {
	var variableHeader []byte
	packetIDBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(packetIDBytes, p.PacketID)
	variableHeader = append(variableHeader, packetIDBytes...)

	var payload []byte
	for _, topic := range p.TopicFilters {
		payload = append(payload, encodeString(topic)...)
	}

	remainingLength := len(variableHeader) + len(payload)
	remainingLengthBytes := encodeRemainingLength(remainingLength)

	fixedHeader := byte(PacketTypeUNSUBSCRIBE<<4) | 0x02

	packet := make([]byte, 0, 1+len(remainingLengthBytes)+len(variableHeader)+len(payload))
	packet = append(packet, fixedHeader)
	packet = append(packet, remainingLengthBytes...)
	packet = append(packet, variableHeader...)
	packet = append(packet, payload...)

	return packet, nil
}

func (p *DisconnectPacket) Encode() ([]byte, error) {
	fixedHeader := byte(PacketTypeDISCONNECT << 4)
	remainingLengthBytes := encodeRemainingLength(1)

	packet := []byte{fixedHeader}
	packet = append(packet, remainingLengthBytes...)
	packet = append(packet, p.ReasonCode)

	return packet, nil
}

func (p *PingreqPacket) Encode() ([]byte, error) {
	return []byte{PacketTypePINGREQ << 4, 0x00}, nil
}

func ParsePacket(data []byte) (byte, error) {
	if len(data) < 1 {
		return 0, errors.New("packet too short")
	}
	packetType := (data[0] >> 4) & 0x0F
	return packetType, nil
}

func ReadPacket(conn interface{ Read([]byte) (int, error) }) (byte, []byte, error) {
	headerBuf := make([]byte, 1)
	_, err := conn.Read(headerBuf)
	if err != nil {
		return 0, nil, fmt.Errorf("read fixed header: %w", err)
	}

	remainingLength := 0
	multiplier := 1
	for {
		lenBuf := make([]byte, 1)
		_, err := conn.Read(lenBuf)
		if err != nil {
			return 0, nil, fmt.Errorf("read remaining length: %w", err)
		}
		remainingLength += int(lenBuf[0]&0x7F) * multiplier
		if lenBuf[0]&0x80 == 0 {
			break
		}
		multiplier *= 128
		if multiplier > 128*128*128 {
			return 0, nil, errors.New("remaining length too large")
		}
	}

	packetType := (headerBuf[0] >> 4) & 0x0F

	payload := make([]byte, remainingLength)
	if remainingLength > 0 {
		_, err = conn.Read(payload)
		if err != nil {
			return packetType, payload, fmt.Errorf("read payload: %w", err)
		}
	}

	return packetType, payload, nil
}
