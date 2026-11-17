import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  FileText,
  ShieldCheck,
  Users
} from "lucide-react";
import api from "../services/api";

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get("/dashboard/summary");
        setData(response.data);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? "You do not have permission to view reports."
            : "Unable to load reports. Please log in as Admin or Claims Manager."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(amount ?? 0);

  const reports = data
    ? [
        {
          title: "Policy Summary",
          description: "Overview of active insurance policies.",
          icon: ShieldCheck,
          value: data.totalPolicies.toLocaleString("en-IN")
        },
        {
          title: "Claims Report",
          description: "Total claims submitted for processing.",
          icon: FileText,
          value: data.totalClaims.toLocaleString("en-IN")
        },
        {
          title: "Customer Report",
          description: "Total registered customers.",
          icon: Users,
          value: data.totalCustomers.toLocaleString("en-IN")
        },
        {
          title: "Performance Report",
          description: "Claims approved out of total submitted claims.",
          icon: ChartNoAxesCombined,
          value: `${data.totalClaims
            ? ((data.approvedClaims / data.totalClaims) * 100).toFixed(1)
            : 0}%`
        }
      ]
    : [];

  return (
    <div className="page-section">
      <div className="page-title-row">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Monitor insurance operations and business performance.</p>
        </div>
      </div>

      {loading ? (
        <p className="page-message">Loading reports...</p>
      ) : error ? (
        <p className="page-message error-message">{error}</p>
      ) : (
        <>
          <div className="report-grid">
            {reports.map((report) => {
              const Icon = report.icon;

              return (
                <div className="panel report-card" key={report.title}>
                  <div className="stat-icon blue">
                    <Icon size={22} />
                  </div>
                  <h3>{report.title}</h3>
                  <p>{report.description}</p>
                  <strong>{report.value}</strong>
                  <span>Live dashboard metric</span>
                </div>
              );
            })}
          </div>

          <div className="panel" style={{ marginTop: "24px", padding: "24px" }}>
            <h3>Claims Financial Summary</h3>
            <p>Total claim amount: <strong>{formatCurrency(data.totalClaimAmount)}</strong></p>
            <p>Approved claim amount: <strong>{formatCurrency(data.approvedClaimAmount)}</strong></p>
            <p>Pending claims: <strong>{data.pendingClaims}</strong></p>
            <p>Approved claims: <strong>{data.approvedClaims}</strong></p>
            <p>Rejected claims: <strong>{data.rejectedClaims}</strong></p>
          </div>
        </>
      )}
    </div>
  );
}
