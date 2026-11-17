using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public NotificationsController(ApplicationDbContext context)
    {
        _context = context;
    }

    private async Task<int?> GetCurrentCustomerId()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                    ?? User.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
            return null;

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);

        return customer?.CustomerId;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var customerId = await GetCurrentCustomerId();

        if (!customerId.HasValue)
            return Unauthorized();

        var notifications = await _context.Notifications
            .Where(n => n.CustomerId == customerId.Value)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                n.NotificationId,
                n.ClaimId,
                n.Title,
                n.Message,
                n.Type,
                n.IsRead,
                n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var customerId = await GetCurrentCustomerId();

        if (!customerId.HasValue)
            return Unauthorized();

        var count = await _context.Notifications
            .CountAsync(n =>
                n.CustomerId == customerId.Value && !n.IsRead);

        return Ok(new { unreadCount = count });
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkAsRead(int id)
    {
        var customerId = await GetCurrentCustomerId();

        if (!customerId.HasValue)
            return Unauthorized();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n =>
                n.NotificationId == id &&
                n.CustomerId == customerId.Value);

        if (notification == null)
            return NotFound(new { message = "Notification not found." });

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Notification marked as read." });
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var customerId = await GetCurrentCustomerId();

        if (!customerId.HasValue)
            return Unauthorized();

        var notifications = await _context.Notifications
            .Where(n =>
                n.CustomerId == customerId.Value && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
            notification.IsRead = true;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "All notifications marked as read."
        });
    }
}