using Microsoft.EntityFrameworkCore;
using StudetPlanner.Services;

namespace StudetPlanner.Services
{
    public class TelegramPollingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<TelegramPollingService> _logger;
        private long _offset = 0;

        public TelegramPollingService(IServiceProvider serviceProvider, ILogger<TelegramPollingService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("TelegramPollingService started.");
            while (!stoppingToken.IsCancellationRequested)
            {
                try { await ProcessUpdatesAsync(); }
                catch (Exception ex) { _logger.LogError(ex, "TelegramPollingService error."); }
                await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);
            }
        }

        private async Task ProcessUpdatesAsync()
        {
            using var scope = _serviceProvider.CreateScope();
            var telegram = scope.ServiceProvider.GetRequiredService<ITelegramService>();
            var context = scope.ServiceProvider.GetRequiredService<PlannerDbContext>();

            var updates = await telegram.GetUpdatesAsync(_offset);
            foreach (var update in updates)
            {
                _offset = update.UpdateId + 1;
                var msg = update.Message;
                if (msg?.Text == null || msg.Chat == null) continue;

                var chatId = msg.Chat.Id.ToString();
                var text = msg.Text.Trim();

                if (System.Text.RegularExpressions.Regex.IsMatch(text, @"^\d{6}$"))
                {
                    var user = await context.Users.FirstOrDefaultAsync(u =>
                        u.TelegramConnectCode == text &&
                        u.TelegramConnectCodeExpiry.HasValue &&
                        u.TelegramConnectCodeExpiry.Value > DateTime.Now);

                    if (user != null)
                    {
                        user.TelegramChatId = chatId;
                        user.TelegramNotifications = true;
                        user.TelegramConnectCode = null;
                        user.TelegramConnectCodeExpiry = null;
                        await context.SaveChangesAsync();

                        await telegram.SendMessageAsync(chatId,
                            "✅ <b>Акаунт підключено!</b>\n\n" +
                            "Тепер ти будеш отримувати нагадування:\n" +
                            "• За 24 години до дедлайну\n" +
                            "• За 3 години до дедлайну\n" +
                            "• При простроченні\n\n" +
                            "Удачі в навчанні! 🎓");
                    }
                    else
                    {
                        await telegram.SendMessageAsync(chatId,
                            "❌ Код невірний або застарів.\nОтримай новий код в налаштуваннях Student Planner.");
                    }
                }
                else
                {
                    await telegram.SendMessageAsync(chatId,
                        "👋 Привіт! Це <b>Student Planner Bot</b>.\n\n" +
                        "Щоб отримувати сповіщення про дедлайни:\n" +
                        "1. Відкрий Student Planner\n" +
                        "2. Натисни «Підключити Telegram» в налаштуваннях\n" +
                        "3. Надішли сюди 6-значний код");
                }
            }
        }
    }
}
