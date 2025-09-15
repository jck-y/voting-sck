import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { CANDIDATES } from "../data/candidates";
import "../styles/candidates.css";

export default function CandidatesPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("voterEmail");
  const [busy, setBusy] = useState(false);       
  const [picked, setPicked] = useState(null);    

  useEffect(() => {
    if (!email) navigate("/");
  }, [email, navigate]);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const vote = async (candidateId) => {
    if (busy || !email) return; // cegah spam
    setBusy(true);
    setPicked(candidateId);

    try {
      await sleep(1200);

      await runTransaction(db, async (tx) => {
        const voterRef = doc(db, "voters", email);
        const voterSnap = await tx.get(voterRef);
        if (!voterSnap.exists()) throw new Error("Email tidak terdaftar.");
        const voter = voterSnap.data();
        if (!voter.allowed) throw new Error("Akses ditolak.");
        if (voter.voted) throw new Error("Email ini sudah vote.");

        const voteRef = doc(db, "votes", email);
        tx.set(voteRef, { email, candidateId, ts: serverTimestamp() });
        tx.update(voterRef, {
          voted: true,
          votedAt: serverTimestamp(),
          candidateId,
        });
      });

      sessionStorage.removeItem("voterEmail");
      navigate("/");
    } catch (e) {
      alert(e.message || "Gagal menyimpan vote.");
      setBusy(false);
      setPicked(null);
    }
  };

  return (
    <div className="candidates-page" aria-busy={busy}>
      <header className="cp-header">
        <h1>Pilih Kandidat OSIS</h1>
        <p className="cp-sub">Klik salah satu kandidat untuk memberikan suara.</p>
      </header>

      <section className={`cp-grid ${busy ? "disabled" : ""}`}>
        {CANDIDATES.map((c) => (
          <button
            key={c.id}
            className={`cp-card ${picked === c.id ? "picked" : ""}`}
            onClick={() => vote(c.id)}
            disabled={busy}
          >
            <div className="cp-img-wrap">
              <img src={c.image} alt={c.name} loading="lazy" />
            </div>
            <div className="cp-name">{c.name}</div>
          </button>
        ))}
      </section>

      {/* Overlay Loading Popup */}
      {busy && (
        <div className="cp-overlay" role="alert" aria-live="assertive">
          <div className="cp-popup">
            <div className="cp-spinner" aria-hidden />
            <div className="cp-popup-text">
              Merekam Vote Anda… mohon tunggu sebentar
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
