package raft

import (
	"math/rand"
	"sync"
	"time"
)

type Config struct {
	ID              string
	Peers           []string
	ElectionTimeout time.Duration
	HeartbeatInterval time.Duration
	StoragePath     string
}

type Raft struct {
	mu        sync.Mutex
	me        string
	peers     []string
	persister *Persister

	state       NodeState
	currentTerm uint64
	votedFor    string
	log         []LogEntry

	commitIndex uint64
	lastApplied uint64

	nextIndex  map[string]uint64
	matchIndex map[string]uint64

	leaderID    string
	lastContact time.Time

	electionTimeout   time.Duration
	heartbeatInterval time.Duration
	electionTimer     *time.Timer
	heartbeatTimer    *time.Timer

	applyCh chan ApplyMsg
	killCh  chan struct{}

	readIndexCh  chan *ReadIndexRequest
	readRequests []*ReadIndexRequest
}

type ReadIndexRequest struct {
	Index    uint64
	NotifyCh chan struct{}
}

func NewRaft(cfg Config) *Raft {
	r := &Raft{
		me:                cfg.ID,
		peers:             cfg.Peers,
		state:             Follower,
		currentTerm:       0,
		votedFor:          "",
		log:               make([]LogEntry, 1),
		commitIndex:       0,
		lastApplied:       0,
		nextIndex:         make(map[string]uint64),
		matchIndex:        make(map[string]uint64),
		electionTimeout:   cfg.ElectionTimeout,
		heartbeatInterval: cfg.HeartbeatInterval,
		applyCh:           make(chan ApplyMsg, 1000),
		killCh:            make(chan struct{}),
		readIndexCh:       make(chan *ReadIndexRequest, 100),
		persister:         NewPersister(cfg.StoragePath),
	}

	r.log[0] = LogEntry{Term: 0, Index: 0}
	r.restoreState()
	r.resetElectionTimer()

	go r.run()

	return r
}

func (r *Raft) run() {
	for {
		select {
		case <-r.killCh:
			return
		case req := <-r.readIndexCh:
			r.handleReadIndex(req)
		case <-r.electionTimer.C:
			r.handleElectionTimeout()
		case <-r.heartbeatTimer.C:
			if r.state == Leader {
				r.sendHeartbeats()
				r.heartbeatTimer.Reset(r.heartbeatInterval)
			}
		}
	}
}

func (r *Raft) resetElectionTimer() {
	timeout := r.electionTimeout + time.Duration(rand.Int63n(int64(r.electionTimeout)))
	if r.electionTimer == nil {
		r.electionTimer = time.NewTimer(timeout)
	} else {
		r.electionTimer.Stop()
		r.electionTimer.Reset(timeout)
	}
}

func (r *Raft) handleElectionTimeout() {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.state == Leader {
		r.resetElectionTimer()
		return
	}

	r.startPreVote()
}

func (r *Raft) startPreVote() {
	preVoteTerm := r.currentTerm + 1
	lastLogIndex, lastLogTerm := r.lastLogInfo()

	votes := 1
	granted := make(chan bool, len(r.peers)-1)

	for _, peer := range r.peers {
		if peer == r.me {
			continue
		}
		go func(peer string) {
			args := PreVoteArgs{
				Term:         preVoteTerm,
				CandidateID:  r.me,
				LastLogIndex: lastLogIndex,
				LastLogTerm:  lastLogTerm,
			}
			reply := PreVoteReply{}
			if r.sendPreVote(peer, &args, &reply) {
				granted <- reply.VoteGranted
			} else {
				granted <- false
			}
		}(peer)
	}

	go func() {
		for i := 0; i < len(r.peers)-1; i++ {
			if <-granted {
				votes++
				if votes > len(r.peers)/2 {
					r.mu.Lock()
					if r.state == Follower {
						r.startElection()
					}
					r.mu.Unlock()
					return
				}
			}
		}
	}()
}

func (r *Raft) startElection() {
	r.state = Candidate
	r.currentTerm++
	r.votedFor = r.me
	r.resetElectionTimer()
	r.persistState()

	lastLogIndex, lastLogTerm := r.lastLogInfo()

	votes := 1
	granted := make(chan bool, len(r.peers)-1)

	for _, peer := range r.peers {
		if peer == r.me {
			continue
		}
		go func(peer string) {
			args := RequestVoteArgs{
				Term:         r.currentTerm,
				CandidateID:  r.me,
				LastLogIndex: lastLogIndex,
				LastLogTerm:  lastLogTerm,
			}
			reply := RequestVoteReply{}
			if r.sendRequestVote(peer, &args, &reply) {
				granted <- reply.VoteGranted
			} else {
				granted <- false
			}
		}(peer)
	}

	go func() {
		for i := 0; i < len(r.peers)-1; i++ {
			if <-granted {
				votes++
				if votes > len(r.peers)/2 {
					r.mu.Lock()
					if r.state == Candidate {
						r.becomeLeader()
					}
					r.mu.Unlock()
					return
				}
			}
		}
	}()
}

