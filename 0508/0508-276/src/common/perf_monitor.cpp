#include "perf_monitor.h"
#include <sstream>
#include <iomanip>
#include <algorithm>

namespace vectordb {

void PerformanceMetrics::Reset() {
  total_inserts = 0;
  total_insert_time_ms = 0.0;
  avg_insert_latency_ms = 0.0;
  insert_qps = 0.0;

  total_searches = 0;
  total_search_time_ms = 0.0;
  avg_search_latency_ms = 0.0;
  search_qps = 0.0;

  avg_recall = 0.0;
  recall_history.clear();

  memory_usage_bytes = 0;
  memory_usage_mb = 0.0;

  build_time_ms = 0.0;
}

std::string PerformanceMetrics::ToString() const {
  std::ostringstream oss;
  oss << std::fixed << std::setprecision(3);
  oss << "Performance Metrics: " << name << "\n";
  oss << "========================================\n";

  if (build_time_ms > 0) {
    oss << "Build Time:           " << build_time_ms << " ms ("
        << build_time_ms / 1000.0 << " s)\n";
  }

  if (total_inserts > 0) {
    oss << "Insert Stats:\n";
    oss << "  Total Inserts:      " << total_inserts << "\n";
    oss << "  Total Time:         " << total_insert_time_ms << " ms\n";
    oss << "  Avg Latency:        " << avg_insert_latency_ms << " ms/vec\n";
    oss << "  QPS:                " << insert_qps << " vec/s\n";
  }

  if (total_searches > 0) {
    oss << "Search Stats:\n";
    oss << "  Total Searches:     " << total_searches << "\n";
    oss << "  Total Time:         " << total_search_time_ms << " ms\n";
    oss << "  Avg Latency:        " << avg_search_latency_ms << " ms/query\n";
    oss << "  QPS:                " << search_qps << " queries/s\n";
  }

  if (!recall_history.empty()) {
    oss << "Recall Stats:\n";
    oss << "  Avg Recall@10:      " << (avg_recall * 100.0) << "%\n";
    if (recall_history.size() >= 10) {
      double min_recall = *std::min_element(recall_history.begin(), recall_history.end());
      double max_recall = *std::max_element(recall_history.begin(), recall_history.end());
      oss << "  Min Recall:         " << (min_recall * 100.0) << "%\n";
      oss << "  Max Recall:         " << (max_recall * 100.0) << "%\n";
    }
  }

  if (memory_usage_bytes > 0) {
    oss << "Memory Stats:\n";
    oss << "  Memory Usage:       " << memory_usage_mb << " MB ("
        << memory_usage_bytes << " bytes)\n";
  }

  oss << "========================================\n";
  return oss.str();
}

PerfMonitor& PerfMonitor::Instance() {
  static PerfMonitor instance;
  return instance;
}

void PerfMonitor::StartTimer(const std::string& operation) {
  std::lock_guard<std::mutex> lock(mutex_);
  timers_[operation] = std::chrono::high_resolution_clock::now();
}

double PerfMonitor::StopTimer(const std::string& operation) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = timers_.find(operation);
  if (it == timers_.end()) {
    return 0.0;
  }

  auto end = std::chrono::high_resolution_clock::now();
  double duration_ms = std::chrono::duration<double, std::milli>(end - it->second).count();
  timers_.erase(it);
  return duration_ms;
}

double PerfMonitor::GetElapsedMs(const std::string& operation) const {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = timers_.find(operation);
  if (it == timers_.end()) {
    return 0.0;
  }

  auto now = std::chrono::high_resolution_clock::now();
  return std::chrono::duration<double, std::milli>(now - it->second).count();
}

void PerfMonitor::RecordInsert(size_t count, double time_ms) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto& metrics = metrics_[current_metric_name_];
  metrics.name = current_metric_name_;
  metrics.total_inserts += count;
  metrics.total_insert_time_ms += time_ms;

  if (metrics.total_inserts > 0) {
    metrics.avg_insert_latency_ms = metrics.total_insert_time_ms / metrics.total_inserts;
    metrics.insert_qps = (metrics.total_inserts * 1000.0) / metrics.total_insert_time_ms;
  }
}

void PerfMonitor::RecordSearch(size_t count, double time_ms) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto& metrics = metrics_[current_metric_name_];
  metrics.name = current_metric_name_;
  metrics.total_searches += count;
  metrics.total_search_time_ms += time_ms;

  if (metrics.total_searches > 0) {
    metrics.avg_search_latency_ms = metrics.total_search_time_ms / metrics.total_searches;
    metrics.search_qps = (metrics.total_searches * 1000.0) / metrics.total_search_time_ms;
  }
}

void PerfMonitor::RecordRecall(double recall) {
  std::lock_guard<std::mutex> lock(mutex_);
  auto& metrics = metrics_[current_metric_name_];
  metrics.name = current_metric_name_;
  metrics.recall_history.push_back(recall);

  double sum = 0.0;
  for (double r : metrics.recall_history) {
    sum += r;
  }
  metrics.avg_recall = sum / metrics.recall_history.size();
}

void PerfMonitor::RecordBuildTime(double time_ms) {
  std::lock_guard<std::mutex> lock(mutex_);
  metrics_[current_metric_name_].name = current_metric_name_;
  metrics_[current_metric_name_].build_time_ms = time_ms;
}

void PerfMonitor::RecordMemoryUsage(size_t bytes) {
  std::lock_guard<std::mutex> lock(mutex_);
  metrics_[current_metric_name_].name = current_metric_name_;
  metrics_[current_metric_name_].memory_usage_bytes = bytes;
  metrics_[current_metric_name_].memory_usage_mb = bytes / (1024.0 * 1024.0);
}

const PerformanceMetrics& PerfMonitor::GetMetrics(const std::string& name) const {
  std::lock_guard<std::mutex> lock(mutex_);
  static PerformanceMetrics empty;
  auto it = metrics_.find(name);
  if (it == metrics_.end()) {
    return empty;
  }
  return it->second;
}

void PerfMonitor::SetCurrentMetricName(const std::string& name) {
  std::lock_guard<std::mutex> lock(mutex_);
  current_metric_name_ = name;
}

void PerfMonitor::Reset(const std::string& name) {
  std::lock_guard<std::mutex> lock(mutex_);
  metrics_[name].Reset();
}

void PerfMonitor::ResetAll() {
  std::lock_guard<std::mutex> lock(mutex_);
  metrics_.clear();
}

std::string PerfMonitor::GetReport(const std::string& name) const {
  std::lock_guard<std::mutex> lock(mutex_);
  auto it = metrics_.find(name);
  if (it == metrics_.end()) {
    return "No metrics found for: " + name;
  }
  return it->second.ToString();
}

std::string PerfMonitor::GetFullReport() const {
  std::lock_guard<std::mutex> lock(mutex_);
  std::ostringstream oss;
  oss << "Full Performance Report\n";
  oss << "========================================\n\n";

  for (const auto& [name, metrics] : metrics_) {
    oss << metrics.ToString() << "\n";
  }

  return oss.str();
}

}
