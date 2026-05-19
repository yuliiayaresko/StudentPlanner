-- ═══════════════════════════════════════════════════════════════
--  SEED TEST DATA — Student Planner
--  Запускати в SSMS після того як вручну зареєстрував акаунт
--  через форму реєстрації на сайті.
-- ═══════════════════════════════════════════════════════════════

USE StudentPlannerDB;
GO

-- 1. Знайди свій UserId
SELECT Id, UserName, Email FROM AspNetUsers;
GO

-- 2. Заміни значення нижче на свій Id з таблиці вище
DECLARE @UserId INT = 1;  -- <-- змінити якщо потрібно

-- 3. Позначити онбординг як пройдений
UPDATE AspNetUsers
SET IsOnboardingCompleted = 1, Level = 3, ExperiencePoints = 240
WHERE Id = @UserId;

-- 4. Предмети
INSERT INTO Subjects (Name, Description, UserId) VALUES
    (N'Математика',    N'Математичний аналіз, алгебра',    @UserId),
    (N'Програмування', N'C#, ASP.NET, бази даних',         @UserId),
    (N'Фізика',        N'Механіка, термодинаміка',          @UserId),
    (N'Англійська',    N'Граматика, лексика, практика',     @UserId),
    (N'Філософія',     N'Історія філософії, логіка',        @UserId);

DECLARE @Math   INT = SCOPE_IDENTITY() - 4;
DECLARE @Prog   INT = SCOPE_IDENTITY() - 3;
DECLARE @Phys   INT = SCOPE_IDENTITY() - 2;
DECLARE @Eng    INT = SCOPE_IDENTITY() - 1;
DECLARE @Phil   INT = SCOPE_IDENTITY();

DECLARE @Now DATETIME = GETDATE();

-- 5. Задачі — сьогодні
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Підготуватись до лекції з математики',  NULL, DATEADD(hour,  10, CAST(CAST(@Now AS DATE) AS DATETIME)), 1, 0, @Now, NULL, @Math, @UserId),
    (N'Розв''язати задачі з інтегралів',        NULL, DATEADD(hour,  14, CAST(CAST(@Now AS DATE) AS DATETIME)), 0, 1, @Now, NULL, @Math, @UserId),
    (N'Написати лабораторну роботу з C#',      NULL, DATEADD(hour,  16, CAST(CAST(@Now AS DATE) AS DATETIME)), 1, 0, @Now, NULL, @Prog, @UserId),
    (N'Прочитати статтю про ASP.NET Core',     NULL, DATEADD(hour,   9, CAST(CAST(@Now AS DATE) AS DATETIME)), 0, 2, @Now, DATEADD(hour,-2,@Now), @Prog, @UserId),
    (N'Повторити слова з теми Travel',         NULL, NULL,                                                     0, 2, @Now, DATEADD(hour,-1,@Now), @Eng,  @UserId);

-- 6. Задачі — завтра
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Підготовка до семінару з фізики',       NULL, DATEADD(day,1,DATEADD(hour,11,CAST(CAST(@Now AS DATE) AS DATETIME))), 1, 0, @Now, NULL, @Phys, @UserId),
    (N'Вивчити нові слова (Unit 8)',           NULL, DATEADD(day,1,DATEADD(hour,15,CAST(CAST(@Now AS DATE) AS DATETIME))), 0, 0, @Now, NULL, @Eng,  @UserId),
    (N'Прочитати параграф 5 з термодинаміки', NULL, DATEADD(day,1,DATEADD(hour,20,CAST(CAST(@Now AS DATE) AS DATETIME))), 0, 0, @Now, NULL, @Phys, @UserId);

-- 7. Задачі — через 2 дні
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Есе з філософії — Декарт і раціоналізм',N'Обсяг 3-4 сторінки, APA стиль', DATEADD(day,2,DATEADD(hour,12,CAST(CAST(@Now AS DATE) AS DATETIME))), 1, 0, @Now, NULL, @Phil, @UserId),
    (N'Контрольна з фізики — термодинаміка',  NULL, DATEADD(day,2,DATEADD(hour,10,CAST(CAST(@Now AS DATE) AS DATETIME))), 1, 0, @Now, NULL, @Phys, @UserId);

-- 8. Прострочені задачі
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Здати реферат з математики',            NULL, DATEADD(hour,-26,@Now), 1, 0, DATEADD(day,-3,@Now), NULL, @Math, @UserId),
    (N'Виправити помилки в коді (PR)',         NULL, DATEADD(hour,-2, @Now), 0, 0, DATEADD(day,-1,@Now), NULL, @Prog, @UserId);

-- 9. Виконані задачі (вчора / позавчора)
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Прочитати розділ 3 підручника',         NULL, NULL,                          0, 2, DATEADD(day,-2,@Now), DATEADD(hour,-3,DATEADD(day,-2,@Now)), @Eng,  @UserId),
    (N'Здати домашнє завдання з алгебри',      NULL, DATEADD(hour,-30,@Now),        0, 2, DATEADD(day,-3,@Now), DATEADD(day,-2,@Now),                  @Math, @UserId),
    (N'Пройти тест на Coursera',               NULL, NULL,                          0, 2, DATEADD(day,-1,@Now), DATEADD(hour,-2,DATEADD(day,-1,@Now)), @Prog, @UserId);

-- 10. Задачі — наступний тиждень
INSERT INTO Tasks (Title, Description, Deadline, Priority, Status, CreatedAt, CompletedAt, SubjectId, UserId) VALUES
    (N'Іспит з англійської мови',             NULL, DATEADD(day,5,DATEADD(hour,10,CAST(CAST(@Now AS DATE) AS DATETIME))), 1, 0, @Now, NULL, @Eng,  @UserId),
    (N'Курсова робота — фінальна версія',     N'Перевірити список літератури і форматування', DATEADD(day,7,@Now), 1, 1, DATEADD(day,-5,@Now), NULL, @Prog, @UserId),
    (N'Презентація з філософії',              NULL, DATEADD(day,6,DATEADD(hour,14,CAST(CAST(@Now AS DATE) AS DATETIME))), 0, 0, @Now, NULL, @Phil, @UserId);

SELECT N'✓ Тестові дані успішно додано!' AS Result;
GO
