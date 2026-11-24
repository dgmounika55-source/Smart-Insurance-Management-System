import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmEmail } from "../services/authService";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const userId = searchParams.get("userId");
    const token = searchParams.get("token");

    if (!userId || !token) {
      setStatus("This verification link is invalid or incomplete.");
      return;
    }

    confirmEmail({ userId, token })
      .then((response) => {
        setStatus(response.message || "Email verified successfully.");
        setSuccess(true);
      })
      .catch((error) => {
        setStatus(
          error.response?.data?.message ||
          "Verification failed. The link may be invalid or expired."
        );
      });
  }, [searchParams]);

  return (
    <div style={{ maxWidth: "480px", margin: "100px auto", padding: "32px", textAlign: "center" }}>
      <h2>Email Verification</h2>
      <p>{status}</p>
      {success && <Link to="/login">Go to Login</Link>}
      {!success && <Link to="/login">Back to Login</Link>}
    </div>
  );
}
