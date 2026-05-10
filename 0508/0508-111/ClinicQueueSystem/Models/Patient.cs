
using System;

namespace ClinicQueueSystem.Models
{
    public enum Priority
    {
        Normal = 0,
        Priority = 1
    }

    public enum PatientStatus
    {
        Waiting = 0,
        InProgress = 1,
        Completed = 2,
        Skipped = 3
    }

    public class Patient
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Department { get; set; }
        public Priority Priority { get; set; }
        public int QueueNumber { get; set; }
        public PatientStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CalledAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
