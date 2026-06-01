package report

import (
	"encoding/json"
	"fmt"
	"mqtt-fuzzer/internal/storage"
	"os"
	"strings"
	"time"
)

type TestReport struct {
	GeneratedAt time.Time `json:"generated_at"`

	SessionInfo SessionSummary `json:"session_info"`

	Summary ResultSummary `json:"summary"`

	MutationAnalysis []MutationStat `json:"mutation_analysis"`

	CriticalCrashes []CrashDetail `json:"critical_crashes"`

	HighSeverity []SeverityGroup `json:"high_severity"`
	MediumSeverity []SeverityGroup `json:"medium_severity"`
}

type SessionSummary struct {
	SessionID     string    `json:"session_id"`
	TargetHost    string    `json:"target_host"`
	TargetPort    int       `json:"target_port"`
	MQTTVersion   string    `json:"mqtt_version"`
	StartTime     time.Time `json:"start_time"`
	EndTime       *time.Time `json:"end_time,omitempty"`
	Duration      string    `json:"duration"`
	TotalCases    int       `json:"total_cases"`
	Status        string    `json:"status"`
}

type ResultSummary struct {
	NormalResponse int `json:"normal_response"`
	Disconnect     int `json:"disconnect"`
	Timeout        int `json:"timeout"`
	Crash          int `json:"crash"`
	Total          int `json:"total"`
	AnomalyRate    float64 `json:"anomaly_rate_percent"`
}

type MutationStat struct {
	MutationType string  `json:"mutation_type"`
	TotalCount   int     `json:"total_count"`
	AnomalyCount int     `json:"anomaly_count"`
	CrashCount   int     `json:"crash_count"`
	AnomalyRate  float64 `json:"anomaly_rate_percent"`
	Severity     string  `json:"severity_rating"`
}

type CrashDetail struct {
	ID             int64  `json:"id"`
	ConnectionID   int    `json:"connection_id"`
	PacketType     string `json:"packet_type"`
	MutationType   string `json:"mutation_type"`
	Description    string `json:"description"`
	ErrorMessage   string `json:"error_message"`
	Timestamp      string `json:"timestamp"`
}

type SeverityGroup struct {
	PacketType   string `json:"packet_type"`
	MutationType string `json:"mutation_type"`
	Count        int    `json:"count"`
}

func GenerateReport(store *storage.Storage, sessionID string) (*TestReport, error) {
	session, err := store.GetSession(sessionID)
	if err != nil {
		return nil, fmt.Errorf("get session: %w", err)
	}

	resultCounts, err := store.GetResultCounts(sessionID)
	if err != nil {
		return nil, fmt.Errorf("get result counts: %w", err)
	}

	mutationStats, err := store.GetMutationStats(sessionID)
	if err != nil {
		return nil, fmt.Errorf("get mutation stats: %w", err)
	}

	crashRecords, err := store.GetCrashRecords(sessionID)
	if err != nil {
		return nil, fmt.Errorf("get crash records: %w", err)
	}

	allRecords, err := store.GetRecordsBySession(sessionID)
	if err != nil {
		return nil, fmt.Errorf("get all records: %w", err)
	}

	report := &TestReport{
		GeneratedAt: time.Now(),
	}

	report.SessionInfo = buildSessionSummary(session)
	report.Summary = buildResultSummary(resultCounts)
	report.MutationAnalysis = buildMutationStats(mutationStats)
	report.CriticalCrashes = buildCrashDetails(crashRecords)
	report.HighSeverity, report.MediumSeverity = classifyBySeverity(allRecords)

	return report, nil
}

func buildSessionSummary(session *storage.TestSession) SessionSummary {
	var duration string
	if session.EndTime != nil {
		duration = session.EndTime.Sub(session.StartTime).String()
	} else {
		duration = time.Since(session.StartTime).String() + " (ongoing)"
	}

	return SessionSummary{
		SessionID:   session.ID,
		TargetHost:  session.TargetHost,
		TargetPort:  session.TargetPort,
		MQTTVersion: session.MQTTVersion,
		StartTime:   session.StartTime,
		EndTime:     session.EndTime,
		Duration:    duration,
		TotalCases:  session.TotalCases,
		Status:      session.Status,
	}
}

func buildResultSummary(counts map[storage.TestResult]int) ResultSummary {
	normal := counts[storage.ResultNormalResponse]
	disconnect := counts[storage.ResultDisconnect]
	timeout := counts[storage.ResultTimeout]
	crash := counts[storage.ResultCrash]
	total := normal + disconnect + timeout + crash

	anomalyRate := 0.0
	if total > 0 {
		anomalyRate = float64(disconnect+timeout+crash) / float64(total) * 100
	}

	return ResultSummary{
		NormalResponse: normal,
		Disconnect:     disconnect,
		Timeout:        timeout,
		Crash:          crash,
		Total:          total,
		AnomalyRate:    anomalyRate,
	}
}

