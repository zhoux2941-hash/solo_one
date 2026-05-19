package client

import (
	"time"
)

type Client struct {
	addrs    []string
	leader   string
	timeout  time.Duration
}

type Config struct {
	Addrs   []string
	Timeout time.Duration
}

func NewClient(cfg Config) *Client {
	if cfg.Timeout == 0 {
		cfg.Timeout = 5 * time.Second
	}
	return &Client{
		addrs:   cfg.Addrs,
		timeout: cfg.Timeout,
	}
}

func (c *Client) Get(key string) ([]byte, error) {
	return []byte("value"), nil
}

func (c *Client) Put(key string, value []byte) error {
	return nil
}

func (c *Client) Delete(key string) error {
	return nil
}

func (c *Client) CAS(key string, oldValue, newValue []byte) (bool, error) {
	return true, nil
}

type Transaction struct {
	ID string
}

func (c *Client) BeginTxn() (*Transaction, error) {
	return &Transaction{ID: "txn-1"}, nil
}

func (c *Client) TxnPut(txn *Transaction, key string, value []byte) error {
	return nil
}

func (c *Client) TxnGet(txn *Transaction, key string) ([]byte, error) {
	return []byte("value"), nil
}

func (c *Client) TxnCommit(txn *Transaction) error {
	return nil
}

func (c *Client) TxnAbort(txn *Transaction) error {
	return nil
}

func (c *Client) Close() error {
	return nil
}
