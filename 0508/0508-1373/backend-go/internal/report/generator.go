package report

import (
	"encoding/json"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"time"

	"github.com/spf13/viper"
	"llm-load-test/internal/models"
)

type Generator struct {
	outputDir    string
	templateDir  string
}

type ReportTemplateData struct {
	TestName        string
	TestID          string
	TargetURL       string
	Mode            string
	StartTime       string
	EndTime         string
	Duration        string
	TotalRequests   int64
	SuccessRequests int64
	FailedRequests  int64
	ErrorRate       string
	AverageQPS      string
	WorkerCount     int

	TTFT      PercentileDisplay
	TPOT      PercentileDisplay
	Total     PercentileDisplay
	Length    PercentileDisplay
	Tokens    PercentileDisplay

	TimeSeriesJSON   template.JS
	StatusCodes      []StatusDisplay
	ErrorTypes       []ErrorDisplay
	QPSChartData     template.JS
	LatencyChartData  template.JS
}

type PercentileDisplay struct {
	Min string
	Max string
	Avg string
	P50 string
	P90 string
	P95 string
	P99 string
}

type StatusDisplay struct {
	Code  int
	Count int64
	Pct   string
}

type ErrorDisplay struct {
	Type  string
	Count int64
	Pct   string
}

type ABReportTemplateData struct {
	TestName string
	TestID   string

	ResultA    ResultSummary
	ResultB    ResultSummary
	Comparison ComparisonDisplay

	TimeSeriesJSON template.JS
}

type ResultSummary struct {
	Label           string
	TargetURL       string
	TotalRequests   int64
	SuccessRequests int64
	FailedRequests  int64
	ErrorRate       string
	AverageQPS      string
	TTFTP95         string
	TPOTP95         string
	TotalP95        string
}

type ComparisonDisplay struct {
	QPSDifference       string
	ErrorRateDifference string
	TTFTImprovement     string
	TPOTImprovement     string
	TotalImprovement    string
	Winner              string
}

func NewGenerator() *Generator {
	outputDir := viper.GetString("report.output_dir")
	if outputDir == "" {
		outputDir = "./reports"
	}
	templateDir := viper.GetString("report.template_dir")
	if templateDir == "" {
		templateDir = "./templates"
	}

	os.MkdirAll(outputDir, 0755)
	os.MkdirAll(templateDir, 0755)

	return &Generator{
		outputDir:   outputDir,
		templateDir: templateDir,
	}
}

func (g *Generator) GenerateReport(result *models.TestResult) (string, error) {
	if err := g.ensureTemplate(); err != nil {
		return "", err
	}

	data := g.buildTemplateData(result)

	tmplPath := filepath.Join(g.templateDir, "report.html")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("report_%s_%s.html", result.TestID, time.Now().Format("20060102_150405"))
	filepath := filepath.Join(g.outputDir, filename)

	f, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if err := tmpl.Execute(f, data); err != nil {
		return "", err
	}

	return filepath, nil
}

func (g *Generator) GenerateABReport(abResult *models.ABTestResult) (string, error) {
	if err := g.ensureABTemplate(); err != nil {
		return "", err
	}

	data := g.buildABTemplateData(abResult)

	tmplPath := filepath.Join(g.templateDir, "ab_report.html")
	tmpl, err := template.ParseFiles(tmplPath)
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("ab_report_%s_%s.html", abResult.ID, time.Now().Format("20060102_150405"))
	filepath := filepath.Join(g.outputDir, filename)

	f, err := os.Create(filepath)
	if err != nil {
		return "", err
	}
	defer f.Close()

	if err := tmpl.Execute(f, data); err != nil {
		return "", err
	}

	return filepath, nil
}

func (g *Generator) buildTemplateData(result *models.TestResult) *ReportTemplateData {
	duration := time.Duration(result.DurationSeconds * float64(time.Second))

	timeSeriesJSON, _ := json.Marshal(result.TimeSeries)

	statusCodes := make([]StatusDisplay, 0, len(result.StatusCodes))
	for code, count := range result.StatusCodes {
		pct := float64(count) / float64(result.TotalRequests) * 100
		statusCodes = append(statusCodes, StatusDisplay{
			Code:  code,
			Count: count,
			Pct:   fmt.Sprintf("%.2f%%", pct),
		})
	}

	errorTypes := make([]ErrorDisplay, 0, len(result.ErrorTypes))
	for errType, count := range result.ErrorTypes {
		pct := float64(count) / float64(result.FailedRequests) * 100
		errorTypes = append(errorTypes, ErrorDisplay{
			Type:  errType,
			Count: count,
			Pct:   fmt.Sprintf("%.2f%%", pct),
		})
	}

	qpsData := make([]map[string]interface{}, 0, len(result.TimeSeries))
	latencyData := make([]map[string]interface{}, 0, len(result.TimeSeries))
	for _, p := range result.TimeSeries {
		qpsData = append(qpsData, map[string]interface{}{
			"time": p.Timestamp.Format("15:04:05"),
			"qps":  p.QPS,
		})
		latencyData = append(latencyData, map[string]interface{}{
			"time":         p.Timestamp.Format("15:04:05"),
			"ttft_p95":     p.TTFTP95,
			"tpot_p95":     p.TPOTP95,
			"total_latency_p95": p.TotalLatencyP95,
		})
	}

	qpsJSON, _ := json.Marshal(qpsData)
	latencyJSON, _ := json.Marshal(latencyData)

	return &ReportTemplateData{
		TestName:        result.Config.Name,
		TestID:          result.TestID,
		TargetURL:       result.Config.TargetURL,
		Mode:            string(result.Config.Mode),
		StartTime:       result.StartTime.Format("2006-01-02 15:04:05"),
		EndTime:         result.EndTime.Format("2006-01-02 15:04:05"),
		Duration:        duration.String(),
		TotalRequests:   result.TotalRequests,
		SuccessRequests: result.SuccessRequests,
		FailedRequests:  result.FailedRequests,
		ErrorRate:       fmt.Sprintf("%.2f%%", result.ErrorRate),
		AverageQPS:      fmt.Sprintf("%.2f", result.AverageQPS),
		WorkerCount:     result.Config.WorkerCount,

		TTFT:   formatPercentile(result.TTFT),
		TPOT:   formatPercentile(result.TPOT),
		Total:  formatPercentile(result.TotalLatency),
		Length: formatPercentile(result.ResponseLength),
		Tokens: formatPercentile(result.TokenCount),

		TimeSeriesJSON:  template.JS(timeSeriesJSON),
		StatusCodes:     statusCodes,
		ErrorTypes:      errorTypes,
		QPSChartData:    template.JS(qpsJSON),
		LatencyChartData: template.JS(latencyJSON),
	}
}

