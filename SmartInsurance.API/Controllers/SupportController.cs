using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer,Admin,ClaimsManager")]
public class SupportController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public SupportController(ApplicationDbContext context)
    {
        _context = context;
    }

    private string? CurrentUserId =>
        User.FindFirstValue(ClaimTypes.NameIdentifier) ??
        User.FindFirstValue("sub");

    private bool IsAdmin => User.IsInRole("Admin");

    [HttpGet]
    public async Task<IActionResult> GetTickets()
    {
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var query = _context.SupportTickets.AsNoTracking();

        if (!IsAdmin)
            query = query.Where(t => t.UserId == userId);

        var tickets = await query
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetTicket(int id)
    {
        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var ticket = await _context.SupportTickets
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
            return NotFound(new { message = "Support ticket not found." });

        if (!IsAdmin && ticket.UserId != userId)
            return Forbid();

        return Ok(ticket);
    }

    [HttpPost]
    [Authorize(Roles = "Customer,ClaimsManager")]
    public async Task<IActionResult> CreateTicket(CreateSupportTicketRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var userId = CurrentUserId;

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound(new { message = "User account not found." });

        var role = User.FindFirstValue(ClaimTypes.Role) ?? "Customer";

        var allowedCategories = new[]
        {
            "General",
            "Policy",
            "Claims",
            "Payments",
            "Technical",
            "Account"
        };

        var allowedPriorities = new[]
        {
            "Low",
            "Medium",
            "High",
            "Urgent"
        };

        if (!allowedCategories.Contains(request.Category, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid support category." });

        if (!allowedPriorities.Contains(request.Priority, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid priority." });

        var ticket = new SupportTicket
        {
            UserId = user.Id,
            UserName = string.IsNullOrWhiteSpace(user.FullName)
                ? user.UserName ?? "User"
                : user.FullName,
            UserRole = role,
            Subject = request.Subject.Trim(),
            Category = request.Category.Trim(),
            Priority = request.Priority.Trim(),
            Description = request.Description.Trim(),
            Status = "Open",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.SupportTickets.Add(ticket);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetTicket),
            new { id = ticket.TicketId },
            ticket);
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateTicketStatus(
        int id,
        UpdateSupportTicketRequest request)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var ticket = await _context.SupportTickets
            .FirstOrDefaultAsync(t => t.TicketId == id);

        if (ticket == null)
            return NotFound(new { message = "Support ticket not found." });

        var allowedStatuses = new[]
        {
            "Open",
            "InProgress",
            "Resolved",
            "Closed"
        };

        if (!allowedStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid ticket status." });

        ticket.Status = request.Status.Equals(
            "InProgress", StringComparison.OrdinalIgnoreCase)
            ? "InProgress"
            : allowedStatuses.First(s =>
                s.Equals(request.Status, StringComparison.OrdinalIgnoreCase));

        if (request.AdminResponse != null)
            ticket.AdminResponse = request.AdminResponse.Trim();

        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(ticket);
    }
}

public class CreateSupportTicketRequest
{
    [Required]
    [StringLength(120, MinimumLength = 3)]
    public string Subject { get; set; } = string.Empty;

    [Required]
    public string Category { get; set; } = string.Empty;

    [Required]
    public string Priority { get; set; } = "Medium";

    [Required]
    [StringLength(2000, MinimumLength = 10)]
    public string Description { get; set; } = string.Empty;
}

public class UpdateSupportTicketRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? AdminResponse { get; set; }
}
