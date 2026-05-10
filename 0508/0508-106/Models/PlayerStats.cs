namespace CombatLogAnalyzer.Models
{
    public class PlayerStats
    {
        public string PlayerName { get; set; } = string.Empty;
        public long TotalDamage { get; set; }
        public long TotalHealing { get; set; }
        public double DPS { get; set; }
        public double HPS { get; set; }
        public int DamageEventCount { get; set; }
        public int HealEventCount { get; set; }
        public double CombatDurationSeconds { get; set; }
    }
}
