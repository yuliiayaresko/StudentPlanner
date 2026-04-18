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
        [Authorize]
        public IActionResult Onboarding()
        {
            return View();
        }

        [Authorize]
        [HttpPost]
        [ValidateAntiForgeryToken]
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

        public IActionResult Index()
        {
            return View();
        }

        
        
    }
}