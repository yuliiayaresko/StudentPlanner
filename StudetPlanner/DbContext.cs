using StudetPlanner.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace StudetPlanner
{
    public class PlannerDbContext : DbContext
    {
        public PlannerDbContext(DbContextOptions<PlannerDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }

        public DbSet<Subject> Subjects { get; set; }

        public DbSet<TaskItem> Tasks { get; set; }

        public DbSet<Achievement> Achievements { get; set; }

        public DbSet<UserAchievement> UserAchievements { get; set; }

        public DbSet<Reward> Rewards { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TaskItem>()
                .HasOne(t => t.Subject)
                .WithMany(s => s.Tasks)
                .HasForeignKey(t => t.SubjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Reward>()
          .HasOne(t => t.User)
          .WithMany(u => u.Rewards)
          .HasForeignKey(t => t.UserId)
          .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<TaskItem>()
        .HasOne(t => t.User)
        .WithMany(u => u.Tasks)
        .HasForeignKey(t => t.UserId)
        .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Subject>()
                .HasOne(s => s.User)
                .WithMany(u => u.Subjects)
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
