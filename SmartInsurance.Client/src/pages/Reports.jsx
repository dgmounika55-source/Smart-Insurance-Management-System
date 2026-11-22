import { useEffect, useState } from "react";
import {
  ChartNoAxesCombined,
  Download,
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


  const exportReports = async () => {
    if (!data) return;

    const rows = [
      ["Report", "Value"],
      ["Total Policies", data.totalPolicies ?? 0],
      ["Total Claims", data.totalClaims ?? 0],
      ["Total Customers", data.totalCustomers ?? 0],
      ["Claims Approval Rate", `${data.totalClaims ? ((data.approvedClaims / data.totalClaims) * 100).toFixed(1) : 0}%`],
      ["Total Claim Amount (INR)", data.totalClaimAmount ?? 0],
      ["Approved Claim Amount (INR)", data.approvedClaimAmount ?? 0],
      ["Pending Claims", data.pendingClaims ?? 0],
      ["Approved Claims", data.approvedClaims ?? 0],
      ["Rejected Claims", data.rejectedClaims ?? 0],
      ["Cancelled Claims", data.cancelledClaims ?? 0]
    ];

    const csv = rows
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;"
    });

    if (window.showSaveFilePicker) {
      try {
        const fileHandle = await window.showSaveFilePicker({
          suggestedName: "InsureFlow_Reports.csv",
          types: [{
            description: "CSV File",
            accept: { "text/csv": [".csv"] }
          }]
        });

        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Save dialog failed:", err);
        alert("Unable to open Save As. Please try again.");
        return;
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "InsureFlow_Reports.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
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
      <div className="page-title-row consistent-page-header report-page-header">
        <div>
          <div className="page-breadcrumb">ANALYTICS / REPORTS</div>
          <h1>Reports & Analytics</h1>
          <p>Monitor insurance operations and business performance.</p>
        </div>
        <button
          type="button"
          className="report-export-button"
          onClick={exportReports}
          disabled={!data || loading || !!error}
        >
          <Download size={17} />
          Export CSV
        </button>
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

                    <section className="report-financial-layout panel">
            <div className="report-section-heading">
              <div className="report-financial-heading">
                <div>
                  <h3>Financial Overview</h3>
                  <p>Summary of insurance claim amounts.</p>
                </div>
                <span className="report-live-indicator">
                  <span></span> LIVE DATA
                </span>
              </div>
            </div>

            <div className="report-financial-grid">
              <div className="report-financial-card total">
                <div className="report-financial-top">
                  <span>Total Claim Amount</span>
                  <span className="report-financial-icon"><FileText size={19} /></span>
                </div>
                <strong>{formatCurrency(data.totalClaimAmount)}</strong>
              </div>

              <div className="report-financial-card approved">
                <div className="report-financial-top">
                  <span>Approved Claim Amount</span>
                  <span className="report-financial-icon"><ShieldCheck size={19} /></span>
                </div>
                <strong>{formatCurrency(data.approvedClaimAmount)}</strong>
              </div>
            </div>
          </section>

          <div className="panel" style={{ marginTop: "24px", padding: "24px" }}>
            <h3>Claims Status Analytics</h3>
            <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "20px" }}>Live distribution of insurance claims by status.</p>
            {[
              { label: "Pending", value: data.pendingClaims, color: "#f59e0b" },
              { label: "Approved", value: data.approvedClaims, color: "#22c55e" },
              { label: "Rejected", value: data.rejectedClaims, color: "#ef4444" },
              { label: "Cancelled", value: data.cancelledClaims, color: "#a78bfa" }
            ].map((item) => {
              const percentage = data.totalClaims
                ? (item.value / data.totalClaims) * 100
                : 0;
              return (
                <div key={item.label} style={{ marginBottom: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                    <strong>{item.label}</strong>
                    <span>{item.value} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: "9px", background: "#26354d", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${percentage}%`, height: "100%", background: item.color, borderRadius: "10px", transition: "width .3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
