package fuzzer

import (
	"crypto/rand"
	"encoding/binary"
	"fmt"
	"math/big"
	"mqtt-fuzzer/internal/mqtt"
	"strings"
)

type MutationType string

const (
	MutationInvalidRemainingLength  MutationType = "invalid_remaining_length"
	MutationWrongProtocolName       MutationType = "wrong_protocol_name"
	MutationDuplicatePacketID       MutationType = "duplicate_packet_id"
	MutationPayloadEmptyBytes       MutationType = "payload_empty_bytes"
	MutationPayloadLongString       MutationType = "payload_long_string"
	MutationInvalidFlagsCombination MutationType = "invalid_flags_combination"
	MutationVariableHeaderMismatch  MutationType = "variable_header_mismatch"
	MutationTruncatedPacket         MutationType = "truncated_packet"
	MutationGarbageBytes            MutationType = "garbage_bytes"
	MutationInvalidQoSValue         MutationType = "invalid_qos_value"
	MutationEmptyTopicList          MutationType = "empty_topic_list"
	MutationWildcardViolation       MutationType = "wildcard_violation"
	MutationZeroPacketID            MutationType = "zero_packet_id"
	MutationRemainingLengthMismatch MutationType = "remaining_length_mismatch"
)

type MutationCategory string

const (
	CategoryLengthRelated MutationCategory = "length_related"
	CategoryProtocolState MutationCategory = "protocol_state"
)

func (mt MutationType) Category() MutationCategory {
	switch mt {
	case MutationInvalidRemainingLength,
		MutationPayloadLongString,
		MutationTruncatedPacket,
		MutationGarbageBytes,
		MutationEmptyTopicList,
		MutationRemainingLengthMismatch:
		return CategoryLengthRelated
	default:
		return CategoryProtocolState
	}
}

type MutatedPacket struct {
	OriginalPacket mqtt.Packet
	MutatedData    []byte
	MutationType   MutationType
	Description    string
	PacketType     string
}

type Mutator struct {
	lastPacketID uint16
}

func NewMutator() *Mutator {
	return &Mutator{}
}

func (m *Mutator) MutateConnect(pkt *mqtt.ConnectPacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationWrongProtocolName:
		mutated = m.mutateProtocolName(pkt)
		desc = "Protocol name case modified or invalid characters"

	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, 999999)
		desc = "Remaining length field set to excessively large value"

	case MutationVariableHeaderMismatch:
		mutated = m.mutateVariableHeaderLength(pkt)
		desc = "Variable header length does not match actual content"

	case MutationPayloadLongString:
		mutated = m.mutateConnectLongPayload(pkt)
		desc = "Client ID contains extremely long string"

	case MutationGarbageBytes:
		mutated = append(originalData, generateGarbage(1024)...)
		desc = "Garbage bytes appended after packet"

	default:
		return nil, fmt.Errorf("unsupported mutation type for CONNECT: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "CONNECT",
	}, nil
}

func (m *Mutator) MutatePublish(pkt *mqtt.PublishPacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, randomInt(10000, 100000))
		desc = "Remaining length field does not match actual payload size"

	case MutationInvalidFlagsCombination:
		mutated = m.mutatePublishFlags(pkt)
		desc = "Invalid flag combination (e.g., QoS with reserved bit)"

	case MutationInvalidQoSValue:
		mutated = m.mutatePublishInvalidQoS(pkt)
		desc = "QoS field set to invalid value (3)"

	case MutationDuplicatePacketID:
		m.lastPacketID = pkt.PacketID
		mutated = originalData
		desc = "Duplicate packet identifier used in sequence"

	case MutationPayloadEmptyBytes:
		mutated = m.mutatePublishEmptyPayload(pkt)
		desc = "Payload contains multiple null bytes"

	case MutationPayloadLongString:
		mutated = m.mutatePublishLongPayload(pkt)
		desc = "Payload is extremely large"

	case MutationTruncatedPacket:
		if len(originalData) > 5 {
			mutated = originalData[:len(originalData)-3]
		} else {
			mutated = originalData
		}
		desc = "Packet is truncated mid-payload"

	default:
		return nil, fmt.Errorf("unsupported mutation type for PUBLISH: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "PUBLISH",
	}, nil
}

