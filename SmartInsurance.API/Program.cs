using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });
builder.Services.AddScoped<SmartInsurance.API.Services.NotificationService>();
builder.Services.AddScoped<SmartInsurance.API.Interfaces.IEmailService, SmartInsurance.API.Services.SmtpEmailService>();
builder.Services.AddOpenApi();

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Use SQLite during development and SQL Server in production.
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    if (builder.Environment.IsDevelopment())
    {
        options.UseSqlite(
            builder.Configuration.GetConnectionString("DevelopmentConnection"));
    }
    else
    {
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"));
    }
});

builder.Services
    .AddIdentityCore<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.User.RequireUniqueEmail = true;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager()
    .AddDefaultTokenProviders();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is not configured.");

if (Encoding.UTF8.GetByteCount(jwtKey) < 32)
{
    throw new InvalidOperationException("JWT key must be at least 32 bytes long.");
}

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException("JWT issuer is not configured.");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException("JWT audience is not configured.");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

// Initialize the temporary development database and roles.
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();

    var dbContext = scope.ServiceProvider
        .GetRequiredService<ApplicationDbContext>();

    await dbContext.Database.EnsureCreatedAsync();

    await dbContext.Database.ExecuteSqlRawAsync("""
        CREATE TABLE IF NOT EXISTS "Payments" (
            "PaymentId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "CustomerId" INTEGER NOT NULL,
            "PolicyId" INTEGER NOT NULL,
            "CustomerPolicyId" INTEGER NULL,
            "TransactionReference" TEXT NOT NULL,
            "Amount" TEXT NOT NULL,
            "PaymentMethod" TEXT NOT NULL,
            "Status" TEXT NOT NULL,
            "CreatedAt" TEXT NOT NULL,
            "PaidAt" TEXT NULL,
            FOREIGN KEY ("CustomerId") REFERENCES "Customers" ("CustomerId") ON DELETE RESTRICT,
            FOREIGN KEY ("PolicyId") REFERENCES "Policies" ("PolicyId") ON DELETE RESTRICT,
            FOREIGN KEY ("CustomerPolicyId") REFERENCES "CustomerPolicies" ("CustomerPolicyId") ON DELETE SET NULL
        );

        CREATE UNIQUE INDEX IF NOT EXISTS "IX_Payments_TransactionReference"
        ON "Payments" ("TransactionReference");

        CREATE TABLE IF NOT EXISTS "SupportTickets" (
            "TicketId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "UserId" TEXT NOT NULL,
            "UserName" TEXT NOT NULL,
            "UserRole" TEXT NOT NULL,
            "Subject" TEXT NOT NULL,
            "Category" TEXT NOT NULL,
            "Priority" TEXT NOT NULL,
            "Description" TEXT NOT NULL,
            "Status" TEXT NOT NULL DEFAULT 'Open',
            "AdminResponse" TEXT NULL,
            "CreatedAt" TEXT NOT NULL,
            "UpdatedAt" TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS "IX_SupportTickets_UserId_CreatedAt"
        ON "SupportTickets" ("UserId", "CreatedAt");
        """);


    // Add missing policy purchase snapshot columns to SQLite.
    var connection = dbContext.Database.GetDbConnection();
    await dbContext.Database.OpenConnectionAsync();

    try
    {
        var columns = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        await using (var command = connection.CreateCommand())
        {
            command.CommandText = "PRAGMA table_info('CustomerPolicies');";
            await using var reader = await command.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                columns.Add(reader.GetString(1));
        }

        var definitions = new Dictionary<string, string>
        {
            ["PolicyNameSnapshot"] = "TEXT NOT NULL DEFAULT ''",
            ["PolicyTypeSnapshot"] = "TEXT NOT NULL DEFAULT ''",
            ["PremiumAmount"] = "TEXT NOT NULL DEFAULT '0'",
            ["CoverageAmount"] = "TEXT NOT NULL DEFAULT '0'",
            ["DurationMonths"] = "INTEGER NOT NULL DEFAULT 0"
        };

        foreach (var item in definitions)
        {
            if (!columns.Contains(item.Key))
            {
                await using var command = connection.CreateCommand();
                command.CommandText = $"ALTER TABLE CustomerPolicies ADD COLUMN \"{item.Key}\" {item.Value};";
                await command.ExecuteNonQueryAsync();
            }
        }

        await dbContext.Database.ExecuteSqlRawAsync("""
            UPDATE CustomerPolicies
            SET
                PolicyNameSnapshot = (SELECT PolicyName FROM Policies WHERE Policies.PolicyId = CustomerPolicies.PolicyId),
                PolicyTypeSnapshot = (SELECT PolicyType FROM Policies WHERE Policies.PolicyId = CustomerPolicies.PolicyId),
                PremiumAmount = COALESCE(
                    (SELECT Amount FROM Payments WHERE Payments.CustomerPolicyId = CustomerPolicies.CustomerPolicyId AND Payments.Status = 'Paid' ORDER BY PaidAt DESC LIMIT 1),
                    (SELECT PremiumAmount FROM Policies WHERE Policies.PolicyId = CustomerPolicies.PolicyId),
                    '0'),
                CoverageAmount = (SELECT CoverageAmount FROM Policies WHERE Policies.PolicyId = CustomerPolicies.PolicyId),
                DurationMonths = (SELECT DurationMonths FROM Policies WHERE Policies.PolicyId = CustomerPolicies.PolicyId)
            WHERE PolicyNameSnapshot = '';
            """);
    }
    finally
    {
        await dbContext.Database.CloseConnectionAsync();
    }
    await RoleSeeder.SeedRolesAsync(scope.ServiceProvider);
    await ClaimsManagerSeeder.SeedAsync(scope.ServiceProvider);
    await AdminSeeder.SeedAsync(scope.ServiceProvider);
    await PolicySeeder.SeedPoliciesAsync(dbContext);
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("ReactFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

