namespace StudetPlanner.Models
{
    public class DashboardViewModel
    {
        public List<Subject> Subjects { get; set; } = new();
        public List<TaskItem> Tasks { get; set; } = new();
    }
}
