import { useEffect, useState } from "react";
import {
  ReceiptText, CheckCircle2, XCircle, Clock, CreditCard, Eye, X
} from "lucide-react";
import api from "../services/api";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount ?? 0);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get("/payments/my");
        setPayments(response.data);
      } catch {
        setError("Unable to load payment history. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const paidPayments = payments.filter(
    (payment) => payment.status?.toLowerCase() === "paid"
  );

  const failedPayments = payments.filter(
    (payment) => payment.status?.toLowerCase() === "failed"
  );



  const totalPaid = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount || 0),
    0
  );

  const filteredPayments = payments.filter((payment) => {
    const status = payment.status?.toLowerCase();
    if (activeFilter === "paid") return status === "paid";
    if (activeFilter === "failed") return status === "failed";
    return true;
  });

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid": return <CheckCircle2 size={15} />;
      case "failed": return <XCircle size={15} />;
      default: return <Clock size={15} />;
    }
  };

  return (
    <>
      <section className="welcome-row consistent-page-header">
        <div>
          <div className="page-breadcrumb">ACCOUNT / PAYMENT HISTORY</div>
          <p className="eyebrow">ACCOUNT ACTIVITY</p>
          <h1>Payment History</h1>
          <p className="subtitle">
            View and track all your insurance policy payment transactions.
          </p>
        </div>
        <div className="stat-icon blue"><ReceiptText size={23} /></div>
      </section>

      {loading ? (
        <p className="page-message">Loading payment history...</p>
      ) : error ? (
        <p className="page-message error-message">{error}</p>
      ) : (
        <>
          <section className="stats-grid payment-history-stats">
            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon green"><CheckCircle2 size={21} /></div>
              </div>
              <p>Successful Payments</p>
              <h2>{paidPayments.length}</h2>
              <span className="stat-note">Completed transactions</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon orange"><XCircle size={21} /></div>
              </div>
              <p>Failed Payments</p>
              <h2>{failedPayments.length}</h2>
              <span className="stat-note">Unsuccessful transactions</span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <div className="stat-icon blue"><CreditCard size={21} /></div>
              </div>
              <p>Total Amount Paid</p>
              <h2>{formatCurrency(totalPaid)}</h2>
              <span className="stat-note">Across successful payments</span>
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-heading table-heading">
              <div>
                <h3>All Transactions</h3>
                <p>Your insurance payment records</p>
              </div>
              <span className="stat-note">{filteredPayments.length} transactions</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>TRANSACTION REFERENCE</th>
                    <th>POLICY</th>
                    <th>AMOUNT</th>
                    <th>PAYMENT DATE</th>
                    <th>POLICY REFERENCE</th>
                    <th>STATUS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        No {activeFilter === "all" ? "" : activeFilter + " "}payment transactions found.
                      </td>
                    </tr>
                  ) : (
                    filteredPayments.map((payment) => (
                      <tr key={payment.paymentId}>
                        <td className="claim-id">{payment.transactionReference}</td>
                        <td className="customer-name">{payment.policyName}</td>
                        <td className="amount">{formatCurrency(payment.amount)}</td>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td>{payment.status?.toLowerCase() === "failed" ? "N/A" : (payment.policyReference || "N/A")}</td>
                        <td>
                          <button
                            type="button"
                            className={`status status-filter-button ${payment.status?.toLowerCase() || "pending"} ${activeFilter === payment.status?.toLowerCase() ? "status-filter-active" : ""}`}
                            onClick={() => {
                              const status = payment.status?.toLowerCase();
                              if (status === "paid" || status === "failed") {
                                setActiveFilter(activeFilter === status ? "all" : status);
                              }
                            }}
                            disabled={!["paid", "failed"].includes(payment.status?.toLowerCase())}
                          >
                            {getStatusIcon(payment.status)}
                            {payment.status || "Pending"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className="payment-view-button"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <Eye size={15} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {selectedPayment && (
        <div className="payment-details-overlay" onClick={() => setSelectedPayment(null)}>
          <section
            className="payment-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-details-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="payment-details-header">
              <div>
                <p className="eyebrow">TRANSACTION INFORMATION</p>
                <h2 id="payment-details-title">Payment Details</h2>
              </div>
              <button
                type="button"
                className="payment-details-close"
                aria-label="Close payment details"
                onClick={() => setSelectedPayment(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="payment-details-status">
              <span className={`status ${selectedPayment.status?.toLowerCase() || "pending"}`}>
                {getStatusIcon(selectedPayment.status)}
                {selectedPayment.status || "Pending"}
              </span>
            </div>

            <div className="payment-details-amount">
              <span>Transaction Amount</span>
              <strong>{formatCurrency(selectedPayment.amount)}</strong>
            </div>

            <div className="payment-details-grid">
              <div>
                <span>Transaction Reference</span>
                <strong>{selectedPayment.transactionReference || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</strong>
              </div>
              <div>
                <span>Payment ID</span>
                <strong>{selectedPayment.paymentId ?? "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</strong>
              </div>
              <div>
                <span>Policy Name</span>
                <strong>{selectedPayment.policyName || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</strong>
              </div>
              <div>
                <span>Policy Reference</span>
                <strong>{selectedPayment.policyReference || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</strong>
              </div>
              <div>
                <span>Payment Method</span>
                <strong>{selectedPayment.paymentMethod || "ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â"}</strong>
              </div>
              <div>
                <span>Transaction Date</span>
                <strong>{formatDate(selectedPayment.createdAt)}</strong>
              </div>
              <div>
                <span>Payment Completion Date</span>
                <strong>{formatDate(selectedPayment.paidAt)}</strong>
              </div>
            </div>

            <button
              type="button"
              className="payment-details-done"
              onClick={() => setSelectedPayment(null)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </>
  );
}
