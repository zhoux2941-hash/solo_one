package api

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	"stock-platform/middleware"
	"stock-platform/models"
)

type CreateGroupRequest struct {
	Name string `json:"name" binding:"required,min=1,max=50"`
}

type AddStockRequest struct {
	StockCode string `json:"stockCode" binding:"required"`
}

func GetWatchlistGroups(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var groups []models.WatchlistGroup
	if err := models.DB.Preload("Stocks").Where("user_id = ?", userID).Find(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get watchlist groups"})
		return
	}

	result := make([]map[string]interface{}, len(groups))
	for i, group := range groups {
		stocks := make([]map[string]interface{}, len(group.Stocks))
		for j, stock := range group.Stocks {
			stocks[j] = map[string]interface{}{
				"code":          stock.Code,
				"name":          stock.Name,
				"market":        stock.Market,
				"price":         stock.Price,
				"change":        stock.Change,
				"changePercent": stock.ChangePercent,
				"open":          stock.Open,
				"high":          stock.High,
				"low":           stock.Low,
				"close":         stock.Close,
				"volume":        stock.Volume,
				"amount":        stock.Amount,
			}
		}

		result[i] = map[string]interface{}{
			"id":        group.ID,
			"name":      group.Name,
			"stocks":    stocks,
			"userId":    group.UserID,
			"createdAt": group.CreatedAt.Format(time.RFC3339),
		}
	}

	c.JSON(http.StatusOK, result)
}

func CreateWatchlistGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req CreateGroupRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	group := models.WatchlistGroup{
		Name:   req.Name,
		UserID: userID,
	}

	if err := models.DB.Create(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create group"})
		return
	}

	c.JSON(http.StatusCreated, map[string]interface{}{
		"id":        group.ID,
		"name":      group.Name,
		"userId":    group.UserID,
		"stocks":    []interface{}{},
		"createdAt": group.CreatedAt.Format(time.RFC3339),
	})
}

func DeleteWatchlistGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID, err := strconv.ParseUint(c.Param("groupId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	var group models.WatchlistGroup
	if err := models.DB.Where("id = ? AND user_id = ?", groupID, userID).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	if err := models.DB.Delete(&group).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Group deleted successfully"})
}

func AddStockToGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID, err := strconv.ParseUint(c.Param("groupId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}

	var req AddStockRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var group models.WatchlistGroup
	if err := models.DB.Preload("Stocks").Where("id = ? AND user_id = ?", groupID, userID).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	for _, s := range group.Stocks {
		if s.Code == req.StockCode {
			c.JSON(http.StatusConflict, gin.H{"error": "Stock already in group"})
			return
		}
	}

	var stock models.Stock
	if err := models.DB.Where("code = ?", req.StockCode).First(&stock).Error; err != nil {
		stock = generateMockStock(req.StockCode)
		if err := models.DB.Create(&stock).Error; err != nil {
		}
	}

	if err := models.DB.Model(&group).Association("Stocks").Append(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add stock to group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock added successfully"})
}

func RemoveStockFromGroup(c *gin.Context) {
	userID := middleware.GetUserID(c)
	groupID, err := strconv.ParseUint(c.Param("groupId"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid group ID"})
		return
	}
	stockCode := c.Param("stockCode")

	var group models.WatchlistGroup
	if err := models.DB.Preload("Stocks").Where("id = ? AND user_id = ?", groupID, userID).First(&group).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Group not found"})
		return
	}

	var stock models.Stock
	if err := models.DB.Where("code = ?", stockCode).First(&stock).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Stock not found"})
		return
	}

	if err := models.DB.Model(&group).Association("Stocks").Delete(&stock).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove stock from group"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Stock removed successfully"})
}
