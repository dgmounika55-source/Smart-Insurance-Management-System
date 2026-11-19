import { useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, ArrowLeft, Send } from "lucide-react";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/account/forgot-password", { email });
      setMessage(response.data.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to process your request. Please try again later."
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
        <div className="auth-icon"><Mail size={24} /></div>
        <h1>Forgot Password?</h1>
        <p className="auth-subtitle">
          Enter your registered email address. If an account exists,
          we will send password reset instructions.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <div className="auth-input">
            <Mail size={17} />
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={event => setEmail(event.target.value)}
              required
            />
          </div>

          {message && <p className="success-message">{message}</p>}
          {error && <p role="alert" className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
            {!loading && <Send size={17} />}
          </button>
        </form>

        <p className="auth-switch">
          <Link to="/login"><ArrowLeft size={14} /> Back to Sign In</Link>
        </p>
      </div>

      <p className="auth-footer">
        © 2026 InsureFlow. Secure insurance management.
      </p>
    </div>
  );
}
