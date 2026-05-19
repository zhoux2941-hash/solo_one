package lsm

import (
	"encoding/binary"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"os"
	"path/filepath"
	"sort"
	"time"
)

func NewMemTable() *MemTable {
	return &MemTable{
		data: make(map[string]KVEntry),
		size: 0,
	}
}

func (mt *MemTable) Get(key string) (KVEntry, bool) {
	mt.mu.RLock()
	defer mt.mu.RUnlock()
	entry, ok := mt.data[key]
	return entry, ok
}

func (mt *MemTable) Put(key string, value []byte) {
	mt.mu.Lock()
	defer mt.mu.Unlock()
	entry := KVEntry{
		Key:       key,
		Value:     value,
		Timestamp: time.Now().UnixNano(),
		Deleted:   false,
	}
	old, exists := mt.data[key]
	if exists {
		mt.size -= len(old.Key) + len(old.Value)
	}
	mt.data[key] = entry
	mt.size += len(key) + len(value)
}

func (mt *MemTable) Delete(key string) {
	mt.mu.Lock()
	defer mt.mu.Unlock()
	entry := KVEntry{
		Key:       key,
		Value:     nil,
		Timestamp: time.Now().UnixNano(),
		Deleted:   true,
	}
	old, exists := mt.data[key]
	if exists {
		mt.size -= len(old.Key) + len(old.Value)
	}
	mt.data[key] = entry
	mt.size += len(key) + 1
}

func (mt *MemTable) Size() int {
	mt.mu.RLock()
	defer mt.mu.RUnlock()
	return mt.size
}

func (mt *MemTable) Entries() []KVEntry {
	mt.mu.RLock()
	defer mt.mu.RUnlock()
	entries := make([]KVEntry, 0, len(mt.data))
	for _, entry := range mt.data {
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Key < entries[j].Key
	})
	return entries
}

func NewBloomFilter(m, k int) *BloomFilter {
	return &BloomFilter{
		bits: make([]bool, m),
		k:    k,
		m:    m,
	}
}

func (bf *BloomFilter) Add(key string) {
	for i := 0; i < bf.k; i++ {
		hash := bf.hash(key, uint32(i))
		bf.bits[hash%uint32(bf.m)] = true
	}
}

func (bf *BloomFilter) MightContain(key string) bool {
	for i := 0; i < bf.k; i++ {
		hash := bf.hash(key, uint32(i))
		if !bf.bits[hash%uint32(bf.m)] {
			return false
		}
	}
	return true
}

func (bf *BloomFilter) hash(key string, seed uint32) uint32 {
	h := fnv.New32a()
	h.Write([]byte(key))
	binary.Write(h, binary.LittleEndian, seed)
	return h.Sum32()
}

func NewLSMTree(cfg Config) (*LSMTree, error) {
	if err := os.MkdirAll(cfg.DataDir, 0755); err != nil {
		return nil, err
	}

	lsm := &LSMTree{
		config:         cfg,
		memTable:       NewMemTable(),
		immutable:      nil,
		sstables:       make([][]*SSTable, cfg.MaxLevel),
		compactionChan: make(chan struct{}, 1),
	}

	if err := lsm.loadSSTables(); err != nil {
		return nil, err
	}

	go lsm.compactionLoop()

	return lsm, nil
}

func (l *LSMTree) Get(key string) ([]byte, bool, error) {
	l.mu.RLock()

	entry, ok := l.memTable.Get(key)
	if ok {
		l.mu.RUnlock()
		if entry.Deleted {
			return nil, false, nil
		}
		return entry.Value, true, nil
	}

	if l.immutable != nil {
		entry, ok = l.immutable.Get(key)
		if ok {
			l.mu.RUnlock()
			if entry.Deleted {
				return nil, false, nil
			}
			return entry.Value, true, nil
		}
	}

	sstables := make([]*SSTable, 0)
	for level := 0; level < l.config.MaxLevel; level++ {
		for _, sst := range l.sstables[level] {
			if sst.BloomFilter.MightContain(key) {
				sstables = append(sstables, sst)
			}
		}
	}
	l.mu.RUnlock()

	for _, sst := range sstables {
		entry, ok, err := l.readSSTable(sst, key)
		if err != nil {
			return nil, false, err
		}
		if ok {
			if entry.Deleted {
				return nil, false, nil
			}
			return entry.Value, true, nil
		}
	}

	return nil, false, nil
}

func (l *LSMTree) Put(key string, value []byte) error {
	l.mu.Lock()
	l.memTable.Put(key, value)

	if l.memTable.Size() >= l.config.MemTableSize {
		l.switchMemTable()
	}
	l.mu.Unlock()

	return nil
}

func (l *LSMTree) Delete(key string) error {
	l.mu.Lock()
	l.memTable.Delete(key)

	if l.memTable.Size() >= l.config.MemTableSize {
		l.switchMemTable()
	}
	l.mu.Unlock()

	return nil
}

func (l *LSMTree) switchMemTable() {
	if l.immutable != nil {
		return
	}
	l.immutable = l.memTable
	l.memTable = NewMemTable()

	go l.flushImmutable()
}

func (l *LSMTree) flushImmutable() {
	l.mu.RLock()
	imm := l.immutable
	l.mu.RUnlock()

	if imm == nil {
		return
	}

	sst, err := l.createSSTable(imm.Entries(), 0)
	if err != nil {
		return
	}

	l.mu.Lock()
	l.sstables[0] = append(l.sstables[0], sst)
	l.immutable = nil
	l.mu.Unlock()

	l.triggerCompaction()
}

