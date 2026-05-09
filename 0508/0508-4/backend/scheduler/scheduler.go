package scheduler

import (
	"encoding/json"
	"log"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/robfig/cron/v3"

	"stock-platform/models"
	"stock-platform/services"
	"stock-platform/websocket"
)

var scheduler *cron.Cron

func Init() {
	scheduler = cron.New()

	scheduler.AddFunc("@every 3s", fetchAndBroadcastStockData)
	scheduler.AddFunc("@every 30s", checkPriceAlerts)

	scheduler.Start()
	log.Println("Scheduler started")
}

func Stop() {
	if scheduler != nil {
		scheduler.Stop()
		log.Println("Scheduler stopped")
	}
}

func fetchAndBroadcastStockData() {
	stocks := getTrackedStocks()
	if len(stocks) == 0 {
		return
	}

	currentPrices := make(map[string]float64)

	for _, stock := range stocks {
		updatedStock, err := services.FetchRealTimeData(stock.Code)
		if err != nil {
			updated := simulatePriceUpdate(&stock)
			updatedStock = &updated
		}

		saveToRedis(*updatedStock)
		updateDatabase(*updatedStock)

		currentPrices[updatedStock.Code] = updatedStock.Price

		websocket.BroadcastPriceUpdate(updatedStock.Code, map[string]interface{}{
			"code":          updatedStock.Code,
			"price":         updatedStock.Price,
			"change":        updatedStock.Change,
			"changePercent": updatedStock.ChangePercent,
			"volume":        updatedStock.Volume,
			"amount":        updatedStock.Amount,
			"timestamp":     time.Now().Unix(),
		})
	}

	if len(currentPrices) > 0 {
		checkPriceAlertsInternal(currentPrices)
	}
}

func checkPriceAlerts() {
	var alerts []models.PriceAlert
	if err := models.DB.Where("is_triggered = ?", false).Find(&alerts).Error; err != nil {
		return
	}

	currentPrices := make(map[string]float64)
	for _, alert := range alerts {
		if _, exists := currentPrices[alert.StockCode]; !exists {
			price := getCachedPrice(alert.StockCode)
			if price > 0 {
				currentPrices[alert.StockCode] = price
			}
		}
	}

	if len(currentPrices) > 0 {
		checkPriceAlertsInternal(currentPrices)
	}
}

func checkPriceAlertsInternal(currentPrices map[string]float64) {
	var alerts []models.PriceAlert
	if err := models.DB.Where("is_triggered = ?", false).Find(&alerts).Error; err != nil {
		return
	}

	now := time.Now()
	for _, alert := range alerts {
		currentPrice, exists := currentPrices[alert.StockCode]
		if !exists {
			continue
		}

		shouldTrigger := false
		if alert.Type == "above" && currentPrice >= alert.TargetPrice {
			shouldTrigger = true
		} else if alert.Type == "below" && currentPrice <= alert.TargetPrice {
			shouldTrigger = true
		}

		if shouldTrigger {
			alert.IsTriggered = true
			alert.TriggeredAt = &now
			models.DB.Save(&alert)
		}
	}
}

func getTrackedStocks() []models.Stock {
	var stocks []models.Stock

	if err := models.DB.Raw(`
		SELECT DISTINCT s.* 
		FROM stocks s
		INNER JOIN group_stocks gs ON gs.stock_id = s.id
		INNER JOIN watchlist_groups wg ON wg.id = gs.group_id
	`).Scan(&stocks).Error; err != nil {
		log.Printf("Failed to get tracked stocks: %v", err)
	}

	if len(stocks) == 0 {
		stocks = getDefaultStocks()
	}

	return stocks
}

func getDefaultStocks() []models.Stock {
	var stocks []models.Stock
	defaultCodes := []string{"sh600519", "sz000001", "sh601318", "sz000858", "sh600036"}

	for _, code := range defaultCodes {
		var stock models.Stock
		if err := models.DB.Where("code = ?", code).First(&stock).Error; err != nil {
			stock = generateMockStock(code)
			if err := models.DB.Create(&stock).Error; err != nil {
			}
		}
		stocks = append(stocks, stock)
	}

	return stocks
}

func generateMockStock(code string) models.Stock {
	rand.Seed(time.Now().UnixNano())

	market := "sh"
	if strings.HasPrefix(code, "sz") {
		market = "sz"
	} else if strings.HasPrefix(code, "hk") {
		market = "hk"
	} else if strings.HasPrefix(code, "us") {
		market = "us"
	}

	basePrice := 20 + rand.Float64()*80
	change := (rand.Float64()*2 - 1) * 3

	return models.Stock{
		Code:          code,
		Name:          "测试股票",
		Market:        market,
		Price:         round(basePrice+change, 2),
		Change:        round(change, 2),
		ChangePercent: round(change/basePrice*100, 2),
		Open:          round(basePrice, 2),
		High:          round(basePrice+rand.Float64()*2, 2),
		Low:           round(basePrice-rand.Float64()*2, 2),
		Close:         round(basePrice, 2),
		Volume:        rand.Int63n(50000000),
		Amount:        rand.Float64() * 500000000,
	}
}

func simulatePriceUpdate(stock *models.Stock) models.Stock {
	rand.Seed(time.Now().UnixNano())

	priceChange := (rand.Float64()*2 - 1) * 0.3
	newPrice := stock.Price + priceChange

	if newPrice < 0.01 {
		newPrice = 0.01
	}

	change := newPrice - stock.Close
	changePercent := 0.0
	if stock.Close > 0 {
		changePercent = change / stock.Close * 100
	}

	volumeIncrease := rand.Int63n(50000)
	amountIncrease := float64(volumeIncrease) * newPrice * 0.5

	return models.Stock{
		ID:            stock.ID,
		Code:          stock.Code,
		Name:          stock.Name,
		Market:        stock.Market,
		Price:         round(newPrice, 2),
		Change:        round(change, 2),
		ChangePercent: round(changePercent, 2),
		Open:          stock.Open,
		High:          max(stock.High, newPrice),
		Low:           min(stock.Low, newPrice),
		Close:         stock.Close,
		Volume:        stock.Volume + volumeIncrease,
		Amount:        stock.Amount + amountIncrease,
	}
}

func saveToRedis(stock models.Stock) {
	data, err := json.Marshal(stock)
	if err != nil {
		return
	}

	key := "stock:" + stock.Code
	if err := models.RedisClient.Set(models.Ctx, key, data, 5*time.Minute).Err(); err != nil {
		log.Printf("Failed to save stock to Redis: %v", err)
	}
}

func getCachedPrice(code string) float64 {
	key := "stock:" + code
	data, err := models.RedisClient.Get(models.Ctx, key).Result()
	if err != nil {
		return 0
	}

	var stock models.Stock
	if err := json.Unmarshal([]byte(data), &stock); err != nil {
		return 0
	}

	return stock.Price
}

func updateDatabase(stock models.Stock) {
	models.DB.Model(&models.Stock{}).
		Where("code = ?", stock.Code).
		Updates(map[string]interface{}{
			"price":          stock.Price,
			"change":         stock.Change,
			"change_percent": stock.ChangePercent,
			"high":           stock.High,
			"low":            stock.Low,
			"volume":         stock.Volume,
			"amount":         stock.Amount,
			"updated_at":     time.Now(),
		})
}

func max(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func min(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func round(val float64, decimals int) float64 {
	multiplier := 1.0
	for i := 0; i < decimals; i++ {
		multiplier *= 10
	}
	return float64(int64(val*multiplier+0.5)) / multiplier
}

var _ = strconv.Itoa
