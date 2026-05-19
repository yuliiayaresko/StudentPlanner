using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StudetPlanner.Data;
using StudetPlanner.Models;

namespace StudetPlanner.Controllers
{
    /// <summary>
    /// Development-only utilities. All endpoints are disabled in Production.
    /// </summary>
    [Route("dev")]
    public class DevController : Controller
    {
        private readonly IWebHostEnvironment _env;

        public DevController(IWebHostEnvironment env)
        {
            _env = env;
        }

        // GET /dev/reseed
        // Deletes the test user + all their data, then re-seeds fresh test data.
        [HttpGet("reseed")]
        public async Task<IActionResult> Reseed()
        {
            if (!_env.IsDevelopment())
                return NotFound();

            var userManager = HttpContext.RequestServices.GetRequiredService<UserManager<User>>();
            var context     = HttpContext.RequestServices.GetRequiredService<PlannerDbContext>();

            var existingUser = await userManager.FindByEmailAsync("demo@planner.dev");

            if (existingUser != null)
            {
                int uid = existingUser.Id;

                // Delete in FK-safe order (NoAction relationships must be cleared manually)
                await context.Rewards
                    .Where(r => r.UserId == uid)
                    .ExecuteDeleteAsync();

                await context.UserAchievements
                    .Where(ua => ua.UserId == uid)
                    .ExecuteDeleteAsync();

                // Tasks cascade-delete when Subject is deleted, but Subject cascade
                // does NOT cover Tasks that have no Subject (null SubjectId).
                // Delete orphan tasks first, then subjects (which cascade the rest).
                await context.Tasks
                    .Where(t => t.UserId == uid)
                    .ExecuteDeleteAsync();

                // Subjects cascade-delete their tasks via FK, but we already removed
                // tasks above — safe to delete subjects now.
                await context.Subjects
                    .Where(s => s.UserId == uid)
                    .ExecuteDeleteAsync();

                await userManager.DeleteAsync(existingUser);
            }

            await DatabaseSeeder.SeedAsync(HttpContext.RequestServices);

            return Redirect("/Identity/Account/Login");
        }
    }
}
