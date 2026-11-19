using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.DTOs;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/account")]
[Authorize]
public class AccountController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _context;

    public AccountController(
        UserManager<ApplicationUser> userManager,
        ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var user = await _userManager.FindByIdAsync(userId ?? "");

        if (user == null) return NotFound(new { message = "User not found." });

        var roles = await _userManager.GetRolesAsync(user);
        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == user.Email);

        return Ok(new
        {
            fullName = user.FullName,
            email = user.Email,
            phoneNumber = user.PhoneNumber,
            address = customer?.Address,
            role = roles.FirstOrDefault() ?? "User"
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile(UpdateProfileRequest request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var user = await _userManager.FindByIdAsync(userId ?? "");

        if (user == null) return NotFound(new { message = "User not found." });

        user.FullName = request.FullName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber)
            ? null : request.PhoneNumber.Trim();

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == user.Email);

        if (customer != null)
        {
            customer.FullName = user.FullName;
            customer.PhoneNumber = user.PhoneNumber;
            customer.Address = request.Address?.Trim();
            await _context.SaveChangesAsync();
        }

        return Ok(new { message = "Profile updated successfully." });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword(ChangePasswordRequest request)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        var user = await _userManager.FindByIdAsync(userId ?? "");

        if (user == null) return NotFound(new { message = "User not found." });

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors.Select(e => e.Description) });

        return Ok(new { message = "Password changed successfully. Please log in again." });
    }
}
