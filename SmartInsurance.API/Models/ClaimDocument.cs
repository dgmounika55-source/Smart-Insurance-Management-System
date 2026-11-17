namespace SmartInsurance.API.Models;

public class ClaimDocument
{
    public int ClaimDocumentId { get; set; }

    public int ClaimId { get; set; }

    public Claim? Claim { get; set; }

    public string FileName { get; set; } = string.Empty;

    public string FilePath { get; set; } = string.Empty;

    public string DocumentType { get; set; } = string.Empty;

    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
}
