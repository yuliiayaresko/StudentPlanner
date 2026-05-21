using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using StudetPlanner.Models;

namespace StudetPlanner.Controllers
{
    [Authorize]
    [Route("Settings")]
    public class SettingsController : Controller
    {
        private readonly UserManager<User> _userManager;
        private readonly PlannerDbContext _context;

        public SettingsController(UserManager<User> userManager, PlannerDbContext context)
        {
            _userManager = userManager;
            _context = context;
        }

        [HttpPost("GenerateTelegramCode")]
        public async Task<IActionResult> GenerateTelegramCode()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            var code = new Random().Next(100000, 999999).ToString();
            user.TelegramConnectCode = code;
            user.TelegramConnectCodeExpiry = DateTime.Now.AddMinutes(10);
            await _context.SaveChangesAsync();

            return Json(new { code, expiry = "10 хвилин", expiresAt = user.TelegramConnectCodeExpiry.Value.ToString("HH:mm") });
        }

        [HttpPost("DisconnectTelegram")]
        public async Task<IActionResult> DisconnectTelegram()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            user.TelegramChatId = null;
            user.TelegramNotifications = false;
            user.TelegramConnectCode = null;
            user.TelegramConnectCodeExpiry = null;
            await _context.SaveChangesAsync();

            return Json(new { success = true });
        }

        [HttpGet("GetTelegramStatus")]
        public async Task<IActionResult> GetTelegramStatus()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return Unauthorized();

            return Json(new { connected = !string.IsNullOrEmpty(user.TelegramChatId), notifications = user.TelegramNotifications });
        }
    }
}
