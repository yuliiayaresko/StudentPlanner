namespace StudetPlanner.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string? Title { get; set; }

        public string? Description { get; set; }

        public DateTime? Deadline { get; set; }

        public int Priority { get; set; } = 0;

        public int Status { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? CompletedAt { get; set; }

        public int? SubjectId { get; set; }

        public Subject? Subject { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public ICollection<Reward>? Rewards { get; set; }

        public bool Notified24h { get; set; } = false;
        public bool Notified3h { get; set; } = false;
        public bool NotifiedOverdue { get; set; } = false;
    }
}
