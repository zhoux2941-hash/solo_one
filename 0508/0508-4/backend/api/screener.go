package api

import (
	"encoding/json"
	"fmt"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"stock-platform/middleware"
	"stock-platform/models"
)

type CreateStrategyRequest struct {
	Name        string                   `json:"name" binding:"required,min=1,max=50"`
	Description string                   `json:"description"`
	Conditions  []models.FilterCondition  `json:"conditions" binding:"required,min=1"`
	IsDefault   bool                     `json:"isDefault"`
}

type UpdateStrategyRequest struct {
	Name        *string                  `json:"name"`
	Description *string                  `json:"description"`
	Conditions  *[]models.FilterCondition `json:"conditions"`
	IsDefault   *bool                    `json:"isDefault"`
}

type ExecuteScreenRequest struct {
	Conditions []models.FilterCondition `json:"conditions"`
	Markets    []string                 `json:"markets"`
	Limit      int                      `json:"limit"`
}

func GetScreenStrategies(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var strategies []models.ScreenStrategy
	if err := models.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&strategies).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get strategies"})
		return
	}

	result := make([]map[string]interface{}, len(strategies))
	for i, strategy := range strategies {
		var conditions []models.FilterCondition
		if strategy.Conditions != "" {
			json.Unmarshal([]byte(strategy.Conditions), &conditions)
		}

		result[i] = map[string]interface{}{
			"id":          strategy.ID,
			"name":        strategy.Name,
			"description": strategy.Description,
			"conditions":  conditions,
			"isDefault":   strategy.IsDefault,
			"userId":      strategy.UserID,
			"createdAt":   strategy.CreatedAt.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, result)
}

func CreateScreenStrategy(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateStrategyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := validateConditions(req.Conditions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	conditionsJSON, err := json.Marshal(req.Conditions)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to serialize conditions"})
		return
	}

	if req.IsDefault {
		models.DB.Model(&models.ScreenStrategy{}).Where("user_id = ?", userID).Update("is_default", false)
	}

	strategy := models.ScreenStrategy{
		UserID:      userID,
		Name:        req.Name,
		Description: req.Description,
		Conditions:  string(conditionsJSON),
		IsDefault:   req.IsDefault,
	}

	if err := models.DB.Create(&strategy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create strategy"})
		return
	}

	c.JSON(http.StatusCreated, map[string]interface{}{
		"id":          strategy.ID,
		"name":        strategy.Name,
		"description": strategy.Description,
		"conditions":  req.Conditions,
		"isDefault":   strategy.IsDefault,
		"userId":      strategy.UserID,
		"createdAt":   strategy.CreatedAt.Format(time.RFC3339),
	})
}

func UpdateScreenStrategy(c *gin.Context) {
	userID := middleware.GetUserID(c)
	strategyID, err := strconv.ParseUint(c.Param("strategyId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid strategy ID"})
		return
	}

	var strategy models.ScreenStrategy
	if err := models.DB.Where("id = ? AND user_id = ?", strategyID, userID).First(&strategy).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Strategy not found"})
		return
	}

	var req UpdateStrategyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Name != nil {
		strategy.Name = *req.Name
	}
	if req.Description != nil {
		strategy.Description = *req.Description
	}
	if req.Conditions != nil {
		if err := validateConditions(*req.Conditions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		conditionsJSON, _ := json.Marshal(*req.Conditions)
		strategy.Conditions = string(conditionsJSON)
	}
	if req.IsDefault != nil && *req.IsDefault {
		models.DB.Model(&models.ScreenStrategy{}).Where("user_id = ?", userID).Update("is_default", false)
		strategy.IsDefault = *req.IsDefault
	}

	if err := models.DB.Save(&strategy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update strategy"})
		return
	}

	var conditions []models.FilterCondition
	if strategy.Conditions != "" {
		json.Unmarshal([]byte(strategy.Conditions), &conditions)
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"id":          strategy.ID,
		"name":        strategy.Name,
		"description": strategy.Description,
		"conditions":  conditions,
		"isDefault":   strategy.IsDefault,
		"userId":      strategy.UserID,
		"createdAt":   strategy.CreatedAt.Format(time.RFC3339),
	})
}

func DeleteScreenStrategy(c *gin.Context) {
	userID := middleware.GetUserID(c)
	strategyID, err := strconv.ParseUint(c.Param("strategyId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid strategy ID"})
		return
	}

	var strategy models.ScreenStrategy
	if err := models.DB.Where("id = ? AND user_id = ?", strategyID, userID).First(&strategy).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Strategy not found"})
		return
	}

	if err := models.DB.Delete(&strategy).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete strategy"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Strategy deleted successfully"})
}

