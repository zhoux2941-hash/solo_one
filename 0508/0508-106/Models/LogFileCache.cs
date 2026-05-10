using System;

namespace CombatLogAnalyzer.Models
{
    public class LogFileCache
    {
        public int Id { get; set; }
        public string FilePath { get; set; } = string.Empty;
        public string FileHash { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public DateTime LastModified { get; set; }
        public DateTime ParsedAt { get; set; }
        public int EventCount { get; set; }
        public double CombatDurationSeconds { get; set; }
        public bool IsCached => EventCount > 0;
    }
}
