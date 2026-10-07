// Netlify Function: /api/feedback
// 代理 Supabase 回饋資料庫

const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xxx.supabase.co
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY; // service_role key（不公開）
const TABLE = 'feedback';

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders() };
  }

  const method = event.httpMethod;

  try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      throw new Error('Supabase not configured');
    }

    // POST /api/feedback  → 新增一筆回饋
    if (method === 'POST') {
      const payload = JSON.parse(event.body || '{}');
      const { rate, note, ig, nick } = payload;
      if (!rate) return { statusCode: 400, headers: corsHeaders(), body: JSON.stringify({ error: 'rate 欄位必填' }) };

      const row = { rate, ts: new Date().toISOString() };
      if (note) row.note = note;
      if (ig) row.ig = ig;
      if (nick) row.nick = nick;

      const res = await supabaseFetch('POST', `/${TABLE}`, row);
      return { statusCode: 201, headers: corsHeaders(), body: JSON.stringify(res) };
    }

    // GET /api/feedback  → 管理者讀取（需要管理密碼）
    if (method === 'GET') {
      const adminPwd = event.headers['x-admin-pwd'] || '';
      const expectedPwd = process.env.ADMIN_PASSWORD || '';
      if (!expectedPwd || adminPwd !== expectedPwd) {
        return { statusCode: 403, headers: corsHeaders(), body: JSON.stringify({ error: '無管理權限' }) };
      }
      const res = await supabaseFetch('GET', `/${TABLE}?order=ts.desc&limit=100`);
      return { statusCode: 200, headers: corsHeaders(), body: JSON.stringify(res) };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: err.message }) };
  }
};

async function supabaseFetch(method, path, body) {
  const url = `${SUPABASE_URL}/rest/v1${path}`;
  const opts = {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : 'return=representation',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-pwd',
  };
}
