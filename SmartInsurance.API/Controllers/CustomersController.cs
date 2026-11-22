using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,ClaimsManager")]
public class CustomersController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CustomersController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
    {
        var customers = await _context.Customers
            .Include(c => c.CustomerPolicies)
            .AsNoTracking()
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Customer>> GetCustomer(int id)
    {
        var customer = await _context.Customers
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.CustomerId == id);

        if (customer == null)
            return NotFound(new { message = "Customer not found." });

        return Ok(customer);
    }

    [HttpPost]
    public async Task<ActionResult<Customer>> CreateCustomer(Customer customer)
    {
        if (string.IsNullOrWhiteSpace(customer.FullName) ||
            customer.FullName.Trim().Length > 100 ||
            string.IsNullOrWhiteSpace(customer.Email) ||
            !new EmailAddressAttribute().IsValid(customer.Email.Trim()) ||
            customer.Email.Trim().Length > 256 ||
            customer.PhoneNumber?.Trim().Length > 20 ||
            customer.Address?.Trim().Length > 300)
        {
            return BadRequest(new { message = "Enter valid customer details. Check name, email, phone number and address lengths." });
        }

        var normalizedEmail = customer.Email.Trim().ToLowerInvariant();

        if (await _context.Customers.AnyAsync(c => c.Email.ToLower() == normalizedEmail))
            return Conflict(new { message = "A customer with this email already exists." });

        customer.FullName = customer.FullName.Trim();
        customer.Email = customer.Email.Trim();
        customer.PhoneNumber = customer.PhoneNumber?.Trim() ?? string.Empty;
        customer.Address = customer.Address?.Trim() ?? string.Empty;

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetCustomer),
            new { id = customer.CustomerId },
            customer);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCustomer(int id, Customer updatedCustomer)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
            return NotFound(new { message = "Customer not found." });

        if (string.IsNullOrWhiteSpace(updatedCustomer.FullName) ||
            updatedCustomer.FullName.Trim().Length > 100 ||
            string.IsNullOrWhiteSpace(updatedCustomer.Email) ||
            !new EmailAddressAttribute().IsValid(updatedCustomer.Email.Trim()) ||
            updatedCustomer.Email.Trim().Length > 256 ||
            updatedCustomer.PhoneNumber?.Trim().Length > 20 ||
            updatedCustomer.Address?.Trim().Length > 300)
        {
            return BadRequest(new { message = "Enter valid customer details." });
        }

        var normalizedEmail = updatedCustomer.Email.Trim().ToLowerInvariant();

        if (await _context.Customers.AnyAsync(c =>
            c.CustomerId != id && c.Email.ToLower() == normalizedEmail))
        {
            return Conflict(new { message = "A customer with this email already exists." });
        }

        customer.FullName = updatedCustomer.FullName.Trim();
        customer.Email = updatedCustomer.Email.Trim();
        customer.PhoneNumber = updatedCustomer.PhoneNumber?.Trim() ?? string.Empty;
        customer.Address = updatedCustomer.Address?.Trim() ?? string.Empty;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCustomer(int id)
    {
        var customer = await _context.Customers.FindAsync(id);

        if (customer == null)
            return NotFound(new { message = "Customer not found." });

        var hasPolicies = await _context.CustomerPolicies.AnyAsync(cp => cp.CustomerId == id);
        var hasClaims = await _context.Claims.AnyAsync(c => c.CustomerId == id);
        var hasPayments = await _context.Payments.AnyAsync(p => p.CustomerId == id);

        if (hasPolicies || hasClaims || hasPayments)
            return Conflict(new { message = "This customer has linked policies, claims or payments and cannot be deleted." });

        _context.Customers.Remove(customer);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}