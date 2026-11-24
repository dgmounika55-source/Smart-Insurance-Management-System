using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartInsurance.API.Data;
using SmartInsurance.API.DTOs;
using SmartInsurance.API.Models;
using SmartInsurance.API.Interfaces;
using JwtClaim = System.Security.Claims.Claim;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context,
        IConfiguration configuration,
        IEmailService emailService)
    {
        _userManager = userManager;
        _context = context;
        _configuration = configuration;
        _emailService = emailService;
    }

    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "All fields are required." });
        }

        if (!string.Equals(request.Role, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(new { message = "Public registration is available for customers only." });
        }

        var email = request.Email.Trim();

        if (await _context.Customers.AnyAsync(c => c.Email == email))
            return BadRequest(new { message = "A customer with this email already exists." });

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            FullName = request.FullName.Trim(),
            EmailConfirmed = false
        };

        var result = await _userManager.CreateAsync(user, request.Password);

        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                errors = result.Errors.Select(e => e.Description)
            });
        }

        var roleResult = await _userManager.AddToRoleAsync(user, "Customer");

        if (!roleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return StatusCode(500, new { message = "Could not assign customer role." });
        }

        try
        {
            var customer = new Customer
            {
                FullName = user.FullName,
                Email = email
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }
        catch
        {
            await _userManager.DeleteAsync(user);
            return StatusCode(500, new { message = "Could not create customer profile." });
        }

        try
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var frontendUrl = _configuration["Frontend:BaseUrl"]?.TrimEnd('/');

            if (string.IsNullOrWhiteSpace(frontendUrl))
                throw new InvalidOperationException("Frontend URL is not configured.");

            var verificationUrl = $"{frontendUrl}/verify-email?userId={Uri.EscapeDataString(user.Id)}&token={Uri.EscapeDataString(token)}";
            var safeUrl = System.Net.WebUtility.HtmlEncode(verificationUrl);

            var emailBody = $@"
                <h2>Welcome to InsureFlow!</h2>
                <p>Hello {System.Net.WebUtility.HtmlEncode(user.FullName)},</p>
                <p>Please verify your email address by clicking below:</p>
                <p><a href='{safeUrl}'>Verify Email Address</a></p>
                <p>If you did not create this account, you can ignore this email.</p>";

            await _emailService.SendEmailAsync(
                email,
                "Verify your InsureFlow account",
                emailBody);
        }
        catch
        {
            return StatusCode(503, new
            {
                message = "Your account was created, but the verification email could not be sent. Please request a new verification email."
            });
        }

        return Ok(new
        {
            message = "Registration successful. Please check your email and verify your account before logging in."
        });
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var user = await _userManager.FindByEmailAsync(request.Email.Trim());

        if (user == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return StatusCode(423, new { message = "Account temporarily locked. Please try again after 15 minutes." });
        }

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
        {
            await _userManager.AccessFailedAsync(user);

            if (await _userManager.IsLockedOutAsync(user))
            {
                return StatusCode(423, new { message = "Too many failed attempts. Account locked for 15 minutes." });
            }

            return Unauthorized(new { message = "Invalid email or password." });
        }

        await _userManager.ResetAccessFailedCountAsync(user);

        if (!user.EmailConfirmed)
        {
            return StatusCode(403, new
            {
                message = "Please verify your email address before logging in."
            });
        }

        var roles = await _userManager.GetRolesAsync(user);

        if (roles.Count == 0)
            return StatusCode(403, new { message = "No role is assigned to this account." });

        var key = _configuration["Jwt:Key"];
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        if (string.IsNullOrWhiteSpace(key) ||
            string.IsNullOrWhiteSpace(issuer) ||
            string.IsNullOrWhiteSpace(audience))
        {
            return StatusCode(500, new { message = "Authentication configuration is incomplete." });
        }

        var expiresAt = DateTime.UtcNow.AddMinutes(30);

        var claims = new List<JwtClaim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? ""),
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? ""),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        claims.AddRange(roles.Select(role => new JwtClaim(ClaimTypes.Role, role)));

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));

        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials);

        return Ok(new AuthResponse
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            Email = user.Email ?? "",
            FullName = user.FullName,
            Role = roles.FirstOrDefault() ?? "Customer",
            ExpiresAt = expiresAt
        });
    }

    [AllowAnonymous]
    [HttpPost("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.UserId) ||
            string.IsNullOrWhiteSpace(request.Token))
        {
            return BadRequest(new { message = "Verification link is invalid." });
        }

        var user = await _userManager.FindByIdAsync(request.UserId);

        if (user == null)
            return BadRequest(new { message = "Verification link is invalid or expired." });

        if (user.EmailConfirmed)
            return Ok(new { message = "Your email is already verified. You can log in." });

        var result = await _userManager.ConfirmEmailAsync(user, request.Token);

        if (!result.Succeeded)
            return BadRequest(new { message = "Verification link is invalid or expired." });

        return Ok(new { message = "Email verified successfully. You can now log in." });
    }}

public class ConfirmEmailRequest
{
    public string UserId { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
}