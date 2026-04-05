using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using StudetPlanner.Models;
using System.Security.Claims;

namespace StudetPlanner.Controllers
{
    [Authorize]
    public class TasksController : Controller
    {
        private readonly PlannerDbContext _context;

        public TasksController(PlannerDbContext context)
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
            var tasks = await _context.Tasks
                .Where(t => t.UserId == userId)
                .Include(t => t.Subject)
                .OrderBy(t => t.Deadline ?? t.CreatedAt)
                .ToListAsync();
            return View(tasks);
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var taskItem = await _context.Tasks
                .Include(t => t.Subject)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (taskItem == null) return NotFound();
            return View(taskItem);
        }

        public IActionResult Create(string? Title = null)
        {
            int userId = GetUserId();
            ViewBag.Subjects = new SelectList(
                _context.Subjects.Where(s => s.UserId == userId).ToList(), "Id", "Name");
            return View(new TaskItem { UserId = userId, Title = Title });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(TaskItem taskItem)
        {
            taskItem.UserId = GetUserId();
            taskItem.CreatedAt = DateTime.Now;
            ModelState.Remove("User");
            ModelState.Remove("Subject");
            ModelState.Remove("Rewards");

            if (ModelState.IsValid)
            {
                _context.Add(taskItem);
                await _context.SaveChangesAsync();
                return RedirectToAction("Index", "Dashboard");
            }
            int userId = GetUserId();
            ViewBag.Subjects = new SelectList(
                _context.Subjects.Where(s => s.UserId == userId).ToList(), "Id", "Name");
            return View(taskItem);
        }

        // ── AJAX ──────────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> CreateAjax([FromBody] TaskCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest(new { error = "Назва не може бути порожньою" });

            int userId = GetUserId();
            var task = new TaskItem
            {
                Title = dto.Title.Trim(),
                Description = dto.Description,
                Deadline = dto.Deadline,
                Priority = dto.Priority,
                Status = 0,
                SubjectId = dto.SubjectId > 0 ? dto.SubjectId : null,
                UserId = userId,
                CreatedAt = DateTime.Now
            };

            _context.Add(task);
            await _context.SaveChangesAsync();

            string? subjectName = null;
            if (task.SubjectId.HasValue)
                subjectName = (await _context.Subjects.FindAsync(task.SubjectId.Value))?.Name;

            return Ok(new
            {
                id = task.Id,
                title = task.Title,
                deadline = task.Deadline?.ToString("yyyy-MM-ddTHH:mm"),
                createdAt = task.CreatedAt.ToString("yyyy-MM-ddTHH:mm"),
                subjectId = task.SubjectId,
                subjectName = subjectName,
                priority = task.Priority
            });
        }

        [HttpPut]
        public async Task<IActionResult> UpdateAjax(int id, [FromBody] TaskUpdateDto dto)
        {
            int userId = GetUserId();
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null) return NotFound();

            task.Title = dto.Title?.Trim() ?? task.Title;
            task.Description = dto.Description;
            task.Deadline = dto.Deadline;
            task.Priority = dto.Priority;
            task.Status = dto.Status;
            task.SubjectId = dto.SubjectId > 0 ? dto.SubjectId : null;
            if (dto.Status == 2 && task.CompletedAt == null) task.CompletedAt = DateTime.Now;
            if (dto.Status != 2) task.CompletedAt = null;

            await _context.SaveChangesAsync();

            string? subjectName = null;
            if (task.SubjectId.HasValue)
                subjectName = (await _context.Subjects.FindAsync(task.SubjectId.Value))?.Name;

            return Ok(new
            {
                id = task.Id,
                title = task.Title,
                description = task.Description,
                deadline = task.Deadline?.ToString("yyyy-MM-ddTHH:mm"),
                createdAt = task.CreatedAt.ToString("yyyy-MM-ddTHH:mm"),
                subjectId = task.SubjectId,
                subjectName,
                priority = task.Priority,
                status = task.Status
            });
        }

        [HttpDelete]
        public async Task<IActionResult> DeleteAjax(int id)
        {
            int userId = GetUserId();
            var task = await _context.Tasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (task == null) return NotFound();
            _context.Tasks.Remove(task);
            await _context.SaveChangesAsync();
            return Ok();
        }
        // ─────────────────────────────────────────────────────────────────────

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var taskItem = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (taskItem == null) return NotFound();
            ViewBag.Subjects = new SelectList(
                _context.Subjects.Where(s => s.UserId == userId).ToList(),
                "Id", "Name", taskItem.SubjectId);
            return View(taskItem);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, TaskItem taskItem)
        {
            if (id != taskItem.Id) return NotFound();
            taskItem.UserId = GetUserId();
            ModelState.Remove("User");
            ModelState.Remove("Subject");
            ModelState.Remove("Rewards");

            if (ModelState.IsValid)
            {
                try { _context.Update(taskItem); await _context.SaveChangesAsync(); }
                catch (DbUpdateConcurrencyException)
                { if (!TaskItemExists(taskItem.Id)) return NotFound(); else throw; }
                return RedirectToAction("Index", "Dashboard");
            }
            int userId = GetUserId();
            ViewBag.Subjects = new SelectList(
                _context.Subjects.Where(s => s.UserId == userId).ToList(),
                "Id", "Name", taskItem.SubjectId);
            return View(taskItem);
        }

        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var taskItem = await _context.Tasks.Include(t => t.Subject)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (taskItem == null) return NotFound();
            return View(taskItem);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            int userId = GetUserId();
            var taskItem = await _context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
            if (taskItem != null) { _context.Tasks.Remove(taskItem); await _context.SaveChangesAsync(); }
            return RedirectToAction("Index", "Dashboard");
        }

        private bool TaskItemExists(int id) => _context.Tasks.Any(e => e.Id == id);
    }


    public class TaskCreateDto
    {
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public int Priority { get; set; } = 0;
        public int? SubjectId { get; set; }
    }

    public class TaskUpdateDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public DateTime? Deadline { get; set; }
        public int Priority { get; set; }
        public int Status { get; set; }
        public int? SubjectId { get; set; }
    }
}