func (r *Raft) becomeLeader() {
	r.state = Leader
	r.leaderID = r.me

	for _, peer := range r.peers {
		r.nextIndex[peer] = r.lastLogIndex() + 1
		r.matchIndex[peer] = 0
	}

	r.heartbeatTimer = time.NewTimer(r.heartbeatInterval)
	r.sendHeartbeats()
}

func (r *Raft) sendHeartbeats() {
	for _, peer := range r.peers {
		if peer == r.me {
			continue
		}
		go r.sendAppendEntries(peer)
	}
}

func (r *Raft) sendAppendEntries(peer string) {
	r.mu.Lock()
	if r.state != Leader {
		r.mu.Unlock()
		return
	}

	prevLogIndex := r.nextIndex[peer] - 1
	prevLogTerm := r.log[prevLogIndex].Term

	var entries []LogEntry
	if r.nextIndex[peer] <= r.lastLogIndex() {
		entries = r.log[r.nextIndex[peer]:]
	}

	args := AppendEntriesArgs{
		Term:         r.currentTerm,
		LeaderID:     r.me,
		PrevLogIndex: prevLogIndex,
		PrevLogTerm:  prevLogTerm,
		Entries:      entries,
		LeaderCommit: r.commitIndex,
	}
	r.mu.Unlock()

	reply := AppendEntriesReply{}
	if r.sendAppendEntriesRPC(peer, &args, &reply) {
		r.mu.Lock()
		defer r.mu.Unlock()

		if reply.Term > r.currentTerm {
			r.becomeFollower(reply.Term)
			return
		}

		if r.state != Leader || r.currentTerm != args.Term {
			return
		}

		if reply.Success {
			r.nextIndex[peer] = args.PrevLogIndex + uint64(len(args.Entries)) + 1
			r.matchIndex[peer] = r.nextIndex[peer] - 1
			r.updateCommitIndex()
		} else {
			if reply.ConflictTerm != 0 {
				lastIndex := r.findLastIndexOfTerm(reply.ConflictTerm)
				if lastIndex > 0 {
					r.nextIndex[peer] = lastIndex + 1
				} else {
					r.nextIndex[peer] = reply.ConflictIndex
				}
			} else {
				r.nextIndex[peer] = reply.ConflictIndex
			}
		}
	}
}

func (r *Raft) updateCommitIndex() {
	for n := r.commitIndex + 1; n <= r.lastLogIndex(); n++ {
		if r.log[n].Term == r.currentTerm {
			count := 1
			for _, peer := range r.peers {
				if peer != r.me && r.matchIndex[peer] >= n {
					count++
				}
			}
			if count > len(r.peers)/2 {
				r.commitIndex = n
				go r.applyEntries()
			}
		}
	}
}

func (r *Raft) applyEntries() {
	r.mu.Lock()
	defer r.mu.Unlock()

	for r.lastApplied < r.commitIndex {
		r.lastApplied++
		entry := r.log[r.lastApplied]
		r.applyCh <- ApplyMsg{
			CommandValid: true,
			Command:      entry.Command,
			CommandIndex: entry.Index,
		}
	}
}

func (r *Raft) PreVote(args *PreVoteArgs, reply *PreVoteReply) {
	r.mu.Lock()
	defer r.mu.Unlock()

	reply.Term = r.currentTerm
	reply.VoteGranted = false

	if args.Term < r.currentTerm {
		return
	}

	if args.Term > r.currentTerm {
		reply.VoteGranted = r.isLogUpToDate(args.LastLogIndex, args.LastLogTerm)
		return
	}

	if r.state == Leader {
		return
	}

	if time.Since(r.lastContact) < r.electionTimeout {
		return
	}

	reply.VoteGranted = r.isLogUpToDate(args.LastLogIndex, args.LastLogTerm)
}

func (r *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
	r.mu.Lock()
	defer r.mu.Unlock()

	reply.Term = r.currentTerm
	reply.VoteGranted = false

	if args.Term < r.currentTerm {
		return
	}

	if args.Term > r.currentTerm {
		r.becomeFollower(args.Term)
	}

	if (r.votedFor == "" || r.votedFor == args.CandidateID) && r.isLogUpToDate(args.LastLogIndex, args.LastLogTerm) {
		reply.VoteGranted = true
		r.votedFor = args.CandidateID
		r.lastContact = time.Now()
		r.persistState()
	}
}

