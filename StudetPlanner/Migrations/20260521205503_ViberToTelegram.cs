using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudetPlanner.Migrations
{
    /// <inheritdoc />
    public partial class ViberToTelegram : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ViberNotifications",
                table: "AspNetUsers",
                newName: "TelegramNotifications");

            migrationBuilder.RenameColumn(
                name: "ViberId",
                table: "AspNetUsers",
                newName: "TelegramConnectCode");

            migrationBuilder.RenameColumn(
                name: "ViberConnectCodeExpiry",
                table: "AspNetUsers",
                newName: "TelegramConnectCodeExpiry");

            migrationBuilder.RenameColumn(
                name: "ViberConnectCode",
                table: "AspNetUsers",
                newName: "TelegramChatId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "TelegramNotifications",
                table: "AspNetUsers",
                newName: "ViberNotifications");

            migrationBuilder.RenameColumn(
                name: "TelegramConnectCodeExpiry",
                table: "AspNetUsers",
                newName: "ViberConnectCodeExpiry");

            migrationBuilder.RenameColumn(
                name: "TelegramConnectCode",
                table: "AspNetUsers",
                newName: "ViberId");

            migrationBuilder.RenameColumn(
                name: "TelegramChatId",
                table: "AspNetUsers",
                newName: "ViberConnectCode");
        }
    }
}
