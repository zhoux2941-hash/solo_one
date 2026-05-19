package gray

import (
	"context"
	"strings"

	"config-center/internal/model"
	"config-center/internal/storage"
)

type GrayService struct {
	storage *storage.EtcdStorage
}

func NewGrayService(storage *storage.EtcdStorage) *GrayService {
	return &GrayService{storage: storage}
}

func (s *GrayService) GetGrayValue(ctx context.Context, configID, clientIP string, tags map[string]string) (string, error) {
	gray, err := s.storage.GetGrayStrategy(ctx, configID)
	if err != nil {
		return "", err
	}
	if gray == nil || !gray.IsEnabled {
		return "", nil
	}

	switch gray.Type {
	case "ip":
		return s.checkIPGray(gray, clientIP)
	case "tag":
		return s.checkTagGray(gray, tags)
	case "percentage":
		return s.checkPercentageGray(gray, clientIP)
	default:
		return "", nil
	}
}

func (s *GrayService) checkIPGray(gray *model.GrayReleaseStrategy, clientIP string) (string, error) {
	for _, ip := range gray.IPList {
		if ip == clientIP {
			return gray.GrayValue, nil
		}
	}
	return "", nil
}

func (s *GrayService) checkTagGray(gray *model.GrayReleaseStrategy, tags map[string]string) (string, error) {
	for _, grayTag := range gray.Tags {
		for _, tagValue := range tags {
			if strings.Contains(tagValue, grayTag) || tagValue == grayTag {
				return gray.GrayValue, nil
			}
		}
	}
	return "", nil
}

func (s *GrayService) checkPercentageGray(gray *model.GrayReleaseStrategy, clientIP string) (string, error) {
	hashValue := hashString(clientIP)
	percentage := int(hashValue % 100)
	
	if percentage < gray.Percentage {
		return gray.GrayValue, nil
	}
	return "", nil
}

func (s *GrayService) CreateGrayStrategy(ctx context.Context, configID, grayValue, grayType string, ipList, tags []string, percentage int, operator string) (*model.GrayReleaseStrategy, error) {
	gray := &model.GrayReleaseStrategy{
		ID:         configID,
		ConfigID:   configID,
		GrayValue:  grayValue,
		Type:       grayType,
		IPList:     ipList,
		Tags:       tags,
		Percentage: percentage,
		IsEnabled:  true,
		CreatedBy:  operator,
	}
	err := s.storage.SaveGrayStrategy(ctx, gray)
	return gray, err
}

func (s *GrayService) UpdateGrayStrategy(ctx context.Context, configID, grayValue, grayType string, ipList, tags []string, percentage int, isEnabled bool, operator string) (*model.GrayReleaseStrategy, error) {
	gray, err := s.storage.GetGrayStrategy(ctx, configID)
	if err != nil {
		return nil, err
	}
	if gray == nil {
		gray = &model.GrayReleaseStrategy{ID: configID, ConfigID: configID}
	}
	
	gray.GrayValue = grayValue
	gray.Type = grayType
	gray.IPList = ipList
	gray.Tags = tags
	gray.Percentage = percentage
	gray.IsEnabled = isEnabled
	gray.CreatedBy = operator
	
	err = s.storage.SaveGrayStrategy(ctx, gray)
	return gray, err
}

func (s *GrayService) DeleteGrayStrategy(ctx context.Context, configID string) error {
	gray, err := s.storage.GetGrayStrategy(ctx, configID)
	if err != nil {
		return err
	}
	if gray == nil {
		return nil
	}
	gray.IsEnabled = false
	return s.storage.SaveGrayStrategy(ctx, gray)
}

func hashString(s string) uint32 {
	hash := uint32(0)
	for _, c := range s {
		hash = hash*31 + uint32(c)
	}
	return hash
}
