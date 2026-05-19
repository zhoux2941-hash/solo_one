package kv

import "sync"

type CommandType string

const (
	CmdPut      CommandType = "put"
	CmdGet      CommandType = "get"
	CmdDelete   CommandType = "delete"
	CmdCAS      CommandType = "cas"
	CmdTxnBegin CommandType = "txn_begin"
	CmdTxnCommit CommandType = "txn_commit"
	CmdTxnAbort CommandType = "txn_abort"
)

type Command struct {
	Type  CommandType
	Key   string
	Value []byte
	OldValue []byte
	TxnID  string
}

type Transaction struct {
	ID      string
	State   TxnState
	Writes  map[string][]byte
	Reads   map[string][]byte
	mu      sync.Mutex
}

type TxnState string

const (
	TxnActive   TxnState = "active"
	TxnPrepared TxnState = "prepared"
	TxnCommitted TxnState = "committed"
	TxnAborted  TxnState = "aborted"
)

type KVStore interface {
	Get(key string) ([]byte, error)
	Put(key string, value []byte) error
	Delete(key string) error
	CAS(key string, oldValue, newValue []byte) (bool, error)

	BeginTxn() (*Transaction, error)
	TxnPut(txn *Transaction, key string, value []byte) error
	TxnGet(txn *Transaction, key string) ([]byte, error)
	TxnCommit(txn *Transaction) error
	TxnAbort(txn *Transaction) error

	CreateSnapshot() ([]byte, error)
	RestoreSnapshot(data []byte) error
}
