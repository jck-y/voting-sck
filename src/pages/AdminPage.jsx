import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebase";
import { CANDIDATES } from "../data/candidates";
import "../styles/admin.css";

export default function AdminPage() {
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [lastVotes, setLastVotes] = useState([]);
  const byId = useMemo(() => {
    const m = new Map();
    CANDIDATES.forEach(c => m.set(c.id, c));
    return m;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "votes"));
    const unsub = onSnapshot(q, (snap) => {
      const c = {};
      let t = 0;
      const recent = [];

      snap.forEach(doc => {
        const data = doc.data();
        const cid = data?.candidateId;
        if (cid != null) {
          c[cid] = (c[cid] || 0) + 1;
          t += 1;
          recent.push({ id: doc.id, ...data });
        }
      });

      // sort recent by ts desc kalau ada timestamp
      recent.sort((a, b) => (b.ts?.seconds || 0) - (a.ts?.seconds || 0));

      setCounts(c);
      setTotal(t);
      setLastVotes(recent.slice(0, 10));
    });

    return () => unsub();
  }, []);

  return (
    <div className="admin-wrap">
      <div className="admin-page">
        <header className="adm-header">
          {/* <div className="adm-live">
            <span className="dot" /> Live Tally
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
            <div className="stat-value">{CANDIDATES.length}</div>
          </div>
        </section>

        <section className="adm-grid">
          {CANDIDATES.map(c => {
            const count = counts[c.id] || 0;
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
        </section>

        <section className="adm-recent">
          <h3>Recent Votes</h3>
          <ul className="recent-list">
            {lastVotes.map(v => {
              const cand = byId.get(v.candidateId);
              const when = v.ts?.seconds ? new Date(v.ts.seconds * 1000).toLocaleTimeString() : "—";
              return (
                <li key={v.id}>
                  <span className="muted">{v.id}</span>
                  <span className="badge">{cand?.name || `#${v.candidateId}`}</span>
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
