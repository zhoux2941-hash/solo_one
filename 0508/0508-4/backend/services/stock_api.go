package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
	"time"

	"stock-platform/models"
)

type StockAPIService interface {
	Search(keyword string) ([]models.Stock, error)
	GetRealTime(code string) (*models.Stock, error)
	GetKLine(code string, kType string, startDate, endDate string) ([]models.KLineData, error)
	GetTimeLine(code string) ([]models.TimeLineData, error)
}

type EastMoneyService struct {
	client *http.Client
}

func NewEastMoneyService() *EastMoneyService {
	return &EastMoneyService{
		client: &http.Client{
			Timeout: 10 * time.Second,
		},
	}
}

func (s *EastMoneyService) Search(keyword string) ([]models.Stock, error) {
	apiURL := fmt.Sprintf(
		"http://searchapi.eastmoney.com/bussiness/web/QuotationLabelCode.aspx?type=14&input=%s",
		url.QueryEscape(keyword),
	)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to search stocks: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result []map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	stocks := make([]models.Stock, 0, len(result))
	for _, item := range result {
		code, _ := item["Code"].(string)
		name, _ := item["Name"].(string)
		market, _ := item["Market"].(string)

		stocks = append(stocks, models.Stock{
			Code:   normalizeCode(code, market),
			Name:   name,
			Market: normalizeMarket(market),
		})
	}

	return stocks, nil
}

func (s *EastMoneyService) GetRealTime(code string) (*models.Stock, error) {
	secid := convertToSecid(code)
	apiURL := fmt.Sprintf(
		"http://push2.eastmoney.com/api/qt/stock/get?secid=%s&fields=f43,f44,f45,f46,f47,f48,f49,f50,f51,f52,f57,f58,f60,f116,f117,f168,f169,f170",
		secid,
	)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get realtime data: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	data, ok := result["data"].(map[string]interface{})
	if !ok || data == nil {
		return nil, fmt.Errorf("no data found")
	}

	stock := parseEastMoneyRealtime(data, code)
	return &stock, nil
}

func (s *EastMoneyService) GetKLine(code string, kType string, startDate, endDate string) ([]models.KLineData, error) {
	secid := convertToSecid(code)
	fields := "f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63,f64"
	klt := map[string]string{
		"day":   "101",
		"week":  "102",
		"month": "103",
	}[kType]

	if klt == "" {
		klt = "101"
	}

	apiURL := fmt.Sprintf(
		"http://push2his.eastmoney.com/api/qt/stock/kline/get?secid=%s&fields1=%s&fields2=%s&klt=%s&fqt=1&end=20500101&lmt=200",
		secid, "f1,f2,f3,f4,f5,f6", fields, klt,
	)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get kline data: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	data, ok := result["data"].(map[string]interface{})
	if !ok || data == nil {
		return nil, fmt.Errorf("no data found")
	}

	klines, ok := data["klines"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid kline data")
	}

	return parseEastMoneyKLine(klines, code, kType), nil
}

