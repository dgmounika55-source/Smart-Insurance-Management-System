using Microsoft.AspNetCore.Identity;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Data;

public static class AdminSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        var email = configuration["SeedUsers:AdminEmail"]
            ?? throw new InvalidOperationException("Admin email is missing from User Secrets.");

        var password = configuration["SeedUsers:AdminPassword"]
            ?? throw new InvalidOperationException("Admin password is missing from User Secrets.");

        var user = await userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = "InsureFlow Admin",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Could not create Admin: {errors}");
            }
        }

        if (!await userManager.IsInRoleAsync(user, "Admin"))
        {
            var roleResult = await userManager.AddToRoleAsync(user, "Admin");

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Could not assign Admin role: {errors}");
            }
        }
    }
}
