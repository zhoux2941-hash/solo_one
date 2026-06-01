package kafka

import (
	"context"
	"encoding/json"
	"time"

	"github.com/IBM/sarama"
	"github.com/spf13/viper"
	"llm-load-test/internal/models"
)

type Consumer struct {
	consumerGroup sarama.ConsumerGroup
	topic         string
	logsChan      chan *models.RequestLog
	ready         chan bool
}

func NewConsumer() (*Consumer, error) {
	brokers := viper.GetStringSlice("kafka.brokers")
	topic := viper.GetString("kafka.topic")
	groupID := viper.GetString("kafka.group_id")

	config := sarama.NewConfig()
	config.Version = sarama.V2_8_0_0
	config.Consumer.Group.Rebalance.GroupStrategies = []sarama.BalanceStrategy{sarama.NewBalanceStrategyRoundRobin()}
	config.Consumer.Offsets.Initial = sarama.OffsetOldest
	config.Consumer.Offsets.AutoCommit.Enable = true
	config.Consumer.Offsets.AutoCommit.Interval = 5 * time.Second

	consumerGroup, err := sarama.NewConsumerGroup(brokers, groupID, config)
	if err != nil {
		return nil, err
	}

	return &Consumer{
		consumerGroup: consumerGroup,
		topic:         topic,
		logsChan:      make(chan *models.RequestLog, 10000),
		ready:         make(chan bool),
	}, nil
}

func (c *Consumer) Start(ctx context.Context) error {
	handler := &consumerGroupHandler{
		logsChan: c.logsChan,
		ready:    c.ready,
	}

	go func() {
		for {
			if err := c.consumerGroup.Consume(ctx, []string{c.topic}, handler); err != nil {
				if ctx.Err() != nil {
					return
				}
				time.Sleep(5 * time.Second)
			}
			c.ready = make(chan bool)
		}
	}()

	<-c.ready
	return nil
}

func (c *Consumer) LogsChannel() <-chan *models.RequestLog {
	return c.logsChan
}

func (c *Consumer) Close() error {
	return c.consumerGroup.Close()
}

type consumerGroupHandler struct {
	logsChan chan<- *models.RequestLog
	ready    chan bool
}

func (h *consumerGroupHandler) Setup(_ sarama.ConsumerGroupSession) error {
	close(h.ready)
	return nil
}

func (h *consumerGroupHandler) Cleanup(_ sarama.ConsumerGroupSession) error {
	return nil
}

func (h *consumerGroupHandler) ConsumeClaim(sess sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for msg := range claim.Messages() {
		var logEntry models.RequestLog
		if err := json.Unmarshal(msg.Value, &logEntry); err != nil {
			continue
		}
		select {
		case h.logsChan <- &logEntry:
		default:
		}
		sess.MarkMessage(msg, "")
	}
	return nil
}

type MockConsumer struct {
	logsChan chan *models.RequestLog
}

func NewMockConsumer() *MockConsumer {
	return &MockConsumer{
		logsChan: make(chan *models.RequestLog, 10000),
	}
}

func (m *MockConsumer) Start(ctx context.Context) error {
	go func() {
		for i := 0; ; i++ {
			select {
			case <-ctx.Done():
				return
			default:
			}
			log := &models.RequestLog{
				ID:             string(rune(i)),
				Timestamp:      models.FlexibleTime{Time: time.Now()},
				CompletionType: models.ChatCompletion,
				Model:          "gpt-4",
				Messages: []models.ChatMessage{
					{Role: "user", Content: "Hello, how are you?"},
				},
				Temperature: float64Ptr(0.7),
				MaxTokens:   intPtr(100),
				Stream:      true,
			}
			m.logsChan <- log
			time.Sleep(100 * time.Millisecond)
		}
	}()
	return nil
}

func (m *MockConsumer) LogsChannel() <-chan *models.RequestLog {
	return m.logsChan
}

func (m *MockConsumer) Close() error {
	close(m.logsChan)
	return nil
}

func float64Ptr(f float64) *float64 {
	return &f
}

func intPtr(i int) *int {
	return &i
}