func (m *Mutator) MutateSubscribe(pkt *mqtt.SubscribePacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, randomInt(5000, 50000))
		desc = "Remaining length field incorrect for SUBSCRIBE"

	case MutationInvalidQoSValue:
		mutated = m.mutateSubscribeInvalidQoS(pkt)
		desc = "Subscription QoS set to invalid value"

	case MutationDuplicatePacketID:
		m.lastPacketID = pkt.PacketID
		mutated = originalData
		desc = "Duplicate packet identifier"

	case MutationPayloadLongString:
		mutated = m.mutateSubscribeLongTopic(pkt)
		desc = "Topic filter is excessively long"

	default:
		return nil, fmt.Errorf("unsupported mutation type for SUBSCRIBE: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "SUBSCRIBE",
	}, nil
}

func (m *Mutator) MutateUnsubscribe(pkt *mqtt.UnsubscribePacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, randomInt(5000, 50000))
		desc = "Remaining length field incorrect for UNSUBSCRIBE"

	case MutationDuplicatePacketID:
		m.lastPacketID = pkt.PacketID
		mutated = originalData
		desc = "Duplicate packet identifier"

	case MutationPayloadLongString:
		mutated = m.mutateUnsubscribeLongTopic(pkt)
		desc = "Topic filter is excessively long"

	case MutationEmptyTopicList:
		mutated = m.mutateUnsubscribeEmptyTopicList(pkt)
		desc = "UNSUBSCRIBE with empty topic filter list (no subscriptions)"

	case MutationWildcardViolation:
		mutated = m.mutateUnsubscribeWildcardViolation(pkt)
		desc = "UNSUBSCRIBE topic filter contains illegal wildcard characters (#/+) in violation of spec"

	case MutationZeroPacketID:
		mutated = m.mutateUnsubscribeZeroPacketID(pkt)
		desc = "UNSUBSCRIBE with packet identifier set to 0 (must be non-zero)"

	case MutationRemainingLengthMismatch:
		mutated = m.mutateUnsubscribeRemainingLengthMismatch(pkt)
		desc = "UNSUBSCRIBE remaining length field does not match actual payload length"

	default:
		return nil, fmt.Errorf("unsupported mutation type for UNSUBSCRIBE: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "UNSUBSCRIBE",
	}, nil
}

func (m *Mutator) MutateDisconnect(pkt *mqtt.DisconnectPacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, randomInt(100, 1000))
		desc = "Remaining length field incorrect for DISCONNECT"

	case MutationGarbageBytes:
		mutated = append(originalData, generateGarbage(256)...)
		desc = "Garbage bytes appended to DISCONNECT packet"

	default:
		return nil, fmt.Errorf("unsupported mutation type for DISCONNECT: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "DISCONNECT",
	}, nil
}

func (m *Mutator) MutatePingreq(pkt *mqtt.PingreqPacket, mutationType MutationType) (*MutatedPacket, error) {
	originalData, err := pkt.Encode()
	if err != nil {
		return nil, err
	}

	var mutated []byte
	var desc string

	switch mutationType {
	case MutationInvalidRemainingLength:
		mutated = m.mutateRemainingLength(originalData, randomInt(10, 100))
		desc = "Remaining length field incorrect for PINGREQ"

	case MutationGarbageBytes:
		mutated = append(originalData, generateGarbage(64)...)
		desc = "Garbage bytes appended to PINGREQ"

	case MutationTruncatedPacket:
		if len(originalData) > 1 {
			mutated = originalData[:1]
		} else {
			mutated = originalData
		}
		desc = "Truncated PINGREQ packet"

	default:
		return nil, fmt.Errorf("unsupported mutation type for PINGREQ: %s", mutationType)
	}

	return &MutatedPacket{
		OriginalPacket: pkt,
		MutatedData:    mutated,
		MutationType:   mutationType,
		Description:    desc,
		PacketType:     "PINGREQ",
	}, nil
}

