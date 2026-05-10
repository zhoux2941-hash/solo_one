using System;
using System.Collections.Generic;
using System.Linq;
using CombatLogAnalyzer.Models;

namespace CombatLogAnalyzer.Services
{
    public class TimelineAnalysisResult
    {
        public List<TimelineEvent> Events { get; set; } = new();
        public List<PlayerHealthHistory> PlayerHistories { get; set; } = new();
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public double TotalDurationSeconds { get; set; }
        public int TotalPlayers { get; set; }
    }

    public class TimelineService
    {
        private const int DefaultMaxHealth = 100000;
        private const double HealthThresholdLow = 30.0;
        private const double HealthThresholdCritical = 15.0;

        public TimelineAnalysisResult AnalyzeTimeline(List<CombatEvent> events)
        {
            var result = new TimelineAnalysisResult();
            if (events == null || events.Count == 0)
            {
                return result;
            }

            var sortedEvents = events.OrderBy(e => e.Timestamp).ToList();
            result.StartTime = sortedEvents[0].Timestamp;
            result.EndTime = sortedEvents[^1].Timestamp;
            result.TotalDurationSeconds = (result.EndTime - result.StartTime).TotalSeconds;

            result.Events = sortedEvents.Select(e => new TimelineEvent
            {
                Timestamp = e.Timestamp,
                EventType = e.EventType,
                Source = e.Caster,
                Target = e.Target,
                Skill = e.Skill,
                Amount = e.Amount,
                IsDamage = e.IsDamage
            }).ToList();

            var playerStats = new Dictionary<string, PlayerHealthHistory>();

            foreach (var evt in sortedEvents)
            {
                if (evt.IsDamage && !string.IsNullOrEmpty(evt.Target) && !evt.Target.StartsWith("0x"))
                {
                    if (!playerStats.ContainsKey(evt.Target))
                    {
                        playerStats[evt.Target] = new PlayerHealthHistory
                        {
                            PlayerName = evt.Target,
                            EstimatedMaxHealth = DefaultMaxHealth
                        };
                    }

                    var history = playerStats[evt.Target];
                    var lastHealth = history.HealthPoints.Count > 0 
                        ? history.HealthPoints[^1].Health 
                        : history.EstimatedMaxHealth;
                    var newHealth = Math.Max(0, lastHealth - evt.Amount);

                    history.HealthPoints.Add(new HealthPoint
                    {
                        Timestamp = evt.Timestamp,
                        Health = newHealth,
                        Change = -evt.Amount,
                        IsDamage = true,
                        RelatedEvent = $"{evt.Caster} used {evt.Skill}"
                    });
                }

                if (evt.IsHeal && !string.IsNullOrEmpty(evt.Target) && !evt.Target.StartsWith("0x"))
                {
                    if (!playerStats.ContainsKey(evt.Target))
                    {
                        playerStats[evt.Target] = new PlayerHealthHistory
                        {
                            PlayerName = evt.Target,
                            EstimatedMaxHealth = DefaultMaxHealth
                        };
                    }

                    var history = playerStats[evt.Target];
                    var lastHealth = history.HealthPoints.Count > 0 
                        ? history.HealthPoints[^1].Health 
                        : history.EstimatedMaxHealth;
                    var newHealth = Math.Min(history.EstimatedMaxHealth, lastHealth + evt.Amount);

                    history.HealthPoints.Add(new HealthPoint
                    {
                        Timestamp = evt.Timestamp,
                        Health = newHealth,
                        Change = evt.Amount,
                        IsDamage = false,
                        RelatedEvent = $"{evt.Caster} healed with {evt.Skill}"
                    });
                }

                if ((evt.IsDamage || evt.IsHeal) && !string.IsNullOrEmpty(evt.Caster) && 
                    !evt.Caster.StartsWith("0x") && evt.Caster != "Environment" && 
                    !playerStats.ContainsKey(evt.Caster))
                {
                    playerStats[evt.Caster] = new PlayerHealthHistory
                    {
                        PlayerName = evt.Caster,
                        EstimatedMaxHealth = DefaultMaxHealth
                    };
                }
            }

            foreach (var history in playerStats.Values)
            {
                if (history.HealthPoints.Count > 0)
                {
                    var maxDamage = history.HealthPoints
                        .Where(h => h.IsDamage)
                        .Max(h => Math.Abs(h.Change));
                    var estimatedMax = Math.Max(DefaultMaxHealth, (int)(maxDamage * 5));
                    history.EstimatedMaxHealth = estimatedMax;

                    var currentHealth = estimatedMax;
                    for (int i = 0; i < history.HealthPoints.Count; i++)
                    {
                        var point = history.HealthPoints[i];
                        currentHealth = Math.Max(0, Math.Min(estimatedMax, currentHealth + point.Change));
                        point.Health = currentHealth;
                    }
                }
            }

            result.PlayerHistories = playerStats.Values.Where(h => h.HealthPoints.Count > 0).ToList();
            result.TotalPlayers = result.PlayerHistories.Count;

            return result;
        }

