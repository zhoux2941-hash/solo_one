package storage

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go.etcd.io/etcd/client/v3"
	"config-center/internal/model"
)

const (
	ConfigPrefix      = "/configs/"
	VersionPrefix     = "/versions/"
	GrayPrefix        = "/gray/"
	AuditPrefix       = "/audit/"
	WebhookPrefix     = "/webhook/"
)

type EtcdStorage struct {
	client *clientv3.Client
}

func NewEtcdStorage(endpoints []string) (*EtcdStorage, error) {
	client, err := clientv3.New(clientv3.Config{
		Endpoints:   endpoints,
		DialTimeout: 5 * time.Second,
	})
	if err != nil {
		return nil, err
	}
	return &EtcdStorage{client: client}, nil
}

func (s *EtcdStorage) Close() error {
	return s.client.Close()
}

func (s *EtcdStorage) GetConfig(ctx context.Context, appID, namespace, key string, env model.Environment) (*model.ConfigItem, error) {
	keyPath := fmt.Sprintf("%s%s/%s/%s/%s", ConfigPrefix, env, appID, namespace, key)
	resp, err := s.client.Get(ctx, keyPath)
	if err != nil {
		return nil, err
	}
	if len(resp.Kvs) == 0 {
		return nil, nil
	}
	var config model.ConfigItem
	err = json.Unmarshal(resp.Kvs[0].Value, &config)
	return &config, err
}

func (s *EtcdStorage) GetConfigsByApp(ctx context.Context, appID, namespace string, env model.Environment) ([]*model.ConfigItem, error) {
	prefix := fmt.Sprintf("%s%s/%s/%s/", ConfigPrefix, env, appID, namespace)
	resp, err := s.client.Get(ctx, prefix, clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}
	configs := make([]*model.ConfigItem, 0, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		var config model.ConfigItem
		if err := json.Unmarshal(kv.Value, &config); err == nil {
			configs = append(configs, &config)
		}
	}
	return configs, nil
}

func (s *EtcdStorage) SaveConfig(ctx context.Context, config *model.ConfigItem) error {
	keyPath := fmt.Sprintf("%s%s/%s/%s/%s", ConfigPrefix, config.Environment, config.AppID, config.Namespace, config.Key)
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	_, err = s.client.Put(ctx, keyPath, string(data))
	return err
}

func (s *EtcdStorage) DeleteConfig(ctx context.Context, appID, namespace, key string, env model.Environment) error {
	keyPath := fmt.Sprintf("%s%s/%s/%s/%s", ConfigPrefix, env, appID, namespace, key)
	_, err := s.client.Delete(ctx, keyPath)
	return err
}

func (s *EtcdStorage) SaveVersion(ctx context.Context, version *model.ConfigVersion) error {
	keyPath := fmt.Sprintf("%s%s/%s/%s/%s/%d", VersionPrefix, version.Environment, version.AppID, version.Namespace, version.Key, version.Version)
	data, err := json.Marshal(version)
	if err != nil {
		return err
	}
	_, err = s.client.Put(ctx, keyPath, string(data))
	return err
}

func (s *EtcdStorage) GetVersions(ctx context.Context, appID, namespace, key string, env model.Environment) ([]*model.ConfigVersion, error) {
	prefix := fmt.Sprintf("%s%s/%s/%s/%s/", VersionPrefix, env, appID, namespace, key)
	resp, err := s.client.Get(ctx, prefix, clientv3.WithPrefix(), clientv3.WithLimit(50))
	if err != nil {
		return nil, err
	}
	versions := make([]*model.ConfigVersion, 0, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		var ver model.ConfigVersion
		if err := json.Unmarshal(kv.Value, &ver); err == nil {
			versions = append(versions, &ver)
		}
	}
	return versions, nil
}

func (s *EtcdStorage) GetGrayStrategy(ctx context.Context, configID string) (*model.GrayReleaseStrategy, error) {
	keyPath := fmt.Sprintf("%s%s", GrayPrefix, configID)
	resp, err := s.client.Get(ctx, keyPath)
	if err != nil {
		return nil, err
	}
	if len(resp.Kvs) == 0 {
		return nil, nil
	}
	var gray model.GrayReleaseStrategy
	err = json.Unmarshal(resp.Kvs[0].Value, &gray)
	return &gray, err
}

func (s *EtcdStorage) SaveGrayStrategy(ctx context.Context, gray *model.GrayReleaseStrategy) error {
	keyPath := fmt.Sprintf("%s%s", GrayPrefix, gray.ConfigID)
	data, err := json.Marshal(gray)
	if err != nil {
		return err
	}
	_, err = s.client.Put(ctx, keyPath, string(data))
	return err
}

func (s *EtcdStorage) SaveAuditLog(ctx context.Context, log *model.AuditLog) error {
	keyPath := fmt.Sprintf("%s%s/%d", AuditPrefix, log.AppID, time.Now().UnixNano())
	data, err := json.Marshal(log)
	if err != nil {
		return err
	}
	_, err = s.client.Put(ctx, keyPath, string(data))
	return err
}

func (s *EtcdStorage) WatchConfigs(ctx context.Context, appID, namespace string, env model.Environment) clientv3.WatchChan {
	prefix := fmt.Sprintf("%s%s/%s/%s/", ConfigPrefix, env, appID, namespace)
	return s.client.Watch(ctx, prefix, clientv3.WithPrefix())
}

func (s *EtcdStorage) GetWebhooks(ctx context.Context, appID string) ([]*model.Webhook, error) {
	prefix := fmt.Sprintf("%s%s/", WebhookPrefix, appID)
	resp, err := s.client.Get(ctx, prefix, clientv3.WithPrefix())
	if err != nil {
		return nil, err
	}
	webhooks := make([]*model.Webhook, 0, len(resp.Kvs))
	for _, kv := range resp.Kvs {
		var wh model.Webhook
		if err := json.Unmarshal(kv.Value, &wh); err == nil {
			webhooks = append(webhooks, &wh)
		}
	}
	return webhooks, nil
}

func (s *EtcdStorage) SaveWebhook(ctx context.Context, webhook *model.Webhook) error {
	keyPath := fmt.Sprintf("%s%s/%s", WebhookPrefix, webhook.AppID, webhook.ID)
	data, err := json.Marshal(webhook)
	if err != nil {
		return err
	}
	_, err = s.client.Put(ctx, keyPath, string(data))
	return err
}

func (s *EtcdStorage) Get(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.GetResponse, error) {
	return s.client.Get(ctx, key, opts...)
}

func (s *EtcdStorage) Put(ctx context.Context, key, value string, opts ...clientv3.OpOption) (*clientv3.PutResponse, error) {
	return s.client.Put(ctx, key, value, opts...)
}

func (s *EtcdStorage) Delete(ctx context.Context, key string, opts ...clientv3.OpOption) (*clientv3.DeleteResponse, error) {
	return s.client.Delete(ctx, key, opts...)
}
