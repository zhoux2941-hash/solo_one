namespace CombatLogAnalyzer.Models
{
    public class SkillStats
    {
        public string SkillName { get; set; } = string.Empty;
        public int UseCount { get; set; }
        public long TotalDamage { get; set; }
        public long TotalHealing { get; set; }
        public double AverageDamage { get; set; }
        public double AverageHealing { get; set; }
    }
}
