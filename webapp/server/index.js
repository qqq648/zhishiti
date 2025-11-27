import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fetch from 'node-fetch';
import axios from 'axios';
import { Readable } from 'node:stream';
import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
// try multiple .env locations to accommodate different setups
dotenv.config({ path: path.resolve(process.cwd(), '.env'), override: true });
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env'), override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

const LOG_FILE = '/tmp/proxy.log';
function log(tag, payload) {
  try {
    const line = `${new Date().toISOString()} ${tag} ${JSON.stringify(payload)}\n`;
    fs.appendFileSync(LOG_FILE, line, 'utf8');
  } catch (e) {
    // ignore logging errors
  }
}

// Agents configuration: env var names
const AGENT_CONFIG = [
  { id: 'jiaowu', name: '智能教务', env: 'DIFY_API_KEY_JIAOWU' },
  { id: 'tuijian', name: '资源检索与推荐', env: 'DIFY_API_KEY_TUIJIAN' },
  { id: 'wenxian', name: '智能文献服务', env: 'DIFY_API_KEY_WENXIAN' },
  { id: 'zhujiao', name: '智能助教/学伴', env: 'DIFY_API_KEY_ZHUJIAO' },
];

const BASE_URL = process.env.DIFY_BASE_URL || 'http://localhost/v1';

function resolveAgentKey(agentId) {
  const conf = AGENT_CONFIG.find((a) => a.id === agentId);
  if (!conf) return null;
  const val = process.env[conf.env];
  if (!val) return null;
  const k = String(val).trim();
  return k ? k : null;
}

function getAgent(agentId) {
  const conf = AGENT_CONFIG.find((a) => a.id === agentId);
  if (!conf) return null;
  const key = resolveAgentKey(agentId);
  if (!key) return null;
  return { id: conf.id, name: conf.name, key };
}

app.get('/api/agents', (req, res) => {
  res.json({
    data: AGENT_CONFIG.map((a) => ({ id: a.id, name: a.name, hasKey: !!resolveAgentKey(a.id) })),
  });
});

// Proxy: GET /conversations
app.get('/api/:agent/conversations', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  const url = new URL(BASE_URL + '/conversations');
  if (req.query.user) url.searchParams.set('user', req.query.user);
  if (req.query.last_id) url.searchParams.set('last_id', req.query.last_id);
  if (req.query.limit) url.searchParams.set('limit', req.query.limit);
  if (req.query.sort_by) url.searchParams.set('sort_by', req.query.sort_by);
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${agent.key}` },
    });
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

// Proxy: GET /messages
app.get('/api/:agent/messages', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  const url = new URL(BASE_URL + '/messages');
  if (req.query.conversation_id) url.searchParams.set('conversation_id', req.query.conversation_id);
  if (req.query.user) url.searchParams.set('user', req.query.user);
  if (req.query.first_id) url.searchParams.set('first_id', req.query.first_id);
  if (req.query.limit) url.searchParams.set('limit', req.query.limit);
  try {
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${agent.key}` },
    });
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

