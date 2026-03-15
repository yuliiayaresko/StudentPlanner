namespace StudetPlanner.Models
{
    public class TaskItem
    {
        public int Id { get; set; }

        public string? Title { get; set; }

        public string? Description { get; set; }

        public DateTime? Deadline { get; set; }

        // 0 - Неважливо, 1 - Важливо
        public int Priority { get; set; } = 0;

        // 0 - Не розпочато, 1 - В процесі, 2 - Зроблено
        public int Status { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? CompletedAt { get; set; }

        public int? SubjectId { get; set; }

        public Subject? Subject { get; set; }

        public int UserId { get; set; }

        public User? User { get; set; }

        public ICollection<Reward>? Rewards { get; set; }
    }
}
