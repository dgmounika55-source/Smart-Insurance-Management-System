import { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", title: customTitle, onClose, duration = 4500 }) {
  useEffect(() => {
    if (!message) return;

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";
  const isDuplicatePolicy =
    !isSuccess && /already have an active policy|actively purchased|active policy/i.test(message);

  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  const title = customTitle || (isSuccess
    ? "Purchase Successful"
    : isDuplicatePolicy
      ? "Policy Already Active"
      : "Unable to Complete Request");

  const displayMessage = isDuplicatePolicy
    ? "You already have an active policy of this type. Please review your existing coverage before purchasing another policy."
    : message;

  return (
    <div
      className={`toast-notification ${isSuccess ? "toast-success" : "toast-error"}`}
      role={isSuccess ? "status" : "alert"}
    >
      <Icon size={22} className="toast-icon" />
      <div className="toast-content">
        <strong>{title}</strong>
        <p>{displayMessage}</p>
        <small>INSUREFLOW Â· POLICY NOTIFICATION</small>
      </div>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
}
