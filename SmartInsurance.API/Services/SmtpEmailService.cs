using System.Net;
using System.Net.Mail;
using SmartInsurance.API.Interfaces;

namespace SmartInsurance.API.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public SmtpEmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlMessage)
    {
        var host = _configuration["EmailSettings:SmtpHost"];
        var port = _configuration.GetValue<int>("EmailSettings:SmtpPort");
        var senderEmail = _configuration["EmailSettings:SenderEmail"];
        var senderName = _configuration["EmailSettings:SenderName"];
        var username = _configuration["EmailSettings:Username"];
        var password = _configuration["EmailSettings:Password"];

        if (string.IsNullOrWhiteSpace(host) ||
            string.IsNullOrWhiteSpace(senderEmail) ||
            string.IsNullOrWhiteSpace(username) ||
            string.IsNullOrWhiteSpace(password) ||
            port <= 0)
        {
            throw new InvalidOperationException("Email service is not configured.");
        }

        using var message = new MailMessage
        {
            From = new MailAddress(senderEmail, senderName ?? "InsureFlow"),
            Subject = subject,
            Body = htmlMessage,
            IsBodyHtml = true
        };

        message.To.Add(to);

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = true,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(username.Trim(), password.Trim())
        };

        await client.SendMailAsync(message);
    }
}
