package api

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"stock-platform/models"
)

func SearchStocks(c *gin.Context) {
	keyword := c.Query("keyword")
	if keyword == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Keyword is required"})
		return
	}

	var stocks []models.Stock
	query := models.DB.Where("code LIKE ? OR name LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	
	if err := query.Limit(20).Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search stocks"})
		return
	}

	if len(stocks) == 0 {
		stocks = generateMockStocks(keyword)
	}

	c.JSON(http.StatusOK, stocks)
}

func GetStockRealtime(c *gin.Context) {
	code := c.Param("code")
	
	var stock models.Stock
	if err := models.DB.Where("code = ?", code).First(&stock).Error; err != nil {
		stock = generateMockStock(code)
	}

	updateStockWithLiveData(&stock)

	c.JSON(http.StatusOK, stock)
}

func GetKLineData(c *gin.Context) {
	code := c.Param("code")
	kType := c.DefaultQuery("type", "day")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")

	var klineData []models.KLineData
	query := models.DB.Where("code = ? AND type = ?", code, kType)

	if startDate != "" {
		query = query.Where("time >= ?", startDate)
	}
	if endDate != "" {
		query = query.Where("time <= ?", endDate)
	}

	if err := query.Order("time ASC").Find(&klineData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get K-line data"})
		return
	}

	if len(klineData) == 0 {
		klineData = generateMockKLineData(code, kType)
	}

	result := make([]map[string]interface{}, len(klineData))
	for i, d := range klineData {
		result[i] = map[string]interface{}{
			"time":   d.Time.Format("2006-01-02"),
			"open":   d.Open,
			"close":  d.Close,
			"high":   d.High,
			"low":    d.Low,
			"volume": d.Volume,
			"amount": d.Amount,
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetTimeLineData(c *gin.Context) {
	code := c.Param("code")

	var timelineData []models.TimeLineData
	if err := models.DB.Where("code = ?", code).Order("time ASC").Find(&timelineData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get timeline data"})
		return
	}

	if len(timelineData) == 0 {
		timelineData = generateMockTimeLineData(code)
	}

	result := make([]map[string]interface{}, len(timelineData))
	for i, d := range timelineData {
		result[i] = map[string]interface{}{
			"time":      d.Time.Format("15:04"),
			"price":     d.Price,
			"avgPrice":  d.AvgPrice,
			"volume":    d.Volume,
			"amount":    d.Amount,
			"preClose":  d.PreClose,
		}
	}

	c.JSON(http.StatusOK, result)
}

func GetMarketList(c *gin.Context) {
	market := c.Param("market")

	var stocks []models.Stock
	if err := models.DB.Where("market = ?", market).Limit(50).Find(&stocks).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get market stocks"})
		return
	}

	if len(stocks) == 0 {
		stocks = generateMockMarketStocks(market)
	}

	c.JSON(http.StatusOK, stocks)
}

func generateMockStocks(keyword string) []models.Stock {
	rand.Seed(time.Now().UnixNano())
	stocks := make([]models.Stock, 5)
	
	market := "sh"
	if strings.HasPrefix(keyword, "0") || strings.HasPrefix(keyword, "3") {
		market = "sz"
	}

	for i := 0; i < 5; i++ {
		code := keyword
		if len(keyword) < 6 {
			code = keyword + strings.Repeat("0", 6-len(keyword))
			code = code[:6]
		}
		
		basePrice := 10 + rand.Float64()*90
		change := (rand.Float64()*2 - 1) * 5
		
		stocks[i] = models.Stock{
			Code:          market + code,
			Name:          keyword + "测试" + strconv.Itoa(i+1),
			Market:        market,
			Price:         basePrice + change,
			Change:        change,
			ChangePercent: change / basePrice * 100,
			Open:          basePrice,
			High:          basePrice + rand.Float64()*3,
			Low:           basePrice - rand.Float64()*3,
			Close:         basePrice,
			Volume:        int64(rand.Int63n(10000000)),
			Amount:        rand.Float64() * 100000000,
		}
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
		Price:         basePrice + change,
		Change:        change,
		ChangePercent: change / basePrice * 100,
		Open:          basePrice,
		High:          basePrice + rand.Float64()*2,
		Low:           basePrice - rand.Float64()*2,
		Close:         basePrice,
		Volume:        int64(rand.Int63n(50000000)),
		Amount:        rand.Float64() * 500000000,
	}
}

func generateMockKLineData(code string, kType string) []models.KLineData {
	rand.Seed(time.Now().UnixNano())
	
	var days int
	switch kType {
	case "week":
		days = 100
	case "month":
		days = 60
	default:
		days = 120
	}

	data := make([]models.KLineData, days)
	basePrice := 20 + rand.Float64()*30
	prePrice := basePrice

	now := time.Now()
	for i := days - 1; i >= 0; i-- {
		var t time.Time
		switch kType {
		case "week":
			t = now.AddDate(0, 0, -i*7)
		case "month":
			t = now.AddDate(0, -i, 0)
		default:
			t = now.AddDate(0, 0, -i)
		}

		change := (rand.Float64()*2 - 1) * 2
		open := prePrice + (rand.Float64()-0.5)*0.5
		close := open + change
		high := mathMax(open, close) + rand.Float64()*1.5
		low := mathMin(open, close) - rand.Float64()*1.5

		data[i] = models.KLineData{
			Code:   code,
			Time:   t,
			Open:   round(open, 2),
			Close:  round(close, 2),
			High:   round(high, 2),
			Low:    round(low, 2),
			Volume: int64(rand.Int63n(20000000)),
			Amount: rand.Float64() * 200000000,
			Type:   kType,
		}

		prePrice = close
	}

	return data
}

func generateMockTimeLineData(code string) []models.TimeLineData {
	rand.Seed(time.Now().UnixNano())
	
	data := make([]models.TimeLineData, 0)
	basePrice := 30 + rand.Float64()*20
	preClose := basePrice
	currentPrice := basePrice
	totalVolume := int64(0)
	totalAmount := 0.0

	now := time.Now()
	marketOpen := time.Date(now.Year(), now.Month(), now.Day(), 9, 30, 0, 0, now.Location())

	for minute := 0; minute < 240; minute++ {
		t := marketOpen.Add(time.Duration(minute) * time.Minute)
		
		change := (rand.Float64()*2 - 1) * 0.2
		currentPrice = currentPrice + change

		volume := rand.Int63n(100000)
		amount := float64(volume) * currentPrice

		totalVolume += volume
		totalAmount += amount

		avgPrice := currentPrice
		if totalVolume > 0 {
			avgPrice = totalAmount / float64(totalVolume)
		}

		data = append(data, models.TimeLineData{
			Code:     code,
			Time:     t,
			Price:    round(currentPrice, 2),
			AvgPrice: round(avgPrice, 2),
			Volume:   volume,
			Amount:   amount,
			PreClose: preClose,
		})
	}

	return data
}

func generateMockMarketStocks(market string) []models.Stock {
	rand.Seed(time.Now().UnixNano())
	stocks := make([]models.Stock, 30)

	for i := 0; i < 30; i++ {
		basePrice := 10 + rand.Float64()*90
		change := (rand.Float64()*2 - 1) * 5

		var code string
		switch market {
		case "sz":
			code = "sz00" + strconv.Itoa(1000 + i)
		case "hk":
			code = "hk0" + strconv.Itoa(1000 + i)
		case "us":
			code = "usAAPL" + strconv.Itoa(i)
		default:
			code = "sh60" + strconv.Itoa(1000 + i)
		}

		stocks[i] = models.Stock{
			Code:          code,
			Name:          "股票" + strconv.Itoa(i+1),
			Market:        market,
			Price:         round(basePrice+change, 2),
			Change:        round(change, 2),
			ChangePercent: round(change/basePrice*100, 2),
			Open:          round(basePrice, 2),
			High:          round(basePrice+rand.Float64()*3, 2),
			Low:           round(basePrice-rand.Float64()*3, 2),
			Close:         round(basePrice, 2),
			Volume:        rand.Int63n(10000000),
			Amount:        rand.Float64() * 100000000,
		}
	}

	return stocks
}

func updateStockWithLiveData(stock *models.Stock) {
	cachedData, err := models.RedisClient.Get(models.Ctx, "stock:"+stock.Code).Result()
	if err == nil && cachedData != "" {
		var cachedStock models.Stock
		if err := json.Unmarshal([]byte(cachedData), &cachedStock); err == nil {
			stock.Price = cachedStock.Price
			stock.Change = cachedStock.Change
			stock.ChangePercent = cachedStock.ChangePercent
			stock.Volume = cachedStock.Volume
			stock.Amount = cachedStock.Amount
			stock.UpdatedAt = time.Now()
			return
		}
	}

	rand.Seed(time.Now().UnixNano())
	priceChange := (rand.Float64()*2 - 1) * 0.5
	stock.Price = round(stock.Price+priceChange, 2)
	stock.Change = round(stock.Price-stock.Close, 2)
	stock.ChangePercent = round(stock.Change/stock.Close*100, 2)
	stock.Volume += rand.Int63n(10000)
}

func mathMax(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

func mathMin(a, b float64) float64 {
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
