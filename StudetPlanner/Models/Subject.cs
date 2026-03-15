namespace StudetPlanner.Models
{
    public class Subject
    {
        public int Id { get; set; }

        public string Name { get; set; } = null!;

        public string? Description { get; set; }

        public int UserId { get; set; }

        public User? User  { get; set; }

        public ICollection<TaskItem>? Tasks { get; set; }
    }
}
