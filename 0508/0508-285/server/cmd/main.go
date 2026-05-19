package main

import (
	"log"

	"config-center/internal/api"
	"config-center/internal/audit"
	"config-center/internal/config"
	"config-center/internal/gray"
	"config-center/internal/storage"
	"config-center/internal/validation"
	"github.com/gin-gonic/gin"
)

func main() {
	etcdEndpoints := []string{"localhost:2379"}
	storage, err := storage.NewEtcdStorage(etcdEndpoints)
	if err != nil {
		log.Fatalf("Failed to connect to etcd: %v", err)
	}
	defer storage.Close()

	grayService := gray.NewGrayService(storage)
	auditService := audit.NewAuditService(storage)
	validationService := validation.NewValidationService(storage)
	configService := config.NewConfigService(storage, grayService, auditService, validationService)
	handler := api.NewHandler(configService, grayService)

	r := gin.Default()
	
	r.Use(CORS())
	
	api.SetupRoutes(r, handler)

	log.Println("Server starting on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With, X-Tag-*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
