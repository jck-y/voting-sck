import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/login.css";

export default function LoginPage() {
  const [email, setEmail]   = useState("");
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("Email wajib diisi"); return; }

    setLoad(true);
    try {
      // Dokumen voters/{email}
      const ref  = doc(db, "voters", email.toLowerCase());
      const snap = await getDoc(ref);

      if (!snap.exists())        { setError("Email tidak terdaftar."); }
      else if (!snap.data().allowed) { setError("Akses ditolak."); }
      else if (snap.data().voted)    { setError("Email ini sudah melakukan vote."); }
      else {
        sessionStorage.setItem("voterEmail", email.toLowerCase());
        navigate("/candidates");
      }
    } catch (e) {
      console.error(e);
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoad(false);
    }
  };

  const onKey = (e) => { if (e.key === "Enter") handleLogin(); };

  return (
    <div className="login-page">
    <div className="login-container">
      <h2>Pemilihan OSIS</h2>
      <p className="subtitle">Masukkan email yang terdaftar untuk mengikuti voting.</p>

      <input
        type="email"
        placeholder="nama@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={onKey}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Memeriksa..." : "Masuk"}
      </button>

      {error && <p className="error">{error}</p>}
    </div>
    </div>
  );
}
