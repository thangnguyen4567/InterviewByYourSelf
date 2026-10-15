// API đồng bộ tiến độ học lên MongoDB.
// Dùng chung cho Vercel serverless (api/*.js) và server local (server.js).
//
// GET  /api/health                 -> { ok, db: 'up' | 'down' }
// GET  /api/progress?profile=xxx   -> { data, updatedAt }
// PUT  /api/progress?profile=xxx   body { data, base } -> { updatedAt } | 409 { conflict, updatedAt }
//   base = updatedAt mà client thấy lần cuối (optimistic concurrency).
const crypto = require('crypto');
const { MongoClient } = require('mongodb');

const MAX_BODY = 1024 * 1024; // 1 MB
const PROFILE_RE = /^[a-zA-Z0-9_-]{1,40}$/;

let clientPromise = null;
function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw Object.assign(new Error('MONGODB_URI chưa cấu hình'), { status: 503 });
  if (!clientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000, connectTimeoutMS: 5000, maxPoolSize: 5 });
    clientPromise = client.connect().catch((err) => {
      clientPromise = null; // lần sau thử kết nối lại
      throw err;
    });
  }
  return clientPromise.then((c) => c.db(process.env.MONGODB_DB || 'interview_prep'));
}
const getCollection = () => getDb().then((db) => db.collection('progress'));

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

function cors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  if (!allowed.length) res.setHeader('Access-Control-Allow-Origin', '*');
  else if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Sync-Key');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }
  return false;
}

function authorized(req) {
  const expected = process.env.SYNC_KEY || '';
  const got = String(req.headers['x-sync-key'] || '');
  if (!expected || got.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

async function readBody(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body) : req.body; // Vercel đã parse sẵn
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw Object.assign(new Error('Body quá lớn'), { status: 413 });
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function isDbError(err) {
  return /Mongo|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|querySrv/i.test(err.name + ' ' + err.message);
}

async function health(req, res) {
  if (cors(req, res)) return;
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    send(res, 200, { ok: true, db: 'up' });
  } catch (err) {
    send(res, 200, { ok: true, db: 'down', error: err.message });
  }
}

async function progress(req, res) {
  if (cors(req, res)) return;
  if (!authorized(req)) return send(res, 401, { error: 'Sai hoặc thiếu sync key' });

  const url = new URL(req.url, 'http://x');
  const profile = url.searchParams.get('profile') || 'default';
  if (!PROFILE_RE.test(profile)) return send(res, 400, { error: 'profile không hợp lệ' });

  try {
    const col = await getCollection();
    if (req.method === 'GET') {
      const doc = await col.findOne({ _id: profile });
      return send(res, 200, { data: doc ? doc.data : null, updatedAt: doc ? doc.updatedAt : 0 });
    }
    if (req.method === 'PUT') {
      const body = await readBody(req);
      if (!body || typeof body.data !== 'object' || body.data === null) return send(res, 400, { error: 'Thiếu data' });
      const base = Number(body.base) || 0;
      const now = Date.now();
      let ok;
      if (base === 0) {
        try {
          await col.insertOne({ _id: profile, data: body.data, updatedAt: now });
          ok = true;
        } catch (e) {
          if (e.code !== 11000) throw e;
          ok = false; // đã có document -> client phải đồng bộ lại
        }
      } else {
        const r = await col.updateOne({ _id: profile, updatedAt: base }, { $set: { data: body.data, updatedAt: now } });
        ok = r.matchedCount === 1;
      }
      if (ok) return send(res, 200, { updatedAt: now });
      const cur = await col.findOne({ _id: profile }, { projection: { updatedAt: 1 } });
      return send(res, 409, { conflict: true, updatedAt: cur ? cur.updatedAt : 0 });
    }
    send(res, 405, { error: 'Method not allowed' });
  } catch (err) {
    if (err instanceof SyntaxError) return send(res, 400, { error: 'JSON không hợp lệ' });
    if (err.status) return send(res, err.status, { error: err.message });
    console.error('[progress]', err.message);
    send(res, isDbError(err) ? 503 : 500, { error: isDbError(err) ? 'Database không khả dụng' : 'Lỗi server' });
  }
}

module.exports = { health, progress };
