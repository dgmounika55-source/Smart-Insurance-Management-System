import { useState } from "react";
import { ShieldCheck, LockKeyhole, Mail, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await loginUser({ email, password });

      localStorage.setItem("token", data.token);
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userName", data.fullName);
      localStorage.setItem("userRole", data.role);

      navigate(data.role === "Customer" ? "/customer-dashboard" : "/");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        "Unable to log in. Please check your details or try again.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="brand-icon"><ShieldCheck size={27}/></div>
        <div><h2>InsureFlow</h2><span>INSURANCE PLATFORM</span></div>
      </div>

      <div className="auth-card">
        <div className="auth-icon"><LockKeyhole size={24}/></div>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to access your insurance account.</p>

        <form onSubmit={handleSubmit}>
          <label>Email address</label>
          <div className="auth-input">
            <Mail size={17}/>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <LockKeyhole size={17}/>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={17}/>}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Create account</Link>
        </p>
      </div>

      <p className="auth-footer">© 2026 InsureFlow. Secure insurance management.</p>
    </div>
  );
}
