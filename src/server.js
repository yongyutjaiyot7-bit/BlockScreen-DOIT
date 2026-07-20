import express from 'express';
import QRCode from 'qrcode';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { networkInterfaces } from 'node:os';
import { existsSync } from 'node:fs';

import {
  getEmployee, getBlock, getMasterData, addBlock, listBlocks,
  createCleanDoc, listCleanDocs, getCleanDoc, peekCleanDocNo, peekDocNo,
  createPressRequest, listPressRequests, getPressRequest, saveInspection, saveBlockStorage, listStoredPress,
  summitPressInspect, receivePress,
  createStretchSend, listStretchSendRows, createStretchReceive, listStretchReceiveRows,
  listStretchSendPending, getStretchSendDoc,
  createInternalDoc, getInternalDoc, listInternalDocs, listInternalDocsByStatus, completeTransport, completeStore, listInternalStored,
  createExternalDoc, getExternalDoc, listExternalDocs,
  searchByBlockNo, searchByInternalCode, searchExternalPending, getBlockHistory, getInternalCodeHistory,
  bulkUpsertBlocks, bulkUpsertEmployees, deleteBlock, updateBlock,
  listMaster, masterUpsert, masterDelete,
  login, verifyToken, listUsers, upsertUser, deleteUser,
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(express.json({ limit: '20mb' }));

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const APK_PATH = path.join(PUBLIC_DIR, 'blockscreen.apk');
// ดาวน์โหลดไฟล์ติดตั้ง Android (APK) — ถ้ายังไม่ได้อัปโหลดไฟล์ จะแจ้งวิธีสร้าง
app.get(['/blockscreen.apk', '/app.apk'], (req, res) => {
  if (existsSync(APK_PATH)) {
    res.type('application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="BlockScreen.apk"');
    return res.sendFile(APK_PATH);
  }
  res.status(404).type('html').send(`<meta charset="utf-8"><body style="font-family:sans-serif;padding:2rem;max-width:600px;margin:auto">
    <h2>ยังไม่มีไฟล์ติดตั้ง (APK)</h2>
    <p>ผู้ดูแลระบบยังไม่ได้อัปโหลดไฟล์ <code>blockscreen.apk</code> ลงในโฟลเดอร์ <code>public/</code></p>
    <p>ระหว่างนี้กรุณาใช้งานผ่านเว็บเบราว์เซอร์ได้ที่ <a href="/">หน้าหลัก</a></p></body>`);
});
app.get('/install', (req, res) => res.redirect('/install.html'));

app.use(express.static(PUBLIC_DIR));

const ok = (res, data) => res.json({ ok: true, data });
const err = (res, msg, code = 400) => res.status(code).json({ ok: false, error: msg });
const wrap = fn => async (req, res) => { try { await fn(req, res); } catch (e) { err(res, e.message); } };

// ---------- AUTH ----------
app.use((req, res, next) => {
  const h = req.headers.authorization || '';
  req.user = h.startsWith('Bearer ') ? verifyToken(h.slice(7)) : null;
  next();
});
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return err(res, 'กรุณาเข้าสู่ระบบ', 401);
  if (!roles.includes(req.user.role)) return err(res, 'ไม่มีสิทธิ์เข้าถึง', 403);
  next();
};
app.post('/api/login', wrap((req, res) => {
  const { username, password } = req.body || {};
  ok(res, login(username, password));
}));
app.get('/api/me', wrap((req, res) => {
  if (!req.user) return err(res, 'ไม่ได้เข้าสู่ระบบ', 401);
  ok(res, req.user);
}));
// User management (administrator only)
app.get('/api/users', requireRole('administrator'), wrap((req, res) => ok(res, listUsers())));
app.post('/api/users', requireRole('administrator'), wrap((req, res) => ok(res, upsertUser(req.body || {}))));
app.delete('/api/users/:username', requireRole('administrator'), wrap((req, res) => ok(res, deleteUser(req.params.username))));

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
app.put('/api/block/:no', requireRole('administrator','supervisor'), wrap((req, res) => ok(res, updateBlock(req.params.no, req.body || {}))));
app.delete('/api/block/:no', requireRole('administrator','supervisor'), wrap((req, res) => ok(res, deleteBlock(req.params.no))));

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

