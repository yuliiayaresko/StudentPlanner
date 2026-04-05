using Microsoft.AspNetCore.Identity.UI.Services;
using System.Net;
using System.Net.Mail;

namespace StudetPlanner.Services
{
    public class EmailSender : IEmailSender
    {
        private readonly IConfiguration _config;

        public EmailSender(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string email, string subject, string htmlMessage)
        {
            var settings = _config.GetSection("EmailSettings");
            var client = new SmtpClient(settings["Host"])
            {
                Port = int.Parse(settings["Port"]!),
                Credentials = new NetworkCredential(settings["Email"], settings["Password"]),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(settings["Email"]!, "Student Planner"),
                Subject = subject,
                Body = htmlMessage,
                IsBodyHtml = true
            };
            mail.To.Add(email);

            await client.SendMailAsync(mail);
        }
    }
}