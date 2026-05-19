package model

import (
	"time"
)

type ConfigFormat string

const (
	FormatYAML       ConfigFormat = "yaml"
	FormatJSON       ConfigFormat = "json"
	FormatProperties ConfigFormat = "properties"
)

type Environment string

const (
	EnvDev  Environment = "dev"
	EnvTest Environment = "test"
	EnvProd Environment = "prod"
)

type ConfigItem struct {
	ID          string            `json:"id"`
	AppID       string            `json:"app_id"`
	Namespace   string            `json:"namespace"`
	Key         string            `json:"key"`
	Value       string            `json:"value"`
	Format      ConfigFormat      `json:"format"`
	Environment Environment       `json:"environment"`
	Labels      map[string]string `json:"labels"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
	CreatedBy   string            `json:"created_by"`
	UpdatedBy   string            `json:"updated_by"`
	Version     int64             `json:"version"`
}

type ConfigVersion struct {
	ID          string            `json:"id"`
	ConfigID    string            `json:"config_id"`
	AppID       string            `json:"app_id"`
	Namespace   string            `json:"namespace"`
	Key         string            `json:"key"`
	Value       string            `json:"value"`
	Format      ConfigFormat      `json:"format"`
	Environment Environment       `json:"environment"`
	Labels      map[string]string `json:"labels"`
	Version     int64             `json:"version"`
	CreatedAt   time.Time         `json:"created_at"`
	CreatedBy   string            `json:"created_by"`
	ChangeDesc  string            `json:"change_desc"`
}

type GrayReleaseStrategy struct {
	ID           string   `json:"id"`
	ConfigID     string   `json:"config_id"`
	GrayValue    string   `json:"gray_value"`
	Type         string   `json:"type"`
	IPList       []string `json:"ip_list"`
	Tags         []string `json:"tags"`
	Percentage   int      `json:"percentage"`
	IsEnabled    bool     `json:"is_enabled"`
	CreatedAt    time.Time `json:"created_at"`
	CreatedBy    string    `json:"created_by"`
}

type AuditLog struct {
	ID         string    `json:"id"`
	AppID      string    `json:"app_id"`
	Namespace  string    `json:"namespace"`
	Key        string    `json:"key"`
	Action     string    `json:"action"`
	OldValue   string    `json:"old_value"`
	NewValue   string    `json:"new_value"`
	Operator   string    `json:"operator"`
	OperatorIP string    `json:"operator_ip"`
	CreatedAt  time.Time `json:"created_at"`
}

type Webhook struct {
	ID         string    `json:"id"`
	AppID      string    `json:"app_id"`
	URL        string    `json:"url"`
	Events     []string  `json:"events"`
	Secret     string    `json:"secret"`
	IsEnabled  bool      `json:"is_enabled"`
	CreatedAt  time.Time `json:"created_at"`
}

type LongPollRequest struct {
	AppID       string            `json:"app_id"`
	Namespace   string            `json:"namespace"`
	Environment Environment       `json:"environment"`
	ClientIP    string            `json:"client_ip"`
	Tags        map[string]string `json:"tags"`
	LastVersion map[string]int64  `json:"last_version"`
}

type ConfigChangeEvent struct {
	ConfigID string `json:"config_id"`
	Key      string `json:"key"`
	Value    string `json:"value"`
	Version  int64  `json:"version"`
	Action   string `json:"action"`
}
