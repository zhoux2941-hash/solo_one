package lsm

import "sync"

type KVEntry struct {
	Key       string
	Value     []byte
	Timestamp int64
	Deleted   bool
}

type MemTable struct {
	data  map[string]KVEntry
	mu    sync.RWMutex
	size  int
}

type SSTable struct {
	ID        int
	Level     int
	Path      string
	Index     map[string]int64
	BloomFilter *BloomFilter
	Size      int
}

type BloomFilter struct {
	bits    []bool
	k       int
	m       int
}

type Config struct {
	MemTableSize      int
	MaxLevel          int
	LevelSizeMultiplier int
	BloomFilterK      int
	BloomFilterM      int
	DataDir           string
}

type LSMTree struct {
	config     Config
	memTable   *MemTable
	immutable  *MemTable
	sstables   [][]*SSTable
	compactionChan chan struct{}
	mu         sync.RWMutex
}
