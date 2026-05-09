package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/gin-gonic/gin"

	"stock-platform/api"
	"stock-platform/config"
	"stock-platform/middleware"
	"stock-platform/models"
	"stock-platform/scheduler"
	"stock-platform/websocket"
)

func main() {
	if err := config.Load(); err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	if err := models.InitDB(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer models.CloseDB()

	if err := models.InitRedis(); err != nil {
		log.Fatalf("Failed to initialize redis: %v", err)
	}
	defer models.CloseRedis()

	websocket.Init()
	scheduler.Init()
	defer scheduler.Stop()

	if config.AppConfig.Server.Mode == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware())

	setupRoutes(r)

	serverAddr := fmt.Sprintf(":%d", config.AppConfig.Server.Port)
	
	go func() {
		log.Printf("Server starting on %s", serverAddr)
		if err := r.Run(serverAddr); err != nil {
			log.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
}

func setupRoutes(r *gin.Engine) {
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	apiGroup := r.Group("/api")
	{
		auth := apiGroup.Group("/auth")
		{
			auth.POST("/register", api.Register)
			auth.POST("/login", api.Login)
			auth.POST("/logout", api.Logout)
			auth.GET("/me", middleware.JWTAuth(), api.GetCurrentUser)
		}

		stocks := apiGroup.Group("/stocks")
		{
			stocks.GET("/search", api.SearchStocks)
			stocks.GET("/market/:market", api.GetMarketList)
			stocks.GET("/:code/realtime", api.GetStockRealtime)
			stocks.GET("/:code/kline", api.GetKLineData)
			stocks.GET("/:code/timeline", api.GetTimeLineData)
		}

		watchlist := apiGroup.Group("/watchlist")
		watchlist.Use(middleware.JWTAuth())
		{
			watchlist.GET("/groups", api.GetWatchlistGroups)
			watchlist.POST("/groups", api.CreateWatchlistGroup)
			watchlist.DELETE("/groups/:groupId", api.DeleteWatchlistGroup)
			watchlist.POST("/groups/:groupId/stocks", api.AddStockToGroup)
			watchlist.DELETE("/groups/:groupId/stocks/:stockCode", api.RemoveStockFromGroup)
		}

		alerts := apiGroup.Group("/alerts")
		alerts.Use(middleware.JWTAuth())
		{
			alerts.GET("", api.GetPriceAlerts)
			alerts.POST("", api.CreatePriceAlert)
			alerts.PUT("/:alertId", api.UpdatePriceAlert)
			alerts.DELETE("/:alertId", api.DeletePriceAlert)
		}

		screener := apiGroup.Group("/screener")
		{
			screener.GET("/meta", api.GetScreenMeta)
			screener.POST("/execute", api.ExecuteScreen)
			screener.Use(middleware.JWTAuth())
			{
				screener.GET("/strategies", api.GetScreenStrategies)
				screener.POST("/strategies", api.CreateScreenStrategy)
				screener.PUT("/strategies/:strategyId", api.UpdateScreenStrategy)
				screener.DELETE("/strategies/:strategyId", api.DeleteScreenStrategy)
				screener.POST("/strategies/:strategyId/execute", api.ExecuteStrategy)
			}
		}
	}

	r.GET("/ws", websocket.HandleWebSocket)
}
