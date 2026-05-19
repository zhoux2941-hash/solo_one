package elasticsearch

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/esapi"
)

type Client struct {
	client *elasticsearch.Client
	index  string
}

type Config struct {
	URLs     []string
	Username string
	Password string
	Index    string
}

func NewClient(cfg Config) (*Client, error) {
	esCfg := elasticsearch.Config{
		Addresses: cfg.URLs,
		Username:  cfg.Username,
		Password:  cfg.Password,
	}

	client, err := elasticsearch.NewClient(esCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create elasticsearch client: %w", err)
	}

	return &Client{
		client: client,
		index:  cfg.Index,
	}, nil
}

func (c *Client) IndexAlert(ctx context.Context, alert interface{}) error {
	data, err := json.Marshal(alert)
	if err != nil {
		return fmt.Errorf("failed to marshal alert: %w", err)
	}

	req := esapi.IndexRequest{
		Index:        c.index,
		DocumentType: "_doc",
		Body:         bytes.NewReader(data),
		Refresh:      "true",
	}

	res, err := req.Do(ctx, c.client)
	if err != nil {
		return fmt.Errorf("failed to index alert: %w", err)
	}
	defer res.Body.Close()

	if res.IsError() {
		var e map[string]interface{}
		if err := json.NewDecoder(res.Body).Decode(&e); err != nil {
			return fmt.Errorf("elasticsearch error: %s", res.Status())
		}
		return fmt.Errorf("elasticsearch error: %s - %v", res.Status(), e)
	}

	return nil
}

func (c *Client) Close() error {
	return nil
}

type Output struct {
	client *Client
	queue  chan interface{}
	done   chan struct{}
}

func NewOutput(cfg Config) (*Output, error) {
	client, err := NewClient(cfg)
	if err != nil {
		return nil, err
	}

	o := &Output{
		client: client,
		queue:  make(chan interface{}, 1000),
		done:   make(chan struct{}),
	}

	go o.processQueue()
	return o, nil
}

func (o *Output) processQueue() {
	ticker := time.NewTicker(100 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case alert := <-o.queue:
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			if err := o.client.IndexAlert(ctx, alert); err != nil {
				log.Printf("Failed to index alert: %v", err)
			}
			cancel()
		case <-ticker.C:
		case <-o.done:
			return
		}
	}
}

func (o *Output) Send(alert interface{}) {
	select {
	case o.queue <- alert:
	default:
		log.Printf("Elasticsearch queue full, dropping alert")
	}
}

func (o *Output) Close() {
	close(o.done)
	o.client.Close()
}
