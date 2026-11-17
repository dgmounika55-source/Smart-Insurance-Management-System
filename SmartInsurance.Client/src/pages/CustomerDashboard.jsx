import { useEffect, useState } from "react";
import {
  ShieldCheck,
  FileText,
  Clock,
  Wallet,
  Bell,
  CheckCheck
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../services/api";
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
} from "../services/notificationService";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount ?? 0);

export default function CustomerDashboard() {
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [policyResponse, claimResponse] = await Promise.all([
          api.get("/customerpolicies/my"),
          api.get("/claims")
        ]);

        setPolicies(policyResponse.data);
        setClaims(claimResponse.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load your account details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const [response, countResponse] = await Promise.all([
          getNotifications(),
          getUnreadCount()
        ]);
        setNotifications(response.data);
        setUnreadCount(countResponse.data.unreadCount);
      } catch (err) {
        console.error("Unable to load notifications.", err);
      }
    }

    loadNotifications();
  }, []);

  async function handleMarkAsRead(notificationId) {
    try {
      await markNotificationAsRead(notificationId);

      const selectedNotification = notifications.find(
        notification => notification.notificationId === notificationId
      );

      setNotifications(previous =>
        previous.map(notification =>
          notification.notificationId === notificationId
            ? { ...notification, isRead: true }
            : notification
        )
      );

      if (selectedNotification && !selectedNotification.isRead) {
        setUnreadCount(previous => Math.max(0, previous - 1));
      }
    } catch (err) {
      window.alert("Unable to update notification.");
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();

      setNotifications(previous =>
        previous.map(notification => ({
          ...notification,
          isRead: true
        }))
      );
      setUnreadCount(0);
    } catch (err) {
      window.alert("Unable to update notifications.");
    }
  }

  const activePolicies = policies.filter(
    item => item.status === "Active"
  );

  const totalCoverage = activePolicies.reduce(
    (total, item) => total + (item.policy?.coverageAmount ?? 0),
    0
  );

  const pendingClaims = claims.filter(
    item => ["Submitted", "UnderReview", "DocumentsRequired"].includes(item.status)
  ).length;

  if (loading) return <p className="page-message">Loading your dashboard...</p>;
  if (error) return <p className="page-message error-message">{error}</p>;

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">CUSTOMER WORKSPACE</p>
          <h1>Welcome, {localStorage.getItem("userName") || "Customer"}!</h1>
          <p className="subtitle">
            Manage your insurance policies and track your claims.
          </p>
        </div>

        <div className="customer-header-actions">
          <div className="notification-wrapper">
            <button
              type="button"
              className="notification-bell"
              onClick={async () => {
                const willOpen = !notificationOpen;
                setNotificationOpen(willOpen);

                if (willOpen) {
                  try {
                    const [response, countResponse] = await Promise.all([
                      getNotifications(),
                      getUnreadCount()
                    ]);
                    setNotifications(response.data);
                    setUnreadCount(countResponse.data.unreadCount);
                  } catch (err) {
                    console.error("Unable to refresh notifications.", err);
                  }
                }
              }}
              aria-label="Notifications"
            >
              <Bell size={21} />
              {unreadCount > 0 && (
                <span className="notification-count">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="notification-dropdown">
                <div className="notification-heading">
                  <div>
                    <h3>Notifications</h3>
                    <p>{unreadCount} unread</p>
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="mark-all-read"
                      onClick={handleMarkAllAsRead}
                    >
                      <CheckCheck size={15} />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <p className="notification-empty">
                      No notifications yet.
                    </p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.notificationId}
                        className={`notification-item ${notification.isRead ? "read" : "unread"}`}
                      >
                        <div className="notification-item-content">
                          <strong>{notification.title}</strong>
                          <p>{notification.message}</p>
                          <small>
                            {new Date(notification.createdAt).toLocaleString("en-IN")}
                          </small>
                        </div>

                        {!notification.isRead && (
                          <button
                            type="button"
                            className="mark-read-button"
                            onClick={() => handleMarkAsRead(notification.notificationId)}
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/policies" className="primary-button">
            Explore Policies
          </Link>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><ShieldCheck size={21} /></div>
          <p>Active Policies</p>
          <h2>{activePolicies.length}</h2>
          <span className="stat-note">Your active insurance plans</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><FileText size={21} /></div>
          <p>Total Claims</p>
          <h2>{claims.length}</h2>
          <span className="stat-note">Claims you have submitted</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><Clock size={21} /></div>
          <p>Pending Claims</p>
          <h2>{pendingClaims}</h2>
          <span className="stat-note">Awaiting processing</span>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Wallet size={21} /></div>
          <p>Total Coverage</p>
          <h2>{currency(totalCoverage)}</h2>
          <span className="stat-note">Coverage from active policies</span>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h3>My Insurance Policies</h3>
            <p>Your purchased insurance plans</p>
          </div>
          <Link to="/policies" className="view-all">View policies</Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>REFERENCE</th>
                <th>POLICY NAME</th>
                <th>PREMIUM</th>
                <th>COVERAGE</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {policies.length === 0 ? (
                <tr><td colSpan="5">You haven't purchased any policies yet.</td></tr>
              ) : policies.map(item => (
                <tr key={item.customerPolicyId}>
                  <td className="claim-id">{item.policyReference}</td>
                  <td>{item.policy?.policyName || item.policy?.policyType || "Insurance Policy"}</td>
                  <td>{currency(item.policy?.premiumAmount)}</td>
                  <td>{currency(item.policy?.coverageAmount)}</td>
                  <td>
                    <span className={`status ${item.status?.toLowerCase()}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading table-heading">
          <div>
            <h3>My Recent Claims</h3>
            <p>Track the progress of your submitted claims</p>
          </div>
          <Link to="/claims" className="view-all">View claims</Link>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>CLAIM NUMBER</th>
                <th>CLAIM AMOUNT</th>
                <th>SUBMITTED</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 ? (
                <tr><td colSpan="4">You haven't submitted any claims yet.</td></tr>
              ) : claims.slice(0, 5).map(claim => (
                <tr key={claim.claimId}>
                  <td className="claim-id">{claim.claimNumber}</td>
                  <td>{currency(claim.claimAmount)}</td>
                  <td>
                    {claim.submissionDate
                      ? new Date(claim.submissionDate).toLocaleDateString("en-IN")
                      : "Ã¢â‚¬â€"}
                  </td>
                  <td>
                    <span className={`status ${claim.status?.toLowerCase()}`}>
                      {claim.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}