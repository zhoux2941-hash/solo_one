package api

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	bpfpb "github.com/ebpf-net-audit/audit-engine/user/bpf"
	"github.com/ebpf-net-audit/audit-engine/user/control"
	"github.com/ebpf-net-audit/audit-engine/user/sampling"
	"github.com/ebpf-net-audit/audit-engine/user/store"
)

type Server struct {
	router    *gin.Engine
	store     *store.Store
	rules     *control.RuleManager
	sampler   *sampling.Sampler
	bpf       *bpfpb.BPFManager
	host      string
	port      int
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func NewServer(st *store.Store, rm *control.RuleManager, sp *sampling.Sampler, bpf *bpfpb.BPFManager, host string, port int) *Server {
	gin.SetMode(gin.ReleaseMode)
	s := &Server{
		router:  gin.Default(),
		store:   st,
		rules:   rm,
		sampler: sp,
		bpf:     bpf,
		host:    host,
		port:    port,
	}
	s.setupRoutes()
	return s
}

func (s *Server) setupRoutes() {
	api := s.router.Group("/api/v1")

	api.GET("/connections", s.getConnections)
	api.GET("/connections/:id", s.getConnection)

	api.GET("/blocked", s.getBlockedConnections)

	api.GET("/samples", s.getSamples)

	api.GET("/rules", s.listRules)
	api.POST("/rules", s.addRule)
	api.DELETE("/rules/:id", s.removeRule)

	api.POST("/rules/process-ip-block", s.addProcessIPBlock)
	api.POST("/rules/process-port-allow", s.addProcessPortAllow)
	api.POST("/rules/domain-block", s.addDomainBlock)
	api.POST("/rules/ip-block", s.addIPBlock)

	api.GET("/sampling/config", s.getSamplingConfig)
	api.PUT("/sampling/config", s.setSamplingConfig)
	api.POST("/sampling/enable", s.enableSampling)
	api.POST("/sampling/disable", s.disableSampling)

	api.GET("/stats", s.getStats)
}

func (s *Server) Start() error {
	addr := fmt.Sprintf("%s:%d", s.host, s.port)
	log.Printf("API server listening on %s", addr)
	return s.router.Run(addr)
}

func (s *Server) getConnections(c *gin.Context) {
	filter := parseQueryFilter(c)
	records, total, err := s.store.QueryConnections(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"records": records,
			"total":   total,
		},
	})
}

func (s *Server) getConnection(c *gin.Context) {
	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) getBlockedConnections(c *gin.Context) {
	filter := parseQueryFilter(c)
	records, total, err := s.store.QueryBlocked(filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"records": records,
			"total":   total,
		},
	})
}

func (s *Server) getSamples(c *gin.Context) {
	c.JSON(http.StatusOK, APIResponse{Success: true, Data: []interface{}{}})
}

func (s *Server) listRules(c *gin.Context) {
	rules, err := s.rules.ListRules()
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Success: true, Data: rules})
}

func (s *Server) addRule(c *gin.Context) {
	var req control.RuleCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	id, err := s.rules.AddRule(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    gin.H{"id": id},
	})
}

func (s *Server) removeRule(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   "invalid rule id",
		})
		return
	}

	if err := s.rules.RemoveRule(uint32(id)); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) addProcessIPBlock(c *gin.Context) {
	var req struct {
		Comm string `json:"comm" binding:"required"`
		CIDR string `json:"cidr" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	id, err := s.rules.AddProcessIPBlock(req.Comm, req.CIDR)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    gin.H{"id": id},
	})
}

func (s *Server) addProcessPortAllow(c *gin.Context) {
	var req struct {
		Comm     string   `json:"comm" binding:"required"`
		Protocol uint8    `json:"protocol" binding:"required"`
		Ports    []uint16 `json:"ports" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	ids, err := s.rules.AddProcessPortAllow(req.Comm, req.Protocol, req.Ports)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    gin.H{"ids": ids},
	})
}

func (s *Server) addDomainBlock(c *gin.Context) {
	var req struct {
		Domain string `json:"domain" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	id, err := s.rules.AddDomainBlock(req.Domain)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    gin.H{"id": id},
	})
}

func (s *Server) addIPBlock(c *gin.Context) {
	var req struct {
		CIDR string `json:"cidr" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	id, err := s.rules.AddIPBlock(req.CIDR)
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, APIResponse{
		Success: true,
		Data:    gin.H{"id": id},
	})
}

func (s *Server) getSamplingConfig(c *gin.Context) {
	cfg, err := s.sampler.GetConfig()
	if err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Success: true, Data: cfg})
}

func (s *Server) setSamplingConfig(c *gin.Context) {
	var req struct {
		SampleRate   uint32   `json:"sample_rate"`
		ExcludePorts []uint16 `json:"exclude_ports"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	if err := s.sampler.SetConfig(req.SampleRate, req.ExcludePorts); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) enableSampling(c *gin.Context) {
	if err := s.sampler.Enable(); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) disableSampling(c *gin.Context) {
	if err := s.sampler.Disable(); err != nil {
		c.JSON(http.StatusInternalServerError, APIResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, APIResponse{Success: true})
}

func (s *Server) getStats(c *gin.Context) {
	c.JSON(http.StatusOK, APIResponse{
		Success: true,
		Data: gin.H{
			"timestamp": time.Now().Unix(),
		},
	})
}

func parseQueryFilter(c *gin.Context) store.QueryFilter {
	filter := store.QueryFilter{
		Comm:      c.Query("comm"),
		SourceIP:  c.Query("source_ip"),
		DestIP:    c.Query("dest_ip"),
		Protocol:  c.Query("protocol"),
	}

	if portStr := c.Query("dest_port"); portStr != "" {
		if port, err := strconv.ParseUint(portStr, 10, 16); err == nil {
			filter.DestPort = uint16(port)
		}
	}

	if startStr := c.Query("start_time"); startStr != "" {
		if t, err := time.Parse(time.RFC3339, startStr); err == nil {
			filter.StartTime = t
		}
	}

	if endStr := c.Query("end_time"); endStr != "" {
		if t, err := time.Parse(time.RFC3339, endStr); err == nil {
			filter.EndTime = t
		}
	}

	if limitStr := c.Query("limit"); limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil {
			filter.Limit = limit
		}
	} else {
		filter.Limit = 100
	}

	if offsetStr := c.Query("offset"); offsetStr != "" {
		if offset, err := strconv.Atoi(offsetStr); err == nil {
			filter.Offset = offset
		}
	}

	return filter
}