func (r *Raft) AppendEntries(args *AppendEntriesArgs, reply *AppendEntriesReply) {
	r.mu.Lock()
	defer r.mu.Unlock()

	reply.Term = r.currentTerm
	reply.Success = false

	if args.Term < r.currentTerm {
		return
	}

	if args.Term > r.currentTerm {
		r.becomeFollower(args.Term)
	}

	r.lastContact = time.Now()
	r.leaderID = args.LeaderID
	r.resetElectionTimer()

	if args.PrevLogIndex > r.lastLogIndex() {
		reply.ConflictIndex = r.lastLogIndex() + 1
		return
	}

	if args.PrevLogIndex < r.log[0].Index {
		if args.PrevLogIndex+uint64(len(args.Entries)) >= r.log[0].Index {
			baseIndex := r.log[0].Index
			args.Entries = args.Entries[baseIndex-args.PrevLogIndex:]
			args.PrevLogIndex = baseIndex - 1
			args.PrevLogTerm = r.log[0].Term
		} else {
			return
		}
	}

	if r.log[args.PrevLogIndex].Term != args.PrevLogTerm {
		conflictTerm := r.log[args.PrevLogIndex].Term
		reply.ConflictTerm = conflictTerm
		conflictIndex := r.findFirstIndexOfTerm(conflictTerm)
		if conflictIndex <= r.commitIndex {
			conflictIndex = r.commitIndex + 1
		}
		reply.ConflictIndex = conflictIndex
		return
	}

	reply.Success = true

	for i, entry := range args.Entries {
		index := args.PrevLogIndex + 1 + uint64(i)
		if index > r.lastLogIndex() {
			r.log = append(r.log, entry)
		} else if index > r.commitIndex && r.log[index].Term != entry.Term {
			r.log = r.log[:index]
			r.log = append(r.log, entry)
		}
	}

	if args.LeaderCommit > r.commitIndex {
		newCommitIndex := args.LeaderCommit
		if newCommitIndex > r.lastLogIndex() {
			newCommitIndex = r.lastLogIndex()
		}
		if newCommitIndex > r.commitIndex {
			r.commitIndex = newCommitIndex
			go r.applyEntries()
		}
	}

	r.persistState()
}

func (r *Raft) becomeFollower(term uint64) {
	r.currentTerm = term
	r.state = Follower
	r.votedFor = ""
	r.leaderID = ""
	r.persistState()
	r.resetElectionTimer()
}

func (r *Raft) isLogUpToDate(candidateIndex, candidateTerm uint64) bool {
	lastIndex, lastTerm := r.lastLogInfo()
	if candidateTerm != lastTerm {
		return candidateTerm > lastTerm
	}
	return candidateIndex >= lastIndex
}

func (r *Raft) lastLogInfo() (uint64, uint64) {
	last := r.log[len(r.log)-1]
	return last.Index, last.Term
}

func (r *Raft) lastLogIndex() uint64 {
	return r.log[len(r.log)-1].Index
}

func (r *Raft) findLastIndexOfTerm(term uint64) uint64 {
	for i := len(r.log) - 1; i >= 0; i-- {
		if r.log[i].Term == term {
			return r.log[i].Index
		}
	}
	return 0
}

func (r *Raft) findFirstIndexOfTerm(term uint64) uint64 {
	for i := 0; i < len(r.log); i++ {
		if r.log[i].Term == term {
			return r.log[i].Index
		}
	}
	return 0
}

func (r *Raft) Start(command interface{}) (uint64, uint64, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.state != Leader {
		return 0, 0, false
	}

	index := r.lastLogIndex() + 1
	term := r.currentTerm
	r.log = append(r.log, LogEntry{
		Term:    term,
		Index:   index,
		Command: command,
	})
	r.persistState()

	return index, term, true
}

func (r *Raft) ReadIndex() (uint64, error) {
	r.mu.Lock()
	if r.state != Leader {
		r.mu.Unlock()
		return 0, nil
	}

	notifyCh := make(chan struct{})
	req := &ReadIndexRequest{
		Index:    r.commitIndex,
		NotifyCh: notifyCh,
	}
	r.readRequests = append(r.readRequests, req)
	r.mu.Unlock()

	r.readIndexCh <- req

	<-notifyCh
	return req.Index, nil
}

func (r *Raft) handleReadIndex(req *ReadIndexRequest) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.state != Leader {
		close(req.NotifyCh)
		return
	}

	count := 1
	for _, peer := range r.peers {
		if peer != r.me && r.matchIndex[peer] >= req.Index {
			count++
		}
	}

	if count > len(r.peers)/2 {
		close(req.NotifyCh)
	}
}

func (r *Raft) GetState() (uint64, bool) {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.currentTerm, r.state == Leader
}

func (r *Raft) ApplyCh() <-chan ApplyMsg {
	return r.applyCh
}

func (r *Raft) Kill() {
	close(r.killCh)
}

func (r *Raft) sendPreVote(peer string, args *PreVoteArgs, reply *PreVoteReply) bool {
	return true
}

func (r *Raft) sendRequestVote(peer string, args *RequestVoteArgs, reply *RequestVoteReply) bool {
	return true
}

func (r *Raft) sendAppendEntriesRPC(peer string, args *AppendEntriesArgs, reply *AppendEntriesReply) bool {
	return true
}
