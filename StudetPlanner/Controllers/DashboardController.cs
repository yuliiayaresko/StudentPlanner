using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StudetPlanner.Models;
using System.Security.Claims;

namespace StudetPlanner.Controllers
{
    [Authorize]
    public class DashboardController : Controller
    {
        private readonly PlannerDbContext _context;

        public DashboardController(PlannerDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(claim, out int id) ? id : 0;
        }

        public async Task<IActionResult> Index()
        {
            int userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var vm = new DashboardViewModel
            {
                Subjects = await _context.Subjects
                    .Where(s => s.UserId == userId)
                    .ToListAsync(),

                Tasks = await _context.Tasks
                    .Where(t => t.UserId == userId)
                    .Include(t => t.Subject)
                    .OrderBy(t => t.Deadline ?? t.CreatedAt)
                    .ToListAsync()
            };

            return View(vm);
        }

        [HttpGet]
        public async Task<IActionResult> GetAchievements()
        {
            int userId = GetUserId();
            if (userId == 0) return Unauthorized();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);

            var completedCount = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == 2)
                .CountAsync();

            var subjectCount = await _context.Subjects
                .Where(s => s.UserId == userId)
                .CountAsync();

            // Streak: consecutive days going back with ≥1 completed task (single query)
            var today = DateTime.Today;
            var lookbackStart = today.AddDays(-30);
            var completedDates = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == 2 &&
                            t.CompletedAt.HasValue && t.CompletedAt.Value >= lookbackStart)
                .Select(t => t.CompletedAt!.Value.Date)
                .Distinct()
                .ToListAsync();
            var completedDateSet = new HashSet<DateTime>(completedDates);
            int streak = 0;
            for (int i = 0; i < 30; i++)
            {
                var day = today.AddDays(-i);
                if (completedDateSet.Contains(day)) streak++;
                else if (i == 0) continue; // today may not be done yet
                else break;
            }

            var completedBeforeDeadline = await _context.Tasks
                .Where(t => t.UserId == userId && t.Status == 2 &&
                            t.Deadline.HasValue && t.CompletedAt.HasValue &&
                            t.CompletedAt <= t.Deadline)
                .CountAsync();

            var achievements = new object[]
            {
                new { id = 1, name = "Перша задача",           desc = "Виконай 1 задачу",              icon = "🎯", unlocked = completedCount >= 1,           progress = Math.Min(completedCount, 1),           total = 1  },
                new { id = 2, name = "На старті",              desc = "Виконай 5 задач",               icon = "🚀", unlocked = completedCount >= 5,           progress = Math.Min(completedCount, 5),           total = 5  },
                new { id = 3, name = "Десятка",                desc = "Виконай 10 задач",              icon = "💪", unlocked = completedCount >= 10,          progress = Math.Min(completedCount, 10),          total = 10 },
                new { id = 4, name = "Тиждень продуктивності", desc = "7 днів поспіль активності",    icon = "🔥", unlocked = streak >= 7,                  progress = Math.Min(streak, 7),                  total = 7  },
                new { id = 5, name = "Студент",                desc = "Додай 3 предмети",              icon = "📚", unlocked = subjectCount >= 3,             progress = Math.Min(subjectCount, 3),             total = 3  },
                new { id = 6, name = "Дедлайн-майстер",        desc = "Виконай 10 задач до дедлайну", icon = "⚡", unlocked = completedBeforeDeadline >= 10, progress = Math.Min(completedBeforeDeadline, 10), total = 10 },
            };

            return Ok(new
            {
                level = user?.Level ?? 1,
                xp = user?.ExperiencePoints ?? 0,
                xpInLevel = (user?.ExperiencePoints ?? 0) % 100,
                achievements
            });
        }
    }
}