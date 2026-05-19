package config

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"hash/fnv"
	"net/http"
	"strings"
	"sync"
	"time"

	"config-center/internal/audit"
	"config-center/internal/gray"
	"config-center/internal/model"
	"config-center/internal/storage"
	"config-center/internal/validation"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	"gopkg.in/yaml.v3"
)

const (
	DefaultMaxConnections  = 10000
	DefaultDebounceTime    = 100 * time.Millisecond
	DefaultChannelCapacity = 16
	ConnectionTimeout      = 35 * time.Second
)

type watchEntry struct {
	ch       chan struct{}
	createAt time.Time
	clientIP string
}

type pendingEvent struct {
	appID     string
	namespace string
	env       model.Environment
	timestamp time.Time
}

type ConfigService struct {
	storage          *storage.EtcdStorage
	grayService      *gray.GrayService
	auditService     *audit.AuditService
	validationService *validation.ValidationService
	watchChans       map[string][]*watchEntry
	watchMutex       sync.RWMutex
	maxConns         int
	connCount        int
	connCond         *sync.Cond

	debounceMutex sync.Mutex
	pendingEvents map[string]*pendingEvent
	debounceTimer *time.Timer

	httpClient *http.Client
}

func NewConfigService(storage *storage.EtcdStorage, grayService *gray.GrayService, auditService *audit.AuditService, validationService *validation.ValidationService) *ConfigService {
	s := &ConfigService{
		storage:           storage,
		grayService:       grayService,
		auditService:      auditService,
		validationService: validationService,
		watchChans:        make(map[string][]*watchEntry),
		maxConns:          DefaultMaxConnections,
		pendingEvents:     make(map[string]*pendingEvent),
		httpClient: &http.Client{
			Timeout: 10 * time.Second,
			Transport: &http.Transport{
				MaxIdleConns:        100,
				MaxIdleConnsPerHost: 10,
				IdleConnTimeout:     90 * time.Second,
			},
		},
	}
	s.connCond = sync.NewCond(&s.watchMutex)
	go s.cleanupStaleConnections()
	go s.processDebouncedEvents()
	return s
}

func (s *ConfigService) SetMaxConnections(max int) {
	s.watchMutex.Lock()
	defer s.watchMutex.Unlock()
	s.maxConns = max
}

func (s *ConfigService) GetConnectionCount() int {
	s.watchMutex.RLock()
	defer s.watchMutex.RUnlock()
	return s.connCount
}

func (s *ConfigService) GetValidationService() *validation.ValidationService {
	return s.validationService
}

func (s *ConfigService) cleanupStaleConnections() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.watchMutex.Lock()
		now := time.Now()
		totalRemoved := 0

		for key, entries := range s.watchChans {
			validEntries := make([]*watchEntry, 0, len(entries))
			for _, entry := range entries {
				if now.Sub(entry.createAt) < ConnectionTimeout {
					validEntries = append(validEntries, entry)
				} else {
					close(entry.ch)
					totalRemoved++
				}
			}
			if len(validEntries) == 0 {
				delete(s.watchChans, key)
			} else {
				s.watchChans[key] = validEntries
			}
		}

		s.connCount -= totalRemoved
		s.watchMutex.Unlock()

		if totalRemoved > 0 {
			logrus.Infof("Cleaned up %d stale long-poll connections", totalRemoved)
		}
	}
}

func (s *ConfigService) acquireConnection() bool {
	s.watchMutex.Lock()
	defer s.watchMutex.Unlock()

	if s.connCount >= s.maxConns {
		return false
	}
	s.connCount++
	return true
}

func (s *ConfigService) releaseConnection() {
	s.watchMutex.Lock()
	defer s.watchMutex.Unlock()
	s.connCount--
	s.connCond.Broadcast()
}

func (s *ConfigService) ValidateConfig(ctx context.Context, appID, namespace, key, value string, format model.ConfigFormat) (*validation.ValidationResult, error) {
	if s.validationService == nil {
		result := &validation.ValidationResult{Valid: true}
		result.Warnings = append(result.Warnings, "validation service not enabled")
		return result, nil
	}
	return s.validationService.ValidateConfig(ctx, appID, namespace, key, value, format)
}

