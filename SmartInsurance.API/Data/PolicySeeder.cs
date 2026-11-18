using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Data;

public static class PolicySeeder
{
    public static async Task SeedPoliciesAsync(ApplicationDbContext context)
    {
        if (await context.Policies.AnyAsync())
            return;

        var today = DateTime.UtcNow.Date;

        var policies = new List<Policy>
        {
            new Policy
            {
                PolicyNumber = "INS-HEALTH-001",
                PolicyName = "Health Secure Plus",
                PolicyType = "Health",
                PremiumAmount = 12000m,
                CoverageAmount = 500000m,
                StartDate = today,
                EndDate = today.AddYears(1),
                DurationMonths = 12,
                Status = "Active"
            },
            new Policy
            {
                PolicyNumber = "INS-LIFE-001",
                PolicyName = "Life Protection Plan",
                PolicyType = "Life",
                PremiumAmount = 15000m,
                CoverageAmount = 1000000m,
                StartDate = today,
                EndDate = today.AddYears(1),
                DurationMonths = 12,
                Status = "Active"
            },
            new Policy
            {
                PolicyNumber = "INS-MOTOR-001",
                PolicyName = "Motor Care Insurance",
                PolicyType = "Motor",
                PremiumAmount = 8000m,
                CoverageAmount = 300000m,
                StartDate = today,
                EndDate = today.AddYears(1),
                DurationMonths = 12,
                Status = "Active"
            },
            new Policy
            {
                PolicyNumber = "INS-TRAVEL-001",
                PolicyName = "Travel Safe Cover",
                PolicyType = "Travel",
                PremiumAmount = 3000m,
                CoverageAmount = 200000m,
                StartDate = today,
                EndDate = today.AddMonths(6),
                DurationMonths = 6,
                Status = "Active"
            }
        };

        await context.Policies.AddRangeAsync(policies);
        await context.SaveChangesAsync();
    }
}