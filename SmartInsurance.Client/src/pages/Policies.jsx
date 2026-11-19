import { useEffect, useState } from "react";
import { ShieldCheck, Search, ShoppingCart, CreditCard, X } from "lucide-react";
import api from "../services/api";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [purchasingId, setPurchasingId] = useState(null);
  const [paymentSession, setPaymentSession] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const userRole = localStorage.getItem("userRole");
  const isCustomer = userRole === "Customer";

  async function fetchPolicies() {
    try {
      setError("");
      const response = await api.get("/policies");
      setPolicies(response.data);
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
      setError(
        err.response?.data?.message ||
        "Unable to create payment session. Please try again."
      );
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

      setMessage(
        response.data.message +
        (response.data.policyReference
          ? ` Policy reference: ${response.data.policyReference}.`
          : "")
      );

      setPaymentSession(null);
      await fetchPolicies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to process payment. Please try again."
      );
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
      <div className="page-title-row">
        <div>
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
        </div>

        {message && <p className="success-message" role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}
        {loading && <p>Loading policies...</p>}

        {!loading && !error && (
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
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.map((policy) => (
                  <tr key={policy.policyId}>
                    <td className="claim-id">{policy.policyNumber}</td>
                    <td className="customer-name">{policy.policyName}</td>
                    <td>{policy.policyType}</td>
                    <td className="amount">
                      {formatCurrency(policy.premiumAmount)}
                    </td>
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
                        <button
                          type="button"
                          className="primary-button"
                          disabled={
                            policy.status !== "Active" ||
                            purchasingId === policy.policyId
                          }
                          onClick={() => handlePurchase(policy)}
                        >
                          <ShoppingCart size={15} />
                          {purchasingId === policy.policyId
                            ? "Processing..."
                            : "Purchase"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredPolicies.length === 0 && (
                  <tr>
                    <td colSpan={isCustomer ? 7 : 6}>
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
                {paymentProcessing ? "Processing payment..." : `Pay ${formatCurrency(paymentSession.amount)}`}
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
