// Single source of truth for the active election
// You can override via env: VITE_ELECTION_ID
export const ACTIVE_ELECTION =
  import.meta.env.VITE_ELECTION_ID || "sma-osis-2025";
