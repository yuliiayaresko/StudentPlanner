using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace StudetPlanner.Controllers
{
    [AllowAnonymous]
    public class HomeController : Controller
    {
        [Authorize]
        public IActionResult Onboarding()
        {
            return View();
        }

        public IActionResult Index()
        {
            return View();
        }
    }
}

