import express from 'express';
import QRCode from 'qrcode';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';

import {
  getEmployee, getBlock, getMasterData, addBlock, listBlocks,
  createCleanDoc, listCleanDocs, getCleanDoc,
  createPressRequest, listPressRequests, getPressRequest, saveInspection, saveBlockStorage,
  createInternalDoc, getInternalDoc, listInternalDocs, submitInternalDoc,
  createExternalDoc, getExternalDoc, listExternalDocs,
  searchByBlockNo, searchByInternalCode, searchExternalPending,
  bulkUpsertBlocks, bulkUpsertEmployees, deleteBlock,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

const ok = (res, data) => res.json({ ok: true, data });
const err = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) { err(res, e.message); } };

// ---------- MASTER DATA ----------
app.get('/api/master', wrap((req, res) => ok(res, getMasterData())));
app.get('/api/employee/:code', wrap((req, res) => {
  const e = getEmployee(req.params.code);
  if (!e) return err(res, 'ไม่พบพนักงาน', 404);
  ok(res, e);
}));
app.get('/api/block/:no', wrap((req, res) => {
  const b = getBlock(req.params.no);
  if (!b) return err(res, 'ไม่พบบล็อก', 404);
  ok(res, b);
}));
app.post('/api/block', wrap((req, res) => {
  const { block_no, size_label, fabric_no } = req.body || {};
  if (!block_no) return err(res, 'กรุณาระบุเลขที่บล็อก');
  ok(res, addBlock(block_no, size_label, fabric_no));
}));
app.get('/api/blocks', wrap((req, res) => ok(res, listBlocks())));
app.delete('/api/block/:no', wrap((req, res) => ok(res, deleteBlock(req.params.no))));

// ---------- EXCEL IMPORT (bulk upsert) ----------
app.post('/api/import/blocks', wrap((req, res) => ok(res, bulkUpsertBlocks(req.body?.rows || []))));
app.post('/api/import/employees', wrap((req, res) => ok(res, bulkUpsertEmployees(req.body?.rows || []))));

// QR Code image
app.get('/api/qr/:text', async (req, res) => {
  try {
    const png = await QRCode.toBuffer(req.params.text, { width: 256, margin: 1 });
    res.type('png').send(png);
  } catch (e) { err(res, e.message); }
});

// ---------- MODULE 1: CLEAN / COAT ----------
app.get('/api/clean', wrap((req, res) => ok(res, listCleanDocs())));
app.get('/api/clean/:doc_no', wrap((req, res) => {
  const d = getCleanDoc(req.params.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/clean', wrap((req, res) => ok(res, createCleanDoc(req.body || {}))));

// ---------- MODULE 2: PRESS REQUEST ----------
app.get('/api/press', wrap((req, res) => ok(res, listPressRequests(req.query.status))));
app.get('/api/press/:doc_no', wrap((req, res) => {
  const d = getPressRequest(req.params.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/press', wrap((req, res) => ok(res, createPressRequest(req.body || {}))));
app.post('/api/press/:doc_no/inspect', wrap((req, res) => ok(res, saveInspection(req.params.doc_no, req.body || {}))));
app.post('/api/press/:doc_no/store', wrap((req, res) => {
  saveBlockStorage(req.params.doc_no, req.body || {});
  ok(res, getPressRequest(req.params.doc_no));
}));

// ---------- MODULE 3: INTERNAL TRANSFER ----------
app.get('/api/internal', wrap((req, res) => ok(res, listInternalDocs(req.query.type))));
app.get('/api/internal/:doc_no', wrap((req, res) => {
  const d = getInternalDoc(req.params.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/internal/:type', wrap((req, res) => ok(res, createInternalDoc(req.params.type, req.body || {}))));
app.post('/api/internal/:doc_no/scan', wrap((req, res) => {
  const doc = getInternalDoc(req.params.doc_no);
  if (!doc) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, { matched: doc.blocks.some(b => b.block_no === req.body.block_no) });
}));
app.post('/api/internal/:doc_no/submit', wrap((req, res) => {
  submitInternalDoc(req.params.doc_no, req.body || {});
  ok(res, getInternalDoc(req.params.doc_no));
}));

// ---------- MODULE 4: EXTERNAL TRANSFER ----------
app.get('/api/external', wrap((req, res) => ok(res, listExternalDocs())));
app.get('/api/external/:doc_no', wrap((req, res) => {
  const d = getExternalDoc(req.params.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/external/:type', wrap((req, res) => ok(res, createExternalDoc(req.params.type, req.body || {}))));

// ---------- SEARCH ----------
app.get('/api/search/block/:no', wrap((req, res) => ok(res, searchByBlockNo(req.params.no))));
app.get('/api/search/code', wrap((req, res) => ok(res, searchByInternalCode(req.query.code, req.query.color_order))));
app.get('/api/search/pending-external', wrap((req, res) => ok(res, searchExternalPending())));

function getLocalIPs() {
  const nets = networkInterfaces();
  const results = [];
  for (const iface of Object.values(nets)) {
    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) results.push(net.address);
    }
  }
  return results;
}

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', async () => {
    const ips = getLocalIPs();
    console.log('\n=== BLOCK SCREEN SERVER ===');
    console.log(`Local:   http://localhost:${PORT}`);
    for (const ip of ips) {
      const url = `http://${ip}:${PORT}`;
      console.log(`Network: ${url}`);
      try {
        const qr = await QRCode.toString(url, { type: 'terminal', small: true });
        console.log('\nสแกน QR Code นี้บนมือถือ เพื่อเชื่อมต่อฐานข้อมูลเดียวกัน:\n');
        console.log(qr);
      } catch {}
    }
    console.log('===========================\n');
  });
}
export default app;
