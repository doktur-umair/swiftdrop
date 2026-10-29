import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { errorMessage, verifyEmail } from "./client.js";

export function VerifyEmail() {
  const [token, setToken] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  useEffect(() => {
    const value =
      new URLSearchParams(location.hash.slice(1)).get("token") ?? "";
    history.replaceState(null, "", `${location.pathname}${location.search}`);
    setToken(value);
    if (!value)
      setMessage(
        "This verification link is missing or invalid. Request a new one from sign in.",
      );
  }, []);
  async function confirm() {
    setPending(true);
    setMessage("");
    try {
      const result = await verifyEmail(token);
      setSuccess(true);
      setMessage(result.message);
    } catch (error) {
      setMessage(errorMessage(error));
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="auth-panel" aria-labelledby="verify-title">
      <span className="eyebrow">Email verification</span>
      <h1 id="verify-title">Confirm your email.</h1>
      <p className="muted">
        Confirm only if you requested this SwiftDrop account. Links expire after
        24 hours.
      </p>
      {token && (
        <button
          className="primary"
          disabled={pending || success}
          onClick={() => void confirm()}
        >
          {pending ? "Checking…" : "Verify email"}
        </button>
      )}
      <p
        role={success ? "status" : "alert"}
        aria-live="polite"
        className={message ? `notice ${success ? "success" : "error"}` : ""}
      >
        {message}
      </p>
      <Link className="inline-link" to="/auth/login">
        Continue to sign in →
      </Link>
    </section>
  );
}
