import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { CANDIDATES } from "../data/candidates";
import "../styles/candidates.css";
import logo from "../assets/logo/logosck.svg";

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
    if (busy || !email) return; // prevent spam
    setBusy(true);
    setPicked(candidateId);

    try {
      await sleep(1200);

      await runTransaction(db, async (tx) => {
        const studentRef = doc(db, "voters", email);
        const teacherRef = doc(db, "voters_teacher_jhs", email);

        // read both; pick whichever exists
        const [stuSnap, tchSnap] = await Promise.all([
          tx.get(studentRef),
          tx.get(teacherRef),
        ]);

        let targetRef, targetSnap;
        if (stuSnap.exists()) {
          targetRef = studentRef;
          targetSnap = stuSnap;
        } else if (tchSnap.exists()) {
          targetRef = teacherRef;
          targetSnap = tchSnap;
        } else {
          throw new Error("Email is not registered.");
        }

        const voter = targetSnap.data();
        if (!voter.allowed) throw new Error("Access denied.");
        if (voter.voted) throw new Error("This email has already voted.");

        // write vote doc and mark as voted
        const voteRef = doc(db, "votes", email);
        tx.set(voteRef, { email, candidateId, ts: serverTimestamp() });
        tx.update(targetRef, {
          voted: true,
          votedAt: serverTimestamp(),
          candidateId,
        });
      });

      sessionStorage.removeItem("voterEmail");
      navigate("/");
    } catch (e) {
      alert(e.message || "Failed to record your vote.");
      setBusy(false);
      setPicked(null);
    }
  };

  return (
    <div className="candidates-wrapper" aria-busy={busy}>
      <div className="candidates-page">
        <header className="cp-header">
          <img src={logo} alt="" className="cp-logo" />
        </header>

        <div className="cp-hero">
          <h1>Vote for Your Student Council Representative</h1>
          <p>Please choose exactly one candidate. Your choice will be recorded securely.</p>
        </div>

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
      </div>

      {busy && (
        <div className="cp-overlay" role="alert" aria-live="assertive">
          <div className="cp-popup">
            <div className="cp-spinner" aria-hidden />
            <div className="cp-popup-text">
              Recording your vote… please wait
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
