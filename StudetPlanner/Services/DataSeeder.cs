using Microsoft.AspNetCore.Identity;
using StudetPlanner.Models;

namespace StudetPlanner.Services
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var userManager = services.GetRequiredService<UserManager<User>>();
            var context = services.GetRequiredService<PlannerDbContext>();

            if (userManager.Users.Any()) return;

            var user = new User
            {
                UserName = "test@student.com",
                Email = "test@student.com",
                NormalizedUserName = "TEST@STUDENT.COM",
                NormalizedEmail = "TEST@STUDENT.COM",
                EmailConfirmed = true,
                NameUser = "Тест Студент",
                Level = 3,
                ExperiencePoints = 240,
                IsOnboardingCompleted = true,
                CreatedAt = DateTime.Now
            };

            var result = await userManager.CreateAsync(user, "Test1234!");
            if (!result.Succeeded) return;

            var subjects = new[]
            {
                new Subject { Name = "Математика",     Description = "Математичний аналіз, алгебра", UserId = user.Id },
                new Subject { Name = "Програмування",  Description = "C#, ASP.NET, бази даних",      UserId = user.Id },
                new Subject { Name = "Фізика",         Description = "Механіка, термодинаміка",       UserId = user.Id },
                new Subject { Name = "Англійська",     Description = "Граматика, лексика, практика",  UserId = user.Id },
                new Subject { Name = "Філософія",      Description = "Історія філософії, логіка",     UserId = user.Id },
            };
            context.Subjects.AddRange(subjects);
            await context.SaveChangesAsync();

            var now = DateTime.Now;
            var tasks = new[]
            {
                new TaskItem { Title = "Підготуватись до лекції з математики",    SubjectId = subjects[0].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.Date.AddHours(10),  CreatedAt = now },
                new TaskItem { Title = "Розв'язати задачі з інтегралів",           SubjectId = subjects[0].Id, UserId = user.Id, Priority = 0, Status = 1, Deadline = now.Date.AddHours(14),  CreatedAt = now },
                new TaskItem { Title = "Написати лабораторну роботу з C#",        SubjectId = subjects[1].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.Date.AddHours(16),  CreatedAt = now },
                new TaskItem { Title = "Прочитати статтю про ASP.NET Core",       SubjectId = subjects[1].Id, UserId = user.Id, Priority = 0, Status = 2, Deadline = now.Date.AddHours(9),   CreatedAt = now, CompletedAt = now.AddHours(-2) },
                new TaskItem { Title = "Повторити слова з теми Travel",           SubjectId = subjects[3].Id, UserId = user.Id, Priority = 0, Status = 2, CreatedAt = now,                   CompletedAt = now.AddHours(-1) },

                new TaskItem { Title = "Підготовка до семінару з фізики",         SubjectId = subjects[2].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.Date.AddDays(1).AddHours(11), CreatedAt = now },
                new TaskItem { Title = "Вивчити нові слова (Unit 8)",             SubjectId = subjects[3].Id, UserId = user.Id, Priority = 0, Status = 0, Deadline = now.Date.AddDays(1).AddHours(15), CreatedAt = now },
                new TaskItem { Title = "Прочитати параграф 5 з термодинаміки",   SubjectId = subjects[2].Id, UserId = user.Id, Priority = 0, Status = 0, Deadline = now.Date.AddDays(1).AddHours(20), CreatedAt = now },

                new TaskItem { Title = "Есе з філософії — Декарт і раціоналізм", SubjectId = subjects[4].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.Date.AddDays(2).AddHours(12), CreatedAt = now },
                new TaskItem { Title = "Контрольна з фізики — термодинаміка",    SubjectId = subjects[2].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.Date.AddDays(2).AddHours(10), CreatedAt = now },

                new TaskItem { Title = "Здати реферат з математики",              SubjectId = subjects[0].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.AddHours(-26),       CreatedAt = now.AddDays(-3) },
                new TaskItem { Title = "Виправити помилки в коді (PR)",           SubjectId = subjects[1].Id, UserId = user.Id, Priority = 0, Status = 0, Deadline = now.AddHours(-2),        CreatedAt = now.AddDays(-1) },

                new TaskItem { Title = "Прочитати розділ 3 підручника",           SubjectId = subjects[3].Id, UserId = user.Id, Priority = 0, Status = 2, CreatedAt = now.AddDays(-2), CompletedAt = now.AddDays(-2).AddHours(3) },
                new TaskItem { Title = "Здати домашнє завдання з алгебри",        SubjectId = subjects[0].Id, UserId = user.Id, Priority = 0, Status = 2, Deadline = now.AddDays(-2).AddHours(18), CreatedAt = now.AddDays(-3), CompletedAt = now.AddDays(-2) },
                new TaskItem { Title = "Пройти тест на Coursera",                 SubjectId = subjects[1].Id, UserId = user.Id, Priority = 0, Status = 2, CreatedAt = now.AddDays(-1), CompletedAt = now.AddDays(-1).AddHours(2) },

                new TaskItem { Title = "Іспит з англійської мови",               SubjectId = subjects[3].Id, UserId = user.Id, Priority = 1, Status = 0, Deadline = now.AddDays(5).AddHours(10),  CreatedAt = now },
                new TaskItem { Title = "Курсова робота — фінальна версія",        SubjectId = subjects[1].Id, UserId = user.Id, Priority = 1, Status = 1, Deadline = now.AddDays(7),               CreatedAt = now.AddDays(-5) },
                new TaskItem { Title = "Презентація з філософії",                 SubjectId = subjects[4].Id, UserId = user.Id, Priority = 0, Status = 0, Deadline = now.AddDays(6).AddHours(14),  CreatedAt = now },
            };

            context.Tasks.AddRange(tasks);
            await context.SaveChangesAsync();
        }
    }
}
