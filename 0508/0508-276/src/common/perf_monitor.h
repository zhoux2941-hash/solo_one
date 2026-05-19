#pragma once

#include <chrono>
#include <vector>
#include <string>
#include <atomic>
#include <mutex>
#include <unordered_map>

namespace vectordb {

struct PerformanceMetrics {
  std::string name;

  size_t total_inserts = 0;
  double total_insert_time_ms = 0.0;
  double avg_insert_latency_ms = 0.0;
  double insert_qps = 0.0;

  size_t total_searches = 0;
  double total_search_time_ms = 0.0;
  double avg_search_latency_ms = 0.0;
  double search_qps = 0.0;

  double avg_recall = 0.0;
  std::vector<double> recall_history;

  size_t memory_usage_bytes = 0;
  double memory_usage_mb = 0.0;

  double build_time_ms = 0.0;

  void Reset();
  std::string ToString() const;
};

class PerfMonitor {
public:
  static PerfMonitor& Instance();

  void StartTimer(const std::string& operation);
  double StopTimer(const std::string& operation);
  double GetElapsedMs(const std::string& operation) const;

  void RecordInsert(size_t count, double time_ms);
  void RecordSearch(size_t count, double time_ms);
  void RecordRecall(double recall);
  void RecordBuildTime(double time_ms);
  void RecordMemoryUsage(size_t bytes);

  const PerformanceMetrics& GetMetrics(const std::string& name = "default") const;
  void SetCurrentMetricName(const std::string& name);

  void Reset(const std::string& name = "default");
  void ResetAll();

  std::string GetReport(const std::string& name = "default") const;
  std::string GetFullReport() const;

private:
  PerfMonitor() = default;
  ~PerfMonitor() = default;
  PerfMonitor(const PerfMonitor&) = delete;
  PerfMonitor& operator=(const PerfMonitor&) = delete;

  mutable std::mutex mutex_;
  std::unordered_map<std::string, PerformanceMetrics> metrics_;
  std::unordered_map<std::string, std::chrono::high_resolution_clock::time_point> timers_;
  std::string current_metric_name_ = "default";
};

class ScopedTimer {
public:
  explicit ScopedTimer(const std::string& name) : name_(name) {
    PerfMonitor::Instance().StartTimer(name);
  }

  ~ScopedTimer() {
    PerfMonitor::Instance().StopTimer(name_);
  }

private:
  std::string name_;
};

class InsertLatencyTracker {
public:
  InsertLatencyTracker() : start_(std::chrono::high_resolution_clock::now()), count_(0) {}

  void Increment(size_t count = 1) {
    count_ += count;
  }

  ~InsertLatencyTracker() {
    auto end = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(end - start_).count();
    PerfMonitor::Instance().RecordInsert(count_, duration_ms);
  }

private:
  std::chrono::high_resolution_clock::time_point start_;
  size_t count_;
};

class SearchLatencyTracker {
public:
  SearchLatencyTracker() : start_(std::chrono::high_resolution_clock::now()), count_(0) {}

  void Increment(size_t count = 1) {
    count_ += count;
  }

  ~SearchLatencyTracker() {
    auto end = std::chrono::high_resolution_clock::now();
    double duration_ms = std::chrono::duration<double, std::milli>(end - start_).count();
    PerfMonitor::Instance().RecordSearch(count_, duration_ms);
  }

private:
  std::chrono::high_resolution_clock::time_point start_;
  size_t count_;
};

}
