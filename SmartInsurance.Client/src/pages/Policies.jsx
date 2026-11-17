import { useEffect, useState } from "react";
import { ShieldCheck, Search, ShoppingCart } from "lucide-react";
import api from "../services/api";

export default function Policies() {
  const [policies, setPolicies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [purchasingId, setPurchasingId] = useState(null);

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

  async function handlePurchase(policy) {
    const confirmed = window.confirm(
      `Do you want to purchase ${policy.policyName}?\n\nPremium: ${formatCurrency(policy.premiumAmount)}\nCoverage: ${formatCurrency(policy.coverageAmount)}`
    );

    if (!confirmed) return;

    try {
      setPurchasingId(policy.policyId);
      setMessage("");
      setError("");

      const response = await api.post("/customerpolicies/purchase", {
        policyId: policy.policyId
      });

      setMessage(
        `${response.data.message} Your policy reference is ${response.data.policyReference}.`
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Policy purchase failed. Please try again."
      );
    } finally {
      setPurchasingId(null);
    }
  }

  const filteredPolicies = policies.filter((policy) =>
    `${policy.policyNumber} ${policy.policyName} ${policy.policyType}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount ?? 0);
  }

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
    </div>
  );
}