func ExecuteScreen(c *gin.Context) {
	var req ExecuteScreenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Conditions) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "At least one condition is required"})
		return
	}

	if err := validateConditions(req.Conditions); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Limit <= 0 || req.Limit > 100 {
		req.Limit = 50
	}

	results, err := executeScreenLogic(req.Conditions, req.Markets, req.Limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute screen"})
		return
	}

	c.JSON(http.StatusOK, results)
}

func ExecuteStrategy(c *gin.Context) {
	userID := middleware.GetUserID(c)
	strategyID, err := strconv.ParseUint(c.Param("strategyId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid strategy ID"})
		return
	}

	var strategy models.ScreenStrategy
	if err := models.DB.Where("id = ? AND user_id = ?", strategyID, userID).First(&strategy).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Strategy not found"})
		return
	}

	var conditions []models.FilterCondition
	if err := json.Unmarshal([]byte(strategy.Conditions), &conditions); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse strategy conditions"})
		return
	}

	limit := 50
	if limitStr := c.Query("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	markets := strings.Split(c.DefaultQuery("markets", "sh,sz,hk,us"), ",")

	results, err := executeScreenLogic(conditions, markets, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to execute strategy"})
		return
	}

	c.JSON(http.StatusOK, results)
}

func GetScreenMeta(c *gin.Context) {
	fields := make([]map[string]interface{}, 0, len(models.ValidFields))
	for _, field := range models.ValidFields {
		fields = append(fields, map[string]interface{}{
			"value": field,
			"label": models.FieldLabels[field],
			"unit":  models.FieldUnits[field],
		})
	}

	operators := make([]map[string]interface{}, 0, len(models.ValidOperators))
	for _, op := range models.ValidOperators {
		operators = append(operators, map[string]interface{}{
			"value":    op,
			"label":    models.OperatorLabels[op],
			"needTwoValues": op == models.OP_BETWEEN,
		})
	}

	markets := []map[string]interface{}{
		{"value": "sh", "label": "上证"},
		{"value": "sz", "label": "深证"},
		{"value": "hk", "label": "港股"},
		{"value": "us", "label": "美股"},
	}

	presets := []map[string]interface{}{
		{
			"name":        "低估值蓝筹",
			"description": "PE < 15 且 PB < 2",
			"conditions": []models.FilterCondition{
				{Field: models.FIELD_PE, Operator: models.OP_LT, Value: 15},
				{Field: models.FIELD_PB, Operator: models.OP_LT, Value: 2},
			},
		},
		{
			"name":        "强势上涨",
			"description": "今日涨幅 > 5%",
			"conditions": []models.FilterCondition{
				{Field: models.FIELD_CHANGE_PERCENT, Operator: models.OP_GT, Value: 5},
			},
		},
		{
			"name":        "超跌反弹",
			"description": "今日跌幅 > 5%",
			"conditions": []models.FilterCondition{
				{Field: models.FIELD_CHANGE_PERCENT, Operator: models.OP_LT, Value: -5},
			},
		},
		{
			"name":        "低价股",
			"description": "价格 < 10元",
			"conditions": []models.FilterCondition{
				{Field: models.FIELD_PRICE, Operator: models.OP_LT, Value: 10},
			},
		},
		{
			"name":        "高换手",
			"description": "换手率 > 10%",
			"conditions": []models.FilterCondition{
				{Field: models.FIELD_TURNOVER, Operator: models.OP_GT, Value: 10},
			},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"fields":    fields,
		"operators": operators,
		"markets":   markets,
		"presets":   presets,
	})
}

func validateConditions(conditions []models.FilterCondition) error {
	for _, cond := range conditions {
		validField := false
		for _, f := range models.ValidFields {
			if f == cond.Field {
				validField = true
				break
			}
		}
		if !validField {
			return fmt.Errorf("invalid field: %s", cond.Field)
		}

		validOp := false
		for _, op := range models.ValidOperators {
			if op == cond.Operator {
				validOp = true
				break
			}
		}
		if !validOp {
			return fmt.Errorf("invalid operator: %s", cond.Operator)
		}

		if cond.Operator == models.OP_BETWEEN && cond.Value2 <= cond.Value {
			return fmt.Errorf("for 'between' operator, value2 must be greater than value")
		}
	}
	return nil
}

