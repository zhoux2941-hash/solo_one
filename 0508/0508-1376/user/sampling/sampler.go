package sampling

import (
	"math"

	bpfpb "github.com/ebpf-net-audit/audit-engine/user/bpf"
)

type Sampler struct {
	bpf *bpfpb.BPFManager
}

func NewSampler(bpf *bpfpb.BPFManager) *Sampler {
	return &Sampler{bpf: bpf}
}

func calculateThreshold(sampleRate uint32) uint32 {
	if sampleRate == 0 {
		return 0
	}
	return uint32(math.MaxUint32 / uint64(sampleRate))
}

func (s *Sampler) SetConfig(sampleRate uint32, excludePorts []uint16) error {
	cfg := &bpfpb.SampleConfig{
		SampleRate:       sampleRate,
		SampleThreshold:  calculateThreshold(sampleRate),
		Enabled:          1,
		ExcludePortCount: uint8(len(excludePorts)),
	}

	for i, port := range excludePorts {
		if i >= 16 {
			break
		}
		cfg.ExcludePorts[i] = port
	}

	return s.bpf.SetSampleConfig(cfg)
}

func (s *Sampler) GetConfig() (*bpfpb.SampleConfig, error) {
	return s.bpf.GetSampleConfig()
}

func (s *Sampler) Enable() error {
	cfg, err := s.bpf.GetSampleConfig()
	if err != nil {
		return err
	}
	cfg.Enabled = 1
	return s.bpf.SetSampleConfig(cfg)
}

func (s *Sampler) Disable() error {
	cfg, err := s.bpf.GetSampleConfig()
	if err != nil {
		return err
	}
	cfg.Enabled = 0
	return s.bpf.SetSampleConfig(cfg)
}