// ---------- MASTER DATA CRUD ----------
app.get('/api/master/:table', wrap((req, res) => ok(res, listMaster(req.params.table))));
app.post('/api/master/:table', requireRole('administrator','supervisor'), wrap((req, res) => ok(res, masterUpsert(req.params.table, req.body || {}))));
app.delete('/api/master/:table/:id', requireRole('administrator','supervisor'), wrap((req, res) => ok(res, masterDelete(req.params.table, req.params.id))));

// ---------- MODULE 1: CLEAN / COAT ----------
app.get('/api/clean', wrap((req, res) => ok(res, listCleanDocs())));
app.get('/api/clean-next', wrap((req, res) => ok(res, { doc_no: peekCleanDocNo() })));
app.get('/api/next-docno/:kind', wrap((req, res) => ok(res, { doc_no: peekDocNo(req.params.kind) })));
app.get('/api/clean/:doc_no', wrap((req, res) => {
  const d = getCleanDoc(req.params.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/clean', wrap((req, res) => ok(res, createCleanDoc(req.body || {}))));

// ---------- MODULE 2: PRESS REQUEST ----------
app.get('/api/press', wrap((req, res) => ok(res, listPressRequests(req.query.status))));
app.post('/api/press', wrap((req, res) => ok(res, createPressRequest(req.body || {}))));
// doc_no มี "/" อยู่ในเลขเอกสาร (เช่น R000001/2026) จึงส่งผ่าน query param แทน path param
app.get('/api/press-doc', wrap((req, res) => {
  const d = getPressRequest(req.query.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.post('/api/press-inspect', wrap((req, res) => ok(res, saveInspection(req.query.doc_no, req.body || {}))));
app.post('/api/press-summit', wrap((req, res) => ok(res, summitPressInspect(req.query.doc_no))));
app.post('/api/press-receive', wrap((req, res) => ok(res, receivePress(req.query.doc_no, req.body || {}))));
app.get('/api/press-stored', wrap((req, res) => ok(res, listStoredPress())));
app.post('/api/press-store', wrap((req, res) => {
  saveBlockStorage(req.query.doc_no, req.body || {});
  ok(res, getPressRequest(req.query.doc_no));
}));

// ---------- ส่งบล็อกขึงผ้า ----------
app.post('/api/stretch-send', wrap((req, res) => ok(res, createStretchSend(req.body || {}))));
app.get('/api/stretch-send-rows', wrap((req, res) => ok(res, listStretchSendRows())));
app.get('/api/stretch-send-pending', wrap((req, res) => ok(res, listStretchSendPending())));
app.get('/api/stretch-send-doc', wrap((req, res) => {
  const d = getStretchSendDoc(req.query.doc_no);
  if (!d) return err(res, 'ไม่พบใบส่ง', 404);
  ok(res, d);
}));

// ---------- รับบล็อกขึงผ้า ----------
app.post('/api/stretch-receive', wrap((req, res) => ok(res, createStretchReceive(req.body || {}))));
app.get('/api/stretch-receive-rows', wrap((req, res) => ok(res, listStretchReceiveRows())));

// ---------- MODULE 3: INTERNAL TRANSFER (จัดเตรียม → ขนส่ง/ตรวจรับ → ตรวจรับ/จัดเก็บ) ----------
app.get('/api/internal', wrap((req, res) => ok(res, listInternalDocs(req.query.type))));
app.post('/api/internal/prepare', wrap((req, res) => ok(res, createInternalDoc('prepare', req.body || {}))));
// doc_no มี "/" จึงใช้ query param แทน path param
app.get('/api/internal-doc', wrap((req, res) => {
  const d = getInternalDoc(req.query.doc_no);
  if (!d) return err(res, 'ไม่พบเอกสาร', 404);
  ok(res, d);
}));
app.get('/api/internal-list', wrap((req, res) => ok(res, listInternalDocsByStatus(req.query.status))));
app.post('/api/internal-transport', wrap((req, res) => ok(res, completeTransport(req.query.doc_no, req.body || {}))));
app.post('/api/internal-store', wrap((req, res) => ok(res, completeStore(req.query.doc_no, req.body || {}))));
app.get('/api/internal-stored', wrap((req, res) => ok(res, listInternalStored())));

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
app.get('/api/block-history/:no', wrap((req, res) => ok(res, getBlockHistory(req.params.no))));
app.get('/api/code-history', wrap((req, res) => ok(res, getInternalCodeHistory(req.query.code, req.query.color_order))));
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