func executeScreenLogic(conditions []models.FilterCondition, markets []string, limit int) ([]models.ScreenResult, error) {
	var stocks []models.Stock

	query := models.DB.Model(&models.Stock{})
	if len(markets) > 0 {
		query = query.Where("market IN ?", markets)
	}

	if err := query.Limit(200).Find(&stocks).Error; err != nil {
		return nil, err
	}

	if len(stocks) == 0 {
		stocks = generateMockStocksForScreen(markets, 100)
	}

	results := make([]models.ScreenResult, 0)
	for _, stock := range stocks {
		matched := true
		matchedConditions := make([]string, 0)
		score := 0.0

		for _, cond := range conditions {
			stockValue := getStockValue(&stock, cond.Field)
			if evaluateCondition(stockValue, cond) {
				matchedConditions = append(matchedConditions, cond.Field)
				score += 1.0
			} else {
				matched = false
			}
		}

		if matched && len(matchedConditions) == len(conditions) {
			results = append(results, models.ScreenResult{
				Stock:      stock,
				MatchScore: score / float64(len(conditions)),
				Matched:    matchedConditions,
			})
		}
	}

	if len(results) > limit {
		results = results[:limit]
	}

	return results, nil
}

func getStockValue(stock *models.Stock, field string) float64 {
	switch field {
	case models.FIELD_PE:
		if stock.PE != nil {
			return *stock.PE
		}
		return 20 + rand.Float64()*30
	case models.FIELD_PB:
		if stock.PB != nil {
			return *stock.PB
		}
		return 1 + rand.Float64()*5
	case models.FIELD_CHANGE:
		return stock.Change
	case models.FIELD_CHANGE_PERCENT:
		return stock.ChangePercent
	case models.FIELD_PRICE:
		return stock.Price
	case models.FIELD_VOLUME:
		return float64(stock.Volume) / 10000
	case models.FIELD_AMOUNT:
		return stock.Amount / 10000
	case models.FIELD_TURNOVER:
		if stock.TurnoverRate != nil {
			return *stock.TurnoverRate
		}
		return rand.Float64() * 15
	case models.FIELD_MARKET_CAP:
		return stock.Price * float64(stock.Volume) / 100000000
	default:
		return 0
	}
}

func evaluateCondition(value float64, cond models.FilterCondition) bool {
	switch cond.Operator {
	case models.OP_GT:
		return value > cond.Value
	case models.OP_GTE:
		return value >= cond.Value
	case models.OP_LT:
		return value < cond.Value
	case models.OP_LTE:
		return value <= cond.Value
	case models.OP_EQ:
		return value == cond.Value
	case models.OP_BETWEEN:
		return value >= cond.Value && value <= cond.Value2
	default:
		return false
	}
}

func generateMockStocksForScreen(markets []string, count int) []models.Stock {
	rand.Seed(time.Now().UnixNano())
	stocks := make([]models.Stock, 0, count)

	if len(markets) == 0 {
		markets = []string{"sh", "sz"}
	}

	for i := 0; i < count; i++ {
		market := markets[i%len(markets)]
		basePrice := 5 + rand.Float64()*95
		changePercent := (rand.Float64()*20 - 10)
		change := basePrice * changePercent / 100
		pe := 5 + rand.Float64()*50
		pb := 0.5 + rand.Float64()*8
		turnover := rand.Float64() * 20

		var code string
		switch market {
		case "sz":
			code = fmt.Sprintf("sz%06d", 100000+i)
		case "hk":
			code = fmt.Sprintf("hk%05d", 1000+i)
		case "us":
			code = fmt.Sprintf("usSTOCK%d", i+1)
		default:
			code = fmt.Sprintf("sh%06d", 600000+i)
		}

		stocks = append(stocks, models.Stock{
			Code:          code,
			Name:          fmt.Sprintf("股票%d", i+1),
			Market:        market,
			Price:         round(basePrice+change, 2),
			Change:        round(change, 2),
			ChangePercent: round(changePercent, 2),
			Open:          round(basePrice, 2),
			High:          round(basePrice+rand.Float64()*3, 2),
			Low:           round(basePrice-rand.Float64()*3, 2),
			Close:         round(basePrice, 2),
			Volume:        int64(rand.Float64() * 50000000),
			Amount:        rand.Float64() * 500000000,
			PE:            &pe,
			PB:            &pb,
			TurnoverRate:  &turnover,
		})
	}

	return stocks
}

var _ = gorm.ErrRecordNotFound
