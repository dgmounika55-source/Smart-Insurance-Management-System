
import { useEffect, useState } from "react";
import {
  Search,
  FileText,
  PlusCircle,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";

export default function Claims() {
  const userRole = localStorage.getItem("userRole");
  const isCustomer = userRole === "Customer";

  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [toast, setToast] = useState(null);
  const [claimModal, setClaimModal] = useState(null);
  const [modalRemarks, setModalRemarks] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [expandedClaim, setExpandedClaim] = useState(null);
  const [historyByClaim, setHistoryByClaim] = useState({});
  const [historyLoading, setHistoryLoading] = useState(null);
  const [documentsByClaim, setDocumentsByClaim] = useState({});
  const [documentsLoading, setDocumentsLoading] = useState(null);

  const [form, setForm] = useState({
    customerPolicyId: "",
    incidentDate: "",
    claimAmount: "",
    description: "",
    documentType: "Medical Report"
  });

  const [files, setFiles] = useState([]);
  const [requestedFiles, setRequestedFiles] = useState({});
  const [requestedDocumentTypes, setRequestedDocumentTypes] = useState({});
  const [uploadingRequested, setUploadingRequested] = useState(null);

  async function fetchData() {
    try {
      setError("");

      const claimsResponse = await api.get("/claims");
      setClaims(claimsResponse.data);

      if (isCustomer) {
        const policiesResponse = await api.get("/customerpolicies/my");
        setPolicies(
          policiesResponse.data.filter(
            item => item.status === "Active"
          )
        );
      }
    } catch (err) {
      setError("Unable to load claims data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function toggleHistory(claimId) {
    if (expandedClaim === claimId) {
      setExpandedClaim(null);
      return;
    }

    setExpandedClaim(claimId);

    if (Object.prototype.hasOwnProperty.call(historyByClaim, claimId)) {
      return;
    }

    try {
      setHistoryLoading(claimId);

      const response = await api.get(
        `/claims/${claimId}/history`
      );

      setHistoryByClaim(previous => ({
        ...previous,
        [claimId]: response.data
      }));
    } catch (err) {
      setHistoryByClaim(previous => ({
        ...previous,
        [claimId]: {
          error:
            err.response?.data?.message ||
            "Unable to load claim history."
        }
      }));
    } finally {
      setHistoryLoading(null);
    }
  }

  async function downloadClaimDocument(document) {
    try {
      const response = await api.get(
        `/claimdocuments/${document.claimDocumentId}/download`,
        { responseType: "blob" }
      );

      const blobUrl = window.URL.createObjectURL(response.data);
      const link = window.document.createElement("a");

      link.href = blobUrl;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setToast({ type: "error", title: "Download Failed", message: "Unable to download this document." });
    }
  }
  async function loadClaimDocuments(claimId) {
    if (Object.prototype.hasOwnProperty.call(documentsByClaim, claimId)) {
      return;
    }

    try {
      setDocumentsLoading(claimId);

      const response = await api.get(
        `/claimdocuments/${claimId}`
      );

      setDocumentsByClaim(previous => ({
        ...previous,
        [claimId]: response.data
      }));
    } catch (err) {
      setToast({ type: "error", title: "Document Loading Failed", message: err.response?.data?.message || "Unable to load claim documents." });
    } finally {
      setDocumentsLoading(null);
    }
  }
  function openClaimModal(claimId, action) {
    setClaimModal({ claimId, action });
    setModalRemarks("");
  }

  async function submitClaimAction() {
    if (!claimModal || modalSubmitting) return;

    const { claimId, action } = claimModal;
    const needsRemarks = ["approve", "reject", "request-documents"].includes(action);

    if (needsRemarks && !modalRemarks.trim()) {
      setToast({
        type: "error",
        title: "Remarks Required",
        message: "Please enter remarks before continuing."
      });
      return;
    }

    try {
      setModalSubmitting(true);

      if (action === "cancel") {
        const response = await api.patch(`/claims/${claimId}/cancel`);
        setToast({
          type: "success",
          title: "Claim Cancelled",
          message: response.data?.message || "The claim was cancelled successfully."
        });
      } else {
        await api.patch(
          `/claimreviews/${claimId}/${action}`,
          action === "review" ? {} : JSON.stringify(modalRemarks.trim()),
          action === "review" ? {} : {
            headers: { "Content-Type": "application/json" }
          }
        );

        const titles = {
          review: "Review Started",
          approve: "Claim Approved",
          reject: "Claim Rejected",
          "request-documents": "Documents Requested"
        };

        const messages = {
          review: "The claim is now under review.",
          approve: "The claim was approved successfully.",
          reject: "The claim was rejected successfully.",
          "request-documents": "Additional documents have been requested."
        };

        setToast({
          type: "success",
          title: titles[action],
          message: messages[action]
        });
      }

      setClaimModal(null);
      setModalRemarks("");
      setExpandedClaim(null);

      setHistoryByClaim(previous => {
        const updated = { ...previous };
        delete updated[claimId];
        return updated;
      });

      await fetchData();
    } catch (error) {
      setToast({
        type: "error",
        title: "Action Failed",
        message: error.response?.data?.message || "Unable to update the claim."
      });
    } finally {
      setModalSubmitting(false);
    }
  }
  async function uploadRequestedDocuments(claimId) {
    const selectedFiles = requestedFiles[claimId] || [];
    const documentType = requestedDocumentTypes[claimId] || "Additional Document";

    if (selectedFiles.length === 0) {
      setToast({ type: "error", title: "No Documents Selected", message: "Please select at least one document." });
      return;
    }

    if (selectedFiles.some(file => file.size > 5 * 1024 * 1024)) {
      setToast({ type: "error", title: "File Size Limit", message: "Each document must be smaller than 5 MB." });
      return;
    }

    setUploadingRequested(claimId);

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", documentType);

        await api.post(
          `/claimdocuments/${claimId}/upload`,
          formData
        );
      }

      setMessage("Additional documents uploaded successfully.");
      setRequestedFiles(previous => ({
        ...previous,
        [claimId]: []
      }));
      setExpandedClaim(null);
    } catch (error) {
      setToast({ type: "error", title: "Upload Failed", message: error.response?.data?.message || "Unable to upload the additional documents." });
    } finally {
      setUploadingRequested(null);
    }
  }
  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (
      !form.customerPolicyId ||
      !form.incidentDate ||
      !form.claimAmount ||
      !form.description.trim()
    ) {
      setError("Please complete all required claim details.");
      return;
    }

    if (Number(form.claimAmount) <= 0) {
      setError("Claim amount must be greater than zero.");
      return;
    }

    if (files.some(file => file.size > 5 * 1024 * 1024)) {
      setError("Each document must be smaller than 5 MB.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/claims", {
        customerPolicyId: Number(form.customerPolicyId),
        incidentDate: form.incidentDate,
        claimAmount: Number(form.claimAmount),
        description: form.description.trim()
      });

      const claimId = response.data.claimId;
      let uploadFailed = false;

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", form.documentType);

        try {
          await api.post(
            `/claimdocuments/${claimId}/upload`,
            formData
          );
        } catch {
          uploadFailed = true;
        }
      }

      setToast({
        type: uploadFailed ? "error" : "success",
        title: uploadFailed ? "Claim Submitted with Document Issue" : "Claim Submission Confirmed",
        message: uploadFailed
          ? `Claim ${response.data.claimNumber} submitted, but one or more documents could not be uploaded.`
          : `Your claim ${response.data.claimNumber} has been submitted successfully. You can track its status and updates from your dashboard.`
      });

      setForm({
        customerPolicyId: "",
        incidentDate: "",
        claimAmount: "",
        description: "",
        documentType: "Medical Report"
      });

      setFiles([]);
      event.target.reset();

      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to submit claim. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const filteredClaims = claims.filter(claim =>
    [
      claim.claimNumber,
      claim.customer?.fullName,
      claim.customerPolicy?.policy?.policyType,
      claim.status
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const formatCurrency = amount =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount ?? 0);

  const formatDate = date =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric"
        })
      : "N/A";

  const statusClass = status =>
    status?.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase().replace(/\s+/g, "-") || "pending";

  return (
    <div className="page-section">
      <Toast message={toast?.message} type={toast?.type} title={toast?.title} onClose={() => setToast(null)} />
      {claimModal && (
        <div className="claim-modal-overlay">
          <div className="claim-modal">
            <div className="claim-modal-header">
              <h2>
                {{
                  cancel: "Cancel Claim",
                  review: "Start Claim Review",
                  approve: "Approve Claim",
                  reject: "Reject Claim",
                  "request-documents": "Request Additional Documents"
                }[claimModal.action]}
              </h2>
              <button
                type="button"
                className="claim-modal-close"
                onClick={() => setClaimModal(null)}
                disabled={modalSubmitting}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <p>
              {{
                cancel: "Are you sure you want to cancel this claim?",
                review: "Confirm that you want to start reviewing this claim.",
                approve: "Confirm approval of this claim.",
                reject: "Confirm rejection of this claim.",
                "request-documents": "Enter the additional documents or information required from the customer."
              }[claimModal.action]}
            </p>

            {["approve", "reject", "request-documents"].includes(claimModal.action) && (
              <div className="claim-modal-field">
                <label htmlFor="claim-modal-remarks">Remarks</label>
                <textarea
                  id="claim-modal-remarks"
                  value={modalRemarks}
                  onChange={event => setModalRemarks(event.target.value)}
                  placeholder="Enter your remarks..."
                  rows={4}
                  disabled={modalSubmitting}
                />
              </div>
            )}

            <div className="claim-modal-actions">
              <button
                type="button"
                className="claim-modal-cancel"
                onClick={() => setClaimModal(null)}
                disabled={modalSubmitting}
              >
                Go Back
              </button>
              <button
                type="button"
                className="claim-modal-confirm"
                onClick={submitClaimAction}
                disabled={modalSubmitting}
              >
                {modalSubmitting ? "Processing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="page-title-row">
        <div>
          <h1>Claims Management</h1>
          <p>Submit, review and track insurance claims.</p>
        </div>
      </div>

      {isCustomer && (
        <div className="panel claim-form-panel">
          <div className="page-title-row">
            <div>
              <h2>
                <PlusCircle size={19} /> Submit a New Claim
              </h2>
              <p>
                Provide the incident details and supporting documents.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="claim-form">
            <div className="form-group">
              <label>Purchased Policy *</label>
              <select
                name="customerPolicyId"
                value={form.customerPolicyId}
                onChange={handleChange}
                required
              >
                <option value="">Select your policy</option>
                {policies.map(item => (
                  <option
                    key={item.customerPolicyId}
                    value={item.customerPolicyId}
                  >
                    {item.policy?.policyName} - {item.policyReference}
                  </option>
                ))}
              </select>

              {policies.length === 0 && (
                <small>
                  You need an active purchased policy before submitting a claim.
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Incident Date *</label>
              <input
                type="date"
                name="incidentDate"
                value={form.incidentDate}
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>Claim Amount (â‚¹) *</label>
              <input
                type="number"
                name="claimAmount"
                placeholder="Enter claim amount"
                min="1"
                step="0.01"
                value={form.claimAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Claim Description *</label>
              <textarea
                name="description"
                placeholder="Explain what happened and why you are submitting this claim..."
                value={form.description}
                onChange={handleChange}
                rows="4"
                required
              />
            </div>

            <div className="form-group">
              <label>Document Type</label>
              <select
                name="documentType"
                value={form.documentType}
                onChange={handleChange}
              >
                <option>Medical Report</option>
                <option>Hospital Bill</option>
                <option>Identity Proof</option>
                <option>Incident Report</option>
                <option>Other Supporting Document</option>
              </select>
            </div>

            <div className="form-group">
              <label>Supporting Documents</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={e =>
                  setFiles(Array.from(e.target.files || []))
                }
              />
              <small>PDF, JPG or PNG. Maximum 5 MB per file.</small>

              {files.map(file => (
                <small key={`${file.name}-${file.size}`}>
                  {file.name}
                </small>
              ))}
            </div>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || policies.length === 0}
            >
              {submitting ? "Submitting..." : "Submit Claim"}
            </button>
          </form>
        </div>
      )}

      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      <div className="panel">
        <div className="page-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search claims..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span>{claims.length} claims</span>
        </div>

        {loading && <p>Loading claims...</p>}

        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>CLAIM ID</th>
                  <th>CUSTOMER</th>
                  <th>POLICY TYPE</th>
                  <th>AMOUNT</th>
                  <th>SUBMITTED</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredClaims.map(claim => (
                  <>
                    <tr key={claim.claimId}>
                      <td className="claim-id">
                        {claim.claimNumber}
                      </td>

                      <td className="customer-name">
                        {claim.customer?.fullName || "N/A"}
                      </td>

                      <td>
                        {claim.customerPolicy?.policy?.policyType || "N/A"}
                      </td>

                      <td className="amount">
                        {formatCurrency(claim.claimAmount)}
                      </td>

                      <td>{formatDate(claim.submissionDate)}</td>

                      <td>
                        <span className={`status ${statusClass(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>

                      <td>
                        <div className="claim-actions">
                          <button
                            type="button"
                            className="history-button"
                            onClick={() => toggleHistory(claim.claimId)}
                          >
                            <Clock size={15} />
                            History
                            {expandedClaim === claim.claimId
                              ? <ChevronUp size={15} />
                              : <ChevronDown size={15} />}
                          </button>

                          {isCustomer && claim.status === "Submitted" && (
                            <button
                              type="button"
                              className="cancel-claim-button"
                              onClick={() => openClaimModal(claim.claimId, "cancel")}
                            >
                              Cancel Claim
                            </button>
                          )}

                          {!isCustomer && (
                            <>
                              {(claim.status === "Submitted" ||
                                claim.status === "DocumentsRequired") && (
                                <button
                                  type="button"
                                  className="review-action-button"
                                  onClick={() => openClaimModal(claim.claimId, "review")}
                                >
                                  Start Review
                                </button>
                              )}

                              {claim.status === "UnderReview" && (
                                <>
                                  <button
                                    type="button"
                                    className="review-action-button approve-action"
                                    onClick={() => openClaimModal(claim.claimId, "approve")}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    type="button"
                                    className="review-action-button reject-action"
                                    onClick={() => openClaimModal(claim.claimId, "reject")}
                                  >
                                    Reject
                                  </button>

                                  <button
                                    type="button"
                                    className="review-action-button"
                                    onClick={() => openClaimModal(claim.claimId, "request-documents")}
                                  >
                                    Request Documents
                                  </button>
                                </>
                              )}
                            </>
                          )}


                        </div>
                      </td>
                    </tr>

                    {expandedClaim === claim.claimId && (
                      <tr key={`history-${claim.claimId}`}>
                        <td colSpan="7" className="history-cell">
                          <div className="claim-history">
                            <h3>Claim Status Timeline</h3>

                            <div className="claim-document-section">
                              <button
                                type="button"
                                className="history-button"
                                onClick={() => loadClaimDocuments(claim.claimId)}
                              >
                                <FileText size={15} />
                                View Uploaded Documents
                              </button>

                              {documentsLoading === claim.claimId && (
                                <p>Loading documents...</p>
                              )}

                              {Array.isArray(documentsByClaim[claim.claimId]) && (
                                <div className="uploaded-document-list">
                                  {documentsByClaim[claim.claimId].length === 0 ? (
                                    <p>No documents uploaded for this claim.</p>
                                  ) : (
                                    documentsByClaim[claim.claimId].map(document => (
                                      <div
                                        className="uploaded-document-item"
                                        key={document.claimDocumentId}
                                      >
                                        <FileText size={17} />
                                        <div>
                                          <strong>{document.fileName}</strong>
                                          <small>
                                            {document.documentType} {" "}
                                            {new Date(document.uploadedAt).toLocaleDateString("en-IN")}
                                          </small>
                                        </div>

                                        <button
                                          type="button"
                                          className="document-download-button"
                                          onClick={() => downloadClaimDocument(document)}
                                        >
                                          Download
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              )}
                            </div>

                            {historyLoading === claim.claimId && (
                              <p>Loading history...</p>
                            )}

                            {historyByClaim[claim.claimId]?.error && (
                              <p className="auth-error">
                                {historyByClaim[claim.claimId].error}
                              </p>
                            )}

                            {Array.isArray(historyByClaim[claim.claimId]) &&
                              historyByClaim[claim.claimId].length === 0 && (
                                <p>No status history available yet.</p>
                              )}

                            {Array.isArray(historyByClaim[claim.claimId]) &&
                              historyByClaim[claim.claimId].map((item, index) => (
                                <div className="history-item" key={index}>
                                  <div className="history-marker" />

                                  <div className="history-details">
                                    <strong>{item.newStatus}</strong>

                                    {item.previousStatus && (
                                      <p>
                                        Previous status: {item.previousStatus}
                                      </p>
                                    )}

                                    {item.remarks && <p>{item.remarks}</p>}

                                    <small>
                                      {new Date(item.changedAt).toLocaleString("en-IN")}
                                      {item.changedBy && ` â€¢ ${item.changedBy}`}
                                    </small>
                                  </div>
                                </div>
                              ))}
                          </div>

                          {isCustomer && claim.status === "DocumentsRequired" && (
                            <div className="requested-documents-panel">
                              <h3>Additional Documents Required</h3>

                              <p>
                                <strong>Claims Manager's remarks:</strong>{" "}
                                {claim.adminRemarks || "Please upload the requested supporting documents."}
                              </p>

                              <label>Document Type</label>
                              <select
                                value={requestedDocumentTypes[claim.claimId] || "Additional Document"}
                                onChange={event =>
                                  setRequestedDocumentTypes(previous => ({
                                    ...previous,
                                    [claim.claimId]: event.target.value
                                  }))
                                }
                              >
                                <option>Additional Document</option>
                                <option>Medical Report</option>
                                <option>Hospital Bill</option>
                                <option>Discharge Summary</option>
                                <option>Prescription</option>
                                <option>Other</option>
                              </select>

                              <label>Select Documents</label>
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                multiple
                                onChange={event =>
                                  setRequestedFiles(previous => ({
                                    ...previous,
                                    [claim.claimId]: Array.from(event.target.files || [])
                                  }))
                                }
                              />

                              <small>PDF, JPG or PNG. Maximum 5 MB per file.</small>

                              <button
                                type="button"
                                className="primary-button"
                                disabled={uploadingRequested === claim.claimId}
                                onClick={() => uploadRequestedDocuments(claim.claimId)}
                              >
                                {uploadingRequested === claim.claimId
                                  ? "Uploading..."
                                  : "Upload Additional Documents"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                ))}

                {filteredClaims.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <FileText size={17} />
                      <p>
                        {claims.length === 0
                          ? "No claims available yet."
                          : "No matching claims found."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}






