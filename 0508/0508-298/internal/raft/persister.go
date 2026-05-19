package raft

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Persister struct {
	path string
}

func NewPersister(path string) *Persister {
	os.MkdirAll(path, 0755)
	return &Persister{path: path}
}

func (p *Persister) Save(state PersistentState) error {
	data, err := json.Marshal(state)
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(p.path, "raft_state.json"), data, 0644)
}

func (p *Persister) Load() (PersistentState, error) {
	data, err := os.ReadFile(filepath.Join(p.path, "raft_state.json"))
	if os.IsNotExist(err) {
		return PersistentState{}, nil
	}
	if err != nil {
		return PersistentState{}, err
	}
	var state PersistentState
	err = json.Unmarshal(data, &state)
	return state, err
}

func (p *Persister) SaveSnapshot(snapshot []byte, index uint64) error {
	return os.WriteFile(filepath.Join(p.path, "snapshot.bin"), snapshot, 0644)
}

func (p *Persister) LoadSnapshot() ([]byte, error) {
	data, err := os.ReadFile(filepath.Join(p.path, "snapshot.bin"))
	if os.IsNotExist(err) {
		return nil, nil
	}
	return data, err
}

func (r *Raft) persistState() {
	state := PersistentState{
		CurrentTerm: r.currentTerm,
		VotedFor:    r.votedFor,
		Log:         r.log,
	}
	r.persister.Save(state)
}

func (r *Raft) restoreState() {
	state, err := r.persister.Load()
	if err == nil && state.Log != nil {
		r.currentTerm = state.CurrentTerm
		r.votedFor = state.VotedFor
		r.log = state.Log
	}
}

func (r *Raft) Snapshot(index uint64, snapshot []byte) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if index <= r.log[0].Index {
		return
	}

	lastIncludedIndex := index
	lastIncludedTerm := r.log[index-r.log[0].Index].Term

	newLog := make([]LogEntry, 1)
	newLog[0] = LogEntry{
		Term:    lastIncludedTerm,
		Index:   lastIncludedIndex,
		Command: nil,
	}

	if index < r.lastLogIndex() {
		newLog = append(newLog, r.log[index-r.log[0].Index+1:]...)
	}

	r.log = newLog
	r.persistState()
	r.persister.SaveSnapshot(snapshot, index)
}

func (r *Raft) InstallSnapshot(args *InstallSnapshotArgs, reply *InstallSnapshotReply) {
	r.mu.Lock()
	defer r.mu.Unlock()

	reply.Term = r.currentTerm

	if args.Term < r.currentTerm {
		return
	}

	if args.Term > r.currentTerm {
		r.becomeFollower(args.Term)
	}

	r.lastContact = time.Now()
	r.resetElectionTimer()

	if args.LastIncludedIndex <= r.log[0].Index {
		return
	}

	newLog := make([]LogEntry, 1)
	newLog[0] = LogEntry{
		Term:    args.LastIncludedTerm,
		Index:   args.LastIncludedIndex,
		Command: nil,
	}

	if args.LastIncludedIndex < r.lastLogIndex() {
		start := args.LastIncludedIndex - r.log[0].Index + 1
		if start < uint64(len(r.log)) {
			newLog = append(newLog, r.log[start:]...)
		}
	}

	r.log = newLog
	r.commitIndex = args.LastIncludedIndex
	r.lastApplied = args.LastIncludedIndex
	r.persistState()
	r.persister.SaveSnapshot(args.Data, args.LastIncludedIndex)

	r.applyCh <- ApplyMsg{
		Snapshot:      args.Data,
		SnapshotTerm:  args.LastIncludedTerm,
		SnapshotIndex: args.LastIncludedIndex,
	}
}
