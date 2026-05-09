package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"stock-platform/middleware"
	"stock-platform/models"
)

type CreateAlertRequest struct {
	StockCode   string  `json:"stockCode" binding:"required"`
	TargetPrice float64 `json:"targetPrice" binding:"required,gt=0"`
	Type        string  `json:"type" binding:"required,oneof=above below"`
}

type UpdateAlertRequest struct {
	TargetPrice *float64 `json:"targetPrice" binding:"omitempty,gt=0"`
	Type        *string  `json:"type" binding:"omitempty,oneof=above below"`
}

func GetPriceAlerts(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var alerts []models.PriceAlert
	if err := models.DB.Where("user_id = ?", userID).Order("created_at DESC").Find(&alerts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get price alerts"})
		return
	}

	result := make([]map[string]interface{}, len(alerts))
	for i, alert := range alerts {
		result[i] = map[string]interface{}{
			"id":          alert.ID,
			"stockCode":   alert.StockCode,
			"stockName":   alert.StockName,
			"targetPrice": alert.TargetPrice,
			"type":        alert.Type,
			"isTriggered": alert.IsTriggered,
			"userId":      alert.UserID,
			"createdAt":   alert.CreatedAt.Format(time.RFC3339),
			"triggeredAt": alert.TriggeredAt,
		}
	}

	c.JSON(http.StatusOK, result)
}

func CreatePriceAlert(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var stock models.Stock
	if err := models.DB.Where("code = ?", req.StockCode).First(&stock).Error; err != nil {
		stock = generateMockStock(req.StockCode)
	}

	alert := models.PriceAlert{
		UserID:      userID,
		StockCode:   req.StockCode,
		StockName:   stock.Name,
		TargetPrice: req.TargetPrice,
		Type:        req.Type,
		IsTriggered: false,
	}

	if err := models.DB.Create(&alert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create price alert"})
		return
	}

	c.JSON(http.StatusCreated, map[string]interface{}{
		"id":          alert.ID,
		"stockCode":   alert.StockCode,
		"stockName":   alert.StockName,
		"targetPrice": alert.TargetPrice,
		"type":        alert.Type,
		"isTriggered": alert.IsTriggered,
		"userId":      alert.UserID,
		"createdAt":   alert.CreatedAt.Format(time.RFC3339),
	})
}

func UpdatePriceAlert(c *gin.Context) {
	userID := middleware.GetUserID(c)
	alertID, err := strconv.ParseUint(c.Param("alertId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var alert models.PriceAlert
	if err := models.DB.Where("id = ? AND user_id = ?", alertID, userID).First(&alert).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	var req UpdateAlertRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TargetPrice != nil {
		alert.TargetPrice = *req.TargetPrice
		alert.IsTriggered = false
		alert.TriggeredAt = nil
	}
	if req.Type != nil {
		alert.Type = *req.Type
		alert.IsTriggered = false
		alert.TriggeredAt = nil
	}

	if err := models.DB.Save(&alert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update alert"})
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"id":          alert.ID,
		"stockCode":   alert.StockCode,
		"stockName":   alert.StockName,
		"targetPrice": alert.TargetPrice,
		"type":        alert.Type,
		"isTriggered": alert.IsTriggered,
		"userId":      alert.UserID,
		"createdAt":   alert.CreatedAt.Format(time.RFC3339),
		"triggeredAt": alert.TriggeredAt,
	})
}

func DeletePriceAlert(c *gin.Context) {
	userID := middleware.GetUserID(c)
	alertID, err := strconv.ParseUint(c.Param("alertId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid alert ID"})
		return
	}

	var alert models.PriceAlert
	if err := models.DB.Where("id = ? AND user_id = ?", alertID, userID).First(&alert).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Alert not found"})
		return
	}

	if err := models.DB.Delete(&alert).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete alert"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Alert deleted successfully"})
}

func CheckPriceAlerts(currentPrices map[string]float64) {
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