func (s *ConfigService) CreateConfig(ctx context.Context, appID, namespace, key, value string, format model.ConfigFormat, env model.Environment, labels map[string]string, operator string, skipValidation bool) (*model.ConfigItem, *validation.ValidationResult, error) {
	if !skipValidation {
		validationResult, err := s.ValidateConfig(ctx, appID, namespace, key, value, format)
		if err != nil {
			return nil, validationResult, fmt.Errorf("validation error: %v", err)
		}
		if !validationResult.Valid {
			return nil, validationResult, fmt.Errorf("config validation failed")
		}
	}

	existing, err := s.storage.GetConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return nil, nil, err
	}
	if existing != nil {
		return nil, nil, fmt.Errorf("config already exists")
	}

	now := time.Now()
	config := &model.ConfigItem{
		ID:          uuid.New().String(),
		AppID:       appID,
		Namespace:   namespace,
		Key:         key,
		Value:       value,
		Format:      format,
		Environment: env,
		Labels:      labels,
		CreatedAt:   now,
		UpdatedAt:   now,
		CreatedBy:   operator,
		UpdatedBy:   operator,
		Version:     1,
	}

	err = s.storage.SaveConfig(ctx, config)
	if err != nil {
		return nil, nil, err
	}

	version := &model.ConfigVersion{
		ID:          uuid.New().String(),
		ConfigID:    config.ID,
		AppID:       appID,
		Namespace:   namespace,
		Key:         key,
		Value:       value,
		Format:      format,
		Environment: env,
		Labels:      labels,
		Version:     1,
		CreatedAt:   now,
		CreatedBy:   operator,
		ChangeDesc:  "Initial creation",
	}
	err = s.storage.SaveVersion(ctx, version)
	if err != nil {
		logrus.Warn("Failed to save version:", err)
	}

	s.auditService.LogChange(ctx, &model.AuditLog{
		AppID:     appID,
		Namespace: namespace,
		Key:       key,
		Action:    "CREATE",
		NewValue:  value,
		Operator:  operator,
	})

	s.scheduleNotify(config.Environment, config.AppID, config.Namespace)
	return config, nil, nil
}

func (s *ConfigService) UpdateConfig(ctx context.Context, appID, namespace, key, value string, format model.ConfigFormat, env model.Environment, labels map[string]string, operator, changeDesc string, skipValidation bool) (*model.ConfigItem, *validation.ValidationResult, error) {
	if !skipValidation {
		validationResult, err := s.ValidateConfig(ctx, appID, namespace, key, value, format)
		if err != nil {
			return nil, validationResult, fmt.Errorf("validation error: %v", err)
		}
		if !validationResult.Valid {
			return nil, validationResult, fmt.Errorf("config validation failed")
		}
	}
	existing, err := s.storage.GetConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return nil, nil, err
	}
	if existing == nil {
		return nil, nil, fmt.Errorf("config not found")
	}

	oldValue := existing.Value
	now := time.Now()
	existing.Value = value
	existing.Format = format
	existing.Labels = labels
	existing.UpdatedAt = now
	existing.UpdatedBy = operator
	existing.Version++

	err = s.storage.SaveConfig(ctx, existing)
	if err != nil {
		return nil, nil, err
	}

	version := &model.ConfigVersion{
		ID:          uuid.New().String(),
		ConfigID:    existing.ID,
		AppID:       appID,
		Namespace:   namespace,
		Key:         key,
		Value:       value,
		Format:      format,
		Environment: env,
		Labels:      labels,
		Version:     existing.Version,
		CreatedAt:   now,
		CreatedBy:   operator,
		ChangeDesc:  changeDesc,
	}
	err = s.storage.SaveVersion(ctx, version)
	if err != nil {
		logrus.Warn("Failed to save version:", err)
	}

	s.auditService.LogChange(ctx, &model.AuditLog{
		AppID:     appID,
		Namespace: namespace,
		Key:       key,
		Action:    "UPDATE",
		OldValue:  oldValue,
		NewValue:  value,
		Operator:  operator,
	})

	s.scheduleNotify(existing.Environment, existing.AppID, existing.Namespace)
	return existing, nil, nil
}

func (s *ConfigService) RollbackConfig(ctx context.Context, appID, namespace, key string, env model.Environment, version int64, operator string) (*model.ConfigItem, error) {
	versions, err := s.storage.GetVersions(ctx, appID, namespace, key, env)
	if err != nil {
		return nil, err
	}

	var targetVersion *model.ConfigVersion
	for _, v := range versions {
		if v.Version == version {
			targetVersion = v
			break
		}
	}
	if targetVersion == nil {
		return nil, fmt.Errorf("version not found")
	}

	existing, err := s.storage.GetConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, fmt.Errorf("config not found")
	}

	oldValue := existing.Value
	now := time.Now()
	existing.Value = targetVersion.Value
	existing.Format = targetVersion.Format
	existing.Labels = targetVersion.Labels
	existing.UpdatedAt = now
	existing.UpdatedBy = operator
	existing.Version++

	err = s.storage.SaveConfig(ctx, existing)
	if err != nil {
		return nil, err
	}

	newVersion := &model.ConfigVersion{
		ID:          uuid.New().String(),
		ConfigID:    existing.ID,
		AppID:       appID,
		Namespace:   namespace,
		Key:         key,
		Value:       existing.Value,
		Format:      existing.Format,
		Environment: env,
		Labels:      existing.Labels,
		Version:     existing.Version,
		CreatedAt:   now,
		CreatedBy:   operator,
		ChangeDesc:  fmt.Sprintf("Rollback to version %d", version),
	}
	err = s.storage.SaveVersion(ctx, newVersion)
	if err != nil {
		logrus.Warn("Failed to save version:", err)
	}

	s.auditService.LogChange(ctx, &model.AuditLog{
		AppID:     appID,
		Namespace: namespace,
		Key:       key,
		Action:    "ROLLBACK",
		OldValue:  oldValue,
		NewValue:  existing.Value,
		Operator:  operator,
	})

	s.scheduleNotify(existing.Environment, existing.AppID, existing.Namespace)
	return existing, nil
}

