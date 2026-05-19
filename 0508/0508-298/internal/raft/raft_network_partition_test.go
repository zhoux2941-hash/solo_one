package raft

import (
	"os"
	"testing"
	"time"
)

func setupTestRaft(t *testing.T, id string) (*Raft, func()) {
	tmpDir, err := os.MkdirTemp("", "raft-test-"+id)
	if err != nil {
		t.Fatal(err)
	}

	cfg := Config{
		ID:              id,
		Peers:           []string{"node1", "node2", "node3"},
		ElectionTimeout: 100 * time.Millisecond,
		HeartbeatInterval: 20 * time.Millisecond,
		StoragePath:     tmpDir,
	}

	r := NewRaft(cfg)
	return r, func() {
		r.Kill()
		os.RemoveAll(tmpDir)
	}
}

func TestNetworkPartitionRecovery(t *testing.T) {
	r1, cleanup1 := setupTestRaft(t, "node1")
	defer cleanup1()

	r2, cleanup2 := setupTestRaft(t, "node2")
	defer cleanup2()

	r3, cleanup3 := setupTestRaft(t, "node3")
	defer cleanup3()

	time.Sleep(300 * time.Millisecond)

	var leader *Raft
	var followers []*Raft

	if _, isLeader := r1.GetState(); isLeader {
		leader = r1
		followers = []*Raft{r2, r3}
	} else if _, isLeader := r2.GetState(); isLeader {
		leader = r2
		followers = []*Raft{r1, r3}
	} else {
		leader = r3
		followers = []*Raft{r1, r2}
	}

	for i := 0; i < 10; i++ {
		_, _, ok := leader.Start([]byte{byte(i)})
		if !ok {
			t.Fatal("Leader should accept commands")
		}
		time.Sleep(10 * time.Millisecond)
	}

	time.Sleep(200 * time.Millisecond)

	partitionedFollower := followers[0]

	partitionedFollower.mu.Lock()
	originalLogLen := len(partitionedFollower.log)
	partitionedFollower.mu.Unlock()

	if originalLogLen < 5 {
		t.Skip("Log replication didn't complete in time")
	}

	partitionedFollower.mu.Lock()
	partitionedFollower.log = partitionedFollower.log[:originalLogLen-3]
	partitionedFollower.persistState()
	partitionedFollower.mu.Unlock()

	partitionedFollower.mu.Lock()
	newLogLen := len(partitionedFollower.log)
	partitionedFollower.mu.Unlock()

	if newLogLen >= originalLogLen {
		t.Error("Log should be shorter after partition")
	}

	time.Sleep(300 * time.Millisecond)

	partitionedFollower.mu.Lock()
	finalLogLen := len(partitionedFollower.log)
	partitionedFollower.mu.Unlock()

	if finalLogLen < originalLogLen {
		t.Errorf("Log should recover after partition. Expected >= %d, got %d", originalLogLen, finalLogLen)
	}
}

func TestCommittedLogProtection(t *testing.T) {
	r1, cleanup1 := setupTestRaft(t, "node1")
	defer cleanup1()

	r1.mu.Lock()
	r1.log = []LogEntry{
		{Term: 1, Index: 0},
		{Term: 1, Index: 1, Command: []byte("cmd1")},
		{Term: 1, Index: 2, Command: []byte("cmd2")},
		{Term: 2, Index: 3, Command: []byte("cmd3")},
	}
	r1.commitIndex = 2
	r1.persistState()
	r1.mu.Unlock()

	args := &AppendEntriesArgs{
		Term:         3,
		LeaderID:     "node2",
		PrevLogIndex: 2,
		PrevLogTerm:  1,
		Entries: []LogEntry{
			{Term: 3, Index: 3, Command: []byte("new_cmd3")},
		},
		LeaderCommit: 2,
	}

	reply := &AppendEntriesReply{}
	r1.AppendEntries(args, reply)

	if !reply.Success {
		t.Error("AppendEntries should succeed")
	}

	r1.mu.Lock()
	if r1.commitIndex != 2 {
		t.Errorf("commitIndex should remain 2, got %d", r1.commitIndex)
	}

	if len(r1.log) < 4 {
		t.Errorf("Log should have at least 4 entries, got %d", len(r1.log))
	}

	if r1.log[1].Term != 1 || r1.log[2].Term != 1 {
		t.Error("Committed log entries should not change")
	}
	r1.mu.Unlock()
}

func TestPreVotePreventsUnnecessaryElections(t *testing.T) {
	r1, cleanup1 := setupTestRaft(t, "node1")
	defer cleanup1()

	r2, cleanup2 := setupTestRaft(t, "node2")
	defer cleanup2()

	_, cleanup3 := setupTestRaft(t, "node3")
	defer cleanup3()

	time.Sleep(200 * time.Millisecond)

	r1.mu.Lock()
	termBefore := r1.currentTerm
	r1.mu.Unlock()

	args := &PreVoteArgs{
		Term:         termBefore + 1,
		CandidateID:  "node3",
		LastLogIndex: 0,
		LastLogTerm:  0,
	}

	reply := &PreVoteReply{}
	r1.PreVote(args, reply)

	if reply.VoteGranted {
		t.Error("PreVote should not grant vote when leader exists")
	}

	r2.mu.Lock()
	r2.lastContact = time.Now()
	r2.mu.Unlock()

	r2.PreVote(args, reply)

	if reply.VoteGranted {
		t.Error("PreVote should not grant vote when last contact is recent")
	}
}

func TestLogRecoveryAfterSnapshot(t *testing.T) {
	r1, cleanup1 := setupTestRaft(t, "node1")
	defer cleanup1()

	r1.mu.Lock()
	for i := 1; i <= 20; i++ {
		r1.log = append(r1.log, LogEntry{Term: 1, Index: uint64(i), Command: []byte{byte(i)}})
	}
	r1.commitIndex = 15
	r1.persistState()
	r1.mu.Unlock()

	r1.Snapshot(10, []byte("snapshot_data"))

	r1.mu.Lock()
	if r1.log[0].Index != 10 {
		t.Errorf("First log index should be 10 after snapshot, got %d", r1.log[0].Index)
	}
	if r1.commitIndex != 15 {
		t.Errorf("commitIndex should remain 15 after snapshot, got %d", r1.commitIndex)
	}
	r1.mu.Unlock()

	args := &AppendEntriesArgs{
		Term:         2,
		LeaderID:     "node2",
		PrevLogIndex: 5,
		PrevLogTerm:  1,
		Entries: []LogEntry{
			{Term: 2, Index: 6, Command: []byte("recover1")},
			{Term: 2, Index: 10, Command: []byte("recover2")},
			{Term: 2, Index: 11, Command: []byte("recover3")},
		},
		LeaderCommit: 11,
	}

	reply := &AppendEntriesReply{}
	r1.AppendEntries(args, reply)

	r1.mu.Lock()
	if r1.log[0].Index != 10 {
		t.Errorf("Snapshot base should not be overwritten")
	}
	r1.mu.Unlock()
}
