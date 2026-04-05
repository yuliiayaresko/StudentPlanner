using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using StudetPlanner.Models;

namespace StudetPlanner.Controllers
{
    [AllowAnonymous]
    public class HomeController : Controller
    {
        private readonly UserManager<User> _userManager;

        public HomeController(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        public IActionResult Index()
        {
            return View();
        }

        [Authorize]
        public async Task<IActionResult> Onboarding()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user == null) return RedirectToAction("Index");

            if (user.IsOnboardingCompleted)
                return RedirectToAction("Index", "Dashboard");

            return View();
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult> OnboardingComplete()
        {
            var user = await _userManager.GetUserAsync(User);
            if (user != null)
            {
                user.IsOnboardingCompleted = true;
                await _userManager.UpdateAsync(user);
            }
            return RedirectToAction("Index", "Dashboard");
        }
    }
}