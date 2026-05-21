using Microsoft.EntityFrameworkCore;
using StudetPlanner.Services;

namespace StudetPlanner.Services
{
    public class DeadlineNotificationService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<DeadlineNotificationService> _logger;

        public DeadlineNotificationService(IServiceProvider serviceProvider, ILogger<DeadlineNotificationService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("DeadlineNotificationService started.");
            while (!stoppingToken.IsCancellationRequested)
            {
                try { await CheckAndSendNotificationsAsync(); }
                catch (Exception ex) { _logger.LogError(ex, "DeadlineNotificationService error."); }
                await Task.Delay(TimeSpan.FromMinutes(15), stoppingToken);
            }
        }

        private async Task CheckAndSendNotificationsAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<PlannerDbContext>();
            var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();

            var now = DateTime.Now;
            var tasks = await context.Tasks
                .Include(t => t.Subject)
                .Include(t => t.User)
                .Where(t =>
                    t.User != null &&
                    t.User.TelegramChatId != null &&
                    t.User.TelegramNotifications &&
                    t.Status != 2 &&
                    t.Deadline.HasValue)
                .ToListAsync();

            bool anyChanged = false;
            foreach (var task in tasks)
            {
                if (task.User?.TelegramChatId == null) continue;
                var diff = task.Deadline!.Value - now;
                bool changed = false;

                if (!task.Notified24h && diff.TotalHours >= 23 && diff.TotalHours <= 25)
                {
                    await telegram.SendDeadlineReminderAsync(task.User.TelegramChatId, task, "близько 24 годин");
                    task.Notified24h = true; changed = true;
                }
                if (!task.Notified3h && diff.TotalHours >= 2 && diff.TotalHours <= 4)
                {
                    await telegram.SendDeadlineReminderAsync(task.User.TelegramChatId, task, "менше 3 годин");
                    task.Notified3h = true; changed = true;
                }
                if (!task.NotifiedOverdue && diff.TotalMinutes >= -30 && diff.TotalMinutes < 0)
                {
                    await telegram.SendOverdueReminderAsync(task.User.TelegramChatId, task);
                    task.NotifiedOverdue = true; changed = true;
                }

                if (changed) { context.Tasks.Update(task); anyChanged = true; }
            }

            if (anyChanged) await context.SaveChangesAsync();
        }
    }
}
