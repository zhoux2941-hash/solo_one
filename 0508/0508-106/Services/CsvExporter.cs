using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using CombatLogAnalyzer.Models;

namespace CombatLogAnalyzer.Services
{
    public class CsvExporter
    {
        public void ExportPlayerStats(string filePath, List<PlayerStats> stats)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Player,Total Damage,DPS,Total Healing,HPS,Damage Events,Heal Events,Combat Duration (s)");

            foreach (var stat in stats)
            {
                sb.AppendLine($"{EscapeCsv(stat.PlayerName)},{stat.TotalDamage},{stat.DPS:F2},{stat.TotalHealing},{stat.HPS:F2},{stat.DamageEventCount},{stat.HealEventCount},{stat.CombatDurationSeconds:F2}");
            }

            File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);
        }

        public void ExportSkillStats(string filePath, List<SkillStats> skills)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Skill,Use Count,Total Damage,Average Damage,Total Healing,Average Healing");

            foreach (var skill in skills)
            {
                sb.AppendLine($"{EscapeCsv(skill.SkillName)},{skill.UseCount},{skill.TotalDamage},{skill.AverageDamage:F2},{skill.TotalHealing},{skill.AverageHealing:F2}");
            }

            File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);
        }

        public void ExportCombatEvents(string filePath, List<CombatEvent> events)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Timestamp,Event Type,Caster,Target,Skill,Amount,Is Damage,Is Heal");

            foreach (var evt in events)
            {
                sb.AppendLine($"{evt.Timestamp:yyyy-MM-dd HH:mm:ss.fff},{EscapeCsv(evt.EventType)},{EscapeCsv(evt.Caster)},{EscapeCsv(evt.Target)},{EscapeCsv(evt.Skill)},{evt.Amount},{evt.IsDamage},{evt.IsHeal}");
            }

            File.WriteAllText(filePath, sb.ToString(), Encoding.UTF8);
        }

        private static string EscapeCsv(string value)
        {
            if (string.IsNullOrEmpty(value)) return "";
            if (value.Contains(',') || value.Contains('"') || value.Contains('\n'))
            {
                return $"\"{value.Replace("\"", "\"\"")}\"";
            }
            return value;
        }
    }
}
