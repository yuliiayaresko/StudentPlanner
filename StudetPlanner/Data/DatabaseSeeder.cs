/*
 * DATABASE SEEDER — Student Planner Test Data
 * =============================================
 *
 * Test account:
 *   Email:    demo@planner.dev
 *   Password: Test123!
 *
 * To reset data: visit /dev/reseed  (Development environment only)
 *
 * Data includes:
 *   - 5 subjects  (Математика, Програмування, Фізика, Англійська мова, Філософія)
 *   - 23 tasks spread across past, today, tomorrow, and next week
 *   - Tasks covering every status: Not started / In progress / Done
 *   - Tasks covering every urgency: overdue / urgent / soon / normal
 *   - Mix of important (priority=1) and normal tasks
 *   - 3 completed days in a row → streak = 3
 *
 * Expected dashboard state after seeding:
 *   Today summary  → 6 tasks today, 1 done, 1 in-progress
 *   Streak         → 3 days  (today + yesterday + 2 days ago)
 *   Urgency banner → overdue tasks visible (past 10:00 / 11:00 deadlines)
 *   XP bar         → Level 3 · 40/100 XP  (ExperiencePoints = 240)
 */

using Microsoft.AspNetCore.Identity;
using StudetPlanner.Models;

namespace StudetPlanner.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<User>>();
            var context     = serviceProvider.GetRequiredService<PlannerDbContext>();

            // ── Guard: skip if already seeded ────────────────────────────
            if (await userManager.FindByEmailAsync("demo@planner.dev") != null)
                return;

            // ── 1. CREATE TEST USER ──────────────────────────────────────
            //
            // ExperiencePoints = 240  →  240 / 100 + 1 = Level 3
            //                           240 % 100      = 40 XP in current level
            //   Displays as: "Рівень 3  ·  40/100 XP"
            //
            var user = new User
            {
                UserName              = "demo@planner.dev",
                Email                 = "demo@planner.dev",
                NormalizedUserName    = "DEMO@PLANNER.DEV",
                NormalizedEmail       = "DEMO@PLANNER.DEV",
                EmailConfirmed        = true,
                NameUser              = "Тест Студент",
                Level                 = 3,
                ExperiencePoints      = 240,
                IsOnboardingCompleted = true,
                CreatedAt             = DateTime.Now.AddDays(-30),
            };

            var createResult = await userManager.CreateAsync(user, "Test123!");
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"DatabaseSeeder: user creation failed — {errors}");
            }

            // ── 2. CREATE SUBJECTS ───────────────────────────────────────
            var subjects = new Subject[]
            {
                new() { Name = "Математика",      Description = "Математичний аналіз, алгебра",  UserId = user.Id },
                new() { Name = "Програмування",   Description = "C#, ASP.NET Core, бази даних",  UserId = user.Id },
                new() { Name = "Фізика",          Description = "Механіка, термодинаміка",        UserId = user.Id },
                new() { Name = "Англійська мова", Description = "Граматика, лексика, практика",   UserId = user.Id },
                new() { Name = "Філософія",       Description = "Історія філософії, логіка",      UserId = user.Id },
            };

            context.Subjects.AddRange(subjects);
            await context.SaveChangesAsync(); // subjects get their IDs here

            // Convenience aliases
            int math = subjects[0].Id;
            int prog = subjects[1].Id;
            int phys = subjects[2].Id;
            int eng  = subjects[3].Id;
            int phil = subjects[4].Id;

            // ── 3. CREATE TASKS ──────────────────────────────────────────
            var today      = DateTime.Today;
            var yesterday  = today.AddDays(-1);
            var twoDaysAgo = today.AddDays(-2);
            var tomorrow   = today.AddDays(1);
            var in2Days    = today.AddDays(2);
            var now        = DateTime.Now;

            var tasks = new TaskItem[]
            {
                // ════════════════════════════════════════════════════════
                //  TODAY  —  6 tasks total (1 done, 1 in-progress, 4 pending)
                //  Deadline filter: (t.deadline || t.createdAt).startsWith(today)
                // ════════════════════════════════════════════════════════

                // Important · Not started · deadline 14:00 today
                new()
                {
                    Title     = "Здати реферат з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddHours(14),
                    CreatedAt = now.AddDays(-2),
                },

                // Not started · OVERDUE (deadline 10:00 — past by the time you test)
                new()
                {
                    Title     = "Підготуватись до лекції з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddHours(10),
                    CreatedAt = now.AddDays(-1),
                },

                // Done  ← counts toward today's streak
                new()
                {
                    Title       = "Прочитати статтю про ASP.NET Core",
                    SubjectId   = prog, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = today.AddHours(9),
                    CreatedAt   = today,
                    CompletedAt = today.AddHours(9).AddMinutes(28),
                },

                // In progress · deadline 16:00
                new()
                {
                    Title     = "Виправити помилки в коді",
                    SubjectId = prog, UserId = user.Id,
                    Priority  = 0, Status = 1,
                    Deadline  = today.AddHours(16),
                    CreatedAt = today,
                },

                // Not started · evening deadline
                new()
                {
                    Title     = "Розв'язати задачі з інтегралів",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddHours(18),
                    CreatedAt = today,
                },

                // Not started · OVERDUE (deadline 11:00 — past by the time you test)
                new()
                {
                    Title     = "Підготуватись до лекції з іноземної",
                    SubjectId = eng, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddHours(11),
                    CreatedAt = today,
                },

                // ════════════════════════════════════════════════════════
                //  YESTERDAY  —  3 tasks (2 done, 1 missed)
                //  2 done tasks → yesterday counts in streak
                // ════════════════════════════════════════════════════════

                // Done · important
                new()
                {
                    Title       = "Лабораторна робота №3",
                    SubjectId   = phys, UserId = user.Id,
                    Priority    = 1, Status = 2,
                    Deadline    = yesterday.AddHours(15),
                    CreatedAt   = yesterday.AddDays(-1),
                    CompletedAt = yesterday.AddHours(14).AddMinutes(30),
                },

                // Done · normal
                new()
                {
                    Title       = "Переклад тексту",
                    SubjectId   = eng, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = yesterday.AddHours(12),
                    CreatedAt   = yesterday,
                    CompletedAt = yesterday.AddHours(11).AddMinutes(45),
                },

                // Not done · missed deadline
                new()
                {
                    Title     = "Конспект з філософії",
                    SubjectId = phil, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = yesterday.AddHours(18),
                    CreatedAt = yesterday,
                },

                // ════════════════════════════════════════════════════════
                //  2 DAYS AGO  —  2 tasks (both done)
                //  2 done tasks → 2 days ago counts in streak  →  streak = 3
                // ════════════════════════════════════════════════════════

                // Done · important
                new()
                {
                    Title       = "Тест з фізики",
                    SubjectId   = phys, UserId = user.Id,
                    Priority    = 1, Status = 2,
                    Deadline    = twoDaysAgo.AddHours(10),
                    CreatedAt   = twoDaysAgo,
                    CompletedAt = twoDaysAgo.AddHours(9).AddMinutes(50),
                },

                // Done · normal
                new()
                {
                    Title       = "Есе про Канта",
                    SubjectId   = phil, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = twoDaysAgo.AddHours(14),
                    CreatedAt   = twoDaysAgo,
                    CompletedAt = twoDaysAgo.AddHours(13).AddMinutes(30),
                },

                // ════════════════════════════════════════════════════════
                //  TOMORROW  —  3 tasks
                // ════════════════════════════════════════════════════════

                new()
                {
                    Title     = "Курсова робота — вступ",
                    SubjectId = prog, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = tomorrow.AddHours(12),
                    CreatedAt = today,
                },

                new()
                {
                    Title     = "Практика з фізики",
                    SubjectId = phys, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = tomorrow.AddHours(9),
                    CreatedAt = today,
                },

                new()
                {
                    Title     = "Словниковий запас — урок 5",
                    SubjectId = eng, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = tomorrow.AddHours(19),
                    CreatedAt = today,
                },

                // ════════════════════════════════════════════════════════
                //  IN 2 DAYS  —  2 tasks
                // ════════════════════════════════════════════════════════

                new()
                {
                    Title     = "Контрольна з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = in2Days.AddHours(11),
                    CreatedAt = today,
                },

                new()
                {
                    Title     = "Здати звіт з лабораторної",
                    SubjectId = phys, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = in2Days.AddHours(16),
                    CreatedAt = today,
                },

                // ════════════════════════════════════════════════════════
                //  NEXT WEEK  —  4 tasks (visible in week/month views)
                // ════════════════════════════════════════════════════════

                new()
                {
                    Title     = "Курсова робота — основна частина",
                    SubjectId = prog, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddDays(7).AddHours(12),
                    CreatedAt = today.AddDays(-5),
                },

                new()
                {
                    Title     = "Підготовка до екзамену з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddDays(8).AddHours(10),
                    CreatedAt = today,
                },

                new()
                {
                    Title     = "Реферат з філософії",
                    SubjectId = phil, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddDays(6).AddHours(15),
                    CreatedAt = today,
                },

                new()
                {
                    Title     = "Граматика — тема Future Perfect",
                    SubjectId = eng, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddDays(5).AddHours(18),
                    CreatedAt = today,
                },

                // ════════════════════════════════════════════════════════
                //  INBOX  — no deadline
                //  CreatedAt set to past days so they don't pollute the
                //  day view (JS filter: (deadline || createdAt).startsWith(date))
                // ════════════════════════════════════════════════════════

                new()
                {
                    Title     = "Купити зошит для конспектів",
                    SubjectId = null, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = null,
                    CreatedAt = today.AddDays(-5),
                },

                new()
                {
                    Title     = "Записатись на консультацію",
                    SubjectId = null, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = null,
                    CreatedAt = today.AddDays(-4),
                },

                new()
                {
                    Title     = "Переглянути відеолекції",
                    SubjectId = prog, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = null,
                    CreatedAt = today.AddDays(-3),
                },
            };

            context.Tasks.AddRange(tasks);
            await context.SaveChangesAsync();
        }
    }
}
