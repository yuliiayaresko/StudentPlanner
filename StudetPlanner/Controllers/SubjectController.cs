using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using StudetPlanner.Models;
using System.Security.Claims;

namespace StudetPlanner.Controllers
{
    [Authorize]
    public class SubjectController : Controller
    {
        private readonly PlannerDbContext _context;

        public SubjectController(PlannerDbContext context)
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
            var subjects = await _context.Subjects
                .Where(s => s.UserId == userId)
                .ToListAsync();
            return View(subjects);
        }

        public async Task<IActionResult> Details(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var subject = await _context.Subjects
                .Include(s => s.Tasks)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (subject == null) return NotFound();
            return View(subject);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Subject subject)
        {
            subject.UserId = GetUserId();
            ModelState.Remove("User");
            ModelState.Remove("Tasks");

            if (ModelState.IsValid)
            {
                _context.Add(subject);
                await _context.SaveChangesAsync();
                return RedirectToAction("Index", "Dashboard");
            }
            return View(subject);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> CreateAjax([FromBody] SubjectCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest(new { error = "Назва не може бути порожньою" });

            int userId = GetUserId();
            var subject = new Subject
            {
                Name = dto.Name.Trim(),
                Description = dto.Description,
                UserId = userId
            };

            _context.Add(subject);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = subject.Id,
                name = subject.Name,
                description = subject.Description
            });
        }

        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subject == null) return NotFound();
            return View(subject);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, Subject subject)
        {
            if (id != subject.Id) return NotFound();
            subject.UserId = GetUserId();
            ModelState.Remove("User");
            ModelState.Remove("Tasks");

            if (ModelState.IsValid)
            {
                try
                {
                    _context.Update(subject);
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException)
                {
                    if (!SubjectExists(subject.Id)) return NotFound();
                    else throw;
                }
                return RedirectToAction(nameof(Index));
            }
            return View(subject);
        }

        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null) return NotFound();
            int userId = GetUserId();
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (subject == null) return NotFound();
            return View(subject);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            int userId = GetUserId();
            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subject != null)
            {
                _context.Subjects.Remove(subject);
                await _context.SaveChangesAsync();
            }
            return RedirectToAction(nameof(Index));
        }

        [HttpGet]
        public async Task<IActionResult> GetDetailsAjax(int id)
        {
            int userId = GetUserId();
            var subject = await _context.Subjects
                .Include(s => s.Tasks)
                .FirstOrDefaultAsync(m => m.Id == id && m.UserId == userId);
            if (subject == null) return NotFound();

            return Ok(new
            {
                id = subject.Id,
                name = subject.Name,
                description = subject.Description,
                tasks = (subject.Tasks ?? new List<TaskItem>()).Select(t => new
                {
                    id = t.Id,
                    title = t.Title,
                    status = t.Status,
                    priority = t.Priority,
                    deadline = t.Deadline.HasValue ? t.Deadline.Value.ToString("yyyy-MM-ddTHH:mm") : (string?)null
                })
            });
        }

        [HttpPut]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> UpdateAjax(int id, [FromBody] SubjectCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name)) return BadRequest(new { error = "Назва не може бути порожньою" });
            int userId = GetUserId();
            var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subject == null) return NotFound();
            subject.Name = dto.Name.Trim();
            subject.Description = dto.Description;
            await _context.SaveChangesAsync();
            return Ok(new { id = subject.Id, name = subject.Name, description = subject.Description });
        }

        [HttpDelete]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteAjax(int id)
        {
            int userId = GetUserId();
            var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);
            if (subject == null) return NotFound();
            _context.Subjects.Remove(subject);
            await _context.SaveChangesAsync();
            return Ok();
        }

        private bool SubjectExists(int id)
        {
            int userId = GetUserId();
            return _context.Subjects.Any(e => e.Id == id && e.UserId == userId);
        }
    }

    public class SubjectCreateDto
    {
        public string Name { get; set; } = "";
        public string? Description { get; set; }
    }
}
