import { useEffect, useState } from "react";
import {
  ShieldCheck, Search, ShoppingCart, CreditCard, X, Plus, Pencil, Ban, HeartPulse, Users, CarFront, Plane, House, Shield
} from "lucide-react";
import api from "../services/api";
import Toast from "../components/Toast";

const emptyForm = {
  policyName: "",
  policyType: "Health",
  premiumAmount: "",
  coverageAmount: "",
  durationMonths: 12,
};

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [customerPolicies, setCustomerPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [purchasingId, setPurchasingId] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [previewPolicy, setPreviewPolicy] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [savingPolicy, setSavingPolicy] = useState(false);
const [toast, setToast] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);

  const userRole = localStorage.getItem("userRole");
  const isCustomer = userRole === "Customer";
  const isAdmin = userRole === "Admin";

  async function fetchPolicies() {
    try {
      setError("");

      const response = await api.get("/policies");
      setPolicies(response.data);

      if (isCustomer) {
        const purchasedResponse = await api.get("/customerpolicies/my");
        setCustomerPolicies(purchasedResponse.data);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to load policies. Please check the backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPolicies();
  }, []);

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  }

  function openCreateForm() {
    setEditingPolicy(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function openPreview(policy) {
    setPreviewPolicy(policy);
  }

  function closePreview() {
    setPreviewPolicy(null);
  }

  function openEditForm(policy) {
    setEditingPolicy(policy);
    setForm({
      policyName: policy.policyName,
      policyType: policy.policyType,
      premiumAmount: policy.premiumAmount,
      coverageAmount: policy.coverageAmount,
      durationMonths: policy.durationMonths,
    });
    setError("");
    setMessage("");
    setShowForm(true);
  }

  function closeForm() {
    if (savingPolicy) return;
    setShowForm(false);
    setEditingPolicy(null);
    setForm(emptyForm);
  }

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function savePolicy(event) {
    event.preventDefault();

    const payload = {
      policyName: form.policyName.trim(),
      policyType: form.policyType,
      premiumAmount: Number(form.premiumAmount),
      coverageAmount: Number(form.coverageAmount),
      durationMonths: Number(form.durationMonths),
    };

    if (
      !payload.policyName ||
      payload.premiumAmount <= 0 ||
      payload.coverageAmount <= 0 ||
      payload.durationMonths <= 0 ||
      !Number.isInteger(payload.durationMonths)
    ) {
      setError("Enter valid policy details. Duration must be a positive whole number.");
      return;
    }

    try {
      setSavingPolicy(true);
      setError("");
      setMessage("");

      if (editingPolicy) {
        await api.put(`/policies/${editingPolicy.policyId}`, payload);
        setMessage("Policy updated successfully.");
      } else {
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + payload.durationMonths);

        await api.post("/policies", {
          ...payload,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
        setToast({
          type: "success",
          message: "Your new insurance policy has been created successfully.",
        });
      }

      setShowForm(false);
      setEditingPolicy(null);
      setForm(emptyForm);
      await fetchPolicies();
    } catch (err) {
      setError(
        err.response?.data?.message || JSON.stringify(err.response?.data) || JSON.stringify(err.response?.data) ||
        "Unable to save policy. Please try again."
      );
    } finally {
      setSavingPolicy(false);
    }
  }

  async function deactivatePolicy(policy) {
    if (policy.status !== "Active") return;

    setDeactivateTarget(policy);
    return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/policies/${policy.policyId}`);
      setMessage(`${policy.policyName} has been deactivated.`);
      await fetchPolicies();
    } catch (err) {
      setError(
        err.response?.data?.message || JSON.stringify(err.response?.data) || JSON.stringify(err.response?.data) ||
        "Unable to deactivate policy. Please try again."
      );
    }
  }

  async function confirmDeactivatePolicy() {
    if (!deactivateTarget) return;

    try {
      setError("");
      setMessage("");
      await api.delete(`/policies/${deactivateTarget.policyId}`);
      setMessage(`${deactivateTarget.policyName} has been deactivated.`);
      setDeactivateTarget(null);
      await fetchPolicies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to deactivate policy. Please try again."
      );
    }
  }
  async function handlePurchase(policy) {
    try {
      setPurchasingId(policy.policyId);
      setMessage("");
      setError("");

      const response = await api.post("/payments/create", {
        policyId: policy.policyId,
      });

      setPaymentSession(response.data);
    } catch (err) {
      console.error("Payment creation diagnostic:", {
        status: err.response?.status,
        response: err.response?.data,
        message: err.message,
        url: err.config?.url,
        baseURL: err.config?.baseURL
      });

      setToast({
        type: "error",
        message:
          err.response?.data?.message ||
          `Payment request failed (${err.response?.status || "Network error"}): ${err.message}`,
      });
    } finally {
      setPurchasingId(null);
    }
  }

  async function completePayment(success) {
    if (!paymentSession) return;

    try {
      setPaymentProcessing(true);
      setError("");
      setMessage("");

      const response = await api.post("/payments/complete", {
        paymentId: paymentSession.paymentId,
        success,
      });

      const paymentStatus = response.data.status;

      const paymentMessage = [
        response.data.message,
        response.data.transactionReference
          ? `Transaction reference: ${response.data.transactionReference}.`
          : "",
        response.data.policyReference
          ? `Policy reference: ${response.data.policyReference}.`
          : "",
      ].filter(Boolean).join(" ");

      setToast({
        type: paymentStatus === "Paid" ? "success" : "error",
        message: paymentMessage,
      });

      setPaymentSession(null);
      await fetchPolicies();
    } catch (err) {
      setToast({
        type: "error",
        message:
          err.response?.data?.message || JSON.stringify(err.response?.data) || JSON.stringify(err.response?.data) ||
          "Unable to process payment. Please try again.",
      });
    } finally {
      setPaymentProcessing(false);
    }
  }
  const filteredPolicies = policies.filter((policy) =>
    `${policy.policyNumber} ${policy.policyName} ${policy.policyType}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="page-section">
          <Toast
      message={toast?.message}
      type={toast?.type}
      onClose={() => setToast(null)}
    /><div className="page-title-row consistent-page-header">
        <div>
          <div className="page-breadcrumb">INSURANCE / POLICIES</div>
          <h1>Insurance Policies</h1>
          <p>Explore insurance products and manage available policies.</p>
        </div>
        <div className="brand-icon">
          <ShieldCheck size={24} />
        </div>
      </div>

      <div className="panel">
        <div className="page-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <span>{policies.length} policies</span>

          {isAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={openCreateForm}
            >
              <Plus size={16} /> Add Policy
            </button>
          )}
        </div>

        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {loading && <p>Loading policies...</p>}

        {!loading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>POLICY ID</th>
                  <th>POLICY NAME</th>
                  <th>TYPE</th>
                  <th>PREMIUM</th>
                  <th>COVERAGE</th>
                  <th>STATUS</th>
                  {isCustomer && <th>ACTION</th>}
                  {isAdmin && <th>MANAGE</th>}
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy.policyId}>
                    <td className="claim-id">{policy.policyNumber}</td>
                    <td>
  <div className="policy-name-cell">
    <span className={`policy-type-icon policy-type-${(policy.policyType || "other").toLowerCase()}`}>
      {(() => {
        const type = (policy.policyType || "").toLowerCase();
        const Icon =
          type === "health" ? HeartPulse :
          type === "life" ? Users :
          type === "motor" ? CarFront :
          type === "travel" ? Plane :
          type === "property" ? House : Shield;
        return <Icon size={18} />;
      })()}
    </span>
    <span className="customer-name">{policy.policyName}</span>
  </div>
</td>
                    <td>{policy.policyType}</td>
                    <td className="amount">{formatCurrency(policy.premiumAmount)}</td>
                    <td>{formatCurrency(policy.coverageAmount)}</td>
                    <td>
                      <span className={`status ${
                        policy.status === "Active" ? "approved" : "rejected"
                      }`}>
                        {policy.status}
                      </span>
                    </td>

                    {isCustomer && (
                      <td>
                        {customerPolicies.some(
                          (item) =>
                            Number(item.policyId ?? item.policy?.policyId) ===
                            Number(policy.policyId)
                        ) ? (
                          <button type="button" className="secondary-button" disabled>
                            Already Purchased
                          </button>
                        ) : policy.status !== "Active" ? (
                          <button type="button" className="secondary-button" disabled>
                            Unavailable
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="primary-button"
                            disabled={purchasingId === policy.policyId}
                            onClick={() => handlePurchase(policy)}
                          >
                            <ShoppingCart size={15} />
                            {purchasingId === policy.policyId
                              ? "Processing..."
                              : "Purchase"}
                          </button>
                        )}
                      </td>
                    )}

                    {isAdmin && (
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => openPreview(policy)}
                          >
                            <ShieldCheck size={14} /> Preview
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => openEditForm(policy)}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            className="checkout-fail-button"
                            disabled={policy.status !== "Active"}
                            onClick={() => deactivatePolicy(policy)}
                          >
                            <Ban size={14} /> Deactivate
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredPolicies.length === 0 && (
                  <tr>
                    <td colSpan={isCustomer ? 7 : isAdmin ? 7 : 6}>
                      {policies.length === 0
                        ? "No policies available yet."
                        : "No matching policies found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {previewPolicy && (
        <div className="checkout-overlay" onClick={closePreview}>
          <div
            className="checkout-modal policy-preview-modal"
            style={{ maxWidth: 520 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="checkout-header">
              <div className="checkout-brand">
                <div className="checkout-brand-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>InsureFlow</strong>
                  <span>Policy Details</span>
                </div>
              </div>
              <button
                type="button"
                className="checkout-close"
                onClick={closePreview}
                aria-label="Close policy preview"
              >
                <X size={19} />
              </button>
            </div>

            <div className="checkout-title">
              <span className="checkout-eyebrow">POLICY PREVIEW</span>
              <h2>{previewPolicy.policyName}</h2>
              <p>Review the complete insurance policy information.</p>
            </div>

            <div className="policy-preview-details">
              <div className="policy-preview-row">
                <span>Policy Number</span>
                <strong>{previewPolicy.policyNumber || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}</strong>
              </div>
              <div className="policy-preview-row">
                <span>Policy Type</span>
                <strong>{previewPolicy.policyType || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}</strong>
              </div>
              <div className="policy-preview-row">
                <span>Status</span>
                <span className={`status ${previewPolicy.status === "Active" ? "approved" : "rejected"}`}>
                  {previewPolicy.status || "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"}
                </span>
              </div>
              <div className="policy-preview-row">
                <span>Premium Amount</span>
                <strong>{formatCurrency(previewPolicy.premiumAmount)}</strong>
              </div>
              <div className="policy-preview-row">
                <span>Coverage Amount</span>
                <strong>{formatCurrency(previewPolicy.coverageAmount)}</strong>
              </div>
              <div className="policy-preview-row policy-preview-duration">
                <span>Duration</span>
                <strong>{previewPolicy.durationMonths ?? "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â"} months</strong>
              </div>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="checkout-pay-button"
                onClick={closePreview}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {deactivateTarget && (
  <div className="checkout-overlay" onClick={() => setDeactivateTarget(null)}>
    <div className="checkout-modal policy-preview-modal" style={{ maxWidth: 380 }} onClick={(event) => event.stopPropagation()}>
      <div className="checkout-title">
        <h2>Deactivate Policy?</h2>
        <p>Are you sure you want to deactivate <strong>{deactivateTarget.policyName}</strong>?</p>
      </div>
      <div className="checkout-actions">
        <button type="button" className="secondary-button" onClick={() => setDeactivateTarget(null)}>
          Cancel
        </button>
        <button type="button" className="checkout-pay-button" onClick={confirmDeactivatePolicy}>
          Deactivate
        </button>
      </div>
    </div>
  </div>
)}{showForm && (
        <div className="checkout-overlay">
          <div className="checkout-modal" style={{ maxWidth: 520 }}>
            <div className="checkout-header">
              <div className="checkout-brand">
                <div className="checkout-brand-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>InsureFlow</strong>
                  <span>Admin Policy Management</span>
                </div>
              </div>
              <button
                type="button"
                className="checkout-close"
                onClick={closeForm}
                disabled={savingPolicy}
                aria-label="Close policy form"
              >
                <X size={19} />
              </button>
            </div>

            <div className="checkout-title">
              <span className="checkout-eyebrow">POLICY MANAGEMENT</span>
              <h2>{editingPolicy ? "Edit Policy" : "Create New Policy"}</h2>
              <p>Enter the insurance policy details below.</p>
            </div>

            <form onSubmit={savePolicy} style={{ display: "grid", gap: 14 }}>
              <label>
                Policy Name
                <input
                  name="policyName"
                  value={form.policyName}
                  onChange={updateForm}
                  placeholder="e.g. Family Health Plan"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Policy Type
                <select
                  name="policyType"
                  value={form.policyType}
                  onChange={updateForm}
                  required
                >
                  <option>Health</option>
                  <option>Life</option>
                  <option>Motor</option>
                  <option>Travel</option>
                  <option>Property</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Premium Amount (&#8377;)
                <input
                  type="number"
                  name="premiumAmount"
                  min="1"
                  step="0.01"
                  value={form.premiumAmount}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Coverage Amount (&#8377;)
                <input
                  type="number"
                  name="coverageAmount"
                  min="1"
                  step="0.01"
                  value={form.coverageAmount}
                  onChange={updateForm}
                  required
                />
              </label>

              <label>
                Duration (months)
                <input
                  type="number"
                  name="durationMonths"
                  min="1"
                  step="1"
                  value={form.durationMonths}
                  onChange={updateForm}
                  required
                />
              </label>

              {error && <p className="auth-error" role="alert">{error}</p>}

              <div className="checkout-actions">
                <button
                  type="submit"
                  className="checkout-pay-button"
                  disabled={savingPolicy}
                >
                  {savingPolicy
                    ? "Saving..."
                    : editingPolicy ? "Save Changes" : "Create Policy"}
                </button>
                <button
                  type="button"
                  className="checkout-fail-button"
                  onClick={closeForm}
                  disabled={savingPolicy}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentSession && (
        <div className="checkout-overlay">
          <div className="checkout-modal">
            <div className="checkout-header">
              <div className="checkout-brand">
                <div className="checkout-brand-icon">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <strong>InsureFlow</strong>
                  <span>Secure Checkout</span>
                </div>
              </div>
              <button
                type="button"
                className="checkout-close"
                disabled={paymentProcessing}
                onClick={() => setPaymentSession(null)}
                aria-label="Close checkout"
              >
                <X size={19} />
              </button>
            </div>

            <div className="checkout-title">
              <span className="checkout-eyebrow">POLICY PAYMENT</span>
              <h2>Complete your purchase</h2>
              <p>Review your policy details before continuing.</p>
            </div>

            <div className="checkout-policy-card">
              <div className="checkout-policy-icon">
                <ShieldCheck size={25} />
              </div>
              <div className="checkout-policy-info">
                <span>Selected insurance plan</span>
                <strong>{paymentSession.policyName}</strong>
                <small>Insurance policy premium</small>
              </div>
            </div>

            <div className="checkout-amount-card">
              <span>Total amount payable</span>
              <h1>{formatCurrency(paymentSession.amount)}</h1>
              <div className="checkout-transaction">
                <span>Transaction reference</span>
                <strong>{paymentSession.transactionReference}</strong>
              </div>
            </div>

            <div className="checkout-demo-note">
              <div className="checkout-demo-icon">
                <CreditCard size={18} />
              </div>
              <div>
                <strong>Development payment simulator</strong>
                <p>This is a demo transaction. No real money will be charged.</p>
              </div>
            </div>

            <div className="checkout-actions">
              <button
                type="button"
                className="checkout-pay-button"
                disabled={paymentProcessing}
                onClick={() => completePayment(true)}
              >
                {paymentProcessing
                  ? "Processing payment..."
                  : `Pay ${formatCurrency(paymentSession.amount)}`}
              </button>
              <button
                type="button"
                className="checkout-fail-button"
                disabled={paymentProcessing}
                onClick={() => completePayment(false)}
              >
                Simulate Payment Failure
              </button>
            </div>

            <div className="checkout-footer">
              <span><ShieldCheck size={14} /> Demo checkout environment</span>
              <span>Test transaction only</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