func (s *ConfigService) GetConfig(ctx context.Context, appID, namespace, key string, env model.Environment, clientIP string, tags map[string]string) (*model.ConfigItem, error) {
	config, err := s.storage.GetConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return nil, err
	}
	if config == nil {
		return nil, nil
	}

	grayValue, err := s.grayService.GetGrayValue(ctx, config.ID, clientIP, tags)
	if err == nil && grayValue != "" {
		config.Value = grayValue
	}

	return config, nil
}

func (s *ConfigService) GetConfigs(ctx context.Context, appID, namespace string, env model.Environment, clientIP string, tags map[string]string) ([]*model.ConfigItem, error) {
	configs, err := s.storage.GetConfigsByApp(ctx, appID, namespace, env)
	if err != nil {
		return nil, err
	}

	for _, config := range configs {
		grayValue, err := s.grayService.GetGrayValue(ctx, config.ID, clientIP, tags)
		if err == nil && grayValue != "" {
			config.Value = grayValue
		}
	}

	return configs, nil
}

func (s *ConfigService) DeleteConfig(ctx context.Context, appID, namespace, key string, env model.Environment, operator string) error {
	existing, err := s.storage.GetConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return err
	}
	if existing == nil {
		return fmt.Errorf("config not found")
	}

	err = s.storage.DeleteConfig(ctx, appID, namespace, key, env)
	if err != nil {
		return err
	}

	s.auditService.LogChange(ctx, &model.AuditLog{
		AppID:     appID,
		Namespace: namespace,
		Key:       key,
		Action:    "DELETE",
		OldValue:  existing.Value,
		Operator:  operator,
	})

	s.scheduleNotify(existing.Environment, existing.AppID, existing.Namespace)
	return nil
}

func (s *ConfigService) GetVersions(ctx context.Context, appID, namespace, key string, env model.Environment) ([]*model.ConfigVersion, error) {
	return s.storage.GetVersions(ctx, appID, namespace, key, env)
}

func (s *ConfigService) ParseConfig(value string, format model.ConfigFormat) (map[string]interface{}, error) {
	switch format {
	case model.FormatYAML:
		var result map[string]interface{}
		err := yaml.Unmarshal([]byte(value), &result)
		return result, err
	case model.FormatJSON:
		var result map[string]interface{}
		err := json.Unmarshal([]byte(value), &result)
		return result, err
	case model.FormatProperties:
		result := make(map[string]interface{})
		lines := strings.Split(value, "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				result[strings.TrimSpace(parts[0])] = strings.TrimSpace(parts[1])
			}
		}
		return result, nil
	default:
		return nil, fmt.Errorf("unsupported format")
	}
}

