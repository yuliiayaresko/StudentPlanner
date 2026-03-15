using Microsoft.EntityFrameworkCore;
using StudetPlanner;

var builder = WebApplication.CreateBuilder(args);

// Додаємо підтримку MVC з представленнями
builder.Services.AddControllersWithViews();

builder.Services.AddEndpointsApiExplorer();


builder.Services.AddDbContext<PlannerDbContext>(options =>
options.UseSqlServer(
builder.Configuration.GetConnectionString("DefaultConnection")
));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
    policy =>
    {
        policy.AllowAnyOrigin()
    .AllowAnyHeader()
    .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors("AllowAll");

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

// Маршрути для MVC-сторінок
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Маршрути для API-контролерів
app.MapControllers();

app.Run();
