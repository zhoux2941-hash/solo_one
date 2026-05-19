package node

import (
	"encoding/json"
	"sync"
	"time"

	"distkv/internal/kv"
	"distkv/internal/raft"
)

type Node struct {
	id         string
	raft       *raft.Raft
	store      *kv.Store
	mu         sync.RWMutex
	applyCh    chan raft.ApplyMsg
	notifyCh   map[uint64]chan interface{}
	leaderAddr string
}

type Config struct {
	ID              string
	Peers           []string
	DataDir         string
	ElectionTimeout time.Duration
	HeartbeatInterval time.Duration
}

func NewNode(cfg Config) (*Node, error) {
	store, err := kv.NewStore(cfg.DataDir + "/kv")
	if err != nil {
		return nil, err
	}

	raftCfg := raft.Config{
		ID:              cfg.ID,
		Peers:           cfg.Peers,
		ElectionTimeout: cfg.ElectionTimeout,
		HeartbeatInterval: cfg.HeartbeatInterval,
		StoragePath:     cfg.DataDir + "/raft",
	}

	r := raft.NewRaft(raftCfg)

	n := &Node{
		id:       cfg.ID,
		raft:     r,
		store:    store,
		applyCh:  r.ApplyCh(),
		notifyCh: make(map[uint64]chan interface{}),
	}

	go n.applyLoop()

	return n, nil
}

func (n *Node) applyLoop() {
	for msg := range n.applyCh {
		if msg.CommandValid {
			var cmd kv.Command
			cmdBytes, ok := msg.Command.([]byte)
			if ok {
				json.Unmarshal(cmdBytes, &cmd)
				result, err := n.store.Apply(cmd)
				
				n.mu.Lock()
				if ch, ok := n.notifyCh[msg.CommandIndex]; ok {
					select {
					case ch <- map[string]interface{}{"result": result, "error": err}:
					default:
					}
					close(ch)
					delete(n.notifyCh, msg.CommandIndex)
				}
				n.mu.Unlock()
			}
		} else if len(msg.Snapshot) > 0 {
			n.store.RestoreSnapshot(msg.Snapshot)
		}
	}
}

func (n *Node) Get(key string) ([]byte, error) {
	_, isLeader := n.raft.GetState()
	if !isLeader {
		return nil, nil
	}

	readIndex, err := n.raft.ReadIndex()
	if err != nil {
		return nil, err
	}

	for {
		index, _ := n.raft.GetState()
		if index >= readIndex {
			break
		}
		time.Sleep(1 * time.Millisecond)
	}

	return n.store.Get(key)
}

func (n *Node) Put(key string, value []byte) error {
	cmd := kv.Command{
		Type:  kv.CmdPut,
		Key:   key,
		Value: value,
	}
	return n.propose(cmd)
}

func (n *Node) Delete(key string) error {
	cmd := kv.Command{
		Type: kv.CmdDelete,
		Key:  key,
	}
	return n.propose(cmd)
}

func (n *Node) CAS(key string, oldValue, newValue []byte) (bool, error) {
	cmd := kv.Command{
		Type:     kv.CmdCAS,
		Key:      key,
		OldValue: oldValue,
		Value:    newValue,
	}
	
	result, err := n.proposeWithResult(cmd)
	if err != nil {
		return false, err
	}
	if res, ok := result.(bool); ok {
		return res, nil
	}
	return false, nil
}

func (n *Node) BeginTxn() (*kv.Transaction, error) {
	return n.store.BeginTxn()
}

func (n *Node) TxnPut(txn *kv.Transaction, key string, value []byte) error {
	return n.store.TxnPut(txn, key, value)
}

func (n *Node) TxnGet(txn *kv.Transaction, key string) ([]byte, error) {
	return n.store.TxnGet(txn, key)
}

func (n *Node) TxnCommit(txn *kv.Transaction) error {
	cmd := kv.Command{
		Type:  kv.CmdTxnCommit,
		TxnID: txn.ID,
	}
	return n.propose(cmd)
}

func (n *Node) TxnAbort(txn *kv.Transaction) error {
	cmd := kv.Command{
		Type:  kv.CmdTxnAbort,
		TxnID: txn.ID,
	}
	return n.propose(cmd)
}

func (n *Node) propose(cmd kv.Command) error {
	cmdBytes, _ := json.Marshal(cmd)
	index, _, ok := n.raft.Start(cmdBytes)
	if !ok {
		return nil
	}

	ch := make(chan interface{}, 1)
	n.mu.Lock()
	n.notifyCh[index] = ch
	n.mu.Unlock()

	select {
	case <-ch:
	case <-time.After(5 * time.Second):
	}

	return nil
}

func (n *Node) proposeWithResult(cmd kv.Command) (interface{}, error) {
	cmdBytes, _ := json.Marshal(cmd)
	index, _, ok := n.raft.Start(cmdBytes)
	if !ok {
		return nil, nil
	}

	ch := make(chan interface{}, 1)
	n.mu.Lock()
	n.notifyCh[index] = ch
	n.mu.Unlock()

	select {
	case result := <-ch:
		if resMap, ok := result.(map[string]interface{}); ok {
			if err, ok := resMap["error"].(error); ok && err != nil {
				return nil, err
			}
			return resMap["result"], nil
		}
	case <-time.After(5 * time.Second):
	}

	return nil, nil
}

func (n *Node) CreateSnapshot(index uint64) error {
	snapshot, err := n.store.CreateSnapshot()
	if err != nil {
		return err
	}
	n.raft.Snapshot(index, snapshot)
	return nil
}

func (n *Node) GetStatus() map[string]interface{} {
	term, isLeader := n.raft.GetState()
	return map[string]interface{}{
		"id":        n.id,
		"term":      term,
		"isLeader":  isLeader,
	}
}

func (n *Node) IsLeader() bool {
	_, isLeader := n.raft.GetState()
	return isLeader
}

func (n *Node) Stop() {
	n.raft.Kill()
	n.store.Close()
}
