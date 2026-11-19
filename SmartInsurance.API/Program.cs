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
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
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
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddSignInManager();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key is not configured.");

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
        """);


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