using System.ComponentModel.DataAnnotations.Schema;

namespace StudetPlanner.Models
{
    public class User
    {
        public int Id { get; set; }

        public string? Username { get; set; }

        public string? Email { get; set; }

        public string? PasswordHash { get; set; }

        [NotMapped]
        public string? Password { get; set; }

        public int Level { get; set; } = 1;

        public int ExperiencePoints { get; set; } = 0;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public ICollection<Subject>? Subjects { get; set; }

        public ICollection<TaskItem>? Tasks { get; set; }

        public ICollection<UserAchievement>? UserAchievements { get; set; }

        public ICollection<Reward>? Rewards { get; set; }
    }
}
