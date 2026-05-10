using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CombatLogAnalyzer.Models;

namespace CombatLogAnalyzer.Services
{
    public class ParseResult
    {
        public List<CombatEvent> Events { get; set; } = new();
        public double CombatDurationSeconds { get; set; }
        public int TotalLines { get; set; }
        public int ParsedLines { get; set; }
        public int SkippedLines { get; set; }
    }

    public class CombatLogParser
    {
        private static readonly HashSet<string> DamageEvents = new(StringComparer.OrdinalIgnoreCase)
        {
            "SWING_DAMAGE",
            "SPELL_DAMAGE",
            "SPELL_PERIODIC_DAMAGE",
            "RANGE_DAMAGE",
            "DAMAGE_SHIELD",
            "ENVIRONMENTAL_DAMAGE",
            "SPELL_BUILDING_DAMAGE"
        };

        private static readonly HashSet<string> HealEvents = new(StringComparer.OrdinalIgnoreCase)
        {
            "SPELL_HEAL",
            "SPELL_PERIODIC_HEAL",
            "SPELL_BUILDING_HEAL"
        };

        public string ComputeFileHash(string filePath)
        {
            using var fs = new FileStream(filePath, FileMode.Open, FileAccess.Read);
            using var md5 = MD5.Create();
            var hash = md5.ComputeHash(fs);
            var sb = new StringBuilder();
            foreach (var b in hash)
            {
                sb.Append(b.ToString("x2"));
            }
            return sb.ToString();
        }

        public ParseResult ParseFile(string filePath, IProgress<int>? progress = null)
        {
            var result = new ParseResult();
            var allLines = File.ReadAllLines(filePath, Encoding.UTF8);
            result.TotalLines = allLines.Length;

            var events = new List<CombatEvent>();
            var fileHash = ComputeFileHash(filePath);

            for (int i = 0; i < allLines.Length; i++)
            {
                var line = allLines[i];
                if (string.IsNullOrWhiteSpace(line))
                {
                    result.SkippedLines++;
                    continue;
                }

                var evt = ParseLine(line, fileHash);
                if (evt != null)
                {
                    events.Add(evt);
                    result.ParsedLines++;
                }
                else
                {
                    result.SkippedLines++;
                }

                if (progress != null && i % 1000 == 0)
                {
                    progress.Report((int)((double)i / allLines.Length * 100));
                }
            }

            events = events.OrderBy(e => e.Timestamp).ToList();
            result.Events = events;

            if (events.Count >= 2)
            {
                var first = events[0].Timestamp;
                var last = events[^1].Timestamp;
                result.CombatDurationSeconds = (last - first).TotalSeconds;
            }

            progress?.Report(100);
            return result;
        }