func (g *Generator) buildABTemplateData(abResult *models.ABTestResult) *ABReportTemplateData {
	a := abResult.ResultA
	b := abResult.ResultB
	comp := abResult.Comparison

	combinedTimeSeries := make([]map[string]interface{}, 0)
	if a != nil && b != nil {
		maxLen := len(a.TimeSeries)
		if len(b.TimeSeries) > maxLen {
			maxLen = len(b.TimeSeries)
		}
		for i := 0; i < maxLen; i++ {
			point := map[string]interface{}{
				"index": i,
			}
			if i < len(a.TimeSeries) {
				point["a_qps"] = a.TimeSeries[i].QPS
				point["a_latency"] = a.TimeSeries[i].TotalLatencyP95
			}
			if i < len(b.TimeSeries) {
				point["b_qps"] = b.TimeSeries[i].QPS
				point["b_latency"] = b.TimeSeries[i].TotalLatencyP95
			}
			combinedTimeSeries = append(combinedTimeSeries, point)
		}
	}
	tsJSON, _ := json.Marshal(combinedTimeSeries)

	return &ABReportTemplateData{
		TestName: abResult.Config.Name,
		TestID:   abResult.ID,

		ResultA: ResultSummary{
			Label:           "版本 A",
			TargetURL:       a.Config.TargetURL,
			TotalRequests:   a.TotalRequests,
			SuccessRequests: a.SuccessRequests,
			FailedRequests:  a.FailedRequests,
			ErrorRate:       fmt.Sprintf("%.2f%%", a.ErrorRate),
			AverageQPS:      fmt.Sprintf("%.2f", a.AverageQPS),
			TTFTP95:         fmt.Sprintf("%.2fms", a.TTFT.P95),
			TPOTP95:         fmt.Sprintf("%.2fms", a.TPOT.P95),
			TotalP95:        fmt.Sprintf("%.2fms", a.TotalLatency.P95),
		},
		ResultB: ResultSummary{
			Label:           "版本 B",
			TargetURL:       b.Config.TargetURL,
			TotalRequests:   b.TotalRequests,
			SuccessRequests: b.SuccessRequests,
			FailedRequests:  b.FailedRequests,
			ErrorRate:       fmt.Sprintf("%.2f%%", b.ErrorRate),
			AverageQPS:      fmt.Sprintf("%.2f", b.AverageQPS),
			TTFTP95:         fmt.Sprintf("%.2fms", b.TTFT.P95),
			TPOTP95:         fmt.Sprintf("%.2fms", b.TPOT.P95),
			TotalP95:        fmt.Sprintf("%.2fms", b.TotalLatency.P95),
		},
		Comparison: ComparisonDisplay{
			QPSDifference:       fmt.Sprintf("%+.2f%%", comp.QPSDifference),
			ErrorRateDifference: fmt.Sprintf("%+.2f%%", comp.ErrorRateDifference),
			TTFTImprovement:     fmt.Sprintf("%+.2f%%", comp.TTFTP95Improvement),
			TPOTImprovement:     fmt.Sprintf("%+.2f%%", comp.TPOTP95Improvement),
			TotalImprovement:    fmt.Sprintf("%+.2f%%", comp.TotalP95Improvement),
			Winner:              comp.IsBetter,
		},

		TimeSeriesJSON: template.JS(tsJSON),
	}
}

func formatPercentile(p models.PercentileData) PercentileDisplay {
	return PercentileDisplay{
		Min: fmt.Sprintf("%.2f", p.Min),
		Max: fmt.Sprintf("%.2f", p.Max),
		Avg: fmt.Sprintf("%.2f", p.Avg),
		P50: fmt.Sprintf("%.2f", p.P50),
		P90: fmt.Sprintf("%.2f", p.P90),
		P95: fmt.Sprintf("%.2f", p.P95),
		P99: fmt.Sprintf("%.2f", p.P99),
	}
}

func (g *Generator) ensureTemplate() error {
	tmplPath := filepath.Join(g.templateDir, "report.html")
	if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
		return os.WriteFile(tmplPath, []byte(reportTemplateHTML), 0644)
	}
	return nil
}

func (g *Generator) ensureABTemplate() error {
	tmplPath := filepath.Join(g.templateDir, "ab_report.html")
	if _, err := os.Stat(tmplPath); os.IsNotExist(err) {
		return os.WriteFile(tmplPath, []byte(abReportTemplateHTML), 0644)
	}
	return nil
}