func (s *ConfigService) LongPoll(ctx context.Context, req *model.LongPollRequest) (map[string]interface{}, error) {
	configs, err := s.GetConfigs(ctx, req.AppID, req.Namespace, req.Environment, req.ClientIP, req.Tags)
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	changed := false

	for _, config := range configs {
		lastVer, ok := req.LastVersion[config.Key]
		if !ok || config.Version > lastVer {
			parsed, err := s.ParseConfig(config.Value, config.Format)
			if err != nil {
				logrus.Warn("Failed to parse config:", err)
				continue
			}
			result[config.Key] = parsed
			changed = true
		}
	}

	if changed {
		return result, nil
	}

	if !s.acquireConnection() {
		return nil, fmt.Errorf("too many connections, please try again later")
	}
	defer s.releaseConnection()

	entry := &watchEntry{
		ch:       make(chan struct{}, 1),
		createAt: time.Now(),
		clientIP: req.ClientIP,
	}

	watchKey := fmt.Sprintf("%s/%s/%s", req.Environment, req.AppID, req.Namespace)

	s.watchMutex.Lock()
	s.watchChans[watchKey] = append(s.watchChans[watchKey], entry)
	s.watchMutex.Unlock()

	defer func() {
		s.watchMutex.Lock()
		defer s.watchMutex.Unlock()

		entries := s.watchChans[watchKey]
		for i, e := range entries {
			if e == entry {
				s.watchChans[watchKey] = append(entries[:i], entries[i+1:]...)
				break
			}
		}
		if len(s.watchChans[watchKey]) == 0 {
			delete(s.watchChans, watchKey)
		}
		close(entry.ch)
	}()

	select {
	case <-entry.ch:
		configs, err := s.GetConfigs(ctx, req.AppID, req.Namespace, req.Environment, req.ClientIP, req.Tags)
		if err != nil {
			return nil, err
		}
		result := make(map[string]interface{})
		for _, config := range configs {
			parsed, err := s.ParseConfig(config.Value, config.Format)
			if err == nil {
				result[config.Key] = parsed
			}
		}
		return result, nil
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (s *ConfigService) scheduleNotify(env model.Environment, appID, namespace string) {
	key := fmt.Sprintf("%s/%s/%s", env, appID, namespace)

	s.debounceMutex.Lock()
	defer s.debounceMutex.Unlock()

	if _, exists := s.pendingEvents[key]; !exists {
		s.pendingEvents[key] = &pendingEvent{
			appID:     appID,
			namespace: namespace,
			env:       env,
			timestamp: time.Now(),
		}
	}

	if s.debounceTimer != nil {
		s.debounceTimer.Stop()
	}
	s.debounceTimer = time.AfterFunc(DefaultDebounceTime, func() {
		s.flushPendingEvents()
	})
}

func (s *ConfigService) flushPendingEvents() {
	s.debounceMutex.Lock()
	events := make([]*pendingEvent, 0, len(s.pendingEvents))
	for _, event := range s.pendingEvents {
		events = append(events, event)
	}
	s.pendingEvents = make(map[string]*pendingEvent)
	s.debounceTimer = nil
	s.debounceMutex.Unlock()

	for _, event := range events {
		s.notifyWatchers(event.env, event.appID, event.namespace)
	}
}

func (s *ConfigService) processDebouncedEvents() {
	ticker := time.NewTicker(1 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		s.flushPendingEvents()
	}
}

func (s *ConfigService) notifyWatchers(env model.Environment, appID, namespace string) {
	watchKey := fmt.Sprintf("%s/%s/%s", env, appID, namespace)

	s.watchMutex.RLock()
	entries := s.watchChans[watchKey]
	s.watchMutex.RUnlock()

	notified := 0
	for _, entry := range entries {
		select {
		case entry.ch <- struct{}{}:
			notified++
		default:
		}
	}

	if notified > 0 {
		logrus.Debugf("Notified %d watchers for %s", notified, watchKey)
	}
}

func (s *ConfigService) sendWebhooks(appID string, event *model.ConfigChangeEvent) {
	webhooks, err := s.storage.GetWebhooks(context.Background(), appID)
	if err != nil {
		logrus.Warn("Failed to get webhooks:", err)
		return
	}

	for _, wh := range webhooks {
		if !wh.IsEnabled {
			continue
		}
		go s.sendWebhook(wh, event)
	}
}

func (s *ConfigService) sendWebhook(wh *model.Webhook, event *model.ConfigChangeEvent) {
	data, err := json.Marshal(event)
	if err != nil {
		logrus.Warn("Failed to marshal webhook event:", err)
		return
	}

	signature := s.generateSignature(data, wh.Secret)

	req, err := http.NewRequest("POST", wh.URL, bytes.NewBuffer(data))
	if err != nil {
		logrus.Warn("Failed to create webhook request:", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Config-Signature", signature)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		logrus.Warn("Failed to send webhook:", err)
		return
	}
	resp.Body.Close()
}

func (s *ConfigService) generateSignature(data []byte, secret string) string {
	h := sha256.New()
	h.Write(data)
	h.Write([]byte(secret))
	return hex.EncodeToString(h.Sum(nil))
}

func (s *ConfigService) CreateWebhook(ctx context.Context, appID, url string, events []string, secret string) (*model.Webhook, error) {
	webhook := &model.Webhook{
		ID:        uuid.New().String(),
		AppID:     appID,
		URL:       url,
		Events:    events,
		Secret:    secret,
		IsEnabled: true,
		CreatedAt: time.Now(),
	}
	err := s.storage.SaveWebhook(ctx, webhook)
	return webhook, err
}

func hashIP(ip string) uint32 {
	h := fnv.New32a()
	h.Write([]byte(ip))
	return h.Sum32()
}
