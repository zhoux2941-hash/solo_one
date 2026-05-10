using System;

namespace CombatLogAnalyzer.Models
{
    public class CombatEvent
    {
        public int Id { get; set; }
        public string FileHash { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public string EventType { get; set; } = string.Empty;
        public string Caster { get; set; } = string.Empty;
        public string CasterGuid { get; set; } = string.Empty;
        public string Target { get; set; } = string.Empty;
        public string TargetGuid { get; set; } = string.Empty;
        public string Skill { get; set; } = string.Empty;
        public int SkillId { get; set; }
        public int Amount { get; set; }
        public bool IsHeal { get; set; }
        public bool IsDamage { get; set; }
        public string RawLine { get; set; } = string.Empty;
    }
}
