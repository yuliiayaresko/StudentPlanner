using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudetPlanner.Migrations
{
    /// <inheritdoc />
    public partial class AddIsOnboardingCompleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
       name: "IsOnboardingCompleted",
       table: "AspNetUsers",
       type: "bit",
       nullable: false,
       defaultValue: false);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
        name: "IsOnboardingCompleted",
        table: "AspNetUsers");
        }
    }
}
