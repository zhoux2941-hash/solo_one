package lsm

import (
	"os"
	"testing"
)

func TestLSMTreeBasic(t *testing.T) {
	tmpDir, _ := os.MkdirTemp("", "lsm-test")
	defer os.RemoveAll(tmpDir)

	cfg := Config{
		MemTableSize:        1024,
		MaxLevel:            3,
		LevelSizeMultiplier: 2,
		BloomFilterK:        4,
		BloomFilterM:        1024,
		DataDir:             tmpDir,
	}

	lsm, err := NewLSMTree(cfg)
	if err != nil {
		t.Fatal(err)
	}
	defer lsm.Close()

	err = lsm.Put("key1", []byte("value1"))
	if err != nil {
		t.Fatal(err)
	}

	val, ok, err := lsm.Get("key1")
	if err != nil {
		t.Fatal(err)
	}
	if !ok || string(val) != "value1" {
		t.Errorf("Expected value1, got %s", val)
	}

	err = lsm.Delete("key1")
	if err != nil {
		t.Fatal(err)
	}

	val, ok, err = lsm.Get("key1")
	if err != nil {
		t.Fatal(err)
	}
	if ok {
		t.Error("Expected key1 to be deleted")
	}
}

func TestMemTable(t *testing.T) {
	mt := NewMemTable()

	mt.Put("key1", []byte("value1"))
	mt.Put("key2", []byte("value2"))

	entry, ok := mt.Get("key1")
	if !ok || string(entry.Value) != "value1" {
		t.Error("Expected value1")
	}

	if mt.Size() != len("key1value1")+len("key2value2") {
		t.Error("Size mismatch")
	}
}

func TestBloomFilter(t *testing.T) {
	bf := NewBloomFilter(1024, 4)

	bf.Add("key1")
	bf.Add("key2")

	if !bf.MightContain("key1") {
		t.Error("Expected key1 to be in filter")
	}
	if !bf.MightContain("key2") {
		t.Error("Expected key2 to be in filter")
	}
}