func (l *LSMTree) createSSTable(entries []KVEntry, level int) (*SSTable, error) {
	id := time.Now().UnixNano()
	path := filepath.Join(l.config.DataDir, fmt.Sprintf("L%d_%d.sst", level, id))

	file, err := os.Create(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	bf := NewBloomFilter(l.config.BloomFilterM, l.config.BloomFilterK)
	index := make(map[string]int64)

	for _, entry := range entries {
		bf.Add(entry.Key)
		offset, _ := file.Seek(0, 1)
		index[entry.Key] = offset

		data, _ := json.Marshal(entry)
		binary.Write(file, binary.LittleEndian, uint32(len(data)))
		file.Write(data)
	}

	sst := &SSTable{
		ID:          int(id),
		Level:       level,
		Path:        path,
		Index:       index,
		BloomFilter: bf,
		Size:        len(entries),
	}

	indexPath := path + ".index"
	indexData, _ := json.Marshal(sst)
	os.WriteFile(indexPath, indexData, 0644)

	return sst, nil
}

func (l *LSMTree) readSSTable(sst *SSTable, key string) (KVEntry, bool, error) {
	offset, ok := sst.Index[key]
	if !ok {
		return KVEntry{}, false, nil
	}

	file, err := os.Open(sst.Path)
	if err != nil {
		return KVEntry{}, false, err
	}
	defer file.Close()

	file.Seek(offset, 0)

	var size uint32
	binary.Read(file, binary.LittleEndian, &size)
	data := make([]byte, size)
	file.Read(data)

	var entry KVEntry
	json.Unmarshal(data, &entry)
	return entry, true, nil
}

func (l *LSMTree) loadSSTables() error {
	for level := 0; level < l.config.MaxLevel; level++ {
		pattern := filepath.Join(l.config.DataDir, fmt.Sprintf("L%d_*.sst.index", level))
		matches, _ := filepath.Glob(pattern)
		for _, match := range matches {
			data, err := os.ReadFile(match)
			if err != nil {
				continue
			}
			var sst SSTable
			if json.Unmarshal(data, &sst) == nil {
				l.sstables[level] = append(l.sstables[level], &sst)
			}
		}
	}
	return nil
}

func (l *LSMTree) triggerCompaction() {
	select {
	case l.compactionChan <- struct{}{}:
	default:
	}
}

func (l *LSMTree) compactionLoop() {
	for range l.compactionChan {
		l.compact()
	}
}

func (l *LSMTree) compact() {
	for level := 0; level < l.config.MaxLevel-1; level++ {
		l.mu.RLock()
		levelSize := len(l.sstables[level])
		threshold := l.config.MemTableSize * (1 << level) * l.config.LevelSizeMultiplier
		l.mu.RUnlock()

		if levelSize > threshold {
			l.doCompact(level)
		}
	}
}

func (l *LSMTree) doCompact(level int) {
	l.mu.Lock()
	if len(l.sstables[level]) == 0 {
		l.mu.Unlock()
		return
	}

	toCompact := l.sstables[level]
	l.sstables[level] = nil
	l.mu.Unlock()

	allEntries := make(map[string]KVEntry)
	for _, sst := range toCompact {
		for key := range sst.Index {
			entry, _, _ := l.readSSTable(sst, key)
			if existing, ok := allEntries[key]; !ok || entry.Timestamp > existing.Timestamp {
				allEntries[key] = entry
			}
		}
	}

	entries := make([]KVEntry, 0, len(allEntries))
	for _, entry := range allEntries {
		entries = append(entries, entry)
	}
	sort.Slice(entries, func(i, j int) bool {
		return entries[i].Key < entries[j].Key
	})

	newSST, err := l.createSSTable(entries, level+1)
	if err == nil {
		l.mu.Lock()
		l.sstables[level+1] = append(l.sstables[level+1], newSST)
		l.mu.Unlock()

		for _, sst := range toCompact {
			os.Remove(sst.Path)
			os.Remove(sst.Path + ".index")
		}
	}
}

func (l *LSMTree) Close() {
	close(l.compactionChan)
}

func (l *LSMTree) CreateSnapshot() ([]byte, error) {
	l.mu.RLock()
	defer l.mu.RUnlock()

	allEntries := make(map[string]KVEntry)

	for _, entry := range l.memTable.Entries() {
		allEntries[entry.Key] = entry
	}

	if l.immutable != nil {
		for _, entry := range l.immutable.Entries() {
			if existing, ok := allEntries[entry.Key]; !ok || entry.Timestamp > existing.Timestamp {
				allEntries[entry.Key] = entry
			}
		}
	}

	for level := 0; level < l.config.MaxLevel; level++ {
		for _, sst := range l.sstables[level] {
			for key := range sst.Index {
				entry, _, _ := l.readSSTable(sst, key)
				if existing, ok := allEntries[key]; !ok || entry.Timestamp > existing.Timestamp {
					allEntries[key] = entry
				}
			}
		}
	}

	var snapshot []KVEntry
	for _, entry := range allEntries {
		if !entry.Deleted {
			snapshot = append(snapshot, entry)
		}
	}

	return json.Marshal(snapshot)
}

func (l *LSMTree) RestoreSnapshot(data []byte) error {
	l.mu.Lock()
	defer l.mu.Unlock()

	var entries []KVEntry
	if err := json.Unmarshal(data, &entries); err != nil {
		return err
	}

	l.memTable = NewMemTable()
	l.immutable = nil

	for level := 0; level < l.config.MaxLevel; level++ {
		for _, sst := range l.sstables[level] {
			os.Remove(sst.Path)
			os.Remove(sst.Path + ".index")
		}
		l.sstables[level] = nil
	}

	for _, entry := range entries {
		l.memTable.Put(entry.Key, entry.Value)
	}

	return nil
}