        private CombatEvent? ParseLine(string line, string fileHash)
        {
            if (string.IsNullOrWhiteSpace(line)) return null;

            try
            {
                var separatorIndex = FindFirstSpaceOutsideQuotes(line);
                if (separatorIndex == -1) return null;

                var timePart = line.Substring(0, separatorIndex).Trim();
                var rest = line.Substring(separatorIndex + 1);

                var timestamp = ParseTimestamp(timePart);

                var parts = SplitCommaSeparated(rest);
                if (parts.Length < 2) return null;

                var eventType = SafeTrim(parts[0]);
                var isDamage = DamageEvents.Contains(eventType);
                var isHeal = HealEvents.Contains(eventType);

                if (!isDamage && !isHeal) return null;

                string caster = "";
                string casterGuid = "";
                string target = "";
                string targetGuid = "";
                string skill = "";
                int skillId = 0;
                int amount = 0;

                if (eventType == "SWING_DAMAGE")
                {
                    if (parts.Length >= 6)
                    {
                        casterGuid = SafeTrimQuote(parts[1]);
                        caster = SafeTrimQuote(parts[2]);
                        targetGuid = SafeTrimQuote(parts[3]);
                        target = SafeTrimQuote(parts[4]);
                        skill = "Melee";
                        if (parts.Length > 8 && int.TryParse(SafeTrim(parts[8]), out var dmg))
                        {
                            amount = dmg;
                        }
                    }
                }
                else
                {
                    if (parts.Length >= 7)
                    {
                        casterGuid = SafeTrimQuote(parts[1]);
                        caster = SafeTrimQuote(parts[2]);
                        targetGuid = SafeTrimQuote(parts[3]);
                        target = SafeTrimQuote(parts[4]);
                        if (parts.Length > 5 && int.TryParse(SafeTrim(parts[5]), out skillIdVal))
                        {
                            skillId = skillIdVal;
                        }
                        skill = SafeTrimQuote(parts[6]);
                        if (isHeal && parts.Length > 8)
                        {
                            if (int.TryParse(SafeTrim(parts[8]), out var heal))
                            {
                                amount = heal;
                            }
                        }
                        else if (isDamage && parts.Length > 8)
                        {
                            if (int.TryParse(SafeTrim(parts[8]), out var dmg))
                            {
                                amount = dmg;
                            }
                        }
                    }
                }

                if (string.IsNullOrEmpty(caster) || caster.StartsWith("0x", StringComparison.Ordinal))
                {
                    caster = "Environment";
                }

                if (string.IsNullOrEmpty(skill))
                {
                    skill = "Unknown";
                }

                return new CombatEvent
                {
                    FileHash = fileHash,
                    Timestamp = timestamp,
                    EventType = eventType,
                    Caster = caster,
                    CasterGuid = casterGuid,
                    Target = target,
                    TargetGuid = targetGuid,
                    Skill = skill,
                    SkillId = skillId,
                    Amount = amount,
                    IsHeal = isHeal,
                    IsDamage = isDamage,
                    RawLine = line
                };
            }
            catch (Exception)
            {
                return null;
            }
        }

        private static int FindFirstSpaceOutsideQuotes(string input)
        {
            if (string.IsNullOrEmpty(input)) return -1;
            
            var inQuotes = false;
            for (int i = 0; i < input.Length; i++)
            {
                char c = input[i];
                if (c == '"')
                {
                    inQuotes = !inQuotes;
                }
                else if (c == ' ' && !inQuotes)
                {
                    return i;
                }
            }
            return -1;
        }

        private static DateTime ParseTimestamp(string timePart)
        {
            if (string.IsNullOrEmpty(timePart)) return DateTime.MinValue;

            string[] formats = new[]
            {
                "M/d HH:mm:ss.fff",
                "MM/dd HH:mm:ss.fff",
                "M/d HH:mm:ss",
                "MM/dd HH:mm:ss"
            };

            if (DateTime.TryParseExact(timePart, formats, 
                CultureInfo.InvariantCulture, DateTimeStyles.None, out var timestamp))
            {
                return timestamp;
            }

            if (DateTime.TryParse(timePart, CultureInfo.InvariantCulture, DateTimeStyles.None, out timestamp))
            {
                return timestamp;
            }

            return DateTime.MinValue;
        }

        private static string SafeTrim(string? input)
        {
            return input?.Trim() ?? string.Empty;
        }

        private static string SafeTrimQuote(string? input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            var trimmed = input.Trim();
            if (trimmed.Length >= 2 && trimmed[0] == '"' && trimmed[trimmed.Length - 1] == '"')
            {
                return trimmed.Substring(1, trimmed.Length - 2).Replace("\"\"", "\"");
            }
            return trimmed;
        }

        private static string[] SplitCommaSeparated(string input)
        {
            if (string.IsNullOrEmpty(input))
            {
                return Array.Empty<string>();
            }

            var result = new List<string>();
            var current = new StringBuilder();
            var inQuotes = false;

            for (int i = 0; i < input.Length; i++)
            {
                char c = input[i];
                
                if (c == '"')
                {
                    if (inQuotes && i + 1 < input.Length && input[i + 1] == '"')
                    {
                        current.Append('"');
                        i++;
                        continue;
                    }
                    
                    inQuotes = !inQuotes;
                    current.Append(c);
                }
                else if (c == ',' && !inQuotes)
                {
                    result.Add(current.ToString());
                    current.Clear();
                }
                else
                {
                    current.Append(c);
                }
            }

            if (current.Length > 0)
            {
                result.Add(current.ToString());
            }

            return result.ToArray();
        }
    }
}