        public List<PlayerHealthSnapshot> GetSnapshotAtTime(
            TimelineAnalysisResult analysis, 
            DateTime targetTime)
        {
            var snapshots = new List<PlayerHealthSnapshot>();

            if (analysis == null || analysis.PlayerHistories.Count == 0)
            {
                return snapshots;
            }

            foreach (var history in analysis.PlayerHistories)
            {
                var relevantPoints = history.HealthPoints
                    .Where(h => h.Timestamp <= targetTime)
                    .OrderBy(h => h.Timestamp)
                    .ToList();

                var currentHealth = history.EstimatedMaxHealth;
                int totalDamageTaken = 0;
                int totalHealingReceived = 0;
                DateTime lastEventTime = analysis.StartTime;

                if (relevantPoints.Count > 0)
                {
                    var lastPoint = relevantPoints[^1];
                    currentHealth = lastPoint.Health;
                    lastEventTime = lastPoint.Timestamp;
                    totalDamageTaken = relevantPoints.Where(h => h.IsDamage).Sum(h => Math.Abs(h.Change));
                    totalHealingReceived = relevantPoints.Where(h => !h.IsDamage).Sum(h => h.Change);
                }

                var healthPercent = (double)currentHealth / history.EstimatedMaxHealth * 100;
                string status = "Healthy";

                if (healthPercent <= HealthThresholdCritical)
                {
                    status = "Critical";
                }
                else if (healthPercent <= HealthThresholdLow)
                {
                    status = "Low";
                }
                else if (healthPercent >= 95)
                {
                    status = "Full";
                }

                snapshots.Add(new PlayerHealthSnapshot
                {
                    PlayerName = history.PlayerName,
                    CurrentHealth = currentHealth,
                    MaxHealth = history.EstimatedMaxHealth,
                    TotalDamageTaken = totalDamageTaken,
                    TotalHealingReceived = totalHealingReceived,
                    LastEventTime = lastEventTime,
                    Status = status,
                    IsPresent = relevantPoints.Count > 0
                });
            }

            return snapshots.OrderByDescending(s => s.HealthPercent).ToList();
        }

        public List<TimelineEvent> GetEventsInRange(
            TimelineAnalysisResult analysis,
            DateTime startTime,
            DateTime endTime)
        {
            if (analysis == null || analysis.Events.Count == 0)
            {
                return new List<TimelineEvent>();
            }

            return analysis.Events
                .Where(e => e.Timestamp >= startTime && e.Timestamp <= endTime)
                .OrderBy(e => e.Timestamp)
                .ToList();
        }

        public double GetProgressPercentage(TimelineAnalysisResult analysis, DateTime currentTime)
        {
            if (analysis == null || analysis.TotalDurationSeconds <= 0)
            {
                return 0;
            }

            var elapsed = (currentTime - analysis.StartTime).TotalSeconds;
            return Math.Max(0, Math.Min(100, (elapsed / analysis.TotalDurationSeconds) * 100));
        }

        public DateTime GetTimeAtPercentage(TimelineAnalysisResult analysis, double percentage)
        {
            if (analysis == null)
            {
                return DateTime.MinValue;
            }

            percentage = Math.Max(0, Math.Min(100, percentage));
            var elapsedSeconds = (percentage / 100) * analysis.TotalDurationSeconds;
            return analysis.StartTime.AddSeconds(elapsedSeconds);
        }
    }
}
