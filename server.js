const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE = process.env.API_BASE || 'http://103.69.87.202:5000';
const API_KEY = process.env.API_KEY || '';
const PASS_KEY = process.env.PASS_KEY || process.env['pass-key'] || '';

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

// CORS — cho phép Cloudflare Pages (và bất kỳ frontend nào) gọi API
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.static(__dirname));

async function apiRequest(endpoint, options = {}) {
  if (!API_KEY) {
    return {
      ok: false,
      status: 500,
      data: { success: false, error: 'Thiếu API_KEY trên server.' },
    };
  }

  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'X-API-KEY': API_KEY,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const text = await response.text();
    let data;

    try {
      data = JSON.parse(text);
    } catch {
      data = {
        success: false,
        error: `Upstream trả về dữ liệu không hợp lệ (HTTP ${response.status})`,
        raw: text.slice(0, 200),
      };
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      data: {
        success: false,
        error: `Không kết nối được upstream: ${error.message}`,
      },
    };
  }
}

app.get('/api/stock', async (req, res) => {
  const stockResult = await apiRequest('/api/dealer/stock');
  if (!stockResult.data.success) {
    return res.status(stockResult.status).json(stockResult.data);
  }

  let balance;
  let dealer;
  const balanceResult = await apiRequest('/api/dealer/balance');
  if (balanceResult.data && balanceResult.data.success) {
    balance = balanceResult.data.balance;
    dealer = balanceResult.data.dealer || balanceResult.data.name || balanceResult.data.username;
  }

  return res.json({
    ...stockResult.data,
    products: stockResult.data.products || {},
    balance,
    dealer,
  });
});

app.post('/api/buy', async (req, res) => {
  const body = req.body || {};

  if (PASS_KEY && body.pass_key !== PASS_KEY) {
    return res.status(403).json({ success: false, error: 'Pass-key không đúng.' });
  }

  if (!body.product_key || typeof body.product_key !== 'string') {
    return res.status(400).json({ success: false, error: 'Sản phẩm không hợp lệ.' });
  }

  if (!Number.isInteger(body.qty) || body.qty < 1 || body.qty > 100) {
    return res.status(400).json({ success: false, error: 'Số lượng không hợp lệ (1-100).' });
  }

  if (body.product_key === 'slot_gpt_team') {
    if (!Array.isArray(body.emails) || body.emails.length !== body.qty) {
      return res.status(400).json({
        success: false,
        error: 'Slot GPT Team yêu cầu số email phải bằng số lượng.',
      });
    }
  }

  const result = await apiRequest('/api/dealer/buy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return res.status(result.status).json(result.data);
});

app.get('/api/debug', async (req, res) => {
  const result = await apiRequest('/api/dealer/stock');
  res.json({
    api_base: API_BASE,
    api_key_set: API_KEY ? `yes (${API_KEY.slice(0, 8)}...)` : 'no',
    upstream_status: result.status,
    upstream_ok: result.ok,
    upstream_preview: JSON.stringify(result.data).slice(0, 300),
    runtime: 'render-node-express',
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
