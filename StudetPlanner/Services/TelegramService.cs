using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using StudetPlanner.Models;

namespace StudetPlanner.Services
{
    public interface ITelegramService
    {
        Task SendMessageAsync(string chatId, string message);
        Task SendDeadlineReminderAsync(string chatId, TaskItem task, string timeLeft);
        Task SendOverdueReminderAsync(string chatId, TaskItem task);
        Task<List<TelegramUpdate>> GetUpdatesAsync(long offset = 0);
    }

    public class TelegramService : ITelegramService
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<TelegramService> _logger;
        private readonly string _token;
        private string ApiUrl => $"https://api.telegram.org/bot{_token}";

        public TelegramService(HttpClient httpClient, IConfiguration configuration, ILogger<TelegramService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _token = configuration["TelegramSettings:BotToken"] ?? "";
        }

        public async Task SendMessageAsync(string chatId, string message)
        {
            if (string.IsNullOrEmpty(_token)) { _logger.LogWarning("TelegramService: BotToken not configured."); return; }
            var payload = new { chat_id = chatId, text = message, parse_mode = "HTML" };
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            try
            {
                var res = await _httpClient.PostAsync($"{ApiUrl}/sendMessage", content);
                if (!res.IsSuccessStatusCode)
                    _logger.LogWarning("TelegramService: sendMessage failed. Status={Status}", res.StatusCode);
            }
            catch (Exception ex) { _logger.LogError(ex, "TelegramService: exception sending to {ChatId}", chatId); }
        }

        public async Task<List<TelegramUpdate>> GetUpdatesAsync(long offset = 0)
        {
            if (string.IsNullOrEmpty(_token)) return new();
            try
            {
                var res = await _httpClient.GetAsync($"{ApiUrl}/getUpdates?offset={offset}&timeout=5&limit=100");
                if (!res.IsSuccessStatusCode) return new();
                var json = await res.Content.ReadAsStringAsync();
                var response = JsonSerializer.Deserialize<TelegramResponse<List<TelegramUpdate>>>(json);
                return response?.Result ?? new();
            }
            catch (Exception ex) { _logger.LogError(ex, "TelegramService: exception in getUpdates"); return new(); }
        }

        public async Task SendDeadlineReminderAsync(string chatId, TaskItem task, string timeLeft)
        {
            var subject = task.Subject?.Name ?? "Без предмету";
            var deadline = task.Deadline.HasValue ? task.Deadline.Value.ToString("dd.MM.yyyy HH:mm") : "—";
            var msg = $"<b>🔔 Нагадування про дедлайн</b>\n\n" +
                      $"📌 <b>{task.Title}</b>\n" +
                      $"📚 {subject}\n" +
                      $"⏰ Дедлайн: {deadline}\n" +
                      $"⌛ Залишилось: <b>{timeLeft}</b>\n\n" +
                      $"Відкрий Student Planner щоб переглянути деталі.";
            await SendMessageAsync(chatId, msg);
        }

        public async Task SendOverdueReminderAsync(string chatId, TaskItem task)
        {
            var subject = task.Subject?.Name ?? "Без предмету";
            var deadline = task.Deadline.HasValue ? task.Deadline.Value.ToString("dd.MM.yyyy HH:mm") : "—";
            var msg = $"<b>❗ Дедлайн прострочено!</b>\n\n" +
                      $"📌 <b>{task.Title}</b>\n" +
                      $"📚 {subject}\n" +
                      $"⏰ Дедлайн був: {deadline}\n\n" +
                      $"Не забудь завершити задачу!";
            await SendMessageAsync(chatId, msg);
        }
    }

    public class TelegramResponse<T>
    {
        [JsonPropertyName("ok")] public bool Ok { get; set; }
        [JsonPropertyName("result")] public T? Result { get; set; }
    }

    public class TelegramUpdate
    {
        [JsonPropertyName("update_id")] public long UpdateId { get; set; }
        [JsonPropertyName("message")] public TelegramMessage? Message { get; set; }
    }

    public class TelegramMessage
    {
        [JsonPropertyName("chat")] public TelegramChat? Chat { get; set; }
        [JsonPropertyName("text")] public string? Text { get; set; }
        [JsonPropertyName("from")] public TelegramUser? From { get; set; }
    }

    public class TelegramChat
    {
        [JsonPropertyName("id")] public long Id { get; set; }
    }

    public class TelegramUser
    {
        [JsonPropertyName("first_name")] public string? FirstName { get; set; }
        [JsonPropertyName("username")] public string? Username { get; set; }
    }
}
