using Microsoft.AspNetCore.Identity;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Data;

public static class ClaimsManagerSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var configuration = serviceProvider.GetRequiredService<IConfiguration>();

        var email = configuration["SeedUsers:ClaimsManagerEmail"]
            ?? throw new InvalidOperationException("Claims Manager email is missing from User Secrets.");

        var password = configuration["SeedUsers:ClaimsManagerPassword"]
            ?? throw new InvalidOperationException("Claims Manager password is missing from User Secrets.");

        var user = await userManager.FindByEmailAsync(email);

        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                FullName = "Claims Manager",
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);

            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Could not create Claims Manager: {errors}");
            }
        }

        if (!await userManager.IsInRoleAsync(user, "ClaimsManager"))
        {
            var roleResult = await userManager.AddToRoleAsync(user, "ClaimsManager");

            if (!roleResult.Succeeded)
            {
                var errors = string.Join(", ", roleResult.Errors.Select(e => e.Description));
                throw new InvalidOperationException($"Could not assign ClaimsManager role: {errors}");
            }
        }
    }
}
