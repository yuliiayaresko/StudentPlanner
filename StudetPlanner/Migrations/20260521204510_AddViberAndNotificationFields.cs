using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace StudetPlanner.Migrations
{
    /// <inheritdoc />
    public partial class AddViberAndNotificationFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Notified24h",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "Notified3h",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "NotifiedOverdue",
                table: "Tasks",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ViberConnectCode",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ViberConnectCodeExpiry",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ViberId",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ViberNotifications",
                table: "AspNetUsers",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Notified24h",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "Notified3h",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "NotifiedOverdue",
                table: "Tasks");

            migrationBuilder.DropColumn(
                name: "ViberConnectCode",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ViberConnectCodeExpiry",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ViberId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "ViberNotifications",
                table: "AspNetUsers");
        }
    }
}
