import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ShieldCheck, Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import api from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const email = params.get("email") || "";
  const token = params.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!email || !token) {
      setError("Invalid or missing password reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/account/reset-password", {
        email,
        token,
        newPassword
      });

      setMessage(response.data.message);

      window.history.replaceState({}, document.title, "/reset-password");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to reset password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-icon"><ShieldCheck size={27} /></div>
        <div><h2>InsureFlow</h2><span>INSURANCE PLATFORM</span></div>
      </div>

      <div className="auth-card">
        <div className="auth-icon"><Lock size={24} /></div>
        <h1>Reset Password</h1>
        <p className="auth-subtitle">
          Create a new password for your InsureFlow account.
        </p>

        <form onSubmit={handleSubmit}>
          <label>New Password</label>
          <div className="auth-input">
            <Lock size={17} />
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          <label>Confirm New Password</label>
          <div className="auth-input">
            <Lock size={17} />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>

          {message && (
            <p className="success-message">
              <CheckCircle2 size={16} /> {message}
            </p>
          )}

          {error && <p role="alert" className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login"><ArrowLeft size={14} /> Back to Sign In</Link>
        </p>
      </div>

      <p className="auth-footer">
         2026 InsureFlow. Secure insurance management.
      </p>
    </div>
  );
}