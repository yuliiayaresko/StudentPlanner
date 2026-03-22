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

        public async Task<IActionResult> Index()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdClaim, out int userId))
                return Unauthorized();

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
    }
}