// Proxy: POST /chat-messages (supports streaming SSE)
app.post('/api/:agent/chat-messages', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  const body = req.body || {};
  // Ensure inputs exists per API contract
  if (!body.inputs) body.inputs = {};
  const responseMode = body.response_mode || 'streaming';
  delete body.response_mode; // Remove the problematic field

  const headers = {
    Authorization: `Bearer ${agent.key}`,
    'Content-Type': 'application/json',
  };
  console.log('[proxy] chat-messages:', { responseMode, hasBody: !!body, keys: Object.keys(body || {}) });
  log('chat-messages.begin', { responseMode, keys: Object.keys(body || {}), bodyHasQuery: !!body.query });
  try {
    if (responseMode === 'streaming') {
      // Always forward as streaming to upstream
      const payload = { ...body, response_mode: 'streaming' };
      try {
        const resp = await axios.post(BASE_URL + '/chat-messages', payload, {
          headers,
          responseType: 'stream',
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders && res.flushHeaders();
        const ct = resp.headers['content-type'] || '';
        log('chat-messages.stream.ct', { ct, status: resp.status });
        if (!ct.includes('text/event-stream')) {
          log('chat-messages.stream.nonSSE', { status: resp.status });
          const chunks = [];
          resp.data.on('data', (c) => chunks.push(Buffer.from(c)));
          resp.data.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf-8');
            log('chat-messages.stream.nonSSE.end', { status: resp.status, bodyLen: text.length });
            // Try to parse JSON and re-emit as SSE-compatible data events
            try {
              const obj = JSON.parse(text);
              res.write(`data: ${JSON.stringify(obj)}\n\n`);
              res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
              res.end();
            } catch (e) {
              res.write(`data: ${JSON.stringify({ error: 'http_error', status: resp.status, body: text })}\n\n`);
              res.end();
            }
          });
          resp.data.on('error', (err) => {
            log('chat-messages.stream.nonSSE.error', { err: String(err) });
            res.write(`data: ${JSON.stringify({ error: 'proxy_failed', detail: String(err) })}\n\n`);
            res.end();
          });
          return;
        }
        resp.data.on('error', (err) => {
          log('chat-messages.stream.error', { err: String(err) });
          res.write(`data: ${JSON.stringify({ error: 'proxy_failed', detail: String(err) })}\n\n`);
          res.end();
        });
        log('chat-messages.stream.pipe', { status: resp.status });
        resp.data.on('data', (chunk) => {
          const chunkStr = chunk.toString('utf8');
          log('chat-messages.stream.chunk', { chunk: chunkStr });
          res.write(chunk);
        });
        resp.data.on('end', () => {
          log('chat-messages.stream.end', {});
          res.end();
        });
      } catch (err) {
        // If upstream returns non-2xx (e.g., 400), try to forward detailed error or fallback to blocking mode
        log('chat-messages.stream.begin.error', {
          name: err?.name,
          message: err?.message,
          status: err?.response?.status,
          dataType: typeof err?.response?.data,
        });
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders && res.flushHeaders();
        // Try fallback to blocking mode for better error/result
        try {
          const blockResp = await axios.post(BASE_URL + '/chat-messages', { ...body, response_mode: 'blocking' }, { headers });
          res.write(`data: ${JSON.stringify(blockResp.data)}\n\n`);
          res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
          return res.end();
        } catch (inner) {
          const status = inner?.response?.status;
          const data = inner?.response?.data;
          if (typeof data === 'object') {
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          } else if (typeof data === 'string') {
            // attempt to parse JSON string
            try {
              const obj = JSON.parse(data);
              res.write(`data: ${JSON.stringify(obj)}\n\n`);
            } catch {
              res.write(`data: ${JSON.stringify({ error: 'http_error', status, body: String(data) })}\n\n`);
            }
          } else {
            res.write(`data: ${JSON.stringify({ error: 'proxy_failed', detail: String(inner) })}\n\n`);
          }
          res.write(`data: ${JSON.stringify({ event: 'end' })}\n\n`);
          return res.end();
        }
      }
    } else {
      try {
        console.log('[proxy] blocking begin', { url: BASE_URL + '/chat-messages' });
        log('chat-messages.blocking.begin', { url: BASE_URL + '/chat-messages' });
        const resp = await axios.post(BASE_URL + '/chat-messages', body, { headers });
        console.log('[proxy] blocking ok', resp.status);
        log('chat-messages.blocking.ok', { status: resp.status });
        res.status(resp.status).json(resp.data);
      } catch (err) {
        console.error('[proxy] blocking error', {
          name: err?.name,
          message: err?.message,
          isAxiosError: !!err?.isAxiosError,
          status: err?.response?.status,
          dataType: typeof err?.response?.data,
        });
        log('chat-messages.blocking.error', {
          name: err?.name,
          message: err?.message,
          isAxiosError: !!err?.isAxiosError,
          status: err?.response?.status,
          dataType: typeof err?.response?.data,
          dataPreview: typeof err?.response?.data === 'string' ? String(err?.response?.data).slice(0, 200) : undefined,
        });
        const status = err?.response?.status || 500;
        const data = err?.response?.data || { error: 'proxy_failed', detail: String(err), caught_at: 'inner', mode: responseMode };
        res.status(status).json(data);
      }
    }
  } catch (e) {
    console.error('[proxy] catch error:', e);
    log('chat-messages.outer.error', { err: String(e), mode: responseMode });
    if (responseMode === 'streaming') {
      res.setHeader('Content-Type', 'text/event-stream');
      res.write(`data: ${JSON.stringify({ error: 'proxy_failed', detail: String(e), caught_at: 'outer', mode: responseMode })}\n\n`);
      return res.end();
    }
    res.status(500).json({ error: 'proxy_failed', detail: String(e), caught_at: 'outer', mode: responseMode });
  }
});

// DELETE /conversations/:conversation_id
app.delete('/api/:agent/conversations/:conversation_id', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  try {
    const resp = await fetch(BASE_URL + `/conversations/${req.params.conversation_id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${agent.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user: req.query.user || req.body?.user }),
    });
    if (resp.status === 204) return res.status(204).end();
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

// GET /parameters
app.get('/api/:agent/parameters', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  try {
    const resp = await fetch(BASE_URL + '/parameters', {
      headers: { Authorization: `Bearer ${agent.key}` },
    });
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

// GET /messages/:message_id/suggested
app.get('/api/:agent/messages/:message_id/suggested', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  const url = new URL(BASE_URL + `/messages/${req.params.message_id}/suggested`);
  if (req.query.user) url.searchParams.set('user', req.query.user);
  try {
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${agent.key}` } });
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

// POST /conversations/:conversation_id/name
app.post('/api/:agent/conversations/:conversation_id/name', async (req, res) => {
  const agent = getAgent(req.params.agent);
  if (!agent) return res.status(400).json({ error: 'invalid_agent_or_missing_key' });
  try {
    const resp = await fetch(BASE_URL + `/conversations/${req.params.conversation_id}/name`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${agent.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body || {}),
    });
    const json = await resp.json();
    res.status(resp.status).json(json);
  } catch (e) {
    res.status(500).json({ error: 'proxy_failed', detail: String(e) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});