func buildMutationStats(stats []*storage.MutationStats) []MutationStat {
	result := make([]MutationStat, len(stats))
	for i, s := range stats {
		severity := "LOW"
		if s.CrashCount > 0 {
			severity = "CRITICAL"
		} else if s.AnomalyRate > 50 {
			severity = "HIGH"
		} else if s.AnomalyRate > 20 {
			severity = "MEDIUM"
		}

		result[i] = MutationStat{
			MutationType: s.MutationType,
			TotalCount:   s.TotalCount,
			AnomalyCount: s.AnomalyCount,
			CrashCount:   s.CrashCount,
			AnomalyRate:  s.AnomalyRate,
			Severity:     severity,
		}
	}
	return result
}

func buildCrashDetails(records []*storage.TestCaseRecord) []CrashDetail {
	result := make([]CrashDetail, len(records))
	for i, r := range records {
		result[i] = CrashDetail{
			ID:           r.ID,
			ConnectionID: r.ConnectionID,
			PacketType:   r.PacketType,
			MutationType: string(r.MutationType),
			Description:  r.Description,
			ErrorMessage: r.ErrorMessage,
			Timestamp:    r.Timestamp.Format(time.RFC3339),
		}
	}
	return result
}

func classifyBySeverity(records []*storage.TestCaseRecord) ([]SeverityGroup, []SeverityGroup) {
	highCount := make(map[string]int)
	mediumCount := make(map[string]int)

	for _, r := range records {
		key := fmt.Sprintf("%s|%s", r.PacketType, r.MutationType)
		if r.Result == storage.ResultDisconnect {
			highCount[key]++
		} else if r.Result == storage.ResultTimeout {
			mediumCount[key]++
		}
	}

	high := make([]SeverityGroup, 0, len(highCount))
	for key, count := range highCount {
		parts := splitKey(key)
		high = append(high, SeverityGroup{
			PacketType:   parts[0],
			MutationType: parts[1],
			Count:        count,
		})
	}

	medium := make([]SeverityGroup, 0, len(mediumCount))
	for key, count := range mediumCount {
		parts := splitKey(key)
		medium = append(medium, SeverityGroup{
			PacketType:   parts[0],
			MutationType: parts[1],
			Count:        count,
		})
	}

	return high, medium
}

func splitKey(key string) []string {
	parts := make([]string, 2)
	for i, c := range key {
		if c == '|' {
			parts[0] = key[:i]
			parts[1] = key[i+1:]
			break
		}
	}
	return parts
}

func (r *TestReport) SaveToFile(filename string) error {
	data, err := json.MarshalIndent(r, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal report: %w", err)
	}

	if err := os.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("write file: %w", err)
	}

	return nil
}

func (r *TestReport) PrintSummary() {
	fmt.Println("\n" + strings.Repeat("=", 60))
	fmt.Println("MQTT FUZZER TEST REPORT")
	fmt.Println(strings.Repeat("=", 60))
	
	fmt.Printf("\nSession: %s\n", r.SessionInfo.SessionID)
	fmt.Printf("Target:  %s:%d (MQTT %s)\n", r.SessionInfo.TargetHost, r.SessionInfo.TargetPort, r.SessionInfo.MQTTVersion)
	fmt.Printf("Duration: %s\n", r.SessionInfo.Duration)
	fmt.Printf("Status:   %s\n\n", r.SessionInfo.Status)

	fmt.Println("--- TEST SUMMARY ---")
	fmt.Printf("  Total Tests:      %d\n", r.Summary.Total)
	fmt.Printf("  Normal Response:  %d\n", r.Summary.NormalResponse)
	fmt.Printf("  Disconnect:       %d\n", r.Summary.Disconnect)
	fmt.Printf("  Timeout:          %d\n", r.Summary.Timeout)
	fmt.Printf("  CRASH (CRITICAL): %d\n", r.Summary.Crash)
	fmt.Printf("  Anomaly Rate:     %.2f%%\n\n", r.Summary.AnomalyRate)

	if len(r.CriticalCrashes) > 0 {
		fmt.Println("--- CRITICAL CRASHES (HIGH PRIORITY) ---")
		for i, crash := range r.CriticalCrashes {
			fmt.Printf("  #%d: %s - %s\n", i+1, crash.PacketType, crash.MutationType)
			fmt.Printf("       %s\n", crash.Description)
			if crash.ErrorMessage != "" {
				fmt.Printf("       Error: %s\n", crash.ErrorMessage)
			}
		}
		fmt.Println()
	}

	fmt.Println("--- MUTATION ANALYSIS ---")
	for _, ms := range r.MutationAnalysis {
		fmt.Printf("  %-30s: %4d tests, %4d anomalies, %2d crashes (%.1f%%) [%s]\n",
			ms.MutationType, ms.TotalCount, ms.AnomalyCount, ms.CrashCount, ms.AnomalyRate, ms.Severity)
	}
	fmt.Println()
}
