package raft

import (
	"sync"
	"time"
)

type NodeState string

const (
	Follower  NodeState = "follower"
	Candidate NodeState = "candidate"
	Leader    NodeState = "leader"
)

type LogEntry struct {
	Term    uint64
	Index   uint64
	Command interface{}
}

type RaftState struct {
	mu sync.RWMutex

	currentTerm uint64
	votedFor    string
	log         []LogEntry
	commitIndex uint64
	lastApplied uint64

	nextIndex  map[string]uint64
	matchIndex map[string]uint64

	state       NodeState
	leaderID    string
	lastContact time.Time

	applyCh chan ApplyMsg
}

type ApplyMsg struct {
	CommandValid bool
	Command      interface{}
	CommandIndex uint64
	Snapshot     []byte
	SnapshotTerm uint64
	SnapshotIndex uint64
}

type PersistentState struct {
	CurrentTerm uint64
	VotedFor    string
	Log         []LogEntry
}

type PreVoteArgs struct {
	Term         uint64
	CandidateID  string
	LastLogIndex uint64
	LastLogTerm  uint64
}

type PreVoteReply struct {
	Term        uint64
	VoteGranted bool
}

type RequestVoteArgs struct {
	Term         uint64
	CandidateID  string
	LastLogIndex uint64
	LastLogTerm  uint64
}

type RequestVoteReply struct {
	Term        uint64
	VoteGranted bool
}

type AppendEntriesArgs struct {
	Term         uint64
	LeaderID     string
	PrevLogIndex uint64
	PrevLogTerm  uint64
	Entries      []LogEntry
	LeaderCommit uint64
}

type AppendEntriesReply struct {
	Term          uint64
	Success       bool
	ConflictIndex uint64
	ConflictTerm  uint64
}

type InstallSnapshotArgs struct {
	Term              uint64
	LeaderID          string
	LastIncludedIndex uint64
	LastIncludedTerm  uint64
	Offset            uint64
	Data              []byte
	Done              bool
}

type InstallSnapshotReply struct {
	Term uint64
}
