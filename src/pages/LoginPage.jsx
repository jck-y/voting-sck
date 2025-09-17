import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/login.css";
import bg from "../assets/logo/background.webp"; 

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoad] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function findVoterDoc(emailLower) {
    // try students first
    let ref = doc(db, "voters", emailLower);
    let snap = await getDoc(ref);
    if (snap.exists()) return { ref, snap, coll: "voters" };

    // then teachers
    ref = doc(db, "voters_teacher_jhs", emailLower);
    snap = await getDoc(ref);
    if (snap.exists()) return { ref, snap, coll: "voters_teacher_jhs" };

    return null;
  }

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
      const result = await findVoterDoc(value);

      if (!result) {
        setError("Email is not registered.");
      } else if (!result.snap.data().allowed) {
        setError("Access denied.");
      } else if (result.snap.data().voted) {
        setError("This email has already voted.");
      } else {
        // store email; the vote page will figure out which collection it belongs to
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

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div
      className="login-page"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="login-container" role="form" aria-label="OSIS Election Login">
        <h2>OSIS Election Portal</h2>
        <p className="subtitle">
          Enter your registered email to participate. One email, one secure vote.
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
