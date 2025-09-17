import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { ACTIVE_ELECTION } from "../config";
import "../styles/candidates.css";
import logo from "../assets/logo/logosck.svg";

export default function CandidatesPage() {
  const navigate = useNavigate();
  const email = sessionStorage.getItem("voterEmail");
  const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    if (!email) navigate("/");
  }, [email, navigate]);

  useEffect(() => {
    // load candidates from Firestore
    (async () => {
      const snap = await getDocs(collection(db, "elections", ACTIVE_ELECTION, "candidates"));
      const list = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      // sort by numeric id if doc ids are numbers
      list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setCandidates(list);
    })();
  }, []);

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const vote = async (candidateId) => {
    if (busy || !email) return;
    setBusy(true);
    setPicked(candidateId);

    try {
      await sleep(800);

      await runTransaction(db, async (tx) => {
        const stuRef = doc(db, "elections", ACTIVE_ELECTION, "voters_students", email);
        const tchRef = doc(db, "elections", ACTIVE_ELECTION, "voters_teachers", email);

        const [stuSnap, tchSnap] = await Promise.all([ tx.get(stuRef), tx.get(tchRef) ]);

        let voterRef, voterSnap;
        if (stuSnap.exists()) { voterRef = stuRef; voterSnap = stuSnap; }
        else if (tchSnap.exists()) { voterRef = tchRef; voterSnap = tchSnap; }
        else { throw new Error("Email is not registered for this election."); }

        const voter = voterSnap.data();
        if (!voter.allowed) throw new Error("Access denied.");
        if (voter.voted) throw new Error("This email has already voted.");

        const voteRef = doc(db, "elections", ACTIVE_ELECTION, "votes", email);
        tx.set(voteRef, { email, candidateId, ts: serverTimestamp() });
        tx.update(voterRef, { voted: true, votedAt: serverTimestamp(), candidateId });
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
          {candidates.map((c) => (
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
          {!candidates.length && <div style={{color:"#555"}}>Loading candidates…</div>}
        </section>
      </div>

      {busy && (
        <div className="cp-overlay" role="alert" aria-live="assertive">
          <div className="cp-popup">
            <div className="cp-spinner" aria-hidden />
            <div className="cp-popup-text">Recording your vote… please wait</div>
          </div>
        </div>
      )}
    </div>
  );
}
