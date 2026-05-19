package audit

import (
	"context"
	"time"

	"config-center/internal/model"
	"config-center/internal/storage"
	"github.com/google/uuid"
)

type AuditService struct {
	storage *storage.EtcdStorage
}

func NewAuditService(storage *storage.EtcdStorage) *AuditService {
	return &AuditService{storage: storage}
}

func (s *AuditService) LogChange(ctx context.Context, log *model.AuditLog) error {
	log.ID = uuid.New().String()
	log.CreatedAt = time.Now()
	return s.storage.SaveAuditLog(ctx, log)
}
