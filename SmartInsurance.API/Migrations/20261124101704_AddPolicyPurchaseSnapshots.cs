using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartInsurance.API.Migrations
{
    /// <inheritdoc />
    public partial class AddPolicyPurchaseSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CoverageAmount",
                table: "CustomerPolicies",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DurationMonths",
                table: "CustomerPolicies",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "PolicyNameSnapshot",
                table: "CustomerPolicies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PolicyTypeSnapshot",
                table: "CustomerPolicies",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<decimal>(
                name: "PremiumAmount",
                table: "CustomerPolicies",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.Sql("""
                UPDATE cp
                SET
                    PolicyNameSnapshot = p.PolicyName,
                    PolicyTypeSnapshot = p.PolicyType,
                    PremiumAmount = COALESCE(pay.Amount, p.PremiumAmount),
                    CoverageAmount = p.CoverageAmount,
                    DurationMonths = p.DurationMonths
                FROM CustomerPolicies cp
                INNER JOIN Policies p ON p.PolicyId = cp.PolicyId
                OUTER APPLY (
                    SELECT TOP 1 Amount
                    FROM Payments
                    WHERE CustomerPolicyId = cp.CustomerPolicyId
                      AND Status = 'Paid'
                    ORDER BY PaidAt DESC
                ) pay;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CoverageAmount",
                table: "CustomerPolicies");

            migrationBuilder.DropColumn(
                name: "DurationMonths",
                table: "CustomerPolicies");

            migrationBuilder.DropColumn(
                name: "PolicyNameSnapshot",
                table: "CustomerPolicies");

            migrationBuilder.DropColumn(
                name: "PolicyTypeSnapshot",
                table: "CustomerPolicies");

            migrationBuilder.DropColumn(
                name: "PremiumAmount",
                table: "CustomerPolicies");
        }
    }
}

