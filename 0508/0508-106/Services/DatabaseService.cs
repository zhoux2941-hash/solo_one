using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using CombatLogAnalyzer.Models;
using Microsoft.Data.Sqlite;

namespace CombatLogAnalyzer.Services
{
    public class DatabaseService
    {
        private readonly string _dbPath;

        public DatabaseService(string dbName = "CombatLogAnalyzer.db")
        {
            _dbPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, dbName);
            InitializeDatabase();
        }

        private void InitializeDatabase()
        {
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                CREATE TABLE IF NOT EXISTS LogFiles (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    FilePath TEXT NOT NULL,
                    FileHash TEXT NOT NULL UNIQUE,
                    FileSize INTEGER NOT NULL,
                    LastModified TEXT NOT NULL,
                    ParsedAt TEXT NOT NULL,
                    EventCount INTEGER NOT NULL DEFAULT 0,
                    CombatDurationSeconds REAL NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS CombatEvents (
                    Id INTEGER PRIMARY KEY AUTOINCREMENT,
                    FileHash TEXT NOT NULL,
                    Timestamp TEXT NOT NULL,
                    EventType TEXT NOT NULL,
                    Caster TEXT NOT NULL,
                    CasterGuid TEXT NOT NULL,
                    Target TEXT NOT NULL,
                    TargetGuid TEXT NOT NULL,
                    Skill TEXT NOT NULL,
                    SkillId INTEGER NOT NULL,
                    Amount INTEGER NOT NULL,
                    IsHeal INTEGER NOT NULL,
                    IsDamage INTEGER NOT NULL,
                    RawLine TEXT NOT NULL,
                    FOREIGN KEY (FileHash) REFERENCES LogFiles(FileHash)
                );

                CREATE INDEX IF NOT EXISTS idx_combat_events_filehash ON CombatEvents(FileHash);
                CREATE INDEX IF NOT EXISTS idx_combat_events_caster ON CombatEvents(Caster);
                CREATE INDEX IF NOT EXISTS idx_combat_events_skill ON CombatEvents(Skill);
            ";
            command.ExecuteNonQuery();
        }

        public LogFileCache? GetCachedLogFile(string fileHash)
        {
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT Id, FilePath, FileHash, FileSize, LastModified, ParsedAt, EventCount, CombatDurationSeconds
                FROM LogFiles
                WHERE FileHash = $hash
            ";
            command.Parameters.AddWithValue("$hash", fileHash);

            using var reader = command.ExecuteReader();
            if (reader.Read())
            {
                return new LogFileCache
                {
                    Id = reader.GetInt32(0),
                    FilePath = reader.GetString(1),
                    FileHash = reader.GetString(2),
                    FileSize = reader.GetInt64(3),
                    LastModified = DateTime.Parse(reader.GetString(4)),
                    ParsedAt = DateTime.Parse(reader.GetString(5)),
                    EventCount = reader.GetInt32(6),
                    CombatDurationSeconds = reader.GetDouble(7)
                };
            }
            return null;
        }

        public void CacheLogFile(LogFileCache logFile, List<CombatEvent> events)
        {
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var transaction = connection.BeginTransaction();
            try
            {
                using var deleteEventsCmd = connection.CreateCommand();
                deleteEventsCmd.CommandText = "DELETE FROM CombatEvents WHERE FileHash = $hash";
                deleteEventsCmd.Parameters.AddWithValue("$hash", logFile.FileHash);
                deleteEventsCmd.ExecuteNonQuery();

                using var deleteFileCmd = connection.CreateCommand();
                deleteFileCmd.CommandText = "DELETE FROM LogFiles WHERE FileHash = $hash";
                deleteFileCmd.Parameters.AddWithValue("$hash", logFile.FileHash);
                deleteFileCmd.ExecuteNonQuery();

                using var insertFileCmd = connection.CreateCommand();
                insertFileCmd.CommandText = @"
                    INSERT INTO LogFiles (FilePath, FileHash, FileSize, LastModified, ParsedAt, EventCount, CombatDurationSeconds)
                    VALUES ($path, $hash, $size, $modified, $parsed, $eventCount, $duration)
                ";
                insertFileCmd.Parameters.AddWithValue("$path", logFile.FilePath);
                insertFileCmd.Parameters.AddWithValue("$hash", logFile.FileHash);
                insertFileCmd.Parameters.AddWithValue("$size", logFile.FileSize);
                insertFileCmd.Parameters.AddWithValue("$modified", logFile.LastModified.ToString("o"));
                insertFileCmd.Parameters.AddWithValue("$parsed", logFile.ParsedAt.ToString("o"));
                insertFileCmd.Parameters.AddWithValue("$eventCount", logFile.EventCount);
                insertFileCmd.Parameters.AddWithValue("$duration", logFile.CombatDurationSeconds);
                insertFileCmd.ExecuteNonQuery();

                foreach (var evt in events)
                {
                    using var insertEventCmd = connection.CreateCommand();
                    insertEventCmd.CommandText = @"
                        INSERT INTO CombatEvents (FileHash, Timestamp, EventType, Caster, CasterGuid, Target, TargetGuid, Skill, SkillId, Amount, IsHeal, IsDamage, RawLine)
                        VALUES ($hash, $timestamp, $eventType, $caster, $casterGuid, $target, $targetGuid, $skill, $skillId, $amount, $isHeal, $isDamage, $rawLine)
                    ";
                    insertEventCmd.Parameters.AddWithValue("$hash", evt.FileHash);
                    insertEventCmd.Parameters.AddWithValue("$timestamp", evt.Timestamp.ToString("o"));
                    insertEventCmd.Parameters.AddWithValue("$eventType", evt.EventType);
                    insertEventCmd.Parameters.AddWithValue("$caster", evt.Caster);
                    insertEventCmd.Parameters.AddWithValue("$casterGuid", evt.CasterGuid);
                    insertEventCmd.Parameters.AddWithValue("$target", evt.Target);
                    insertEventCmd.Parameters.AddWithValue("$targetGuid", evt.TargetGuid);
                    insertEventCmd.Parameters.AddWithValue("$skill", evt.Skill);
                    insertEventCmd.Parameters.AddWithValue("$skillId", evt.SkillId);
                    insertEventCmd.Parameters.AddWithValue("$amount", evt.Amount);
                    insertEventCmd.Parameters.AddWithValue("$isHeal", evt.IsHeal ? 1 : 0);
                    insertEventCmd.Parameters.AddWithValue("$isDamage", evt.IsDamage ? 1 : 0);
                    insertEventCmd.Parameters.AddWithValue("$rawLine", evt.RawLine);
                    insertEventCmd.ExecuteNonQuery();
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public List<CombatEvent> GetCachedEvents(string fileHash)
        {
            var events = new List<CombatEvent>();
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT Timestamp, EventType, Caster, CasterGuid, Target, TargetGuid, Skill, SkillId, Amount, IsHeal, IsDamage, RawLine
                FROM CombatEvents
                WHERE FileHash = $hash
                ORDER BY Timestamp ASC
            ";
            command.Parameters.AddWithValue("$hash", fileHash);

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                try
                {
                    events.Add(new CombatEvent
                    {
                        FileHash = fileHash,
                        Timestamp = DateTime.Parse(reader.IsDBNull(0) ? DateTime.MinValue.ToString() : reader.GetString(0)),
                        EventType = reader.IsDBNull(1) ? string.Empty : reader.GetString(1),
                        Caster = reader.IsDBNull(2) ? string.Empty : reader.GetString(2),
                        CasterGuid = reader.IsDBNull(3) ? string.Empty : reader.GetString(3),
                        Target = reader.IsDBNull(4) ? string.Empty : reader.GetString(4),
                        TargetGuid = reader.IsDBNull(5) ? string.Empty : reader.GetString(5),
                        Skill = reader.IsDBNull(6) ? string.Empty : reader.GetString(6),
                        SkillId = reader.IsDBNull(7) ? 0 : reader.GetInt32(7),
                        Amount = reader.IsDBNull(8) ? 0 : reader.GetInt32(8),
                        IsHeal = !reader.IsDBNull(9) && reader.GetInt32(9) == 1,
                        IsDamage = !reader.IsDBNull(10) && reader.GetInt32(10) == 1,
                        RawLine = reader.IsDBNull(11) ? string.Empty : reader.GetString(11)
                    });
                }
                catch
                {
                    continue;
                }
            }
            return events;
        }

        public List<PlayerStats> GetPlayerStats(string fileHash, double combatDurationSeconds)
        {
            var stats = new Dictionary<string, PlayerStats>();
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT 
                    Caster,
                    SUM(CASE WHEN IsDamage = 1 THEN Amount ELSE 0 END) as TotalDamage,
                    SUM(CASE WHEN IsHeal = 1 THEN Amount ELSE 0 END) as TotalHealing,
                    COUNT(CASE WHEN IsDamage = 1 THEN 1 ELSE NULL END) as DamageCount,
                    COUNT(CASE WHEN IsHeal = 1 THEN 1 ELSE NULL END) as HealCount
                FROM CombatEvents
                WHERE FileHash = $hash
                GROUP BY Caster
                HAVING TotalDamage > 0 OR TotalHealing > 0
                ORDER BY TotalDamage DESC, TotalHealing DESC
            ";
            command.Parameters.AddWithValue("$hash", fileHash);

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var caster = reader.GetString(0);
                var totalDamage = reader.GetInt64(1);
                var totalHealing = reader.GetInt64(2);
                var damageCount = reader.GetInt32(3);
                var healCount = reader.GetInt32(4);

                var playerStats = new PlayerStats
                {
                    PlayerName = caster,
                    TotalDamage = totalDamage,
                    TotalHealing = totalHealing,
                    DamageEventCount = damageCount,
                    HealEventCount = healCount,
                    CombatDurationSeconds = combatDurationSeconds,
                    DPS = combatDurationSeconds > 0 ? totalDamage / combatDurationSeconds : 0,
                    HPS = combatDurationSeconds > 0 ? totalHealing / combatDurationSeconds : 0
                };
                stats[caster] = playerStats;
            }

            return stats.Values.OrderByDescending(p => p.TotalDamage).ToList();
        }

        public List<SkillStats> GetTopSkills(string fileHash, int topN = 5)
        {
            var skills = new List<SkillStats>();
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = @"
                SELECT 
                    Skill,
                    COUNT(*) as UseCount,
                    SUM(CASE WHEN IsDamage = 1 THEN Amount ELSE 0 END) as TotalDamage,
                    SUM(CASE WHEN IsHeal = 1 THEN Amount ELSE 0 END) as TotalHealing
                FROM CombatEvents
                WHERE FileHash = $hash
                GROUP BY Skill
                ORDER BY UseCount DESC
                LIMIT $topN
            ";
            command.Parameters.AddWithValue("$hash", fileHash);
            command.Parameters.AddWithValue("$topN", topN);

            using var reader = command.ExecuteReader();
            while (reader.Read())
            {
                var skillName = reader.GetString(0);
                var useCount = reader.GetInt32(1);
                var totalDamage = reader.GetInt64(2);
                var totalHealing = reader.GetInt64(3);
                var damageCount = totalDamage > 0 ? useCount : 0;
                var healCount = totalHealing > 0 ? useCount : 0;

                skills.Add(new SkillStats
                {
                    SkillName = skillName,
                    UseCount = useCount,
                    TotalDamage = totalDamage,
                    TotalHealing = totalHealing,
                    AverageDamage = damageCount > 0 ? (double)totalDamage / damageCount : 0,
                    AverageHealing = healCount > 0 ? (double)totalHealing / healCount : 0
                });
            }

            return skills;
        }

        public void ClearAllCache()
        {
            using var connection = new SqliteConnection($"Data Source={_dbPath}");
            connection.Open();

            using var command = connection.CreateCommand();
            command.CommandText = "DELETE FROM CombatEvents; DELETE FROM LogFiles;";
            command.ExecuteNonQuery();
        }
    }
}
