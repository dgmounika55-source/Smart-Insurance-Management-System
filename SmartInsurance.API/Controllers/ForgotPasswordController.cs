using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using SmartInsurance.API.DTOs;
using SmartInsurance.API.Interfaces;
using SmartInsurance.API.Models;
using System.Net;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/account")]
[AllowAnonymous]
public class ForgotPasswordController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ForgotPasswordController> _logger;

    public ForgotPasswordController(
        UserManager<ApplicationUser> userManager,
        IEmailService emailService,
        IConfiguration configuration,
        ILogger<ForgotPasswordController> logger)
    {
        _userManager = userManager;
        _emailService = emailService;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest request)
    {
        const string responseMessage =
            "If an account exists for this email, password reset instructions will be sent.";

        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
            return Ok(new { message = responseMessage });

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);

        var frontendUrl = _configuration["Frontend:BaseUrl"];

        if (string.IsNullOrWhiteSpace(frontendUrl))
        {
            _logger.LogError("Frontend:BaseUrl is not configured.");
            return StatusCode(500, new { message = "Password reset is temporarily unavailable." });
        }

        var resetUrl = $"{frontendUrl.TrimEnd('/')}/reset-password" +
            $"?email={Uri.EscapeDataString(user.Email!)}" +
            $"&token={Uri.EscapeDataString(token)}";

        var htmlMessage = $"""
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;">
                <h2 style="color:#3978FF;">InsureFlow Password Reset</h2>
                <p>We received a request to reset your InsureFlow account password.</p>
                <p>
                    <a href="{WebUtility.HtmlEncode(resetUrl)}"
                       style="display:inline-block;background:#3978FF;color:white;
                       padding:12px 22px;text-decoration:none;border-radius:6px;">
                       Reset Password
                    </a>
                </p>
                <p>If you did not request this, you can safely ignore this email.</p>
                <p>This reset link is time-limited and can only be used once.</p>
                <p>Regards,<br/>InsureFlow Team</p>
            </div>
            """;

        try
        {
            await _emailService.SendEmailAsync(
                user.Email!,
                "InsureFlow - Password Reset",
                htmlMessage);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unable to send password reset email.");
            return StatusCode(503, new
            {
                message = "Password reset email could not be sent. Please try again later."
            });
        }

        return Ok(new { message = responseMessage });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);

        if (user == null)
            return BadRequest(new { message = "Invalid or expired password reset link." });

        var result = await _userManager.ResetPasswordAsync(
            user,
            request.Token,
            request.NewPassword);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Password reset failed. The link may be invalid or expired.",
                errors = result.Errors.Select(error => error.Description)
            });
        }

        return Ok(new { message = "Password reset successfully. Please log in with your new password." });
    }
}
