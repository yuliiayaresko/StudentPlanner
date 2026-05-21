# Viber Bot Setup — Student Planner

## 1. Створити Viber Bot
1. Перейди на https://partners.viber.com
2. Увійди через свій Viber акаунт
3. Натисни "Create Bot Account"
4. Заповни назву та опис (наприклад: "Student Planner")
5. Скопіюй **AUTH_TOKEN** (він показується одразу після створення)

## 2. Налаштувати проект
В `appsettings.json` заміни:
```json
"ViberSettings": {
  "AuthToken": "твій_токен_сюди",
  "BotName": "Student Planner",
  "WebhookUrl": "https://твій-домен.com/api/viber/webhook"
}
```

## 3. Зареєструвати webhook
Сервер повинен бути доступний публічно (для локальної розробки використай ngrok):

```bash
# Встанови ngrok: https://ngrok.com
ngrok http 7212

# Скопіюй https URL (наприклад: https://abc123.ngrok.io)
# Встанови його як WebhookUrl в appsettings.json
```

Після запуску додатку викличи один раз:
```
POST https://localhost:7212/api/viber/register-webhook
```
(тільки в Development середовищі)

## 4. Застосувати міграцію БД
```bash
Add-Migration AddViberAndNotificationFields
Update-Database
```

## 5. Підключити Viber в додатку
1. Увійди в Student Planner
2. Натисни шестерню (Налаштування) в бічній панелі
3. Натисни "Підключити Viber" — з'явиться 6-значний код
4. Відкрий Viber, знайди свого бота за назвою
5. Надішли код боту
6. Бот підтвердить підключення

## 6. Коли надходять сповіщення
- **За 24 години** до дедлайну
- **За 3 години** до дедлайну
- **Одразу після** прострочення (в межах 30 хвилин)

Перевірка відбувається кожні **15 хвилин** у фоновому режимі.

## Тестування локально
1. Запусти `ngrok http 7212`
2. Встанови ngrok URL в `WebhookUrl`
3. Виклич `POST /api/viber/register-webhook`
4. Відкрий бота у Viber і надішли будь-яке повідомлення
5. Перевір логи — має з'явитися запит від Viber
