package models

import (
	"fmt"
	"log"

	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"github.com/go-redis/redis/v8"
	"context"

	"stock-platform/config"
)

var DB *gorm.DB
var RedisClient *redis.Client
var Ctx = context.Background()

func InitDB() error {
	dsn := config.AppConfig.Database.GetDSN()
	
	db, err := gorm.Open("postgres", dsn)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	db.LogMode(true)
	DB = db

	if err := migrateDB(); err != nil {
		return fmt.Errorf("failed to migrate database: %w", err)
	}

	log.Println("Database connected and migrated successfully")
	return nil
}

func InitRedis() error {
	redisCfg := config.AppConfig.Redis
	
	RedisClient = redis.NewClient(&redis.Options{
		Addr:     redisCfg.GetAddr(),
		Password: redisCfg.Password,
		DB:       redisCfg.DB,
	})

	_, err := RedisClient.Ping(Ctx).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to redis: %w", err)
	}

	log.Println("Redis connected successfully")
	return nil
}

func migrateDB() error {
	if err := DB.AutoMigrate(
		&User{},
		&Stock{},
		&WatchlistGroup{},
		&KLineData{},
		&TimeLineData{},
		&PriceAlert{},
		&GroupStock{},
	).Error; err != nil {
		return err
	}

	return nil
}

func CloseDB() {
	if DB != nil {
		DB.Close()
	}
}

func CloseRedis() {
	if RedisClient != nil {
		RedisClient.Close()
	}
}