func (s *EastMoneyService) GetTimeLine(code string) ([]models.TimeLineData, error) {
	secid := convertToSecid(code)
	apiURL := fmt.Sprintf(
		"http://push2.eastmoney.com/api/qt/stock/trends2/get?secid=%s&fields1=f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13&fields2=f51,f52,f53,f54,f55,f56,f57,f58",
		secid,
	)

	resp, err := s.client.Get(apiURL)
	if err != nil {
		return nil, fmt.Errorf("failed to get timeline data: %w", err)
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	data, ok := result["data"].(map[string]interface{})
	if !ok || data == nil {
		return nil, fmt.Errorf("no data found")
	}

	trends, ok := data["trends"].([]interface{})
	if !ok {
		return nil, fmt.Errorf("invalid trend data")
	}

	preClose, _ := data["preClose"].(float64)
	return parseEastMoneyTimeLine(trends, code, preClose), nil
}

func parseEastMoneyRealtime(data map[string]interface{}, code string) models.Stock {
	getFloat := func(key string) float64 {
		if v, ok := data[key]; ok {
			switch val := v.(type) {
			case float64:
				return val
			case int:
				return float64(val)
			}
		}
		return 0
	}

	getInt := func(key string) int64 {
		if v, ok := data[key]; ok {
			switch val := v.(type) {
			case float64:
				return int64(val)
			case int:
				return int64(val)
			}
		}
		return 0
	}

	name, _ := data["f58"].(string)
	price := getFloat("f43") / 100
	open := getFloat("f46") / 100
	high := getFloat("f44") / 100
	low := getFloat("f45") / 100
	preClose := getFloat("f60") / 100
	change := price - preClose
	changePercent := 0.0
	if preClose > 0 {
		changePercent = change / preClose * 100
	}

	market := "sh"
	if strings.HasPrefix(code, "sz") {
		market = "sz"
	} else if strings.HasPrefix(code, "hk") {
		market = "hk"
	} else if strings.HasPrefix(code, "us") {
		market = "us"
	}

	return models.Stock{
		Code:          code,
		Name:          name,
		Market:        market,
		Price:         price,
		Change:        change,
		ChangePercent: changePercent,
		Open:          open,
		High:          high,
		Low:           low,
		Close:         preClose,
		Volume:        getInt("f47"),
		Amount:        getFloat("f48"),
	}
}

func parseEastMoneyKLine(klines []interface{}, code string, kType string) []models.KLineData {
	result := make([]models.KLineData, 0, len(klines))

	for _, item := range klines {
		lineStr, ok := item.(string)
		if !ok {
			continue
		}

		parts := strings.Split(lineStr, ",")
		if len(parts) < 7 {
			continue
		}

		t, _ := time.Parse("2006-01-02", parts[0])
		open := parseFloat(parts[1])
		close := parseFloat(parts[2])
		high := parseFloat(parts[3])
		low := parseFloat(parts[4])
		volume := parseInt64(parts[5])
		amount := parseFloat(parts[6])

		result = append(result, models.KLineData{
			Code:   code,
			Time:   t,
			Open:   open,
			Close:  close,
			High:   high,
			Low:    low,
			Volume: volume,
			Amount: amount,
			Type:   kType,
		})
	}

	return result
}

func parseEastMoneyTimeLine(trends []interface{}, code string, preClose float64) []models.TimeLineData {
	result := make([]models.TimeLineData, 0, len(trends))

	for _, item := range trends {
		lineStr, ok := item.(string)
		if !ok {
			continue
		}

		parts := strings.Split(lineStr, ",")
		if len(parts) < 6 {
			continue
		}

		t, _ := time.Parse("2006-01-02 15:04", parts[0])
		price := parseFloat(parts[2])
		avgPrice := parseFloat(parts[3])
		volume := parseInt64(parts[5])
		amount := parseFloat(parts[6])

		result = append(result, models.TimeLineData{
			Code:     code,
			Time:     t,
			Price:    price,
			AvgPrice: avgPrice,
			Volume:   volume,
			Amount:   amount,
			PreClose: preClose,
		})
	}

	return result
}

func convertToSecid(code string) string {
	if strings.HasPrefix(code, "sh") {
		return "1." + strings.TrimPrefix(code, "sh")
	}
	if strings.HasPrefix(code, "sz") {
		return "0." + strings.TrimPrefix(code, "sz")
	}
	if strings.HasPrefix(code, "hk") {
		return "116." + strings.TrimPrefix(code, "hk")
	}
	if strings.HasPrefix(code, "us") {
		return "105." + strings.TrimPrefix(code, "us")
	}
	return "1." + code
}

func normalizeCode(code, market string) string {
	switch strings.ToLower(market) {
	case "sh", "sse":
		return "sh" + code
	case "sz", "szse":
		return "sz" + code
	case "hk", "hkex":
		return "hk" + code
	case "us", "nasdaq", "nyse":
		return "us" + code
	default:
		return code
	}
}

func normalizeMarket(market string) string {
	switch strings.ToLower(market) {
	case "sh", "sse":
		return "sh"
	case "sz", "szse":
		return "sz"
	case "hk", "hkex":
		return "hk"
	case "us", "nasdaq", "nyse":
		return "us"
	default:
		return "sh"
	}
}

func parseFloat(s string) float64 {
	var result float64
	fmt.Sscanf(s, "%f", &result)
	return result
}

func parseInt64(s string) int64 {
	var result int64
	fmt.Sscanf(s, "%d", &result)
	return result
}

func FetchRealTimeData(code string) (*models.Stock, error) {
	service := NewEastMoneyService()
	return service.GetRealTime(code)
}

var _ StockAPIService = (*EastMoneyService)(nil)
