namespace StudetPlanner.Models
{
    public class Reward
    {
        public int Id { get; set; }

        public int Points { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public int UserId { get; set; }

        public User User { get; set; }

        public int TaskItemId { get; set; }

        public TaskItem TaskItem { get; set; }
    }
}