func (m *Mutator) mutateProtocolName(pkt *mqtt.ConnectPacket) []byte {
	names := []string{"MQTT", "mqtt", "MqTt", "MQT", "MQTT5", "XMOTT", "HTTP"}
	randomName := names[randomInt(0, len(names)-1)]
	
	mutatedPkt := *pkt
	mutatedPkt.ProtocolName = randomName
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateRemainingLength(original []byte, fakeLength int) []byte {
	if len(original) < 2 {
		return original
	}
	
	result := make([]byte, 1)
	result[0] = original[0]
	
	remainingLengthBytes := make([]byte, 0, 4)
	length := fakeLength
	for {
		encodedByte := byte(length % 128)
		length = length / 128
		if length > 0 {
			encodedByte |= 0x80
		}
		remainingLengthBytes = append(remainingLengthBytes, encodedByte)
		if length == 0 {
			break
		}
	}
	
	result = append(result, remainingLengthBytes...)
	
	var originalRemaining int
	var multiplier = 1
	var idx = 1
	for idx < len(original) {
		b := original[idx]
		originalRemaining += int(b&0x7F) * multiplier
		idx++
		if b&0x80 == 0 {
			break
		}
		multiplier *= 128
	}
	
	if idx < len(original) {
		result = append(result, original[idx:]...)
	}
	
	return result
}

func (m *Mutator) mutateVariableHeaderLength(pkt *mqtt.ConnectPacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.ProtocolName = "A"
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateConnectLongPayload(pkt *mqtt.ConnectPacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.ClientID = strings.Repeat("X", 65535)
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutatePublishFlags(pkt *mqtt.PublishPacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.Retain = true
	mutatedPkt.QoS = 1
	data, _ := mutatedPkt.Encode()
	
	if len(data) > 0 {
		data[0] |= 0x0F
	}
	return data
}

func (m *Mutator) mutatePublishInvalidQoS(pkt *mqtt.PublishPacket) []byte {
	data, _ := pkt.Encode()
	if len(data) > 0 {
		data[0] = (data[0] & 0xF9) | 0x06
	}
	return data
}

func (m *Mutator) mutatePublishEmptyPayload(pkt *mqtt.PublishPacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.Payload = []byte{0x00, 0x00, 0x00, 0x00, 0x00}
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutatePublishLongPayload(pkt *mqtt.PublishPacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.Payload = generateGarbage(1024 * 256)
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateSubscribeInvalidQoS(pkt *mqtt.SubscribePacket) []byte {
	mutatedPkt := *pkt
	for i := range mutatedPkt.Subscriptions {
		mutatedPkt.Subscriptions[i].QoS = 0x03
	}
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateSubscribeLongTopic(pkt *mqtt.SubscribePacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.Subscriptions = []mqtt.Subscription{
		{TopicFilter: strings.Repeat("longtopic/", 1000), QoS: 0},
	}
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateUnsubscribeLongTopic(pkt *mqtt.UnsubscribePacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.TopicFilters = []string{strings.Repeat("longtopic/", 1000)}
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateUnsubscribeEmptyTopicList(pkt *mqtt.UnsubscribePacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.TopicFilters = []string{}
	data, _ := mutatedPkt.Encode()

	fixedHeader := byte(mqtt.PacketTypeUNSUBSCRIBE << 4) | 0x02
	packetIDBytes := make([]byte, 2)
	binary.BigEndian.PutUint16(packetIDBytes, mutatedPkt.PacketID)
	remainingLength := len(packetIDBytes)
	remainingLengthBytes := encodeRemainingLength(remainingLength)

	result := []byte{fixedHeader}
	result = append(result, remainingLengthBytes...)
	result = append(result, packetIDBytes...)
	return result
}

func (m *Mutator) mutateUnsubscribeWildcardViolation(pkt *mqtt.UnsubscribePacket) []byte {
	violatingTopics := []string{
		"#",
		"+",
		"#/test",
		"test/+/more",
		"a/#/b",
		"+/+/#",
		"sport/tennis/player1/#",
		"sport/#/ranking",
		"#/invalid",
		"+/#",
	}
	mutatedPkt := *pkt
	mutatedPkt.TopicFilters = violatingTopics
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateUnsubscribeZeroPacketID(pkt *mqtt.UnsubscribePacket) []byte {
	mutatedPkt := *pkt
	mutatedPkt.PacketID = 0
	data, _ := mutatedPkt.Encode()
	return data
}

func (m *Mutator) mutateUnsubscribeRemainingLengthMismatch(pkt *mqtt.UnsubscribePacket) []byte {
	mutatedPkt := *pkt
	data, _ := mutatedPkt.Encode()
	if len(data) < 2 {
		return data
	}

	payloadStart := 1
	multiplier := 1
	for payloadStart < len(data) {
		if data[payloadStart]&0x80 == 0 {
			payloadStart++
			break
		}
		payloadStart++
		multiplier *= 128
	}

	realPayloadLen := len(data) - payloadStart
	fakePayloadLen := realPayloadLen + randomInt(10, 500)

	result := make([]byte, 0, 1+4+len(data)-payloadStart)
	result = append(result, data[0])
	result = append(result, encodeRemainingLength(fakePayloadLen)...)
	result = append(result, data[payloadStart:]...)
	return result
}

func generateGarbage(length int) []byte {
	garbage := make([]byte, length)
	_, err := rand.Read(garbage)
	if err != nil {
		for i := range garbage {
			garbage[i] = byte(i % 256)
		}
	}
	return garbage
}

func randomInt(min, max int) int {
	n, err := rand.Int(rand.Reader, big.NewInt(int64(max-min+1)))
	if err != nil {
		return min
	}
	return int(n.Int64()) + min
}

func GetAvailableMutations(packetType byte) []MutationType {
	switch packetType {
	case mqtt.PacketTypeCONNECT:
		return []MutationType{
			MutationWrongProtocolName,
			MutationInvalidRemainingLength,
			MutationVariableHeaderMismatch,
			MutationPayloadLongString,
			MutationGarbageBytes,
		}
	case mqtt.PacketTypePUBLISH:
		return []MutationType{
			MutationInvalidRemainingLength,
			MutationInvalidFlagsCombination,
			MutationInvalidQoSValue,
			MutationDuplicatePacketID,
			MutationPayloadEmptyBytes,
			MutationPayloadLongString,
			MutationTruncatedPacket,
		}
	case mqtt.PacketTypeSUBSCRIBE:
		return []MutationType{
			MutationInvalidRemainingLength,
			MutationInvalidQoSValue,
			MutationDuplicatePacketID,
			MutationPayloadLongString,
		}
	case mqtt.PacketTypeUNSUBSCRIBE:
		return []MutationType{
			MutationInvalidRemainingLength,
			MutationDuplicatePacketID,
			MutationPayloadLongString,
			MutationEmptyTopicList,
			MutationWildcardViolation,
			MutationZeroPacketID,
			MutationRemainingLengthMismatch,
		}
	case mqtt.PacketTypeDISCONNECT:
		return []MutationType{
			MutationInvalidRemainingLength,
			MutationGarbageBytes,
		}
	case mqtt.PacketTypePINGREQ:
		return []MutationType{
			MutationInvalidRemainingLength,
			MutationGarbageBytes,
			MutationTruncatedPacket,
		}
	default:
		return nil
	}
}

func encodeString(s string) []byte {
	buf := make([]byte, 2+len(s))
	binary.BigEndian.PutUint16(buf[0:2], uint16(len(s)))
	copy(buf[2:], s)
	return buf
}
