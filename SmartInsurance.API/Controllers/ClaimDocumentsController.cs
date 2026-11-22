using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartInsurance.API.Data;
using SmartInsurance.API.Models;

namespace SmartInsurance.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ClaimDocumentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IWebHostEnvironment _environment;

    private static readonly string[] AllowedExtensions =
        { ".pdf", ".jpg", ".jpeg", ".png" };

    public ClaimDocumentsController(
        ApplicationDbContext context,
        IWebHostEnvironment environment)
    {
        _context = context;
        _environment = environment;
    }

    private bool IsStaff =>
        User.IsInRole("Admin") || User.IsInRole("ClaimsManager");

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

    private async Task<bool> CanAccessClaim(int claimId)
    {
        if (IsStaff)
            return true;

        var customerId = await GetCurrentCustomerId();

        return customerId.HasValue &&
            await _context.Claims.AnyAsync(c =>
                c.ClaimId == claimId &&
                c.CustomerId == customerId.Value);
    }

    [HttpGet("{claimId:int}")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> GetDocuments(int claimId)
    {
        if (!await _context.Claims.AnyAsync(c => c.ClaimId == claimId))
            return NotFound(new { message = "Claim not found." });

        if (!await CanAccessClaim(claimId))
            return Forbid();

        var documents = await _context.ClaimDocuments
            .Where(d => d.ClaimId == claimId)
            .Select(d => new
            {
                d.ClaimDocumentId,
                d.FileName,
                d.DocumentType,
                d.UploadedAt
            })
            .ToListAsync();

        return Ok(documents);
    }

    [HttpPost("{claimId:int}/upload")]
    [Authorize(Roles = "Customer")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<IActionResult> UploadDocument(
        int claimId,
        IFormFile file,
        [FromForm] string documentType)
    {
        var claim = await _context.Claims
            .FirstOrDefaultAsync(c => c.ClaimId == claimId);

        if (claim == null)
            return NotFound(new { message = "Claim not found." });

        if (!await CanAccessClaim(claimId))
            return NotFound(new { message = "Claim not found." });

        if (claim.Status != "Submitted" &&
            claim.Status != "DocumentsRequired")
        {
            return BadRequest(new
            {
                message = "Documents can only be uploaded for submitted claims or claims requiring additional documents."
            });
        }

        if (file == null || file.Length == 0 || file.Length > 5 * 1024 * 1024)
            return BadRequest(new { message = "Select a file smaller than 5 MB." });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "Only PDF, JPG, JPEG and PNG files are allowed." });

        // Verify that the actual file content matches its extension.
        byte[] signature = new byte[8];

        await using (var validationStream = file.OpenReadStream())
        {
            int bytesRead = await validationStream.ReadAsync(signature.AsMemory(0, signature.Length));

            bool validSignature = extension switch
            {
                ".pdf" => bytesRead >= 5 &&
                    signature[0] == 0x25 &&
                    signature[1] == 0x50 &&
                    signature[2] == 0x44 &&
                    signature[3] == 0x46 &&
                    signature[4] == 0x2D,

                ".jpg" or ".jpeg" => bytesRead >= 3 &&
                    signature[0] == 0xFF &&
                    signature[1] == 0xD8 &&
                    signature[2] == 0xFF,

                ".png" => bytesRead >= 8 &&
                    signature[0] == 0x89 &&
                    signature[1] == 0x50 &&
                    signature[2] == 0x4E &&
                    signature[3] == 0x47 &&
                    signature[4] == 0x0D &&
                    signature[5] == 0x0A &&
                    signature[6] == 0x1A &&
                    signature[7] == 0x0A,

                _ => false
            };

            if (!validSignature)
                return BadRequest(new
                {
                    message = "The file content does not match its file extension."
                });
        }

        if (string.IsNullOrWhiteSpace(documentType) || documentType.Trim().Length > 50)
            return BadRequest(new { message = "Document type is required and must not exceed 50 characters." });

        var uploadFolder = Path.Combine(
            _environment.ContentRootPath,
            "Uploads",
            "Claims");

        Directory.CreateDirectory(uploadFolder);

        var storedFileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(uploadFolder, storedFileName);

        await using (var stream = new FileStream(filePath, FileMode.CreateNew))
        {
            await file.CopyToAsync(stream);
        }

        var document = new ClaimDocument
        {
            ClaimId = claimId,
            FileName = Path.GetFileName(file.FileName),
            FilePath = filePath,
            DocumentType = documentType.Trim(),
            UploadedAt = DateTime.UtcNow
        };

        _context.ClaimDocuments.Add(document);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Document uploaded successfully.",
            document.ClaimDocumentId,
            document.FileName,
            document.DocumentType
        });
    }

    [HttpGet("{documentId:int}/download")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> DownloadDocument(int documentId)
    {
        var document = await _context.ClaimDocuments
            .FirstOrDefaultAsync(d => d.ClaimDocumentId == documentId);

        if (document == null)
            return NotFound(new { message = "Document not found." });

        if (!await CanAccessClaim(document.ClaimId))
            return Forbid();

        if (!System.IO.File.Exists(document.FilePath))
            return NotFound(new { message = "The uploaded file could not be found." });

        var extension = Path.GetExtension(document.FilePath).ToLowerInvariant();

        var contentType = extension switch
        {
            ".pdf" => "application/pdf",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            _ => null
        };

        if (contentType == null)
            return BadRequest(new { message = "Unsupported document format." });

        var safeFileName = Path.GetFileName(document.FileName);

        return PhysicalFile(
            document.FilePath,
            contentType,
            safeFileName
        );
    }
    [HttpDelete("{documentId:int}")]
    [Authorize(Roles = "Customer,Admin,ClaimsManager")]
    public async Task<IActionResult> DeleteDocument(int documentId)
    {
        var document = await _context.ClaimDocuments
            .FirstOrDefaultAsync(d => d.ClaimDocumentId == documentId);

        if (document == null)
            return NotFound(new { message = "Document not found." });

        if (!IsStaff && !User.IsInRole("Customer"))
            return Forbid();

        if (!await CanAccessClaim(document.ClaimId))
            return Forbid();

        if (!IsStaff)
        {
            var claim = await _context.Claims.FindAsync(document.ClaimId);

            if (claim == null || claim.Status != "Submitted")
                return BadRequest(new { message = "Documents can only be deleted while the claim is submitted." });
        }

        var filePath = document.FilePath;

        _context.ClaimDocuments.Remove(document);
        await _context.SaveChangesAsync();

        if (System.IO.File.Exists(filePath))
            System.IO.File.Delete(filePath);

        return Ok(new { message = "Document deleted successfully." });
    }
}
