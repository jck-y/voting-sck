import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/login.css";
import logo from "../assets/logo/logosck.svg";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    const value = email.trim().toLowerCase();

    // Admin shortcut
    if (value === "scklabat") {
      sessionStorage.removeItem("voterEmail");
      navigate("/admin");
      return;
    }

    if (!value) {
      setError("Email is required.");
      return;
    }

    setLoad(true);
    try {
      // Check Firestore: voters/{email}
      const ref = doc(db, "voters", value);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setError("Email is not registered.");
      } else if (!snap.data().allowed) {
        setError("Access denied.");
      } else if (snap.data().voted) {
        setError("This email has already voted.");
      } else {
        sessionStorage.setItem("voterEmail", value);
        navigate("/candidates");
      }
    } catch (e) {
      console.error(e);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoad(false);
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

return (
  <div className="login-page">
    <div className="login-container" role="form" aria-label="OSIS Election Login">
      <img src={logo} alt="OSIS Logo" className="login-logo" />

      <h2>OSIS Election Portal</h2>
      <p className="subtitle">
        Please enter your registered email to participate. Each email can submit exactly one vote
      </p>

      <input
        type="email"
        placeholder="name@student.citrakasih.sch.id"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={onKey}
        autoComplete="email"
        aria-label="Email address"
        inputMode="email"
      />

      <button onClick={handleLogin} disabled={loading} aria-busy={loading}>
        {loading ? "Checking…" : "Enter"}
      </button>

      {error && <p className="error" role="alert">{error}</p>}
    </div>
  </div>
);

}
