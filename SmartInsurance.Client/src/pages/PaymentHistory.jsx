import { useEffect, useState } from "react";
import { ReceiptText, CheckCircle2, XCircle, Clock, CreditCard } from "lucide-react";
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
    : "—";

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    (total, payment) => total + payment.amount,
    0
  );

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <CheckCircle2 size={15} />;
      case "failed":
        return <XCircle size={15} />;
      default:
        return <Clock size={15} />;
    }
  };

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ACCOUNT ACTIVITY</p>
          <h1>Payment History</h1>
          <p className="subtitle">
            View and track all your insurance policy payment transactions.
          </p>
        </div>
        <div className="stat-icon blue">
          <ReceiptText size={23} />
        </div>
      </section>

      {loading ? (
        <p className="page-message">Loading payment history...</p>
      ) : error ? (
        <p className="page-message error-message">{error}</p>
      ) : (
        <>
          <section className="stats-grid">
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
              <span className="stat-note">{payments.length} transactions</span>
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
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan="6">No payment transactions found.</td>
                    </tr>
                  ) : (
                    payments.map((payment) => (
                      <tr key={payment.paymentId}>
                        <td className="claim-id">{payment.transactionReference}</td>
                        <td className="customer-name">{payment.policyName}</td>
                        <td className="amount">{formatCurrency(payment.amount)}</td>
                        <td>{formatDate(payment.createdAt)}</td>
                        <td>{payment.policyReference || "—"}</td>
                        <td>
                          <span className={`status ${payment.status?.toLowerCase() || "pending"}`}>
                            {getStatusIcon(payment.status)}
                            {payment.status || "Pending"}
                          </span>
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
    </>
  );
}
