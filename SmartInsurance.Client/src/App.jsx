import { lazy, Suspense, useEffect, useState } from "react";
import {
  LayoutDashboard, ShieldCheck, FileText, Users, Settings, ReceiptText,
  Bell, ChevronRight, Activity, Wallet,
  ArrowUpRight, Clock, CheckCircle2, ClipboardList, Plus,
  Search,
} from "lucide-react";
import { BrowserRouter, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from "react-router-dom";
const Policies = lazy(() => import("./pages/Policies"));
const Claims = lazy(() => import("./pages/Claims"));
const Customers = lazy(() => import("./pages/Customers"));
const Reports = lazy(() => import("./pages/Reports"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const PaymentHistory = lazy(() => import("./pages/PaymentHistory"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Support = lazy(() => import("./pages/Support"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [summaryResponse, statusResponse] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/claim-status")
        ]);

        setSummary(summaryResponse.data);
        setStatusSummary(statusResponse.data);
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
  const cancelled = getStatusCount("Cancelled");
  const pending = getStatusCount("Submitted") + getStatusCount("UnderReview");

  const percentage = (value) =>
    totalClaims ? ((value / totalClaims) * 100).toFixed(1) : "0";

  const stats = summary
    ? [
        {
          title: "Total Customers",
          value: summary.totalCustomers ?? 0,
          note: "Registered customers",
          icon: Users,
          color: "teal"
        },
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
      <section className="welcome-row consistent-page-header">
        <div>
          <div className="page-breadcrumb">OVERVIEW / DASHBOARD</div>
          <h1>Dashboard Overview</h1>
          <p className="subtitle">
            Welcome back! Here's what's happening with your insurance platform.
          </p>
        </div>
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
                  <div
                    className="progress-cancelled"
                    style={{ width: `${percentage(cancelled)}%` }}
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
                  <span>
                    <i className="dot purple-dot" /> Cancelled
                    <strong>{percentage(cancelled)}%</strong>
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
        </>
      )}
    </>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const userRole = localStorage.getItem("userRole");
  const isStaff = ["Admin", "ClaimsManager"].includes(userRole);
  const [profileOpen, setProfileOpen] = useState(false);
  const userName = localStorage.getItem("userName") || "User";
  const userInitials = userName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = userRole === "ClaimsManager" ? "Claims Manager" : userRole || "User";

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
          <div><h2>InsureFlow</h2><span>ENTERPRISE INSURANCE SOLUTIONS</span></div>
        </div>


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
              <NavLink to="/payment-history" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                <ReceiptText size={19} />Payment History
              </NavLink>
            </>
          )}
        </nav>


        <nav className="nav-menu">
          <NavLink to="/preferences" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}><Settings size={19} />Settings</NavLink>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Activity size={20} /></div>
            <strong>Need assistance?</strong>
            <p>Contact your platform administrator for support.</p>
            <button type="button" onClick={() => navigate("/support")}>Get Support <ChevronRight size={15} /></button>
          </div>

        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb"></div>
          <div className="top-actions">
            <div className="top-profile-wrapper">
              <button
                type="button"
                className="top-profile-trigger"
                onClick={() => setProfileOpen(!profileOpen)}
                aria-expanded={profileOpen}
                aria-label="Open user profile menu"
              >
                <span className="top-profile-avatar">{userInitials}</span>
                <span className="top-profile-text">
                  <strong>{userName}</strong>
                  <small>{roleLabel}</small>
                </span>
                <ChevronRight size={16} className={profileOpen ? "profile-chevron open" : "profile-chevron"} />
              </button>
              {profileOpen && (
                <div className="top-profile-dropdown">
                  <div className="dropdown-user-info">
                    <span className="top-profile-avatar">{userInitials}</span>
                    <div>
                      <strong>{userName}</strong>
                      <small>{roleLabel}</small>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button type="button" className="dropdown-logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Suspense fallback={<p className="page-message">Loading page...</p>}>
          <Routes>
            <Route element={<ProtectedRoute allowedRoles={["Admin", "ClaimsManager"]} />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/reports" element={<Reports />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["Customer"]} />}>
              <Route path="/customer-dashboard" element={<CustomerDashboard />} />
              <Route path="/payment-history" element={<PaymentHistory />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={["Customer", "Admin", "ClaimsManager"]} />}>
              <Route path="/policies" element={<Policies />} />
              <Route path="/claims" element={<Claims />} />
              <Route path="/preferences" element={<Preferences />} />
              <Route path="/support" element={<Support />} />
            </Route>
            <Route path="/access-denied" element={<div className="page-message"><h2>Access denied</h2><p>You do not have permission to view this page.</p><NavLink to="/policies">Return to Policies</NavLink></div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
          <footer className="footer">
            <span>{"\u00A9"} 2026 InsureFlow. All rights reserved.</span>
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
  if (location.pathname === "/forgot-password") return <ForgotPassword />;
  if (location.pathname === "/reset-password") return <ResetPassword />;

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
      <Suspense fallback={<p className="page-message">Loading InsureFlow...</p>}>
        <AppContent />
      </Suspense>
    </BrowserRouter>
  );
}
