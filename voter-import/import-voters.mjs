import admin from "firebase-admin";
import path from "node:path";
import { existsSync, readdirSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { readFileSync } from "node:fs";

function initFirebase() {
  const cwd = process.cwd();
  console.log("CWD:", cwd);

  // 1) Jika ENV diset, pakai ENV
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const p = path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log("Using GOOGLE_APPLICATION_CREDENTIALS:", p);
    if (!existsSync(p)) {
      throw new Error(
        `ENV GOOGLE_APPLICATION_CREDENTIALS menunjuk file yang tidak ada: ${p}`
      );
    }
    admin.initializeApp({
      credential: admin.credential.cert(p),
    });
    return;
  }

  // 2) Coba cari beberapa nama umum di folder skrip
  const candidates = [
    "serviceAccountKey.json",
    // kalau ingin pakai nama asli hasil unduhan, tambahkan di sini:
    // "project-id-firebase-adminsdk-xxxxx.json",
  ];

  console.log("Files in folder:", readdirSync(cwd));
  let found = null;
  for (const name of candidates) {
    const p = path.resolve(name);
    if (existsSync(p)) {
      found = p;
      break;
    }
  }

  if (!found) {
    throw new Error(
      `Tidak menemukan berkas kunci. Letakkan "serviceAccountKey.json" di folder ini
atau set ENV GOOGLE_APPLICATION_CREDENTIALS.`
    );
  }

  console.log("Using local key file:", found);
  admin.initializeApp({
    credential: admin.credential.cert(found),
  });
}

initFirebase();

// ===== di bawah ini lanjutkan kode import CSV kamu seperti sebelumnya =====

const db = admin.firestore();

// contoh minimal baca CSV voters.csv
const raw = readFileSync("./voters.csv");
const rows = parse(raw, { columns: true, skip_empty_lines: true });

// batching 450
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

const cleaned = [];
const seen = new Set();
for (const r of rows) {
  const email = String(r.email || "")
    .trim()
    .toLowerCase();
  if (!email || seen.has(email)) continue;
  seen.add(email);
  cleaned.push({
    email,
    name: (r.name || "").trim(),
    allowed: String(r.allowed ?? "true").toLowerCase() === "true",
  });
}

console.log(`Siap impor ${cleaned.length} email...`);
let done = 0;
for (const group of chunk(cleaned, 450)) {
  const batch = db.batch();
  for (const row of group) {
    const ref = db.collection("voters").doc(row.email);
    const data = { allowed: row.allowed, voted: false };
    if (row.name) data.name = row.name;
    batch.set(ref, data, { merge: true });
  }
  await batch.commit();
  done += group.length;
  console.log(`Commit: ${done}/${cleaned.length}`);
}
console.log("Impor selesai ✅");
