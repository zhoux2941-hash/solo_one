package config

import (
	"fmt"

	"github.com/spf13/viper"
)

type Config struct {
	Interface  string `mapstructure:"interface"`
	DBPath     string `mapstructure:"db_path"`
	BatchSize  int    `mapstructure:"batch_size"`
	APIPort    int    `mapstructure:"api_port"`
	APIHost    string `mapstructure:"api_host"`
	Sampling   SamplingConfig `mapstructure:"sampling"`
	Rules      []RuleConfig `mapstructure:"rules"`
}

type SamplingConfig struct {
	Enabled      bool     `mapstructure:"enabled"`
	SampleRate   uint32   `mapstructure:"sample_rate"`
	ExcludePorts []uint16 `mapstructure:"exclude_ports"`
}

type RuleConfig struct {
	Type     string `mapstructure:"type"`
	Action   string `mapstructure:"action"`
	Comm     string `mapstructure:"comm"`
	IP       string `mapstructure:"ip"`
	CIDR     string `mapstructure:"cidr"`
	Port     uint16 `mapstructure:"port"`
	Protocol uint8  `mapstructure:"protocol"`
	Domain   string `mapstructure:"domain"`
}

func Load(path string) (*Config, error) {
	v := viper.New()
	v.SetConfigFile(path)
	v.SetConfigType("yaml")

	v.SetDefault("interface", "eth0")
	v.SetDefault("db_path", "net_audit.db")
	v.SetDefault("batch_size", 1000)
	v.SetDefault("api_port", 8080)
	v.SetDefault("api_host", "127.0.0.1")
	v.SetDefault("sampling.enabled", true)
	v.SetDefault("sampling.sample_rate", 1000)
	v.SetDefault("sampling.exclude_ports", []uint16{80})

	if err := v.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("read config: %w", err)
		}
	}

	var cfg Config
	if err := v.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshal config: %w", err)
	}

	return &cfg, nil
}
