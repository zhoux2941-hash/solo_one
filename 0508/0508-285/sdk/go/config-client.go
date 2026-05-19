package configclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type ConfigClient struct {
	serverURL   string
	appID       string
	namespace   string
	environment string
	tags        map[string]string
	configs     map[string]interface{}
	versions    map[string]int64
	mu          sync.RWMutex
	callbacks   []func(map[string]interface{})
}

func NewConfigClient(serverURL, appID, namespace, environment string) *ConfigClient {
	return &ConfigClient{
		serverURL:   serverURL,
		appID:       appID,
		namespace:   namespace,
		environment: environment,
		tags:        make(map[string]string),
		configs:     make(map[string]interface{}),
		versions:    make(map[string]int64),
		callbacks:   make([]func(map[string]interface{}), 0),
	}
}

func (c *ConfigClient) AddTag(key, value string) {
	c.tags[key] = value
}

func (c *ConfigClient) OnChange(callback func(map[string]interface{})) {
	c.callbacks = append(c.callbacks, callback)
}

func (c *ConfigClient) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.configs[key]
	return val, ok
}

func (c *ConfigClient) GetString(key string) (string, bool) {
	val, ok := c.Get(key)
	if !ok {
		return "", false
	}
	str, ok := val.(string)
	return str, ok
}

func (c *ConfigClient) GetAll() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make(map[string]interface{})
	for k, v := range c.configs {
		result[k] = v
	}
	return result
}

func (c *ConfigClient) Start() error {
	if err := c.fetchConfigs(); err != nil {
		return err
	}
	go c.pollLoop()
	return nil
}

func (c *ConfigClient) fetchConfigs() error {
	url := fmt.Sprintf("%s/api/v1/configs?app_id=%s&namespace=%s&environment=%s",
		c.serverURL, c.appID, c.namespace, c.environment)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}

	for k, v := range c.tags {
		req.Header.Set("X-Tag-"+k, v)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	var configs []struct {
		Key     string      `json:"key"`
		Value   string      `json:"value"`
		Format  string      `json:"format"`
		Version int64       `json:"version"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&configs); err != nil {
		return err
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	changed := false
	for _, cfg := range configs {
		var parsed map[string]interface{}
		switch cfg.Format {
		case "json":
			json.Unmarshal([]byte(cfg.Value), &parsed)
		case "yaml":
			parsed = map[string]interface{}{"raw": cfg.Value}
		default:
			parsed = map[string]interface{}{"raw": cfg.Value}
		}
		c.configs[cfg.Key] = parsed
		c.versions[cfg.Key] = cfg.Version
		changed = true
	}

	if changed && len(c.callbacks) > 0 {
		snapshot := c.GetAll()
		for _, cb := range c.callbacks {
			go cb(snapshot)
		}
	}

	return nil
}

func (c *ConfigClient) pollLoop() {
	for {
		if err := c.longPoll(); err != nil {
			time.Sleep(5 * time.Second)
			continue
		}
	}
}

func (c *ConfigClient) longPoll() error {
	c.mu.RLock()
	versionsCopy := make(map[string]int64)
	for k, v := range c.versions {
		versionsCopy[k] = v
	}
	c.mu.RUnlock()

	reqBody := map[string]interface{}{
		"app_id":       c.appID,
		"namespace":    c.namespace,
		"environment":  c.environment,
		"last_version": versionsCopy,
		"tags":         c.tags,
	}

	data, _ := json.Marshal(reqBody)
	url := fmt.Sprintf("%s/api/v1/long-poll", c.serverURL)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	ctx, cancel := context.WithTimeout(context.Background(), 35*time.Second)
	defer cancel()
	req = req.WithContext(ctx)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotModified {
		return nil
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	var newConfigs map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&newConfigs); err != nil {
		return err
	}

	c.mu.Lock()
	for k, v := range newConfigs {
		c.configs[k] = v
	}
	c.mu.Unlock()

	snapshot := c.GetAll()
	for _, cb := range c.callbacks {
		go cb(snapshot)
	}

	return nil
}
