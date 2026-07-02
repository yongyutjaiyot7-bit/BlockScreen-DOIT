import initSqlJs from 'sql.js';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'blockscreen.db');

const SEED = JSON.parse(readFileSync(path.join(__dirname, 'seed.json'), 'utf-8'));

const SQL = await initSqlJs();

let _db;
function getDb() {
  if (_db) return _db;
  if (existsSync(DB_PATH)) {
    _db = new SQL.Database(readFileSync(DB_PATH));
  } else {
    _db = new SQL.Database();
  }
  return _db;
}

function save() {
  const data = getDb().export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export const uuid = () => randomUUID();
const now = () => new Date().toISOString();

function run(sql, params = []) {
  getDb().run(sql, params);
  save();
}

function get(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

function all(sql, params = []) {
  const stmt = getDb().prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// ── Schema ──
getDb().run(`
CREATE TABLE IF NOT EXISTS departments (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS employees (
  emp_code TEXT PRIMARY KEY, prefix TEXT,
  firstname TEXT NOT NULL, lastname TEXT NOT NULL, dept_id TEXT
);
CREATE TABLE IF NOT EXISTS block_sizes (id INTEGER PRIMARY KEY AUTOINCREMENT, label TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS fabric_types (id TEXT PRIMARY KEY);
CREATE TABLE IF NOT EXISTS process_steps (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, step_order INTEGER);
CREATE TABLE IF NOT EXISTS problems (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL);
CREATE TABLE IF NOT EXISTS blocks (
  block_no TEXT PRIMARY KEY, size_label TEXT, fabric_no TEXT,
  status TEXT DEFAULT 'available', location TEXT, current_dept TEXT DEFAULT 'BL', updated_at TEXT
);
CREATE TABLE IF NOT EXISTS clean_docs (
  doc_no TEXT PRIMARY KEY, date TEXT NOT NULL, process_step TEXT NOT NULL,
  emp1_code TEXT, emp2_code TEXT, remarks TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clean_doc_blocks (id TEXT PRIMARY KEY, doc_no TEXT NOT NULL, block_no TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS press_requests (
  doc_no TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
  dept TEXT NOT NULL, old_block_no TEXT NOT NULL, new_block_no TEXT, frame_size TEXT,
  requester_emp TEXT, problem_type TEXT, remarks TEXT, status TEXT DEFAULT 'pending', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS press_films (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL,
  internal_code TEXT, color_order TEXT, revision TEXT, fabric_no TEXT
);
CREATE TABLE IF NOT EXISTS press_inspections (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL, version INTEGER DEFAULT 1,
  new_block_no TEXT, frame_size TEXT, due_date TEXT, due_time TEXT,
  tension_value REAL, tension_pass INTEGER DEFAULT 0,
  dust_pass INTEGER DEFAULT 0, grease_pass INTEGER DEFAULT 0,
  old_adhesive_pass INTEGER DEFAULT 0, fabric_hole_pass INTEGER DEFAULT 0,
  dot_pass INTEGER DEFAULT 0, film_correct_pass INTEGER DEFAULT 0,
  exposure_seconds REAL, adhesive_block_pass INTEGER DEFAULT 0,
  sharpness_pass INTEGER DEFAULT 0, register_pass INTEGER DEFAULT 0,
  emp1_code TEXT, emp2_code TEXT, insp_date TEXT, insp_time TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS block_storage (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL, new_block_no TEXT,
  storage_location TEXT, storer_emp TEXT, store_date TEXT, store_time TEXT,
  remarks TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS internal_docs (
  doc_no TEXT PRIMARY KEY, doc_type TEXT NOT NULL,
  from_dept TEXT, to_dept TEXT, emp_code TEXT,
  doc_date TEXT, doc_time TEXT, status TEXT DEFAULT 'draft', created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS internal_doc_blocks (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL, block_no TEXT NOT NULL,
  internal_code TEXT, color_order TEXT, revision TEXT, fabric_no TEXT,
  scanned INTEGER DEFAULT 0, is_extra INTEGER DEFAULT 0, storage_location TEXT
);
CREATE TABLE IF NOT EXISTS external_docs (
  doc_no TEXT PRIMARY KEY, doc_type TEXT NOT NULL,
  from_dept TEXT, to_dept TEXT, emp_code TEXT,
  doc_date TEXT, doc_time TEXT, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS external_doc_blocks (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL,
  block_no TEXT NOT NULL, frame_size TEXT, fabric_no TEXT
);
CREATE TABLE IF NOT EXISTS receive_inspections (
  id TEXT PRIMARY KEY, doc_no TEXT NOT NULL, block_no TEXT NOT NULL,
  tension1 REAL, tension2 REAL, tension_pass INTEGER DEFAULT 0,
  frame_check_pass INTEGER DEFAULT 0, created_at TEXT NOT NULL
);
`);
save();

// ── Seed master data (from Excel: 79f768a7-...Mobile_barcode_BL2.1.xlsx) ──
if (!get('SELECT 1 FROM departments LIMIT 1')) {
  SEED.departments.forEach(id => getDb().run('INSERT OR IGNORE INTO departments(id,name) VALUES(?,?)', [id, id]));
  save();
}

if (!get('SELECT 1 FROM employees LIMIT 1')) {
  SEED.employees.forEach(e => getDb().run(
    'INSERT OR IGNORE INTO employees(emp_code,prefix,firstname,lastname,dept_id) VALUES(?,?,?,?,?)',
    [e.code, e.prefix, e.firstname, e.lastname, e.dept]));
  save();
}

if (!get('SELECT 1 FROM process_steps LIMIT 1')) {
  const steps = [
    ['ล้างคราบไข (บล็อกใหม่)',1],['ล้างกาว (ใช้เชอรีสตริป)',2],
    ['เคลือบน้ำยาล้างลายผีหลอก',3],['ล้างสะอาด (ใช้ทินเนอร์)',4],
    ['ล้างสี, ล้างเคลียร์ (ใช้ทินเนอร์)',5],
    ['ตรวจสอบสภาพบล็อกก่อนล้างโค๊ตกาวอัด',6],
    ['โค๊ตกาวอัดและนำเข้าเตาอบ',7],
  ];
  steps.forEach(s => getDb().run('INSERT OR IGNORE INTO process_steps(name,step_order) VALUES(?,?)', s));
  save();
}

if (!get('SELECT 1 FROM problems LIMIT 1')) {
  SEED.problems.forEach(p => getDb().run('INSERT OR IGNORE INTO problems(name) VALUES(?)', [p]));
  save();
}

if (!get('SELECT 1 FROM block_sizes LIMIT 1')) {
  SEED.sizes.forEach(s => getDb().run('INSERT OR IGNORE INTO block_sizes(label) VALUES(?)', [s]));
  save();
}

if (!get('SELECT 1 FROM fabric_types LIMIT 1')) {
  const fabrics = [...new Set(SEED.blocks.map(b => b.fabric_no).filter(f => f && f !== '#N/A'))].sort();
  fabrics.forEach(f => getDb().run('INSERT OR IGNORE INTO fabric_types(id) VALUES(?)', [f]));
  save();
}

if (!get('SELECT 1 FROM blocks LIMIT 1')) {
  const ts = now();
  const stmt = getDb().prepare('INSERT OR IGNORE INTO blocks(block_no,size_label,fabric_no,status,location,current_dept,updated_at) VALUES(?,?,?,?,?,?,?)');
  SEED.blocks.forEach(b => {
    stmt.run([b.block_no, b.size_label||null, (b.fabric_no && b.fabric_no !== '#N/A') ? b.fabric_no : null, 'available', null, 'BL', ts]);
  });
  stmt.free();
  save();
}

// ── Doc number generators ──
function nextDocNo(prefix, table) {
  const yr = new Date().getFullYear();
  const rows = all(`SELECT doc_no FROM ${table} WHERE doc_no LIKE '${prefix}%/${yr}'`);
  return `${prefix}${String(rows.length + 1).padStart(6, '0')}/${yr}`;
}

// ── Exported helpers ──
export function getEmployee(code) {
  const e = get('SELECT * FROM employees WHERE emp_code=?', [code]);
  if (e) e.fullname = `${e.prefix} ${e.firstname} ${e.lastname}`;
  return e;
}
export function getBlock(block_no) { return get('SELECT * FROM blocks WHERE block_no=?', [block_no]); }
export function listBlocks() { return all('SELECT * FROM blocks ORDER BY block_no'); }
export function addBlock(block_no, size_label, fabric_no) {
  const ts = now();
  run('INSERT OR REPLACE INTO blocks(block_no,size_label,fabric_no,status,current_dept,updated_at) VALUES(?,?,?,?,?,?)',
    [block_no, size_label||null, fabric_no||null, 'available', 'BL', ts]);
  return getBlock(block_no);
}

export function bulkUpsertBlocks(rows) {
  const ts = now();
  let added = 0, updated = 0;
  (rows || []).forEach(r => {
    const no = String(r.block_no || '').trim();
    if (!no || no === '#N/A') return;
    const size = (r.size_label && r.size_label !== '#N/A') ? String(r.size_label).replace(/\s+/g, ' ').trim() : null;
    const fab = (r.fabric_no && r.fabric_no !== '#N/A') ? String(r.fabric_no).trim() : null;
    const exists = get('SELECT block_no FROM blocks WHERE block_no=?', [no]);
    if (exists) {
      getDb().run('UPDATE blocks SET size_label=COALESCE(?,size_label),fabric_no=COALESCE(?,fabric_no),updated_at=? WHERE block_no=?', [size, fab, ts, no]);
      updated++;
    } else {
      getDb().run('INSERT INTO blocks(block_no,size_label,fabric_no,status,current_dept,updated_at) VALUES(?,?,?,?,?,?)', [no, size, fab, 'available', 'BL', ts]);
      added++;
    }
  });
  save();
  return { added, updated };
}

export function bulkUpsertEmployees(rows) {
  let added = 0, updated = 0;
  (rows || []).forEach(r => {
    const code = String(r.emp_code || '').trim();
    if (!code) return;
    const rec = [String(r.prefix||'').trim(), String(r.firstname||'').trim(), String(r.lastname||'').trim(), String(r.dept_id||'').trim()];
    const exists = get('SELECT emp_code FROM employees WHERE emp_code=?', [code]);
    if (exists) {
      getDb().run('UPDATE employees SET prefix=?,firstname=?,lastname=?,dept_id=? WHERE emp_code=?', [...rec, code]);
      updated++;
    } else {
      getDb().run('INSERT INTO employees(emp_code,prefix,firstname,lastname,dept_id) VALUES(?,?,?,?,?)', [code, ...rec]);
      added++;
    }
  });
  save();
  return { added, updated };
}

export function deleteBlock(block_no) { run('DELETE FROM blocks WHERE block_no=?', [block_no]); return { ok: true }; }

export function getMasterData() {
  const emps = all('SELECT * FROM employees ORDER BY dept_id, emp_code');
  emps.forEach(e => { e.fullname = `${e.prefix} ${e.firstname} ${e.lastname}`; });
  return {
    departments: all('SELECT * FROM departments ORDER BY id'),
    employees: emps,
    process_steps: all('SELECT * FROM process_steps ORDER BY step_order'),
    problems: all('SELECT * FROM problems ORDER BY id'),
    block_sizes: all('SELECT * FROM block_sizes ORDER BY id'),
    fabric_types: all('SELECT * FROM fabric_types ORDER BY id'),
    blocks: all('SELECT * FROM blocks ORDER BY block_no'),
  };
}

// ── MODULE 1: Clean ──
export function createCleanDoc(data) {
  const doc_no = nextDocNo('', 'clean_docs');
  const ts = now();
  run('INSERT INTO clean_docs(doc_no,date,process_step,emp1_code,emp2_code,remarks,created_at) VALUES(?,?,?,?,?,?,?)',
    [doc_no, data.date||ts.slice(0,10), data.process_step||'', data.emp1||null, data.emp2||null, data.remarks||null, ts]);
  (data.blocks||[]).forEach(b => run('INSERT INTO clean_doc_blocks(id,doc_no,block_no) VALUES(?,?,?)', [uuid(),doc_no,b]));
  return getCleanDoc(doc_no);
}
export function listCleanDocs() {
  return all('SELECT c.*, (SELECT COUNT(*) FROM clean_doc_blocks WHERE doc_no=c.doc_no) as block_count FROM clean_docs c ORDER BY c.created_at DESC LIMIT 100');
}
export function getCleanDoc(doc_no) {
  const doc = get('SELECT * FROM clean_docs WHERE doc_no=?', [doc_no]);
  if (doc) doc.blocks = all('SELECT * FROM clean_doc_blocks WHERE doc_no=?', [doc_no]);
  return doc;
}

// ── MODULE 2: Press request ──
export function createPressRequest(data) {
  const doc_no = nextDocNo('R', 'press_requests');
  const ts = now();
  run('INSERT INTO press_requests(doc_no,date,time,dept,old_block_no,requester_emp,problem_type,remarks,status,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)',
    [doc_no, data.date||ts.slice(0,10), data.time||ts.slice(11,16), data.dept||'', data.old_block_no||'',
     data.requester_emp||null, data.problem_type||null, data.remarks||null, 'pending', ts]);
  (data.films||[]).forEach(f => run('INSERT INTO press_films(id,doc_no,internal_code,color_order,revision,fabric_no) VALUES(?,?,?,?,?,?)',
    [uuid(), doc_no, f.internal_code||null, f.color_order||null, f.revision||null, f.fabric_no||null]));
  return get('SELECT * FROM press_requests WHERE doc_no=?', [doc_no]);
}
export function listPressRequests(status) {
  if (status) return all('SELECT * FROM press_requests WHERE status=? ORDER BY created_at DESC', [status]);
  return all('SELECT * FROM press_requests ORDER BY created_at DESC LIMIT 200');
}
export function getPressRequest(doc_no) {
  const doc = get('SELECT * FROM press_requests WHERE doc_no=?', [doc_no]);
  if (!doc) return null;
  doc.films = all('SELECT * FROM press_films WHERE doc_no=?', [doc_no]);
  doc.inspections = all('SELECT * FROM press_inspections WHERE doc_no=? ORDER BY version', [doc_no]);
  doc.storage = get('SELECT * FROM block_storage WHERE doc_no=?', [doc_no]);
  return doc;
}
export function saveInspection(doc_no, data) {
  const row = get('SELECT MAX(version) as v FROM press_inspections WHERE doc_no=?', [doc_no]);
  const version = ((row?.v) || 0) + 1;
  const ts = now();
  run(`INSERT INTO press_inspections(id,doc_no,version,new_block_no,frame_size,due_date,due_time,tension_value,tension_pass,dust_pass,grease_pass,old_adhesive_pass,fabric_hole_pass,dot_pass,film_correct_pass,exposure_seconds,adhesive_block_pass,sharpness_pass,register_pass,emp1_code,emp2_code,insp_date,insp_time,created_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uuid(), doc_no, version, data.new_block_no||null, data.frame_size||null, data.due_date||null, data.due_time||null,
     data.tension_value||null, data.tension_pass?1:0, data.dust_pass?1:0, data.grease_pass?1:0,
     data.old_adhesive_pass?1:0, data.fabric_hole_pass?1:0, data.dot_pass?1:0, data.film_correct_pass?1:0,
     data.exposure_seconds||null, data.adhesive_block_pass?1:0, data.sharpness_pass?1:0, data.register_pass?1:0,
     data.emp1_code||null, data.emp2_code||null, data.insp_date||ts.slice(0,10), data.insp_time||ts.slice(11,16), ts]);
  if (data.new_block_no) run('UPDATE press_requests SET new_block_no=?,status=? WHERE doc_no=?', [data.new_block_no,'inspected',doc_no]);
  return get('SELECT * FROM press_inspections WHERE doc_no=? AND version=?', [doc_no, version]);
}
export function saveBlockStorage(doc_no, data) {
  const ts = now();
  run('INSERT OR REPLACE INTO block_storage(id,doc_no,new_block_no,storage_location,storer_emp,store_date,store_time,remarks,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
    [uuid(), doc_no, data.new_block_no||null, data.storage_location||null, data.storer_emp||null,
     data.store_date||ts.slice(0,10), data.store_time||ts.slice(11,16), data.remarks||null, ts]);
  run('UPDATE press_requests SET status=? WHERE doc_no=?', ['stored', doc_no]);
  if (data.new_block_no) run('INSERT OR REPLACE INTO blocks(block_no,size_label,status,location,current_dept,updated_at) VALUES(?,?,?,?,?,?)',
    [data.new_block_no, data.frame_size||null, 'available', data.storage_location||null, 'BL', ts]);
}

// ── MODULE 3: Internal transfer ──
export function createInternalDoc(type, data) {
  const doc_no = nextDocNo('M', 'internal_docs');
  const ts = now();
  run('INSERT INTO internal_docs(doc_no,doc_type,from_dept,to_dept,emp_code,doc_date,doc_time,status,created_at) VALUES(?,?,?,?,?,?,?,?,?)',
    [doc_no, type, data.from_dept||null, data.to_dept||null, data.emp_code||null, data.date||ts.slice(0,10), data.time||ts.slice(11,16), 'draft', ts]);
  (data.blocks||[]).forEach(b => run('INSERT INTO internal_doc_blocks(id,doc_no,block_no) VALUES(?,?,?)', [uuid(),doc_no,b.block_no]));
  return get('SELECT * FROM internal_docs WHERE doc_no=?', [doc_no]);
}
export function getInternalDoc(doc_no) {
  const doc = get('SELECT * FROM internal_docs WHERE doc_no=?', [doc_no]);
  if (doc) doc.blocks = all('SELECT * FROM internal_doc_blocks WHERE doc_no=?', [doc_no]);
  return doc;
}
export function listInternalDocs(type) {
  if (type) return all('SELECT * FROM internal_docs WHERE doc_type=? ORDER BY created_at DESC LIMIT 100', [type]);
  return all('SELECT * FROM internal_docs ORDER BY created_at DESC LIMIT 100');
}
export function submitInternalDoc(doc_no, data) {
  const ts = now();
  run('UPDATE internal_docs SET status=?,emp_code=?,doc_date=?,doc_time=? WHERE doc_no=?',
    ['submitted', data.emp_code||null, data.date||ts.slice(0,10), data.time||ts.slice(11,16), doc_no]);
}

// ── MODULE 4: External transfer ──
function nextExtDocNo(type) {
  return type === 'send_out' ? nextDocNo('OU', 'external_docs') : nextDocNo('IN', 'external_docs');
}
export function createExternalDoc(type, data) {
  const doc_no = nextExtDocNo(type);
  const ts = now();
  run('INSERT INTO external_docs(doc_no,doc_type,from_dept,to_dept,emp_code,doc_date,doc_time,created_at) VALUES(?,?,?,?,?,?,?,?)',
    [doc_no, type, data.from_dept||null, data.to_dept||null, data.emp_code||null, data.date||ts.slice(0,10), data.time||ts.slice(11,16), ts]);
  (data.blocks||[]).forEach(b => {
    const blk = getBlock(b.block_no);
    run('INSERT INTO external_doc_blocks(id,doc_no,block_no,frame_size,fabric_no) VALUES(?,?,?,?,?)',
      [uuid(), doc_no, b.block_no, blk?.size_label||null, blk?.fabric_no||null]);
    if (type === 'receive_in') {
      run('INSERT INTO receive_inspections(id,doc_no,block_no,tension1,tension2,tension_pass,frame_check_pass,created_at) VALUES(?,?,?,?,?,?,?,?)',
        [uuid(), doc_no, b.block_no, b.tension1||null, b.tension2||null, b.tension_pass?1:0, b.frame_check_pass?1:0, ts]);
      run('UPDATE blocks SET status=?,current_dept=?,updated_at=? WHERE block_no=?', ['available', data.to_dept||'BL', ts, b.block_no]);
    } else {
      run('UPDATE blocks SET status=?,current_dept=?,updated_at=? WHERE block_no=?', ['external', data.to_dept||null, ts, b.block_no]);
    }
  });
  return get('SELECT * FROM external_docs WHERE doc_no=?', [doc_no]);
}
export function getExternalDoc(doc_no) {
  const doc = get('SELECT * FROM external_docs WHERE doc_no=?', [doc_no]);
  if (!doc) return null;
  doc.blocks = all('SELECT * FROM external_doc_blocks WHERE doc_no=?', [doc_no]);
  if (doc.doc_type === 'receive_in') doc.inspections = all('SELECT * FROM receive_inspections WHERE doc_no=?', [doc_no]);
  return doc;
}
export function listExternalDocs() { return all('SELECT * FROM external_docs ORDER BY created_at DESC LIMIT 100'); }

// ── Search ──
export function searchByBlockNo(block_no) {
  return {
    block: getBlock(block_no),
    cleanHistory: all('SELECT cd.* FROM clean_docs cd JOIN clean_doc_blocks cb ON cd.doc_no=cb.doc_no WHERE cb.block_no=? ORDER BY cd.created_at DESC', [block_no]),
    pressHistory: all('SELECT * FROM press_requests WHERE old_block_no=? OR new_block_no=? ORDER BY created_at DESC', [block_no, block_no]),
    moveHistory: all('SELECT id.* FROM internal_docs id JOIN internal_doc_blocks idb ON id.doc_no=idb.doc_no WHERE idb.block_no=? ORDER BY id.created_at DESC', [block_no]),
    extHistory: all('SELECT ed.* FROM external_docs ed JOIN external_doc_blocks edb ON ed.doc_no=edb.doc_no WHERE edb.block_no=? ORDER BY ed.created_at DESC', [block_no]),
  };
}
export function searchByInternalCode(code, color_order) {
  let q = 'SELECT pf.*,pr.old_block_no,pr.new_block_no,pr.status FROM press_films pf JOIN press_requests pr ON pf.doc_no=pr.doc_no WHERE pf.internal_code=?';
  const p = [code];
  if (color_order) { q += ' AND pf.color_order=?'; p.push(color_order); }
  return all(q, p);
}
export function searchExternalPending() {
  return all(`SELECT ed.doc_no,ed.to_dept,ed.doc_date,edb.block_no,edb.frame_size
    FROM external_docs ed JOIN external_doc_blocks edb ON ed.doc_no=edb.doc_no
    WHERE ed.doc_type='send_out'
    AND edb.block_no NOT IN (
      SELECT edb2.block_no FROM external_docs ed2
      JOIN external_doc_blocks edb2 ON ed2.doc_no=edb2.doc_no
      WHERE ed2.doc_type='receive_in'
    ) ORDER BY ed.doc_date DESC`);
}
