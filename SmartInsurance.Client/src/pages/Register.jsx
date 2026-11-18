import { useState } from "react";
import { ShieldCheck, User, Mail, LockKeyhole, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../services/authService";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  function update(e) {
    setForm((previous) => ({ ...previous, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const data = await registerUser({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
        role: "Customer"
      });

      setSuccess(data.message || "Registration successful. Please log in.");

      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.errors?.join(", ") ||
        "Registration failed. Please try again.";

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
        <div className="auth-icon"><User size={24}/></div>
        <h1>Create your account</h1>
        <p className="auth-subtitle">
          Register to manage your insurance policies and claims.
        </p>

        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <div className="auth-input">
            <User size={17}/>
            <input
              name="fullName"
              placeholder="Enter your full name"
              value={form.fullName}
              onChange={update}
              required
            />
          </div>

          <label>Email address</label>
          <div className="auth-input">
            <Mail size={17}/>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={update}
              required
            />
          </div>

          <label>Password</label>
          <div className="auth-input">
            <LockKeyhole size={17}/>
            <input
              name="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={update}
              required
            />
          </div>

          <label>Confirm password</label>
          <div className="auth-input">
            <LockKeyhole size={17}/>
            <input
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={update}
              required
            />
          </div>

          {error && <p role="alert" className="auth-error">{error}</p>}
          {success && <p role="status" className="auth-success">{success}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight size={17}/>}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>

      <p className="auth-footer">
        © 2026 InsureFlow. Secure insurance management.
      </p>
    </div>
  );
}
