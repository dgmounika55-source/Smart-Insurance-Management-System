using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<CustomerPolicy> CustomerPolicies => Set<CustomerPolicy>();
    public DbSet<Claim> Claims => Set<Claim>();
    public DbSet<ClaimDocument> ClaimDocuments => Set<ClaimDocument>();
    public DbSet<ClaimStatusHistory> ClaimStatusHistories => Set<ClaimStatusHistory>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<SupportTicket> SupportTickets => Set<SupportTicket>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.Entity<SupportTicket>()
            .HasKey(t => t.TicketId);

        builder.Entity<Customer>()
            .HasIndex(c => c.Email)
            .IsUnique();

        builder.Entity<Policy>()
            .HasIndex(p => p.PolicyNumber)
            .IsUnique();

        builder.Entity<CustomerPolicy>()
            .HasIndex(cp => cp.PolicyReference)
            .IsUnique();

        builder.Entity<CustomerPolicy>()
            .HasOne(cp => cp.Customer)
            .WithMany(c => c.CustomerPolicies)
            .HasForeignKey(cp => cp.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<CustomerPolicy>()
            .HasOne(cp => cp.Policy)
            .WithMany(p => p.CustomerPolicies)
            .HasForeignKey(cp => cp.PolicyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Claim>()
            .HasOne(c => c.Customer)
            .WithMany()
            .HasForeignKey(c => c.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Claim>()
            .HasOne(c => c.CustomerPolicy)
            .WithMany()
            .HasForeignKey(c => c.CustomerPolicyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Claim>()
            .HasIndex(c => c.ClaimNumber)
            .IsUnique();

        builder.Entity<ClaimDocument>()
            .HasOne(d => d.Claim)
            .WithMany(c => c.Documents)
            .HasForeignKey(d => d.ClaimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ClaimStatusHistory>()
            .HasOne(h => h.Claim)
            .WithMany(c => c.StatusHistory)
            .HasForeignKey(h => h.ClaimId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Notification>()
            .HasOne(n => n.Customer)
            .WithMany()
            .HasForeignKey(n => n.CustomerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Notification>()
            .HasOne(n => n.Claim)
            .WithMany()
            .HasForeignKey(n => n.ClaimId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Notification>()
            .Property(n => n.Title)
            .HasMaxLength(150)
            .IsRequired();

        builder.Entity<Notification>()
            .Property(n => n.Message)
            .HasMaxLength(500)
            .IsRequired();

        builder.Entity<Notification>()
            .Property(n => n.Type)
            .HasMaxLength(50)
            .IsRequired();

        builder.Entity<Notification>()
            .HasIndex(n => new { n.CustomerId, n.IsRead, n.CreatedAt });

        builder.Entity<Payment>()
            .HasIndex(p => p.TransactionReference)
            .IsUnique();

        builder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        builder.Entity<Payment>()
            .HasOne(p => p.Customer)
            .WithMany()
            .HasForeignKey(p => p.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Payment>()
            .HasOne(p => p.Policy)
            .WithMany()
            .HasForeignKey(p => p.PolicyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Payment>()
            .HasOne(p => p.CustomerPolicy)
            .WithMany()
            .HasForeignKey(p => p.CustomerPolicyId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Customer>()
            .Property(c => c.FullName)
            .HasMaxLength(150);

        builder.Entity<Customer>()
            .Property(c => c.Email)
            .HasMaxLength(256);

        builder.Entity<Policy>()
            .Property(p => p.PremiumAmount)
            .HasPrecision(18, 2);

        builder.Entity<Policy>()
            .Property(p => p.CoverageAmount)
            .HasPrecision(18, 2);
        builder.Entity<CustomerPolicy>().Property(cp => cp.PremiumAmount).HasPrecision(18, 2);
        builder.Entity<CustomerPolicy>().Property(cp => cp.CoverageAmount).HasPrecision(18, 2);


        builder.Entity<Claim>()
            .Property(c => c.ClaimAmount)
            .HasPrecision(18, 2);
    }
}

