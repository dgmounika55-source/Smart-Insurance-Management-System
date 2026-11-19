using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[Authorize(Roles = "Customer")]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PaymentsController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMyPayments()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                    ?? User.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Customer identity not found." });

        var payments = await _context.Payments
            .Include(p => p.Policy)
            .Include(p => p.CustomerPolicy)
            .Where(p => p.Customer != null && p.Customer.Email == email)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.PaymentId,
                p.TransactionReference,
                PolicyName = p.Policy != null ? p.Policy.PolicyName : "Unknown Policy",
                p.Amount,
                p.PaymentMethod,
                p.Status,
                p.CreatedAt,
                p.PaidAt,
                PolicyReference = p.CustomerPolicy != null
                    ? p.CustomerPolicy.PolicyReference
                    : null
            })
            .ToListAsync();

        return Ok(payments);
    }
    [HttpPost("create")]
    public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized(new { message = "Customer identity not found." });

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.Email == email);

        if (customer == null)
            return NotFound(new { message = "Customer profile not found." });

        var policy = await _context.Policies
            .FirstOrDefaultAsync(p => p.PolicyId == request.PolicyId);

        if (policy == null || policy.Status != "Active")
            return BadRequest(new { message = "This policy is unavailable." });

        var alreadyOwned = await _context.CustomerPolicies
            .AnyAsync(cp =>
                cp.CustomerId == customer.CustomerId &&
                cp.PolicyId == policy.PolicyId &&
                cp.Status == "Active" &&
                cp.EndDate >= DateTime.UtcNow.Date);

        if (alreadyOwned)
            return Conflict(new
            {
                message = "You already have an active policy of this type."
            });

        var payment = new Payment
        {
            CustomerId = customer.CustomerId,
            PolicyId = policy.PolicyId,
            TransactionReference = $"PAY-{Guid.NewGuid():N}".ToUpper(),
            Amount = policy.PremiumAmount,
            PaymentMethod = "Development Simulator",
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payment session created.",
            paymentId = payment.PaymentId,
            transactionReference = payment.TransactionReference,
            policyName = policy.PolicyName,
            amount = payment.Amount,
            currency = "INR",
            status = payment.Status
        });
    }

    [HttpPost("complete")]
    public async Task<IActionResult> CompletePayment(
        [FromBody] CompletePaymentRequest request)
    {
        var email = User.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(email))
            return Unauthorized();

        var payment = await _context.Payments
            .Include(p => p.Customer)
            .Include(p => p.Policy)
            .FirstOrDefaultAsync(p => p.PaymentId == request.PaymentId);

        if (payment == null)
            return NotFound(new { message = "Payment transaction not found." });

        if (payment.Customer?.Email != email)
            return Forbid();

        if (payment.Status == "Paid")
        {
            return Ok(new
            {
                message = "Payment was already completed.",
                status = payment.Status,
                transactionReference = payment.TransactionReference,
                policyReference = payment.CustomerPolicy?.PolicyReference
            });
        }

        if (payment.Status != "Pending")
            return BadRequest(new { message = "This payment cannot be processed again." });

        if (!request.Success)
        {
            payment.Status = "Failed";
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Payment failed. Your policy has not been activated.",
                status = payment.Status
            });
        }

        if (payment.Policy == null || payment.Policy.Status != "Active")
            return BadRequest(new { message = "The selected policy is no longer available." });

        var alreadyOwned = await _context.CustomerPolicies
            .AnyAsync(cp =>
                cp.CustomerId == payment.CustomerId &&
                cp.PolicyId == payment.PolicyId &&
                cp.Status == "Active" &&
                cp.EndDate >= DateTime.UtcNow.Date);

        if (alreadyOwned)
            return Conflict(new
            {
                message = "You already have an active policy of this type. This payment cannot activate another one."
            });

        await using var transaction = await _context.Database.BeginTransactionAsync();

        try
        {
            var today = DateTime.UtcNow.Date;

            var customerPolicy = new CustomerPolicy
            {
                CustomerId = payment.CustomerId,
                PolicyId = payment.PolicyId,
                PolicyReference = $"CP-{Guid.NewGuid():N}".Substring(0, 11).ToUpper(),
                PurchaseDate = DateTime.UtcNow,
                StartDate = today,
                EndDate = today.AddMonths(payment.Policy.DurationMonths),
                Status = "Active"
            };

            _context.CustomerPolicies.Add(customerPolicy);
            await _context.SaveChangesAsync();

            payment.CustomerPolicyId = customerPolicy.CustomerPolicyId;
            payment.Status = "Paid";
            payment.PaidAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Ok(new
            {
                message = "Payment successful! Your insurance policy is now active.",
                status = payment.Status,
                transactionReference = payment.TransactionReference,
                policyReference = customerPolicy.PolicyReference
            });
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}

public class CreatePaymentRequest
{
    public int PolicyId { get; set; }
}

public class CompletePaymentRequest
{
    public int PaymentId { get; set; }
    public bool Success { get; set; }
}
