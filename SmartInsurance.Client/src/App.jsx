import { useEffect, useState } from "react";
import {
  LayoutDashboard, ShieldCheck, FileText, Users, Settings,
  Search, Bell, ChevronRight, Activity, Wallet,
  ArrowUpRight, Clock, CheckCircle2, ClipboardList, Plus
} from "lucide-react";
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from "react-router-dom";
import Policies from "./pages/Policies";
import Claims from "./pages/Claims";
import Customers from "./pages/Customers";
import Reports from "./pages/Reports";
import CustomerDashboard from "./pages/CustomerDashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import api from "./services/api";
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount ?? 0);

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
    : "ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â";

const formatStatus = (status) => {
  if (status === "UnderReview") return "Under Review";
  return status || "Unknown";
};

function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [statusSummary, setStatusSummary] = useState([]);
  const [recentClaims, setRecentClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryResponse, statusResponse, claimsResponse] =
          await Promise.all([
            api.get("/dashboard/summary"),
            api.get("/dashboard/claim-status"),
            api.get("/dashboard/recent-claims")
          ]);

        setSummary(summaryResponse.data);
        setStatusSummary(statusResponse.data);
        setRecentClaims(claimsResponse.data);
      } catch (err) {
        setError(
          err.response?.status === 403
            ? "You do not have permission to view the dashboard."
            : "Unable to load dashboard data. Please log in as Admin or Claims Manager."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusCount = (status) =>
    statusSummary.find((item) => item.status === status)?.count ?? 0;

  const totalClaims = summary?.totalClaims ?? 0;
  const approved = getStatusCount("Approved");
  const rejected = getStatusCount("Rejected");
  const pending = getStatusCount("Submitted") + getStatusCount("UnderReview");

  const percentage = (value) =>
    totalClaims ? ((value / totalClaims) * 100).toFixed(1) : "0";

  const stats = summary
    ? [
        {
          title: "Active Policies",
          value: summary.totalPolicies,
          note: "Currently active policies",
          icon: ShieldCheck,
          color: "blue"
        },
        {
          title: "Total Claims",
          value: summary.totalClaims,
          note: "All submitted claims",
          icon: FileText,
          color: "purple"
        },
        {
          title: "Pending Claims",
          value: summary.pendingClaims,
          note: "Awaiting review",
          icon: Clock,
          color: "orange"
        },
        {
          title: "Approved Claims",
          value: summary.approvedClaims,
          note: "Successfully approved",
          icon: CheckCircle2,
          color: "green"
        }
      ]
    : [];

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric"
            }).toUpperCase()}
          </p>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">
            Welcome back! Here's what's happening with your insurance platform.
          </p>
        </div>
        <NavLink to="/policies" className="primary-button">
          <Plus size={18} /> View Policies
        </NavLink>
      </section>

      {loading ? (
        <p className="page-message">Loading dashboard...</p>
      ) : error ? (
        <p className="page-message error-message">{error}</p>
      ) : (
        <>
          <section className="stats-grid">
            {stats.map((item) => {
              const Icon = item.icon;

              return (
                <div className="stat-card" key={item.title}>
                  <div className="stat-top">
                    <div className={`stat-icon ${item.color}`}>
                      <Icon size={21} />
                    </div>
                  </div>
                  <p>{item.title}</p>
                  <h2>{item.value.toLocaleString("en-IN")}</h2>
                  <span className="stat-note">{item.note}</span>
                </div>
              );
            })}
          </section>

          <section className="middle-grid">
            <div className="panel claims-panel">
              <div className="panel-heading">
                <div>
                  <h3>Claims Activity</h3>
                  <p>Overview of claim processing status</p>
                </div>
              </div>

              <div className="activity-content">
                <div className="activity-total">
                  <strong>{totalClaims.toLocaleString("en-IN")}</strong>
                  <span>Total claims submitted</span>
                </div>

                <div className="progress-track">
                  <div
                    className="progress-approved"
                    style={{ width: `${percentage(approved)}%` }}
                  />
                  <div
                    className="progress-pending"
                    style={{ width: `${percentage(pending)}%` }}
                  />
                  <div
                    className="progress-rejected"
                    style={{ width: `${percentage(rejected)}%` }}
                  />
                </div>

                <div className="legend">
                  <span>
                    <i className="dot green-dot" /> Approved
                    <strong>{percentage(approved)}%</strong>
                  </span>
                  <span>
                    <i className="dot orange-dot" /> Pending
                    <strong>{percentage(pending)}%</strong>
                  </span>
                  <span>
                    <i className="dot red-dot" /> Rejected
                    <strong>{percentage(rejected)}%</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="panel payout-panel">
              <div className="panel-heading">
                <div>
                  <h3>Claim Payouts</h3>
                  <p>Total approved claim amount</p>
                </div>
                <div className="payout-icon">
                  <Wallet size={20} />
                </div>
              </div>

              <h2>{formatCurrency(summary.approvedClaimAmount)}</h2>
              <div className="payout-change">
                <ArrowUpRight size={16} />
                {summary.approvedClaims.toLocaleString("en-IN")}
                <span>approved claims</span>
              </div>
              <div className="payout-footer">
                <span>Total claim amount</span>
                <strong>{formatCurrency(summary.totalClaimAmount)}</strong>
              </div>
            </div>
          </section>

          <section className="panel table-panel">
            <div className="panel-heading table-heading">
              <div>
                <h3>Recent Claims</h3>
                <p>Latest insurance claims submitted by customers</p>
              </div>
              <NavLink to="/claims" className="view-all">
                View all claims <ArrowUpRight size={16} />
              </NavLink>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>CLAIM ID</th>
                    <th>CUSTOMER</th>
                    <th>SUBMITTED</th>
                    <th>CLAIM AMOUNT</th>
                    <th>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.length === 0 ? (
                    <tr>
                      <td colSpan="5">No claims available.</td>
                    </tr>
                  ) : (
                    recentClaims.map((claim) => (
                      <tr key={claim.claimId}>
                        <td className="claim-id">{claim.claimNumber}</td>
                        <td className="customer-name">{claim.customerName}</td>
                        <td>{formatDate(claim.submissionDate)}</td>
                        <td className="amount">
                          {formatCurrency(claim.claimAmount)}
                        </td>
                        <td>
                          <span
                            className={`status ${formatStatus(claim.status)
                              .toLowerCase()
                              .replaceAll(" ", "-")}`}
                          >
                            {formatStatus(claim.status)}
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

function AppLayout() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");
  const isStaff = ["Admin", "ClaimsManager"].includes(userRole);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><ShieldCheck size={25} /></div>
          <div><h2>InsureFlow</h2><span>INSURANCE PLATFORM</span></div>
        </div>

        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-menu">
          {isStaff ? (
            <>
              <NavLink end to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <LayoutDashboard size={19} />Dashboard
              </NavLink>
              <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <Users size={19} />Customers
              </NavLink>
              <NavLink to="/policies" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <ShieldCheck size={19} />Policies
              </NavLink>
              <NavLink to="/claims" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <FileText size={19} />Claims
              </NavLink>
              <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <ClipboardList size={19} />Reports
              </NavLink>
            </>
          ) : (
            <>
              <NavLink end to="/customer-dashboard" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <LayoutDashboard size={19} />Dashboard
              </NavLink>
              <NavLink to="/policies" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <ShieldCheck size={19} />Policies
              </NavLink>
              <NavLink to="/claims" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <FileText size={19} />Claims
              </NavLink>
            </>
          )}
        </nav>

        <div className="workspace-label settings-label">PREFERENCES</div>
        <nav className="nav-menu">
          <a className="nav-link" href="#settings"><Settings size={19} />Settings</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Activity size={20} /></div>
            <strong>Need assistance?</strong>
            <p>Contact your platform administrator for support.</p>
            <button>Get Support <ChevronRight size={15} /></button>
          </div>
          <div className="profile">
            <div className="avatar">AD</div>
            <div className="profile-info">
              <strong>{localStorage.getItem("userName") || "Admin User"}</strong>
              <span>{localStorage.getItem("userRole") || "Administrator"}</span>
            </div>
            <button type="button" onClick={handleLogout} className="logout-button">Logout</button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span><ChevronRight size={15} />
            <strong>Insurance Management</strong>
          </div>
          <div className="top-actions">
            <div className="search-box">
              <Search size={17} />
              <input placeholder="Search anything..." />
            </div>
            <button className="notification-button"><Bell size={19} /><i /></button>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={["Admin", "ClaimsManager"]} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["Customer"]} />}>
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["Customer", "Admin", "ClaimsManager"]} />}>
              <Route path="/policies" element={<Policies />} />
              <Route path="/claims" element={<Claims />} />
            </Route>
            <Route path="/access-denied" element={<div className="page-message"><h2>Access denied</h2><p>You do not have permission to view this page.</p><NavLink to="/policies">Return to Policies</NavLink></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <footer className="footer">
            <span>© 2026 InsureFlow. All rights reserved.</span>
            <span>Smart Insurance Management Platform <span className="footer-dot">?</span></span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function AppContent() {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userRole = localStorage.getItem("userRole");

  if (location.pathname === "/login") return <Login />;
  if (location.pathname === "/register") return <Register />;

  if (!token) return <Navigate to="/login" replace />;

  if (location.pathname === "/" && userRole === "Customer") {
    return <Navigate to="/customer-dashboard" replace />;
  }

  if (location.pathname === "/" && ["Admin", "ClaimsManager"].includes(userRole)) {
    return <AppLayout />;
  }

  return <AppLayout />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
