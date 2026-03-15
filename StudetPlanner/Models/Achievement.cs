namespace StudetPlanner.Models
{
    public class Achievement
    {
        public int Id { get; set; }

        public string Name { get; set; }

        public string Description { get; set; }

        public int RequiredTasks { get; set; }

        public ICollection<UserAchievement> UserAchievements { get; set; }
    }
}
