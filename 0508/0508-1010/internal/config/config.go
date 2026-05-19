package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Rule struct {
	Name        string   `mapstructure:"name"`
	Enabled     bool     `mapstructure:"enabled"`
	EventType   string   `mapstructure:"event_type"`
	Severity    string   `mapstructure:"severity"`
	Description string   `mapstructure:"description"`
	MatchPaths  []string `mapstructure:"match_paths"`
	MatchComms   []string `mapstructure:"match_comms"`
	WhitelistPaths []string `mapstructure:"whitelist_paths"`
	WhitelistComms []string `mapstructure:"whitelist_comms"`
}

type Config struct {
	LogLevel string `mapstructure:"log_level"`
	BPF      struct {
		BPFObjPath string `mapstructure:"bpf_obj_path"`
	} `mapstructure:"bpf"`
	Elasticsearch struct {
		Enabled  bool     `mapstructure:"enabled"`
		URLs     []string `mapstructure:"urls"`
		Username string   `mapstructure:"username"`
		Password string   `mapstructure:"password"`
		Index    string   `mapstructure:"index"`
	} `mapstructure:"elasticsearch"`
	Container struct {
		Runtime    string   `mapstructure:"runtime"`
		Docker    string   `mapstructure:"docker_socket"`
		Containerd string `mapstructure:"containerd_socket"`
	} `mapstructure:"container"`
	Rules []Rule `mapstructure:"rules"`
	Whitelist struct {
		ContainerIDs []string `mapstructure:"container_ids"`
		Images     []string `mapstructure:"images"`
		Comms      []string `mapstructure:"comms"`
	} `mapstructure:"whitelist"`
	Blacklist struct {
		ContainerIDs []string `mapstructure:"container_ids"`
		Images     []string `mapstructure:"images"`
		Comms      []string `mapstructure:"comms"`
	} `mapstructure:"blacklist"`
}

func Load(path string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(path)
	v.SetConfigType("yaml")

	v.SetDefault("log_level", "info")
	v.SetDefault("bpf.bpf_obj_path", "./bpf/escaper_detector.bpf.o")
	v.SetDefault("elasticsearch.enabled", false)
	v.SetDefault("elasticsearch.urls", []string{"http://localhost:9200"})
	v.SetDefault("elasticsearch.index", "container-escaper-alerts")
	v.SetDefault("container.runtime", "auto")
	v.SetDefault("container.docker_socket", "/var/run/docker.sock")
	v.SetDefault("container.containerd_socket", "/run/containerd/containerd.sock")

	if err := v.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("failed to read config: %w", err)
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	if err := validateConfig(&cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

func validateConfig(cfg *Config) error {
	for i, rule := range cfg.Rules {
		if rule.Name == "" {
			return fmt.Errorf("rule at index %d: name is required", i)
		}
		if rule.EventType == "" {
			return fmt.Errorf("rule %s: event_type is required", rule.Name)
		}
		if rule.Severity == "" {
			cfg.Rules[i].Severity = "medium"
		}
	}

	return nil
}

func (c *Config) IsContainerWhitelisted(containerID string, image string, comm string) bool {
	for _, id := range c.Whitelist.ContainerIDs {
		if containerID != "" && strings.Contains(containerID, id) {
			return true
		}
	}
	for _, img := range c.Whitelist.Images {
		if image != "" && strings.Contains(image, img) {
			return true
		}
	}
	for _, c := range c.Whitelist.Comms {
		if comm != "" && strings.Contains(comm, c) {
			return true
		}
	}
	return false
}

func (c *Config) IsContainerBlacklisted(containerID string, image string, comm string) bool {
	for _, id := range c.Blacklist.ContainerIDs {
		if containerID != "" && strings.Contains(containerID, id) {
			return true
		}
	}
	for _, img := range c.Blacklist.Images {
		if image != "" && strings.Contains(image, img) {
			return true
		}
	}
	for _, c := range c.Blacklist.Comms {
		if comm != "" && strings.Contains(comm, c) {
			return true
		}
	}
	return false
}
