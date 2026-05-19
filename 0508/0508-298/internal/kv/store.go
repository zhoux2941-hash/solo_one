package kv

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"sync"
	"time"

	"distkv/internal/lsm"
)

type Store struct {
	lsm     *lsm.LSMTree
	txns    map[string]*Transaction
	txnMu   sync.RWMutex
	applyMu sync.Mutex
}

func NewStore(dataDir string) (*Store, error) {
	cfg := lsm.Config{
		MemTableSize:      64 * 1024 * 1024,
		MaxLevel:          7,
		LevelSizeMultiplier: 10,
		BloomFilterK:      4,
		BloomFilterM:      1024 * 8,
		DataDir:           dataDir,
	}

	lsmTree, err := lsm.NewLSMTree(cfg)
	if err != nil {
		return nil, err
	}

	return &Store{
		lsm:  lsmTree,
		txns: make(map[string]*Transaction),
	}, nil
}

func (s *Store) Get(key string) ([]byte, error) {
	value, ok, err := s.lsm.Get(key)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, nil
	}
	return value, nil
}

func (s *Store) Put(key string, value []byte) error {
	return s.lsm.Put(key, value)
}

func (s *Store) Delete(key string) error {
	return s.lsm.Delete(key)
}

func (s *Store) CAS(key string, oldValue, newValue []byte) (bool, error) {
	s.applyMu.Lock()
	defer s.applyMu.Unlock()

	currentValue, err := s.Get(key)
	if err != nil {
		return false, err
	}

	if !bytes.Equal(currentValue, oldValue) {
		return false, nil
	}

	if err := s.Put(key, newValue); err != nil {
		return false, err
	}

	return true, nil
}

func (s *Store) BeginTxn() (*Transaction, error) {
	txnID := generateTxnID()
	txn := &Transaction{
		ID:     txnID,
		State:  TxnActive,
		Writes: make(map[string][]byte),
		Reads:  make(map[string][]byte),
	}

	s.txnMu.Lock()
	s.txns[txnID] = txn
	s.txnMu.Unlock()

	return txn, nil
}

func (s *Store) TxnPut(txn *Transaction, key string, value []byte) error {
	txn.mu.Lock()
	defer txn.mu.Unlock()

	if txn.State != TxnActive {
		return nil
	}

	txn.Writes[key] = value
	return nil
}

func (s *Store) TxnGet(txn *Transaction, key string) ([]byte, error) {
	txn.mu.Lock()
	defer txn.mu.Unlock()

	if txn.State != TxnActive {
		return nil, nil
	}

	if value, ok := txn.Writes[key]; ok {
		return value, nil
	}

	value, err := s.Get(key)
	if err != nil {
		return nil, err
	}

	txn.Reads[key] = value
	return value, nil
}

func (s *Store) TxnCommit(txn *Transaction) error {
	s.applyMu.Lock()
	defer s.applyMu.Unlock()

	txn.mu.Lock()
	defer txn.mu.Unlock()

	if txn.State != TxnActive {
		return nil
	}

	for key, expected := range txn.Reads {
		current, err := s.Get(key)
		if err != nil {
			txn.State = TxnAborted
			return err
		}
		if !bytes.Equal(current, expected) {
			txn.State = TxnAborted
			return nil
		}
	}

	for key, value := range txn.Writes {
		if err := s.Put(key, value); err != nil {
			txn.State = TxnAborted
			return err
		}
	}

	txn.State = TxnCommitted

	s.txnMu.Lock()
	delete(s.txns, txn.ID)
	s.txnMu.Unlock()

	return nil
}

func (s *Store) TxnAbort(txn *Transaction) error {
	txn.mu.Lock()
	defer txn.mu.Unlock()

	txn.State = TxnAborted

	s.txnMu.Lock()
	delete(s.txns, txn.ID)
	s.txnMu.Unlock()

	return nil
}

func (s *Store) Apply(cmd Command) (interface{}, error) {
	switch cmd.Type {
	case CmdPut:
		return nil, s.Put(cmd.Key, cmd.Value)
	case CmdGet:
		return s.Get(cmd.Key)
	case CmdDelete:
		return nil, s.Delete(cmd.Key)
	case CmdCAS:
		return s.CAS(cmd.Key, cmd.OldValue, cmd.Value)
	case CmdTxnBegin:
		return s.BeginTxn()
	case CmdTxnCommit:
		txn := s.getTxn(cmd.TxnID)
		if txn == nil {
			return nil, nil
		}
		return nil, s.TxnCommit(txn)
	case CmdTxnAbort:
		txn := s.getTxn(cmd.TxnID)
		if txn == nil {
			return nil, nil
		}
		return nil, s.TxnAbort(txn)
	default:
		return nil, nil
	}
}

func (s *Store) getTxn(txnID string) *Transaction {
	s.txnMu.RLock()
	defer s.txnMu.RUnlock()
	return s.txns[txnID]
}

func (s *Store) CreateSnapshot() ([]byte, error) {
	return s.lsm.CreateSnapshot()
}

func (s *Store) RestoreSnapshot(data []byte) error {
	return s.lsm.RestoreSnapshot(data)
}

func (s *Store) Close() {
	s.lsm.Close()
}

func generateTxnID() string {
	b := make([]byte, 16)
	rand.Read(b)
	return hex.EncodeToString(b) + "-" + time.Now().Format("20060102150405")
}
