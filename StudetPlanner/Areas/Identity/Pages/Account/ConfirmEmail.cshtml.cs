// Licensed to the .NET Foundation under one or more agreements.
// The .NET Foundation licenses this file to you under the MIT license.
#nullable disable

using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.WebUtilities;
using StudetPlanner.Models;

namespace StudetPlanner.Areas.Identity.Pages.Account
{
    public class ConfirmEmailModel : PageModel
    {
        private readonly UserManager<User> _userManager;

        public ConfirmEmailModel(UserManager<User> userManager)
        {
            _userManager = userManager;
        }

        [TempData]
        public string StatusMessage { get; set; }

        public async Task<IActionResult> OnGetAsync(string userId, string code)
        {
            if (userId == null || code == null)
                return RedirectToPage("/Index");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound($"Unable to load user with ID '{userId}'.");

            code = Encoding.UTF8.GetString(WebEncoders.Base64UrlDecode(code));
            var result = await _userManager.ConfirmEmailAsync(user, code);

            if (result.Succeeded)
            {
                // Перший раз після реєстрації — на Onboarding
                // Наступні рази (якщо вже проходив) — на Dashboard
                if (user.IsOnboardingCompleted)
                    return RedirectToAction("Index", "Dashboard");
                else
                    return RedirectToAction("Onboarding", "Home");
            }

            // Якщо помилка — показуємо сторінку з повідомленням
            StatusMessage = "Помилка підтвердження email. Спробуй ще раз.";
            return Page();
        }
    }
}