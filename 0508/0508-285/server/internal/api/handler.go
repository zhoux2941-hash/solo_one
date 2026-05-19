package api

import (
	"context"
	"net/http"
	"time"

	"config-center/internal/config"
	"config-center/internal/gray"
	"config-center/internal/model"
	"config-center/internal/validation"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	configService *config.ConfigService
	grayService   *gray.GrayService
}

func NewHandler(configService *config.ConfigService, grayService *gray.GrayService) *Handler {
	return &Handler{
		configService: configService,
		grayService:   grayService,
	}
}

func (h *Handler) CreateConfig(c *gin.Context) {
	var req struct {
		AppID          string            `json:"app_id" binding:"required"`
		Namespace      string            `json:"namespace" binding:"required"`
		Key            string            `json:"key" binding:"required"`
		Value          string            `json:"value" binding:"required"`
		Format         model.ConfigFormat `json:"format" binding:"required"`
		Environment    model.Environment  `json:"environment" binding:"required"`
		Labels         map[string]string `json:"labels"`
		Operator       string            `json:"operator"`
		SkipValidation bool              `json:"skip_validation"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, validationResult, err := h.configService.CreateConfig(c.Request.Context(), req.AppID, req.Namespace, req.Key, req.Value, req.Format, req.Environment, req.Labels, req.Operator, req.SkipValidation)
	if err != nil {
		if validationResult != nil && !validationResult.Valid {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":      err.Error(),
				"validation": validationResult,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func (h *Handler) UpdateConfig(c *gin.Context) {
	var req struct {
		AppID          string            `json:"app_id" binding:"required"`
		Namespace      string            `json:"namespace" binding:"required"`
		Key            string            `json:"key" binding:"required"`
		Value          string            `json:"value" binding:"required"`
		Format         model.ConfigFormat `json:"format" binding:"required"`
		Environment    model.Environment  `json:"environment" binding:"required"`
		Labels         map[string]string `json:"labels"`
		Operator       string            `json:"operator"`
		ChangeDesc     string            `json:"change_desc"`
		SkipValidation bool              `json:"skip_validation"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, validationResult, err := h.configService.UpdateConfig(c.Request.Context(), req.AppID, req.Namespace, req.Key, req.Value, req.Format, req.Environment, req.Labels, req.Operator, req.ChangeDesc, req.SkipValidation)
	if err != nil {
		if validationResult != nil && !validationResult.Valid {
			c.JSON(http.StatusBadRequest, gin.H{
				"error":      err.Error(),
				"validation": validationResult,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func (h *Handler) RollbackConfig(c *gin.Context) {
	var req struct {
		AppID       string           `json:"app_id" binding:"required"`
		Namespace   string           `json:"namespace" binding:"required"`
		Key         string           `json:"key" binding:"required"`
		Environment model.Environment `json:"environment" binding:"required"`
		Version     int64            `json:"version" binding:"required"`
		Operator    string           `json:"operator"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	config, err := h.configService.RollbackConfig(c.Request.Context(), req.AppID, req.Namespace, req.Key, req.Environment, req.Version, req.Operator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, config)
}

func (h *Handler) GetConfig(c *gin.Context) {
	appID := c.Query("app_id")
	namespace := c.Query("namespace")
	key := c.Query("key")
	env := model.Environment(c.Query("environment"))
	clientIP := c.ClientIP()

	tags := make(map[string]string)
	for k, v := range c.Request.Header {
		if len(k) > 5 && k[:5] == "X-Tag" {
			tags[k[5:]] = v[0]
		}
	}

	config, err := h.configService.GetConfig(c.Request.Context(), appID, namespace, key, env, clientIP, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if config == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "config not found"})
		return
	}

	c.JSON(http.StatusOK, config)
}

func (h *Handler) GetConfigs(c *gin.Context) {
	appID := c.Query("app_id")
	namespace := c.Query("namespace")
	env := model.Environment(c.Query("environment"))
	clientIP := c.ClientIP()

	tags := make(map[string]string)
	for k, v := range c.Request.Header {
		if len(k) > 5 && k[:5] == "X-Tag" {
			tags[k[5:]] = v[0]
		}
	}

	configs, err := h.configService.GetConfigs(c.Request.Context(), appID, namespace, env, clientIP, tags)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, configs)
}

func (h *Handler) DeleteConfig(c *gin.Context) {
	var req struct {
		AppID       string           `json:"app_id" binding:"required"`
		Namespace   string           `json:"namespace" binding:"required"`
		Key         string           `json:"key" binding:"required"`
		Environment model.Environment `json:"environment" binding:"required"`
		Operator    string           `json:"operator"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	err := h.configService.DeleteConfig(c.Request.Context(), req.AppID, req.Namespace, req.Key, req.Environment, req.Operator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) GetVersions(c *gin.Context) {
	appID := c.Query("app_id")
	namespace := c.Query("namespace")
	key := c.Query("key")
	env := model.Environment(c.Query("environment"))

	versions, err := h.configService.GetVersions(c.Request.Context(), appID, namespace, key, env)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, versions)
}

func (h *Handler) LongPoll(c *gin.Context) {
	var req model.LongPollRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	req.ClientIP = c.ClientIP()

	ctx, cancel := context.WithTimeout(c.Request.Context(), 30*time.Second)
	defer cancel()

	result, err := h.configService.LongPoll(ctx, &req)
	if err != nil {
		if err == context.DeadlineExceeded {
			c.JSON(http.StatusNotModified, gin.H{"message": "no changes"})
			return
		}
		if err.Error() == "too many connections, please try again later" {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) CreateGrayStrategy(c *gin.Context) {
	var req struct {
		ConfigID   string   `json:"config_id" binding:"required"`
		GrayValue  string   `json:"gray_value" binding:"required"`
		GrayType   string   `json:"gray_type" binding:"required"`
		IPList     []string `json:"ip_list"`
		Tags       []string `json:"tags"`
		Percentage int      `json:"percentage"`
		Operator   string   `json:"operator"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gray, err := h.grayService.CreateGrayStrategy(c.Request.Context(), req.ConfigID, req.GrayValue, req.GrayType, req.IPList, req.Tags, req.Percentage, req.Operator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gray)
}

func (h *Handler) UpdateGrayStrategy(c *gin.Context) {
	var req struct {
		ConfigID   string   `json:"config_id" binding:"required"`
		GrayValue  string   `json:"gray_value" binding:"required"`
		GrayType   string   `json:"gray_type" binding:"required"`
		IPList     []string `json:"ip_list"`
		Tags       []string `json:"tags"`
		Percentage int      `json:"percentage"`
		IsEnabled  bool     `json:"is_enabled"`
		Operator   string   `json:"operator"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	gray, err := h.grayService.UpdateGrayStrategy(c.Request.Context(), req.ConfigID, req.GrayValue, req.GrayType, req.IPList, req.Tags, req.Percentage, req.IsEnabled, req.Operator)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gray)
}

func (h *Handler) DeleteGrayStrategy(c *gin.Context) {
	configID := c.Query("config_id")
	err := h.grayService.DeleteGrayStrategy(c.Request.Context(), configID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func (h *Handler) CreateWebhook(c *gin.Context) {
	var req struct {
		AppID   string   `json:"app_id" binding:"required"`
		URL     string   `json:"url" binding:"required"`
		Events  []string `json:"events"`
		Secret  string   `json:"secret"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	webhook, err := h.configService.CreateWebhook(c.Request.Context(), req.AppID, req.URL, req.Events, req.Secret)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, webhook)
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"time":   time.Now().Unix(),
	})
}

func (h *Handler) Metrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"active_connections": h.configService.GetConnectionCount(),
		"timestamp":          time.Now().Unix(),
	})
}

func (h *Handler) ValidateConfig(c *gin.Context) {
	var req struct {
		AppID       string            `json:"app_id" binding:"required"`
		Namespace   string            `json:"namespace" binding:"required"`
		Key         string            `json:"key" binding:"required"`
		Value       string            `json:"value" binding:"required"`
		Format      model.ConfigFormat `json:"format" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	result, err := h.configService.ValidateConfig(c.Request.Context(), req.AppID, req.Namespace, req.Key, req.Value, req.Format)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) SaveValidationScript(c *gin.Context) {
	var req struct {
		AppID       string `json:"app_id" binding:"required"`
		Namespace   string `json:"namespace" binding:"required"`
		Key         string `json:"key" binding:"required"`
		Script      string `json:"script"`
		Description string `json:"description"`
		IsEnabled   bool   `json:"is_enabled"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validationService := h.configService.GetValidationService()
	if validationService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "validation service not enabled"})
		return
	}

	script := &validation.ValidationScript{
		AppID:       req.AppID,
		Namespace:   req.Namespace,
		Key:         req.Key,
		Script:      req.Script,
		Description: req.Description,
		IsEnabled:   req.IsEnabled,
	}

	err := validationService.SaveScript(c.Request.Context(), script)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, script)
}

func (h *Handler) GetValidationScript(c *gin.Context) {
	appID := c.Query("app_id")
	namespace := c.Query("namespace")
	key := c.Query("key")

	if appID == "" || namespace == "" || key == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required parameters"})
		return
	}

	validationService := h.configService.GetValidationService()
	if validationService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "validation service not enabled"})
		return
	}

	script, err := validationService.GetScript(c.Request.Context(), appID, namespace, key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if script == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "script not found"})
		return
	}

	c.JSON(http.StatusOK, script)
}

func (h *Handler) DeleteValidationScript(c *gin.Context) {
	var req struct {
		AppID     string `json:"app_id" binding:"required"`
		Namespace string `json:"namespace" binding:"required"`
		Key       string `json:"key" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	validationService := h.configService.GetValidationService()
	if validationService == nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "validation service not enabled"})
		return
	}

	err := validationService.DeleteScript(c.Request.Context(), req.AppID, req.Namespace, req.Key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

func SetupRoutes(r *gin.Engine, handler *Handler) {
	r.GET("/health", handler.HealthCheck)
	r.GET("/metrics", handler.Metrics)

	api := r.Group("/api/v1")
	{
		configs := api.Group("/configs")
		{
			configs.POST("", handler.CreateConfig)
			configs.PUT("", handler.UpdateConfig)
			configs.DELETE("", handler.DeleteConfig)
			configs.GET("", handler.GetConfigs)
			configs.GET("/item", handler.GetConfig)
			configs.POST("/rollback", handler.RollbackConfig)
			configs.GET("/versions", handler.GetVersions)
		}

		api.POST("/long-poll", handler.LongPoll)

		validation := api.Group("/validation")
		{
			validation.POST("/validate", handler.ValidateConfig)
			validation.POST("/script", handler.SaveValidationScript)
			validation.GET("/script", handler.GetValidationScript)
			validation.DELETE("/script", handler.DeleteValidationScript)
		}

		gray := api.Group("/gray")
		{
			gray.POST("", handler.CreateGrayStrategy)
			gray.PUT("", handler.UpdateGrayStrategy)
			gray.DELETE("", handler.DeleteGrayStrategy)
		}

		webhook := api.Group("/webhook")
		{
			webhook.POST("", handler.CreateWebhook)
		}
	}
}
