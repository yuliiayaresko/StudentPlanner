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

            if (await userManager.FindByEmailAsync("demo@planner.dev") != null)
                return;

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

            var subjects = new Subject[]
            {
                new() { Name = "Математика",      Description = "Математичний аналіз, алгебра",  UserId = user.Id },
                new() { Name = "Програмування",   Description = "C#, ASP.NET Core, бази даних",  UserId = user.Id },
                new() { Name = "Фізика",          Description = "Механіка, термодинаміка",        UserId = user.Id },
                new() { Name = "Англійська мова", Description = "Граматика, лексика, практика",   UserId = user.Id },
                new() { Name = "Філософія",       Description = "Історія філософії, логіка",      UserId = user.Id },
            };

            context.Subjects.AddRange(subjects);
            await context.SaveChangesAsync();

            int math = subjects[0].Id;
            int prog = subjects[1].Id;
            int phys = subjects[2].Id;
            int eng  = subjects[3].Id;
            int phil = subjects[4].Id;

            var today      = DateTime.Today;
            var yesterday  = today.AddDays(-1);
            var twoDaysAgo = today.AddDays(-2);
            var tomorrow   = today.AddDays(1);
            var in2Days    = today.AddDays(2);
            var now        = DateTime.Now;

            var tasks = new TaskItem[]
            {
                new()
                {
                    Title     = "Здати реферат з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddHours(14),
                    CreatedAt = now.AddDays(-2),
                },
                new()
                {
                    Title     = "Підготуватись до лекції з математики",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 1, Status = 0,
                    Deadline  = today.AddHours(10),
                    CreatedAt = now.AddDays(-1),
                },
                new()
                {
                    Title       = "Прочитати статтю про ASP.NET Core",
                    SubjectId   = prog, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = today.AddHours(9),
                    CreatedAt   = today,
                    CompletedAt = today.AddHours(9).AddMinutes(28),
                },
                new()
                {
                    Title     = "Виправити помилки в коді",
                    SubjectId = prog, UserId = user.Id,
                    Priority  = 0, Status = 1,
                    Deadline  = today.AddHours(16),
                    CreatedAt = today,
                },
                new()
                {
                    Title     = "Розв'язати задачі з інтегралів",
                    SubjectId = math, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddHours(18),
                    CreatedAt = today,
                },
                new()
                {
                    Title     = "Підготуватись до лекції з іноземної",
                    SubjectId = eng, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = today.AddHours(11),
                    CreatedAt = today,
                },
                new()
                {
                    Title       = "Лабораторна робота №3",
                    SubjectId   = phys, UserId = user.Id,
                    Priority    = 1, Status = 2,
                    Deadline    = yesterday.AddHours(15),
                    CreatedAt   = yesterday.AddDays(-1),
                    CompletedAt = yesterday.AddHours(14).AddMinutes(30),
                },
                new()
                {
                    Title       = "Переклад тексту",
                    SubjectId   = eng, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = yesterday.AddHours(12),
                    CreatedAt   = yesterday,
                    CompletedAt = yesterday.AddHours(11).AddMinutes(45),
                },
                new()
                {
                    Title     = "Конспект з філософії",
                    SubjectId = phil, UserId = user.Id,
                    Priority  = 0, Status = 0,
                    Deadline  = yesterday.AddHours(18),
                    CreatedAt = yesterday,
                },
                new()
                {
                    Title       = "Тест з фізики",
                    SubjectId   = phys, UserId = user.Id,
                    Priority    = 1, Status = 2,
                    Deadline    = twoDaysAgo.AddHours(10),
                    CreatedAt   = twoDaysAgo,
                    CompletedAt = twoDaysAgo.AddHours(9).AddMinutes(50),
                },
                new()
                {
                    Title       = "Есе про Канта",
                    SubjectId   = phil, UserId = user.Id,
                    Priority    = 0, Status = 2,
                    Deadline    = twoDaysAgo.AddHours(14),
                    CreatedAt   = twoDaysAgo,
                    CompletedAt = twoDaysAgo.AddHours(13).AddMinutes(30),
                },
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
