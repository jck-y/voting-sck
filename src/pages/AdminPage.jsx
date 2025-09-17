import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import { ACTIVE_ELECTION } from "../config";
import "../styles/admin.css";
import bg from "../assets/logo/background.webp";

export default function AdminPage() {
  const [candidates, setCandidates] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [lastVotes, setLastVotes] = useState([]);

  // map kandidat by id untuk lookup cepat
  const byId = useMemo(() => {
    const m = new Map();
    candidates.forEach((c) => m.set(String(c.id), c));
    return m;
  }, [candidates]);

  // load candidates sekali di awal
  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        collection(db, "elections", ACTIVE_ELECTION, "candidates")
      );
      const list = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
      // Sort numeric jika id kandidat angka (string)
      list.sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));
      setCandidates(list);
    })();
  }, []);

  // subscribe realtime ke votes election aktif
  useEffect(() => {
    const qRef = query(
      collection(db, "elections", ACTIVE_ELECTION, "votes")
    );
    const unsub = onSnapshot(qRef, (snap) => {
      const c = {};
      let t = 0;
      const recent = [];

      snap.forEach((d) => {
        const data = d.data();
        const cid = data?.candidateId;
        if (cid != null) {
          const key = String(cid);
          c[key] = (c[key] || 0) + 1;
          t += 1;
          recent.push({ id: d.id, ...data });
        }
      });

      // sort terbaru berdasarkan timestamp
      recent.sort(
        (a, b) => (b.ts?.seconds || 0) - (a.ts?.seconds || 0)
      );

      setCounts(c);
      setTotal(t);
      setLastVotes(recent.slice(0, 12));
    });

    return () => unsub();
  }, []);

  return (
    <div
      className="admin-wrap"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="admin-page">
        <header className="adm-header">
          {/* <div className="adm-live">
            <span className="dot" /> Live Tally — {ACTIVE_ELECTION}
          </div> */}
          <h1>OSIS Election Dashboard</h1>
          <p className="adm-sub">Monitoring votes as they come in</p>
        </header>

        <section className="adm-stats">
          <div className="stat-card">
            <div className="stat-title">Total Votes</div>
            <div className="stat-value">{total}</div>
          </div>
          <div className="stat-card">
            <div className="stat-title">Candidates</div>
            <div className="stat-value">{candidates.length}</div>
          </div>
        </section>

        <section className="adm-grid">
          {candidates.map((c) => {
            const count = counts[String(c.id)] || 0;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return (
              <div key={c.id} className="cand-card">
                <div className="cand-media">
                  <img src={c.image} alt={c.name} loading="lazy" />
                </div>
                <div className="cand-body">
                  <div className="cand-name">{c.name}</div>
                  <div className="cand-row">
                    <div className="cand-count">{count} votes</div>
                    <div className="cand-pct">{pct}%</div>
                  </div>
                  <div className="bar">
                    <div className="bar-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
          {!candidates.length && (
            <div className="adm-loading">Loading candidates…</div>
          )}
        </section>

        <section className="adm-recent">
          <h3>Recent Votes</h3>
          <ul className="recent-list">
            {lastVotes.map((v) => {
              const cand = byId.get(String(v.candidateId));
              const when = v.ts?.seconds
                ? new Date(v.ts.seconds * 1000).toLocaleTimeString()
                : "—";
              return (
                <li key={v.id}>
                  <span className="badge">
                    {cand?.name || `#${v.candidateId}`}
                  </span>
                  <span className="muted">{v.id}</span>
                  <span className="time">{when}</span>
                </li>
              );
            })}
            {!lastVotes.length && <li className="muted">No votes yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
