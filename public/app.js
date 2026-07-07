/* ============================================================
   BLOCK SCREEN – Single-Page App
   ============================================================ */

// ── state ──
let master = {};
let currentPage = 'home';
let scanCallback = null;
let scanStream = null;
let scanDetector = null;

// ── bootstrap ──
(async () => {
  const res = await api('/api/master');
  master = res.data || {};
  renderPage('home');
})();

// ── router ──
function renderPage(page, params = {}) {
  currentPage = page;
  const app = document.getElementById('app');
  const pages = {
    home: pageHome,
    clean: pageClean,
    cleanNew: pageCleanNew,
    cleanDetail: pageCleanDetail,
    pressMenu: pagePressMenu,
    press: pagePress,
    pressNew: pagePressNew,
    pressDetail: pagePressDetail,
    pressInspect: pagePressInspect,
    pressReceive: pagePressReceive,
    pressStore: pagePressStore,
    pressDB3: pagePressDB3,
    internal: pageInternal,
    internalPrepare: pageInternalPrepare,
    internalTransport: pageInternalTransport,
    internalTransportForm: pageInternalTransportForm,
    internalReceive: pageInternalReceive,
    internalStoreForm: pageInternalStoreForm,
    external: pageExternal,
    externalStretchSend: pageExternalStretchSend,
    externalStretchReceive: pageExternalStretchReceive,
    externalStretchSendResult: pageExternalStretchSendResult,
    externalStretchReceiveResult: pageExternalStretchReceiveResult,
    search: pageSearch,
    blocks: pageBlocks,
  };
  (pages[page] || pageHome)(app, params);
  updateBottomNav(page);
}

function updateBottomNav(page) {
  document.querySelectorAll('.bottomnav button').forEach(b => b.classList.remove('active'));
  const map = { home: 'nav-home', clean: 'nav-home', press: 'nav-home', internal: 'nav-internal', external: 'nav-external', search: 'nav-search', blocks: 'nav-blocks' };
  const root = page.replace(/[A-Z].*/,'');
  const id = map[root] || map[page] || 'nav-home';
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

// ── BOTTOM NAV ──
document.getElementById('app').insertAdjacentHTML('afterend', `
<nav class="bottomnav">
  <button id="nav-home" onclick="renderPage('home')"><span class="icon">🏠</span>Home</button>
  <button id="nav-internal" onclick="renderPage('internal')"><span class="icon">🔄</span>รับส่งใน</button>
  <button id="nav-external" onclick="renderPage('external')"><span class="icon">🚚</span>รับส่งนอก</button>
  <button id="nav-search" onclick="renderPage('search')"><span class="icon">🔍</span>ค้นหา</button>
  <button id="nav-blocks" onclick="renderPage('blocks')"><span class="icon">📋</span>ทะเบียน</button>
</nav>`);

// ── HOME ──
function pageHome(app) {
  app.innerHTML = `
    <div class="topnav"><h1>📦 BLOCK SCREEN</h1><small style="color:var(--muted)">${todayStr()}</small></div>
    <div class="home-grid">
      <div class="home-card" onclick="renderPage('cleanNew')">
        <div class="hc-icon">🧹</div>
        <div class="hc-title">ล้าง/โค๊ตบล็อก</div>
        <div class="hc-sub">บันทึกการล้างและโค๊ต</div>
      </div>
      <div class="home-card" onclick="renderPage('pressMenu')">
        <div class="hc-icon">🖼️</div>
        <div class="hc-title">ร้องขออัดบล็อก</div>
        <div class="hc-sub">ร้องขอ / ตรวจรับ / จัดเก็บ</div>
      </div>
      <div class="home-card" onclick="renderPage('internal')">
        <div class="hc-icon">🔄</div>
        <div class="hc-title">รับส่งภายใน</div>
        <div class="hc-sub">เตรียม / ขนส่ง / จัดเก็บ</div>
      </div>
      <div class="home-card" onclick="renderPage('external')">
        <div class="hc-icon">🚚</div>
        <div class="hc-title">รับส่งภายนอก</div>
        <div class="hc-sub">ส่ง/รับบล็อกขึงผ้า</div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
//  MODULE 1 – ล้าง/โค๊ตบล็อก
// ══════════════════════════════════════════════════════
async function pageClean(app) {
  const { data: rows } = await api('/api/clean');
  const steps = master.process_steps;
  const cols = 4 + steps.length + 3;
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🧹 DATA BASE 1</h1>
      <button class="btn-primary btn-sm" onclick="renderPage('cleanNew')">+ เพิ่ม</button>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">บันทึกการล้างบล็อกสกรีน</div>
        <div class="table-scroll">
          <table class="db1">
            <thead><tr>
              <th>เลขที่เอกสาร</th><th>วันที่</th><th>เลขที่บล็อก</th><th>ขนาดบล็อก</th>
              ${steps.map(s=>`<th class="stepcol">${s.name}</th>`).join('')}
              <th>พนักงานคนที่ 1</th><th>พนักงานคนที่ 2</th><th>หมายเหตุ</th>
            </tr></thead>
            <tbody>
              ${rows.length===0
                ? `<tr><td colspan="${cols}" class="no-data">ยังไม่มีรายการ — กด "+ เพิ่ม" เพื่อบันทึก</td></tr>`
                : rows.map(r=>`<tr>
                    <td><strong>${r.doc_no}</strong></td>
                    <td>${fmtDate(r.date)}</td>
                    <td><strong>${r.block_no||'-'}</strong></td>
                    <td>${r.size_label||'-'}</td>
                    ${steps.map(s=>`<td class="ctr">${r.process_step===s.name?'<span class="mark1">1</span>':'-'}</td>`).join('')}
                    <td>${r.emp1_name||'-'}</td>
                    <td>${r.emp2_name||'-'}</td>
                    <td>${r.remarks||'-'}</td>
                  </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

const MAX_CLEAN_BLOCKS = 100;
function pageCleanNew(app) {
  window._cleanBlocks = [];
  const stepOpts = master.process_steps.map(s=>`<option>${s.name}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🧹 ล้าง/โค๊ตบล็อก</h1>
      <button class="btn-primary btn-sm" onclick="renderPage('clean')">📋 รายการ</button>
    </div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>

      <div class="card">
        <div class="card-title">ขั้นตอนการล้างบล็อกสกรีน / โค๊ตบล็อก</div>
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">อัตโนมัติ</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">ขั้นตอน</td><td class="in"><select id="c_step">${stepOpts}</select></td></tr>
          <tr><td class="lbl">รหัสพนักงาน BL คนที่ 1</td><td class="in">
            <div class="row gap-sm"><input id="c_emp1" list="empList" placeholder="พิมพ์ / เลือก / สแกน" class="flex1" oninput="lookupEmp(this,'c_emp1_name')"/><button class="scan-btn" onclick="openScan(v=>{$('c_emp1').value=v;lookupEmp($('c_emp1'),'c_emp1_name')})">📷</button></div>
            <div id="c_emp1_name" class="emp-name"></div></td></tr>
          <tr><td class="lbl">รหัสพนักงาน BL คนที่ 2</td><td class="in">
            <div class="row gap-sm"><input id="c_emp2" list="empList" placeholder="พิมพ์ / เลือก / สแกน" class="flex1" oninput="lookupEmp(this,'c_emp2_name')"/><button class="scan-btn" onclick="openScan(v=>{$('c_emp2').value=v;lookupEmp($('c_emp2'),'c_emp2_name')})">📷</button></div>
            <div id="c_emp2_name" class="emp-name"></div></td></tr>
        </table>
      </div>

      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">เลขที่บล็อก (<span id="c_block_count">0</span>/${MAX_CLEAN_BLOCKS})</span>
          <button class="scan-btn" onclick="openScan(v=>addCleanBlock(v),{continuous:true})">📷 สแกนต่อเนื่อง</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .6rem">สแกน QR ต่อเนื่องได้สูงสุด ${MAX_CLEAN_BLOCKS} หมายเลข · เลขห้ามซ้ำ</p>
        <div class="row gap-sm mb">
          <input id="c_block_input" placeholder="พิมพ์เลขบล็อก" class="flex1" onkeydown="if(event.key==='Enter'){addCleanBlock($('c_block_input').value);event.preventDefault();}"/>
          <button class="btn-secondary" onclick="addCleanBlock($('c_block_input').value)">เพิ่ม</button>
        </div>
        <div id="c_block_list"></div>
      </div>

      <div class="card">
        <div class="form-group"><label>หมายเหตุ</label><textarea id="c_remark" rows="2" placeholder="ระบุเพิ่มเติม (ถ้ามี)"></textarea></div>
      </div>

      <button class="btn-primary" style="width:100%;font-size:1.05rem;padding:.9rem" onclick="submitClean()">ส่ง</button>
    </div>`;

  window.addCleanBlock = (val) => {
    val = (val || '').trim();
    if (!val) return;
    if (window._cleanBlocks.includes(val)) { toast('เลขบล็อกซ้ำ: ' + val, 'red'); return; }
    if (window._cleanBlocks.length >= MAX_CLEAN_BLOCKS) { toast('ครบ ' + MAX_CLEAN_BLOCKS + ' หมายเลขแล้ว', 'red'); return; }
    window._cleanBlocks.push(val);
    $('c_block_input').value = '';
    renderCleanBlocks();
  };
  window.removeCleanBlock = (i) => { window._cleanBlocks.splice(i,1); renderCleanBlocks(); };
  function renderCleanBlocks() {
    $('c_block_count').textContent = window._cleanBlocks.length;
    $('c_block_list').innerHTML = window._cleanBlocks.length
      ? window._cleanBlocks.map((b,i)=>`
        <div class="blk-row">
          <span class="blk-i">${i+1}</span>
          <span class="flex1"><strong>${b}</strong></span>
          <button class="btn-icon" onclick="removeCleanBlock(${i})">🗑️</button>
        </div>`).join('')
      : '<p class="no-data">ยังไม่มีบล็อก — กดสแกนต่อเนื่อง หรือพิมพ์เพิ่ม</p>';
  }
  renderCleanBlocks();

  window.submitClean = async () => {
    if (window._cleanBlocks.length === 0) { toast('กรุณาเพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    const body = {
      date: todayISO(),
      process_step: $('c_step').value,
      emp1: $('c_emp1').value.trim()||null,
      emp2: $('c_emp2').value.trim()||null,
      remarks: $('c_remark').value.trim()||null,
      blocks: window._cleanBlocks,
    };
    const { data } = await api('/api/clean','POST',body);
    toast(`บันทึกสำเร็จ ${data.count} รายการ (${data.doc_nos[0]} – ${data.doc_nos[data.doc_nos.length-1]})`);
    renderPage('clean');
  };
}

async function pageCleanDetail(app, {doc_no}) {
  const { data: d } = await api(`/api/clean/${doc_no}`);
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('clean')">‹</button>
      <h1>บันทึกการล้าง</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">${d.doc_no}</div>
        <div class="grid2">
          ${infoRow('วันที่',d.date)}
          ${infoRow('ขั้นตอน',d.process_step)}
          ${infoRow('พนักงาน 1',d.emp1_code||'-')}
          ${infoRow('พนักงาน 2',d.emp2_code||'-')}
        </div>
        ${d.remarks?`<p style="color:var(--muted);font-size:.85rem">หมายเหตุ: ${d.remarks}</p>`:''}
      </div>
      <div class="card">
        <div class="card-title">บล็อกที่ล้าง (${d.blocks.length} รายการ)</div>
        ${d.blocks.map(b=>`<div style="padding:.3rem 0;border-bottom:1px solid var(--border)">${b.block_no}</div>`).join('')}
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════
//  MODULE 2 – ร้องขออัดบล็อก
// ══════════════════════════════════════════════════════
// เมนูย่อยของ "ร้องขออัดบล็อก"
function pagePressMenu(app) {
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🖼️ ร้องขออัดบล็อก</h1>
    </div>
    <div class="home-grid">
      <div class="home-card" onclick="renderPage('press',{filter:'all'})">
        <div class="hc-icon">📝</div>
        <div class="hc-title">ร้องขออัดบล็อก</div>
        <div class="hc-sub">สร้าง/ดูใบร้องขอ</div>
      </div>
      <div class="home-card" onclick="renderPage('press',{filter:'pending'})">
        <div class="hc-icon">⏳</div>
        <div class="hc-title">บล็อครออัด</div>
        <div class="hc-sub">รอดำเนินการอัด</div>
      </div>
      <div class="home-card" onclick="renderPage('press',{filter:'inspect'})">
        <div class="hc-icon">🔍</div>
        <div class="hc-title">ตรวจรับ</div>
        <div class="hc-sub">ตรวจรับบล็อกที่อัด</div>
      </div>
      <div class="home-card" onclick="renderPage('press',{filter:'store'})">
        <div class="hc-icon">📦</div>
        <div class="hc-title">จัดเก็บ</div>
        <div class="hc-sub">จัดเก็บเข้าคลัง</div>
      </div>
    </div>`;
}

const PRESS_VIEWS = {
  all:     { title:'ร้องขออัดบล็อก', status:null,          canCreate:true,  empty:'ยังไม่มีรายการ' },
  pending: { title:'บล็อกรออัด',      status:null,          canCreate:false, empty:'ไม่มีบล็อกรออัด' },
  inspect: { title:'ตรวจรับ',          status:'inspect_done',canCreate:false, empty:'ไม่มีรายการตรวจรับ' },
  store:   { title:'จัดเก็บ',          status:'received',    canCreate:false, empty:'ไม่มีบล็อกรอจัดเก็บ' },
};
function pressFileName(d) {
  // วัน/เดือน/ปี & หน่วยงาน & เลขบล็อก(ใหม่ถ้ามี) & เลขที่เอกสาร (+&V1 เฉพาะตอนรอ SUMMIT)
  const blk = d.new_block_no || d.old_block_no;
  return `${fmtDatePad(d.date)}&${d.dept}&${blk}&${d.doc_no}${d.status==='inspected'?'&V1':''}`;
}
async function pagePress(app, { filter = 'all' } = {}) {
  const view = PRESS_VIEWS[filter] || PRESS_VIEWS.all;
  const q = view.status ? `/api/press?status=${view.status}` : '/api/press';
  let { data: docs } = await api(q);
  const statusLabel = { pending:'รอดำเนินการ', inspected:'อัดแล้ว', stored:'จัดเก็บแล้ว' };
  const statusBadge = { pending:'badge-yellow', inspected:'badge-blue', stored:'badge-green' };

  // "บล็อกรออัด" — Folder รายการคลิกได้ (pending + inspected/รอ SUMMIT) → เข้าหน้าตรวจรับ
  if (filter === 'pending') {
    docs = docs.filter(d => d.status === 'pending' || d.status === 'inspected');
    app.innerHTML = `
      <div class="topnav">
        <button class="back-btn" onclick="renderPage('pressMenu')">‹</button>
        <h1>บล็อกรออัด</h1>
      </div>
      <div class="page">
        <div class="folder-tag">📁 Folder บล็อกรออัด</div>
        <div class="card">
          ${docs.length===0
            ? `<p class="no-data">ไม่มีบล็อกรออัด</p>`
            : docs.map(d=>`
              <div class="list-item" onclick="renderPage('pressInspect',{doc_no:'${d.doc_no}'})">
                <div>
                  <div class="list-title">${fmtDatePad(d.date)}&${d.dept}&${d.new_block_no||d.old_block_no}&${d.doc_no}${d.status==='inspected'?'<span style="color:var(--red);font-weight:800">&V1</span>':''}</div>
                  <div class="list-sub">บล็อกเดิม ${d.old_block_no}${d.new_block_no?' → ใหม่ '+d.new_block_no:''} · ${d.dept}</div>
                </div>
                <div class="list-right">
                  <span class="badge ${d.status==='inspected'?'badge-red':'badge-yellow'}">${d.status==='inspected'?'รอจบขั้นตอน':'รอดำเนินการ'}</span>
                  <div class="chevron">›</div>
                </div>
              </div>`).join('')}
        </div>
      </div>`;
    return;
  }

  // "ตรวจรับ" — Folder หลังอัดบล็อก → คลิกเข้าฟอร์มตรวจรับและส่ง
  if (filter === 'inspect') {
    app.innerHTML = `
      <div class="topnav">
        <button class="back-btn" onclick="renderPage('pressMenu')">‹</button>
        <h1>ตรวจรับ</h1>
      </div>
      <div class="page">
        <div class="folder-tag">📁 Folder ตรวจรับ</div>
        <div class="card">
          ${docs.length===0
            ? `<p class="no-data">ไม่มีรายการตรวจรับ</p>`
            : docs.map(d=>`
              <div class="list-item" onclick="renderPage('pressReceive',{doc_no:'${d.doc_no}'})">
                <div>
                  <div class="list-title">${pressFileName(d)}</div>
                  <div class="list-sub">บล็อกใหม่ ${d.new_block_no||'-'} · ${d.dept}</div>
                </div>
                <div class="list-right"><span class="chevron">›</span></div>
              </div>`).join('')}
        </div>
      </div>`;
    return;
  }

  // "จัดเก็บ" — Folder หลังตรวจรับและส่ง
  if (filter === 'store') {
    app.innerHTML = `
      <div class="topnav">
        <button class="back-btn" onclick="renderPage('pressMenu')">‹</button>
        <h1>จัดเก็บ</h1>
      </div>
      <div class="page">
        <div class="folder-tag">📁 Folder จัดเก็บ</div>
        <div class="card">
          ${docs.length===0
            ? `<p class="no-data">ไม่มีบล็อกรอจัดเก็บ</p>`
            : docs.map(d=>`
              <div class="list-item" onclick="renderPage('pressStore',{doc_no:'${d.doc_no}'})">
                <div>
                  <div class="list-title">${pressFileName(d)}</div>
                  <div class="list-sub">บล็อกใหม่ ${d.new_block_no||'-'} · ${d.dept}</div>
                </div>
                <div class="list-right"><span class="chevron">›</span></div>
              </div>`).join('')}
        </div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('pressMenu')">‹</button>
      <h1>${view.title}</h1>
      ${view.canCreate ? `<button class="btn-primary btn-sm" onclick="renderPage('pressNew')">+ ร้องขอ</button>` : ''}
    </div>
    <div class="page">
      <div class="card">
        ${docs.length===0?`<p class="no-data">${view.empty}</p>`:docs.map(d=>`
          <div class="list-item" onclick="renderPage('pressDetail',{doc_no:'${d.doc_no}'})">
            <div>
              <div class="list-title">${d.doc_no}</div>
              <div class="list-sub">บล็อกเดิม: ${d.old_block_no} ${d.new_block_no?'→ ใหม่: '+d.new_block_no:''}</div>
              <div class="list-sub">${d.dept} · ${d.date}</div>
            </div>
            <div class="list-right">
              <span class="badge ${statusBadge[d.status]||'badge-gray'}">${statusLabel[d.status]||d.status}</span>
              <div class="chevron">›</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
}

function pagePressNew(app) {
  window._pressFilms = [
    {internal_code:'',color_order:'',revision:'',fabric_no:''},
  ];
  const deptOpts = master.departments.map(d=>`<option value="${d.id}">${d.id} – ${d.name}</option>`).join('');
  const probOpts = master.problems.map(p=>`<option>${p.name}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('pressMenu')">‹</button>
      <h1>ร้องขออัดบล็อก</h1>
    </div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>

      <div class="ptabs">
        <button class="ptab active">ร้องขออัดบล็อก</button>
        <button class="ptab" onclick="renderPage('press',{filter:'pending'})">บล็อกรออัด</button>
        <button class="ptab" onclick="renderPage('press',{filter:'inspect'})">ตรวจรับ</button>
        <button class="ptab" onclick="renderPage('press',{filter:'store'})">จัดเก็บ</button>
      </div>

      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">อัตโนมัติ</td></tr>
          <tr><td class="lbl">หน่วยงาน</td><td class="in"><select id="p_dept">${deptOpts}</select></td></tr>
          <tr><td class="lbl">เลขที่บล็อกเดิม</td><td class="in">
            <div class="row gap-sm"><input id="p_old_block" placeholder="สแกน / พิมพ์" class="flex1" oninput="lookupFrame(this.value)"/><button class="scan-btn" onclick="openScan(v=>{$('p_old_block').value=v;lookupFrame(v);})">📷</button></div></td></tr>
          <tr><td class="lbl">ขนาดเฟรม</td><td class="auto" id="p_framesize">-</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">ข้อมูลบล็อก (ฟิล์ม)</span>
          <button class="btn-sm btn-secondary" onclick="addFilmRow()">+ เพิ่มฟิล์ม</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .5rem">สแกน QR CODE ในบล็อกทุกสี · สูงสุด 4 Film</p>
        <div class="table-scroll">
          <table class="filmtbl">
            <thead><tr><th></th><th>รหัสภายใน</th><th>ลำดับสี</th><th>Rev.</th><th>เบอร์ผ้า</th><th></th></tr></thead>
            <tbody id="film_rows"></tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">ปัญหา</td><td class="in"><select id="p_problem" onchange="togglePressRemark()">${probOpts}</select></td></tr>
          <tr><td class="lbl">หมายเหตุ</td><td class="in"><input id="p_remark" placeholder="ระบุเพิ่มเติม (จำเป็นเมื่อเลือก อื่นๆ)"/></td></tr>
          <tr><td class="lbl">รหัสพนักงานผู้ร้องขอ</td><td class="in">
            <div class="row gap-sm"><input id="p_emp" list="empList" placeholder="พิมพ์ / เลือก / สแกน" class="flex1" oninput="lookupEmp(this,'p_emp_name')"/><button class="scan-btn" onclick="openScan(v=>{$('p_emp').value=v;lookupEmp($('p_emp'),'p_emp_name')})">📷</button></div>
            <div id="p_emp_name" class="emp-name"></div></td></tr>
        </table>
      </div>

      <button class="btn-primary" style="width:100%;font-size:1.05rem;padding:.9rem" onclick="submitPress()">SUMMIT</button>
    </div>`;

  window.lookupFrame = async (bno) => {
    bno = (bno||'').trim();
    const el = $('p_framesize');
    if (!bno) { el.textContent = '-'; return; }
    try { const { data } = await api('/api/block/'+encodeURIComponent(bno)); el.textContent = data.size_label || '-'; }
    catch { el.textContent = 'ไม่พบบล็อกในทะเบียน'; }
  };
  window.togglePressRemark = () => {};

  window.addFilmRow = () => {
    if (window._pressFilms.length >= 4) { toast('สูงสุด 4 ฟิล์ม','red'); return; }
    window._pressFilms.push({internal_code:'',color_order:'',revision:'',fabric_no:''});
    renderFilmRows();
  };
  window.removeFilmRow = (i) => { if (window._pressFilms.length<=1) { toast('ต้องมีอย่างน้อย 1 ฟิล์ม','red'); return; } window._pressFilms.splice(i,1); renderFilmRows(); };
  function renderFilmRows() {
    $('film_rows').innerHTML = window._pressFilms.map((f,i)=>`
      <tr>
        <td><button class="scan-btn btn-sm" onclick="openScan(v=>{window._pressFilms[${i}].internal_code=v;renderFilmRowsG();})">📷</button></td>
        <td><input value="${f.internal_code}" oninput="window._pressFilms[${i}].internal_code=this.value" placeholder="H-E-26-01" style="min-width:110px"/></td>
        <td><input value="${f.color_order}" oninput="window._pressFilms[${i}].color_order=this.value" placeholder="1" style="width:56px"/></td>
        <td><input value="${f.revision}" oninput="window._pressFilms[${i}].revision=this.value" placeholder="1" style="width:56px"/></td>
        <td><select onchange="window._pressFilms[${i}].fabric_no=this.value" style="min-width:100px">
          <option value="">เลือก...</option>
          ${master.fabric_types.map(ft=>`<option value="${ft.id}" ${ft.id===f.fabric_no?'selected':''}>${ft.id}</option>`).join('')}
        </select></td>
        <td><button class="btn-icon" onclick="removeFilmRow(${i})">🗑️</button></td>
      </tr>`).join('');
  }
  window.renderFilmRowsG = renderFilmRows;
  renderFilmRows();

  window.submitPress = async () => {
    const old_block_no = $('p_old_block').value.trim();
    if (!old_block_no) { toast('กรุณากรอกเลขบล็อกเดิม','red'); return; }
    if ($('p_problem').value === 'อื่นๆ' && !$('p_remark').value.trim()) { toast('เลือก "อื่นๆ" ต้องกรอกหมายเหตุ','red'); return; }
    const body = {
      date: todayISO(),
      time: nowTime(),
      dept: $('p_dept').value,
      old_block_no,
      requester_emp: $('p_emp').value.trim()||null,
      problem_type: $('p_problem').value,
      remarks: $('p_remark').value.trim()||null,
      films: window._pressFilms.filter(f=>f.internal_code),
    };
    const { data } = await api('/api/press','POST',body);
    toast('ร้องขอสำเร็จ: '+data.doc_no);
    renderPage('press',{filter:'pending'});
  };
}

async function pagePressDetail(app, {doc_no}) {
  const { data: d } = await api(`/api/press-doc?doc_no=${encodeURIComponent(doc_no)}`);
  const canInspect = d.status === 'pending' || d.status === 'inspected';
  const canStore = d.status === 'inspected' && !d.storage;
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('press')">‹</button>
      <h1>รายละเอียดร้องขออัดบล็อก</h1>
    </div>
    <div class="page">
      <div class="steps">
        <div class="step done">1.ร้องขอ</div>
        <div class="step ${d.status!=='pending'?'done':'active'}">2.บล็อกรออัด</div>
        <div class="step ${d.status==='stored'?'done':d.status==='inspected'?'done':''}">3.ตรวจรับ</div>
        <div class="step ${d.status==='stored'?'active':''}">4.จัดเก็บ</div>
      </div>

      <div class="card">
        <div class="card-title">${d.doc_no}</div>
        <div class="grid2">
          ${infoRow('วันที่',d.date)} ${infoRow('เวลา',d.time)}
          ${infoRow('หน่วยงาน',d.dept)} ${infoRow('สถานะ',d.status)}
          ${infoRow('บล็อกเดิม',d.old_block_no)} ${infoRow('บล็อกใหม่',d.new_block_no||'-')}
          ${infoRow('ปัญหา',d.problem_type||'-')}
        </div>
        ${d.remarks?`<p style="color:var(--muted);font-size:.82rem">หมายเหตุ: ${d.remarks}</p>`:''}
      </div>

      ${d.films.length?`
      <div class="card">
        <div class="card-title">ฟิล์ม</div>
        <div class="film-row film-header" style="font-size:.7rem"><span>รหัสภายใน</span><span>สี</span><span>Rev</span><span>เบอร์ผ้า</span><span></span></div>
        ${d.films.map(f=>`<div class="film-row"><span>${f.internal_code}</span><span>${f.color_order}</span><span>${f.revision}</span><span>${f.fabric_no}</span><span></span></div>`).join('')}
      </div>`:''}

      ${d.inspections.length?`
      <div class="card">
        <div class="card-title">ผลการตรวจรับ (${d.inspections.length} ครั้ง)</div>
        ${d.inspections.map(ins=>`
          <div class="history-entry">
            <strong>ครั้งที่ ${ins.version}</strong> – ${ins.insp_date} ${ins.insp_time||''}<br/>
            บล็อกใหม่: ${ins.new_block_no||'-'} · ความตึง: ${ins.tension_value||'-'} N/cm
            <span class="badge ${ins.tension_pass?'badge-green':'badge-red'}">${ins.tension_pass?'ผ่าน':'ไม่ผ่าน'}</span>
          </div>`).join('')}
      </div>`:''}

      ${d.storage?`
      <div class="card">
        <div class="card-title">ข้อมูลจัดเก็บ</div>
        <div class="grid2">
          ${infoRow('บล็อกใหม่',d.storage.new_block_no||'-')}
          ${infoRow('ที่จัดเก็บ',d.storage.storage_location||'-')}
          ${infoRow('ผู้จัดเก็บ',d.storage.storer_emp||'-')}
          ${infoRow('วันที่',d.storage.store_date||'-')}
        </div>
      </div>`:''}

      <div class="col gap" style="gap:.5rem">
        ${canInspect?`<button class="btn-primary" onclick="renderPage('pressInspect',{doc_no:'${doc_no}'})">📝 บันทึกตรวจรับ (ขั้นตอน 3)</button>`:''}
        ${canStore?`<button class="btn-success" onclick="renderPage('pressStore',{doc_no:'${doc_no}'})">📦 จัดเก็บ (ขั้นตอน 4)</button>`:''}
      </div>
    </div>`;
}

const INSPECT_ROWS = [
  {key:'tension_pass',   label:'ความตึงของบล็อกสกรีน', std:'14-20 นิวตัน/ซม.', method:'DIAL GAUGE', value:'i_tension', unit:'นิวตัน'},
  {key:'dust_pass',      label:'ความสะอาด: ไม่มีฝุ่น', std:'ไม่มีฝุ่น', method:'สายตา'},
  {key:'grease_pass',    label:'ความสะอาด: ไม่มีคราบไขมัน', std:'ไม่มีคราบไขมัน', method:'สายตา'},
  {key:'old_adhesive_pass', label:'ความสะอาด: ไม่มีคราบกาวอัดเดิม/หมึกพิมพ์', std:'ไม่มีคราบกาว/หมึก', method:'สายตา'},
  {key:'fabric_hole_pass', label:'สภาพของผ้าสกรีน', std:'ผ้าไม่ขาด/ไม่เป็นรูรั่วมากเกินไป', method:'สายตา'},
  {key:'dot_pass',       label:'ตามดบนแม่พิมพ์', std:'ไม่มีตามด', method:'สายตา'},
  {key:'film_correct_pass', label:'ความถูกต้องของฟิล์ม', std:'TAG ถูกต้อง / ไม่กลับด้าน', method:'สายตา'},
  {key:'_exposure_pass', label:'เวลาในการฉายแสง', std:'TAG หน้าเครื่อง', method:'TAG หน้าเครื่อง', value:'i_exposure', unit:'วินาที'},
  {key:'adhesive_block_pass', label:'กาวอุดตันบริเวณภาพ', std:'ไม่อุดตัน', method:'สายตา'},
  {key:'sharpness_pass', label:'ความคมชัดของภาพ', std:'คมชัด', method:'สายตา'},
  {key:'register_pass',  label:'REGISTER (MARK)', std:'ตรงกัน', method:'ฟิล์มพิมพ์'},
];
async function pagePressInspect(app, {doc_no}) {
  const { data: d } = await api(`/api/press-doc?doc_no=${encodeURIComponent(doc_no)}`);
  const f = d.films || [];
  const join = k => f.map(x=>x[k]).filter(v=>v!=null&&v!=='').join(', ') || '-';
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  const state = {};
  INSPECT_ROWS.forEach(r => state[r.key] = null);
  window._inspState = state;
  window._inspSaved = false;

  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('press',{filter:'pending'})">‹</button>
      <h1>ตรวจรับ</h1>
    </div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="ptabs">
        <button class="ptab" onclick="renderPage('press',{filter:'all'})">ร้องขออัดบล็อก</button>
        <button class="ptab active">บล็อกรออัด</button>
        <button class="ptab" onclick="renderPage('press',{filter:'inspect'})">ตรวจรับ</button>
        <button class="ptab" onclick="renderPage('press',{filter:'store'})">จัดเก็บ</button>
      </div>

      <div class="card">
        <div class="card-title">ข้อมูลชุดที่ 1</div>
        <table class="ftable">
          <tr><td class="lbl">หน่วยงาน</td><td class="auto">${d.dept||'-'}</td></tr>
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">${d.doc_no}</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${fmtDate(d.date)}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${d.time||'-'} น.</td></tr>
          <tr><td class="lbl">กำหนดวันที่เสร็จ</td><td class="in"><input type="date" id="i_due_date" value="${todayISO()}"/></td></tr>
          <tr><td class="lbl">กำหนดเวลาเสร็จ</td><td class="in"><input type="time" id="i_due_time" value="${nowTime()}"/></td></tr>
          <tr><td class="lbl">เลขที่บล็อกใหม่</td><td class="in">
            <div class="row gap-sm"><input id="i_new_block" class="flex1" placeholder="สแกน / พิมพ์" oninput="lookupNewFrame(this.value)"/><button class="scan-btn" onclick="openScan(v=>{$('i_new_block').value=v;lookupNewFrame(v);})">📷</button></div></td></tr>
          <tr><td class="lbl">ขนาดเฟรม</td><td class="auto" id="i_framesize">-</td></tr>
          <tr><td class="lbl">รหัสภายใน</td><td class="auto">${join('internal_code')}</td></tr>
          <tr><td class="lbl">ลำดับสี</td><td class="auto">${join('color_order')}</td></tr>
          <tr><td class="lbl">Revision</td><td class="auto">${join('revision')}</td></tr>
          <tr><td class="lbl">เบอร์ผ้า</td><td class="auto">${join('fabric_no')}</td></tr>
        </table>
      </div>

      <div class="card">
        <div class="card-title">ข้อมูลชุดที่ 2 — ผลการตรวจรับ</div>
        <div class="table-scroll">
          <table class="insp">
            <thead><tr><th>สิ่งที่ต้องควบคุม</th><th>เกณฑ์</th><th>วิธี</th><th>ค่าที่วัดได้</th><th>ผ่าน</th><th>ไม่ผ่าน</th></tr></thead>
            <tbody>
              ${INSPECT_ROWS.map(r=>`<tr>
                <td>${r.label}</td>
                <td class="sub">${r.std}</td>
                <td class="sub">${r.method}</td>
                <td>${r.value?`<input id="${r.value}" type="number" step="0.1" placeholder="${r.unit}" style="width:80px"/>`:'-'}</td>
                <td class="ctr"><button class="pfbtn" id="pf_pass_${r.key}" onclick="setCheck('${r.key}',1)"></button></td>
                <td class="ctr"><button class="pfbtn" id="pf_fail_${r.key}" onclick="setCheck('${r.key}',0)"></button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-title">ผู้ปฏิบัติ</div>
        <table class="ftable">
          <tr><td class="lbl">รหัสพนักงาน BL คนที่ 1</td><td class="in">
            <div class="row gap-sm"><input id="i_emp1" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="onEmp1(this)"/><button class="scan-btn" onclick="openScan(v=>{$('i_emp1').value=v;onEmp1($('i_emp1'));})">📷</button></div>
            <div id="i_emp1_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">รหัสพนักงาน BL คนที่ 2</td><td class="in">
            <div class="row gap-sm"><input id="i_emp2" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'i_emp2_n')"/><button class="scan-btn" onclick="openScan(v=>{$('i_emp2').value=v;lookupEmp($('i_emp2'),'i_emp2_n')})">📷</button></div>
            <div id="i_emp2_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">วันที่ปฏิบัติ</td><td class="auto" id="i_op_date">-</td></tr>
          <tr><td class="lbl">เวลาปฏิบัติ</td><td class="auto" id="i_op_time">-</td></tr>
        </table>
      </div>

      <div class="row gap-sm">
        <button class="btn-success flex1" style="padding:.9rem;font-size:1rem" onclick="saveInspect('${doc_no}')">บันทึก</button>
        <button class="flex1" id="btn_summit" disabled style="padding:.9rem;font-size:1rem;background:#cbd5e1;color:#64748b;cursor:not-allowed" onclick="summitInspect('${doc_no}')">จบขั้นตอน</button>
      </div>
      <p class="scan-hint" style="text-align:center;margin-top:.5rem">กด "บันทึก" ได้ตลอด (เพิ่มข้อมูลได้เรื่อยๆ) · "จบขั้นตอน" เปิดเป็นสีเขียวหลังกดบันทึก · ต้องระบุพนักงานทั้ง 2 คน</p>
    </div>`;

  window.lookupNewFrame = async (bno) => {
    bno = (bno||'').trim(); const el = $('i_framesize');
    if (!bno) { el.textContent='-'; return; }
    try { const { data } = await api('/api/block/'+encodeURIComponent(bno)); el.textContent = data.size_label||'-'; }
    catch { el.textContent='ไม่พบบล็อก (จะเพิ่มใหม่)'; }
  };
  window.onEmp1 = (inp) => {
    lookupEmp(inp, 'i_emp1_n');
    // วันที่/เวลาปฏิบัติ = ตามเวลาที่กรอกรหัสพนักงาน BL คนที่ 1
    if (inp.value.trim()) { $('i_op_date').textContent = todayStr(); $('i_op_time').textContent = nowTime()+' น.'; }
    else { $('i_op_date').textContent = '-'; $('i_op_time').textContent = '-'; }
  };
  window.setCheck = (key, val) => {
    // กดซ้ำที่ค่าเดิม = ยกเลิก (กลับเป็นว่าง)
    const cur = window._inspState[key];
    const next = (cur === val) ? null : val;
    window._inspState[key] = next;
    $(`pf_pass_${key}`).className = 'pfbtn' + (next===1?' on-pass':'');
    $(`pf_fail_${key}`).className = 'pfbtn' + (next===0?' on-fail':'');
  };

  function collectBody() {
    const st = window._inspState;
    return {
      new_block_no: $('i_new_block').value.trim()||null,
      frame_size: $('i_framesize').textContent !== '-' ? $('i_framesize').textContent : null,
      due_date: $('i_due_date').value,
      due_time: $('i_due_time').value,
      tension_value: parseFloat($('i_tension').value)||null,
      tension_pass: st.tension_pass?1:0,
      dust_pass: st.dust_pass?1:0, grease_pass: st.grease_pass?1:0, old_adhesive_pass: st.old_adhesive_pass?1:0,
      fabric_hole_pass: st.fabric_hole_pass?1:0, dot_pass: st.dot_pass?1:0, film_correct_pass: st.film_correct_pass?1:0,
      exposure_seconds: parseFloat($('i_exposure').value)||null,
      adhesive_block_pass: st.adhesive_block_pass?1:0, sharpness_pass: st.sharpness_pass?1:0, register_pass: st.register_pass?1:0,
      emp1_code: $('i_emp1').value.trim()||null, emp2_code: $('i_emp2').value.trim()||null,
      insp_date: todayISO(), insp_time: nowTime(),
    };
  }
  function enableSummit() {
    const s = $('btn_summit');
    s.disabled = false; s.style.cssText = 'padding:.9rem;font-size:1rem'; s.className = 'flex1 btn-danger';
  }

  window.saveInspect = async (docNo) => {
    if (!$('i_new_block').value.trim()) { toast('กรุณาระบุเลขที่บล็อกใหม่','red'); return; }
    await api(`/api/press-inspect?doc_no=${encodeURIComponent(docNo)}`,'POST',collectBody());
    toast('บันทึกแล้ว — กลับสู่ Folder บล็อกรออัด');
    renderPage('press',{filter:'pending'});
  };
  window.summitInspect = async (docNo) => {
    const e1 = $('i_emp1').value.trim(), e2 = $('i_emp2').value.trim();
    if (!e1 || !e2) { toast('ต้องระบุ/สแกนพนักงาน BL ทั้ง 2 คน ก่อนจบขั้นตอน','red'); return; }
    // บันทึกครั้งสุดท้าย (พร้อมชื่อผู้ปฏิบัติ + วันเวลาที่กด SUMMIT) แล้วจบขั้นตอน
    await api(`/api/press-inspect?doc_no=${encodeURIComponent(docNo)}`,'POST',collectBody());
    await api(`/api/press-summit?doc_no=${encodeURIComponent(docNo)}`,'POST',{});
    toast('จบขั้นตอนอัดบล็อก — ย้ายไป Folder ตรวจรับ');
    renderPage('press',{filter:'inspect'});
  };

  // ถ้าตรวจรับแล้ว (SAVE มาก่อน) → เติมค่าเดิม + เปิด SUMMIT ให้เลย
  if (d.status === 'inspected' && d.inspections && d.inspections.length) {
    const last = d.inspections[d.inspections.length-1];
    $('i_new_block').value = last.new_block_no || '';
    if (last.new_block_no) window.lookupNewFrame(last.new_block_no);
    if (last.due_date) $('i_due_date').value = last.due_date;
    if (last.due_time) $('i_due_time').value = last.due_time;
    if (last.tension_value!=null) $('i_tension').value = last.tension_value;
    if (last.exposure_seconds!=null) $('i_exposure').value = last.exposure_seconds;
    INSPECT_ROWS.forEach(r => { const v = last[r.key]; if (v===1||v===0) window.setCheck(r.key, v); });
    if (last.emp1_code) { $('i_emp1').value = last.emp1_code; window.onEmp1($('i_emp1')); }
    if (last.emp2_code) { $('i_emp2').value = last.emp2_code; lookupEmp($('i_emp2'),'i_emp2_n'); }
    enableSummit();
  }
}

// ── ตรวจรับและส่ง (จาก Folder ตรวจรับ) ──
const RECEIVE_ROWS = [
  {key:'film_correct_pass', label:'ความถูกต้องของบล็อก', std:'TAG ถูกต้อง', method:'สายตา'},
  {key:'register_pass', label:'Register (Mark)', std:'ตรงกัน', method:'ฟิล์มพิมพ์'},
  {key:'adhesive_block_pass', label:'กาวอุดตันบริเวณภาพ', std:'ไม่อุดตัน', method:'สายตา'},
  {key:'sharpness_pass', label:'ความคมชัดของภาพ', std:'คมชัด', method:'สายตา'},
  {key:'dot_pass', label:'ตรวจสอบฟิล์มทาบกับบล็อก', std:'ไม่กลับด้าน ภาพสมบูรณ์', method:'สายตา'},
];
async function pagePressReceive(app, {doc_no}) {
  const { data: d } = await api(`/api/press-doc?doc_no=${encodeURIComponent(doc_no)}`);
  const f = d.films||[]; const join = k=>f.map(x=>x[k]).filter(v=>v!=null&&v!=='').join(', ')||'-';
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  const state={}; RECEIVE_ROWS.forEach(r=>state[r.key]=null); window._inspState=state;
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('press',{filter:'inspect'})">‹</button><h1>ตรวจรับและส่ง</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="ptabs">
        <button class="ptab" onclick="renderPage('press',{filter:'all'})">ร้องขออัดบล็อก</button>
        <button class="ptab" onclick="renderPage('press',{filter:'pending'})">บล็อกรออัด</button>
        <button class="ptab active">ตรวจรับ</button>
        <button class="ptab" onclick="renderPage('press',{filter:'store'})">จัดเก็บ</button>
      </div>
      <div class="card"><div class="card-title">ข้อมูลชุดที่ 1</div>
        <table class="ftable">
          <tr><td class="lbl">หน่วยงานร้องขอ</td><td class="auto">${d.dept||'-'}</td></tr>
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">${d.doc_no}</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${fmtDate(d.date)}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${d.time||'-'} น.</td></tr>
          <tr><td class="lbl">เลขที่บล็อก (ใหม่)</td><td class="auto">${d.new_block_no||'-'}</td></tr>
          <tr><td class="lbl">ขนาดเฟรม</td><td class="auto" id="r_frame">-</td></tr>
          <tr><td class="lbl">รหัสภายใน</td><td class="auto">${join('internal_code')}</td></tr>
          <tr><td class="lbl">ลำดับสี</td><td class="auto">${join('color_order')}</td></tr>
          <tr><td class="lbl">Revision</td><td class="auto">${join('revision')}</td></tr>
          <tr><td class="lbl">เบอร์ผ้า</td><td class="auto">${join('fabric_no')}</td></tr>
        </table>
      </div>
      <div class="card"><div class="card-title">ผลการตรวจรับ</div>
        <div class="table-scroll"><table class="insp">
          <thead><tr><th>สิ่งที่ต้องควบคุม</th><th>เกณฑ์</th><th>วิธี</th><th>ผ่าน</th><th>ไม่ผ่าน</th></tr></thead>
          <tbody>${RECEIVE_ROWS.map(r=>`<tr><td>${r.label}</td><td class="sub">${r.std}</td><td class="sub">${r.method}</td>
            <td class="ctr"><button class="pfbtn" id="pf_pass_${r.key}" onclick="setCheck('${r.key}',1)"></button></td>
            <td class="ctr"><button class="pfbtn" id="pf_fail_${r.key}" onclick="setCheck('${r.key}',0)"></button></td></tr>`).join('')}</tbody>
        </table></div>
      </div>
      <div class="card"><div class="card-title">ผู้ตรวจรับและส่ง</div>
        <table class="ftable">
          <tr><td class="lbl">รหัสพนักงาน</td><td class="in">
            <div class="row gap-sm"><input id="r_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="onREmp(this)"/><button class="scan-btn" onclick="openScan(v=>{$('r_emp').value=v;onREmp($('r_emp'));})">📷</button></div>
            <div id="r_emp_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto" id="r_date">-</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto" id="r_time">-</td></tr>
        </table>
      </div>
      <button class="btn-danger" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="doReceive('${doc_no}')">จบขั้นตอน</button>
      <p class="scan-hint" style="text-align:center;margin-top:.5rem">ต้องระบุ/สแกนผู้ตรวจรับและส่ง แล้วจึงจบขั้นตอน → ย้ายไป Folder จัดเก็บ</p>
    </div>`;
  if (d.new_block_no) { try{ const {data:b}=await api('/api/block/'+encodeURIComponent(d.new_block_no)); $('r_frame').textContent=b.size_label||'-'; }catch{} }
  window.setCheck=(key,val)=>{const cur=window._inspState[key];const next=cur===val?null:val;window._inspState[key]=next;$(`pf_pass_${key}`).className='pfbtn'+(next===1?' on-pass':'');$(`pf_fail_${key}`).className='pfbtn'+(next===0?' on-fail':'');};
  window.onREmp=(inp)=>{lookupEmp(inp,'r_emp_n');if(inp.value.trim()){$('r_date').textContent=todayStr();$('r_time').textContent=nowTime()+' น.';}else{$('r_date').textContent='-';$('r_time').textContent='-';}};
  window.doReceive=async(docNo)=>{const e=$('r_emp').value.trim();if(!e){toast('ต้องระบุ/สแกนผู้ตรวจรับและส่ง','red');return;}await api(`/api/press-receive?doc_no=${encodeURIComponent(docNo)}`,'POST',{receiver_emp:e,receive_date:todayISO(),receive_time:nowTime()});toast('จบขั้นตอนตรวจรับ — ย้ายไป Folder จัดเก็บ');renderPage('press',{filter:'store'});};
}

// ── จัดเก็บ (จาก Folder จัดเก็บ) ──
async function pagePressStore(app, {doc_no}) {
  const { data: d } = await api(`/api/press-doc?doc_no=${encodeURIComponent(doc_no)}`);
  const f=d.films||[]; const join=k=>f.map(x=>x[k]).filter(v=>v!=null&&v!=='').join(', ')||'-';
  const deptOpts=master.departments.map(x=>`<option value="${x.id}" ${x.id===d.dept?'selected':''}>${x.id}</option>`).join('');
  const empOpts=master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('press',{filter:'store'})">‹</button><h1>จัดเก็บ</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="ptabs">
        <button class="ptab" onclick="renderPage('press',{filter:'all'})">ร้องขออัดบล็อก</button>
        <button class="ptab" onclick="renderPage('press',{filter:'pending'})">บล็อกรออัด</button>
        <button class="ptab" onclick="renderPage('press',{filter:'inspect'})">ตรวจรับ</button>
        <button class="ptab active">จัดเก็บ</button>
      </div>
      <div class="card"><div class="card-title">ข้อมูลชุดที่ 1</div>
        <table class="ftable">
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">${d.doc_no}</td></tr>
          <tr><td class="lbl">หน่วยงานที่รับ</td><td class="in"><select id="st_dept">${deptOpts}</select></td></tr>
          <tr><td class="lbl">เลขที่บล็อก</td><td class="auto">${d.new_block_no||'-'}</td></tr>
          <tr><td class="lbl">ขนาดเฟรม</td><td class="auto" id="st_frame">-</td></tr>
          <tr><td class="lbl">รหัสภายใน</td><td class="auto">${join('internal_code')}</td></tr>
          <tr><td class="lbl">ลำดับสี</td><td class="auto">${join('color_order')}</td></tr>
          <tr><td class="lbl">Revision</td><td class="auto">${join('revision')}</td></tr>
          <tr><td class="lbl">เบอร์ผ้า</td><td class="auto">${join('fabric_no')}</td></tr>
          <tr><td class="lbl">ที่จัดเก็บ</td><td class="in"><div class="row gap-sm"><input id="st_loc" class="flex1" placeholder="เช่น A1/1 (สแกน/พิมพ์)"/><button class="scan-btn" onclick="openScan(v=>$('st_loc').value=v)">📷</button></div></td></tr>
          <tr><td class="lbl">หมายเหตุ</td><td class="in"><input id="st_remark" placeholder="ระบุเพิ่มเติม"/></td></tr>
          <tr><td class="lbl">รหัสพนักงานผู้จัดเก็บ</td><td class="in"><div class="row gap-sm"><input id="st_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'st_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('st_emp').value=v;lookupEmp($('st_emp'),'st_emp_n')})">📷</button></div><div id="st_emp_n" class="emp-name"></div></td></tr>
        </table>
      </div>
      <button class="btn-danger" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="doStore('${doc_no}')">จบขั้นตอน</button>
    </div>`;
  if (d.new_block_no) { try{ const {data:b}=await api('/api/block/'+encodeURIComponent(d.new_block_no)); $('st_frame').textContent=b.size_label||'-'; }catch{} }
  window.doStore=async(docNo)=>{
    const loc=$('st_loc').value.trim(), emp=$('st_emp').value.trim();
    if(!loc){toast('ระบุที่จัดเก็บ','red');return;}
    if(!emp){toast('ระบุ/สแกนพนักงานผู้จัดเก็บ','red');return;}
    await api(`/api/press-store?doc_no=${encodeURIComponent(docNo)}`,'POST',{new_block_no:d.new_block_no,frame_size:$('st_frame').textContent,storage_location:loc,remarks:$('st_remark').value.trim()||null,storer_emp:emp,store_date:todayISO(),store_time:nowTime(),to_dept:$('st_dept').value});
    toast('จบขั้นตอนจัดเก็บ');
    renderPage('pressDB3');
  };
}

// ── DATA BASE 3 — ฟอร์มใบเบิกจ่ายบล็อก ──
async function pagePressDB3(app) {
  const { data: rows } = await api('/api/press-stored');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('pressMenu')">‹</button><h1>DATA BASE 3</h1>
      <button class="btn-primary btn-sm" onclick="exportDB3()">⬇ Excel</button></div>
    <div class="page"><div class="card"><div class="card-title">ฟอร์มใบเบิกจ่ายบล็อก</div>
      <div class="table-scroll"><table class="db1"><thead><tr>
        <th>วันที่</th><th>เลขที่เอกสาร</th><th>เลขที่บล็อก</th><th>รหัสภายใน</th><th>จากหน่วยงาน</th><th>ผู้ส่ง</th><th>Revision</th><th>สี</th><th>ผู้รับ</th><th>ถึงหน่วยงาน</th><th>ที่จัดเก็บ</th><th>หมายเหตุ</th>
      </tr></thead><tbody>
      ${rows.length===0?`<tr><td colspan="12" class="no-data">ยังไม่มีรายการ</td></tr>`:rows.map(r=>`<tr>
        <td>${fmtDate(r.store_date||r.date)}</td><td><strong>${r.doc_no}</strong></td><td><strong>${r.new_block_no||'-'}</strong></td>
        <td style="font-size:.75rem">${r.internal_codes||'-'}</td><td>บล็อก</td><td>${r.sender_name||'-'}</td>
        <td>${r.revisions||'-'}</td><td>${r.color_orders||'-'}</td><td>${r.receiver_name||'-'}</td>
        <td>${r.store_to_dept||'-'}</td><td>${r.storage_location||'-'}</td><td>${r.store_remarks||'-'}</td>
      </tr>`).join('')}
      </tbody></table></div>
    </div></div>`;
  window.exportDB3=()=>{
    const data=rows.map(r=>({'วันที่':fmtDate(r.store_date||r.date),'เลขที่เอกสาร':r.doc_no,'เลขที่บล็อก':r.new_block_no,'รหัสภายใน':r.internal_codes,'จากหน่วยงาน':'บล็อก','ผู้ส่ง':r.sender_name,'Revision':r.revisions,'สี':r.color_orders,'ผู้รับ':r.receiver_name,'ถึงหน่วยงาน':r.store_to_dept,'ที่จัดเก็บ':r.storage_location,'หมายเหตุ':r.store_remarks}));
    const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DB3');XLSX.writeFile(wb,'DataBase3.xlsx');
  };
}

// ══════════════════════════════════════════════════════
//  MODULE 3 – รับส่งภายใน
// ══════════════════════════════════════════════════════
// ── เมนู "รับส่งภายใน" ──
function pageInternal(app) {
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🔄 รับส่งภายใน</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">สร้างเอกสารใหม่</div>
        <div class="row gap-sm" style="flex-wrap:wrap">
          <button class="btn-primary" onclick="renderPage('internalPrepare')">🧰 จัดเตรียม</button>
          <button class="btn-secondary" onclick="renderPage('internalTransport')">🚀 ขนส่ง/ตรวจรับ</button>
          <button class="btn-secondary" onclick="renderPage('internalReceive')">🗃️ ตรวจรับและจัดเก็บ</button>
        </div>
      </div>
    </div>`;
}

// ── ขั้นตอนการเตรียม (จัดเตรียม) ──
function pageInternalPrepare(app) {
  window._prepBlocks = [];
  const deptOpts = master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('internal')">‹</button><h1>ขั้นตอนการเตรียม</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">อัตโนมัติ</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">หน่วยงานที่เตรียม <span class="req">*</span></td><td class="in"><select id="pp_from">${deptOpts}</select></td></tr>
          <tr><td class="lbl">รหัสพนักงานผู้จัดเตรียม <span class="req">*</span></td><td class="in">
            <div class="row gap-sm"><input id="pp_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'pp_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('pp_emp').value=v;lookupEmp($('pp_emp'),'pp_emp_n')})">📷</button></div>
            <div id="pp_emp_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">เตรียมให้หน่วยงาน <span class="req">*</span></td><td class="in"><select id="pp_to">${deptOpts}</select></td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">บล็อก (<span id="pp_count">0</span>)</span>
          <button class="scan-btn" onclick="openScan(v=>addPrepBlock(v),{continuous:true})">📷 สแกนต่อเนื่อง</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .6rem">สแกน QR CODE ได้ต่อเนื่อง 100 หมายเลข · แต่ละบล็อกเพิ่มฟิล์มได้สูงสุด 4</p>
        <div class="row gap-sm mb"><input id="pp_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter'){addPrepBlock($('pp_block_in').value);event.preventDefault();}"/><button class="btn-secondary" onclick="addPrepBlock($('pp_block_in').value)">เพิ่ม</button></div>
        <div id="pp_rows"></div>
      </div>
      <button class="btn-primary" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="saveOnclickPrepare()">บันทึก</button>
    </div>`;

  window.addPrepBlock = (val) => {
    val = (val||'').trim(); if (!val) return;
    if (window._prepBlocks.find(b=>b.block_no===val)) { toast('เลขบล็อกซ้ำ: '+val,'red'); return; }
    window._prepBlocks.push({ block_no: val, films: [{internal_code:'',color_order:'',revision:''}] });
    $('pp_block_in').value = '';
    renderPrepRows();
  };
  window.removePrepBlock = (i) => { window._prepBlocks.splice(i,1); renderPrepRows(); };
  window.addPrepFilm = (bi) => {
    const films = window._prepBlocks[bi].films;
    if (films.length >= 4) { toast('สูงสุด 4 ฟิล์มต่อบล็อก','red'); return; }
    films.push({internal_code:'',color_order:'',revision:''});
    renderPrepRows();
  };
  window.removePrepFilm = (bi, fi) => { window._prepBlocks[bi].films.splice(fi,1); renderPrepRows(); };
  window.setPrepFilm = (bi, fi, key, val) => { window._prepBlocks[bi].films[fi][key] = val; };

  function renderPrepRows() {
    $('pp_count').textContent = window._prepBlocks.length;
    $('pp_rows').innerHTML = window._prepBlocks.map((b,bi)=>`
      <div class="prep-block-row">
        <div class="row gap-sm" style="align-items:center">
          <strong class="flex1">บล็อก ${b.block_no}</strong>
          <button class="btn-sm btn-secondary" onclick="addPrepFilm(${bi})">+ ฟิล์ม</button>
          <button class="btn-icon" onclick="removePrepBlock(${bi})">🗑️</button>
        </div>
        <div class="table-scroll"><table class="filmtbl"><thead><tr><th></th><th>รหัสภายใน</th><th>ลำดับสี</th><th>Revision</th><th></th></tr></thead><tbody>
          ${b.films.map((f,fi)=>`<tr>
            <td><button class="scan-btn btn-sm" onclick="openScan(v=>{setPrepFilm(${bi},${fi},'internal_code',v);renderPrepRowsG();})">📷</button></td>
            <td><input value="${f.internal_code}" oninput="setPrepFilm(${bi},${fi},'internal_code',this.value)" placeholder="H-E-26-01" style="min-width:100px"/></td>
            <td><input value="${f.color_order}" oninput="setPrepFilm(${bi},${fi},'color_order',this.value)" placeholder="1" style="width:56px"/></td>
            <td><input value="${f.revision}" oninput="setPrepFilm(${bi},${fi},'revision',this.value)" placeholder="1" style="width:56px"/></td>
            <td><button class="btn-icon" onclick="removePrepFilm(${bi},${fi})">🗑️</button></td>
          </tr>`).join('')}
        </tbody></table></div>
      </div>`).join('') || `<p class="no-data">ยังไม่มีบล็อก</p>`;
  }
  window.renderPrepRowsG = renderPrepRows;
  renderPrepRows();

  window.saveOnclickPrepare = async () => {
    if (!$('pp_from').value) { toast('กรุณาระบุหน่วยงานที่เตรียม','red'); return; }
    if (!$('pp_emp').value.trim()) { toast('กรุณาระบุ/สแกนรหัสพนักงานผู้จัดเตรียม','red'); return; }
    if (!$('pp_to').value) { toast('กรุณาระบุหน่วยงานที่เตรียมให้','red'); return; }
    if (window._prepBlocks.length===0) { toast('กรุณาสแกน/เพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    for (const b of window._prepBlocks) {
      if (!b.films.some(f=>f.internal_code.trim())) { toast('บล็อก '+b.block_no+' ต้องมีข้อมูลฟิล์มอย่างน้อย 1 รายการ','red'); return; }
    }
    const body = {
      date: todayISO(), time: nowTime(),
      from_dept: $('pp_from').value, to_dept: $('pp_to').value,
      emp_code: $('pp_emp').value.trim(),
      blocks: window._prepBlocks,
    };
    const { data } = await api('/api/internal/prepare','POST',body);
    toast('บันทึกจัดเตรียมสำเร็จ: '+data.doc_no);
    renderPage('internalTransport');
  };
}

function internalFileName(d) {
  return `${fmtDatePad(d.doc_date)}&${d.to_dept||d.from_dept||''}&${d.doc_no}`;
}

// ── Folder: ขั้นตอนตรวจรับและขนส่ง ──
async function pageInternalTransport(app) {
  const { data: docs } = await api('/api/internal-list?status=prepared');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('internal')">‹</button><h1>ขนส่ง/ตรวจรับ</h1></div>
    <div class="page">
      <div class="folder-tag">📁 Folder ขั้นตอนตรวจรับและขนส่ง</div>
      <div class="card">
        ${docs.length===0?`<p class="no-data">ไม่มีรายการรอขนส่ง</p>`:docs.map(d=>`
          <div class="list-item" onclick="renderPage('internalTransportForm',{doc_no:'${d.doc_no}'})">
            <div>
              <div class="list-title">${internalFileName(d)}</div>
              <div class="list-sub">เตรียมให้ ${d.to_dept||'-'} · ผู้เตรียม ${d.emp_name||'-'}</div>
            </div>
            <div class="list-right"><span class="chevron">›</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── ฟอร์มตรวจรับและขนส่ง ──
async function pageInternalTransportForm(app, {doc_no}) {
  const { data: d } = await api('/api/internal-doc?doc_no='+encodeURIComponent(doc_no));
  const deptOpts = master.departments.map(x=>`<option value="${x.id}">${x.id}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  const prepared = d.blocks; // รายการที่เตรียมไว้
  window._transScanned = new Set();
  window._transExtra = [];
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('internalTransport')">‹</button><h1>ตรวจรับและขนส่ง</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">${d.doc_no}</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">หน่วยงานที่ขน <span class="req">*</span></td><td class="in"><select id="tr_dept">${deptOpts}</select></td></tr>
          <tr><td class="lbl">รหัสพนักงานผู้ขน <span class="req">*</span></td><td class="in">
            <div class="row gap-sm"><input id="tr_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'tr_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('tr_emp').value=v;lookupEmp($('tr_emp'),'tr_emp_n')})">📷</button></div>
            <div id="tr_emp_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">เตรียมให้หน่วยงาน</td><td class="auto">${d.to_dept||'-'}</td></tr>
          <tr><td class="lbl">จำนวนบล็อกที่สแกนถูกต้อง</td><td class="auto" id="tr_matched_count">0</td></tr>
          <tr><td class="lbl">จำนวนบล็อกทั้งหมด</td><td class="auto">${prepared.length}</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">สแกนตรวจรับ</span>
          <button class="scan-btn" onclick="openScan(v=>scanTransport(v),{continuous:true})">📷 สแกนต่อเนื่อง</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .6rem">เลขที่บล็อกที่ Scan ห้ามซ้ำ</p>
        <div class="row gap-sm mb"><input id="tr_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter'){scanTransport($('tr_block_in').value);event.preventDefault();}"/><button class="btn-secondary" onclick="scanTransport($('tr_block_in').value)">เพิ่ม</button></div>
        <div class="table-scroll"><table class="db1"><thead><tr><th>เลขที่บล็อก</th><th>รหัสภายใน</th><th>ลำดับสี</th><th>สถานะ</th></tr></thead><tbody id="tr_rows"></tbody></table></div>
      </div>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่บล็อกที่ยังไม่สแกน</td><td class="auto" id="tr_missing">${prepared.map(b=>b.block_no).join(', ')||'-'}</td></tr>
          <tr><td class="lbl">เลขที่บล็อกที่เกินมานอกเหนือจากการเตรียม</td><td class="auto" id="tr_extra_list">-</td></tr>
        </table>
      </div>
      <button class="btn-danger" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="finishTransport('${doc_no}')">จบขั้นตอน</button>
    </div>`;

  window.scanTransport = (val) => {
    val = (val||'').trim(); if (!val) return;
    if (window._transScanned.has(val) || window._transExtra.includes(val)) { toast('เลขบล็อกซ้ำ: '+val,'red'); return; }
    const found = prepared.find(b=>b.block_no===val);
    if (found) window._transScanned.add(val);
    else window._transExtra.push(val);
    $('tr_block_in').value='';
    renderTransRows();
  };
  function renderTransRows() {
    const scannedRows = prepared.filter(b=>window._transScanned.has(b.block_no));
    const extraRows = window._transExtra;
    $('tr_matched_count').textContent = scannedRows.length;
    const missing = prepared.filter(b=>!window._transScanned.has(b.block_no)).map(b=>b.block_no);
    $('tr_missing').textContent = missing.join(', ') || '-';
    $('tr_extra_list').textContent = extraRows.join(', ') || '-';
    $('tr_rows').innerHTML = [
      ...scannedRows.map(b=>`<tr><td><strong>${b.block_no}</strong></td><td>${b.internal_code||'-'}</td><td>${b.color_order||'-'}</td><td><span class="badge badge-green">ถูกต้อง</span></td></tr>`),
      ...extraRows.map(bno=>`<tr class="row-red"><td><strong>${bno}</strong></td><td>NI</td><td>NI</td><td><span class="badge badge-red">เกินมา</span></td></tr>`),
    ].join('') || `<tr><td colspan="4" class="no-data">ยังไม่ได้สแกน</td></tr>`;
  }
  renderTransRows();

  window.finishTransport = async (docNo) => {
    if (!$('tr_dept').value) { toast('กรุณาระบุหน่วยงานที่ขน','red'); return; }
    if (!$('tr_emp').value.trim()) { toast('กรุณาระบุ/สแกนรหัสพนักงานผู้ขน','red'); return; }
    if (window._transScanned.size===0 && window._transExtra.length===0) { toast('กรุณาสแกนบล็อกอย่างน้อย 1 รายการ','red'); return; }
    await api('/api/internal-transport?doc_no='+encodeURIComponent(docNo),'POST',{
      transport_to_dept: $('tr_dept').value, transport_emp: $('tr_emp').value.trim(),
      date: todayISO(), time: nowTime(),
      matched: [...window._transScanned], extra: window._transExtra,
    });
    toast('จบขั้นตอนตรวจรับและขนส่ง');
    renderPage('internalReceive');
  };
}

// ── Folder: ขั้นตอนตรวจรับและจัดเก็บ ──
async function pageInternalReceive(app) {
  const { data: docs } = await api('/api/internal-list?status=transported');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('internal')">‹</button><h1>ตรวจรับและจัดเก็บ</h1></div>
    <div class="page">
      <div class="folder-tag">📁 Folder ขั้นตอนตรวจรับและจัดเก็บ</div>
      <div class="card">
        ${docs.length===0?`<p class="no-data">ไม่มีรายการรอจัดเก็บ</p>`:docs.map(d=>`
          <div class="list-item" onclick="renderPage('internalStoreForm',{doc_no:'${d.doc_no}'})">
            <div>
              <div class="list-title">${internalFileName(d)}</div>
              <div class="list-sub">หน่วยงานที่รับ ${d.to_dept||'-'}</div>
            </div>
            <div class="list-right"><span class="chevron">›</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}

// ── ฟอร์มตรวจรับและจัดเก็บ ──
async function pageInternalStoreForm(app, {doc_no}) {
  const { data: d } = await api('/api/internal-doc?doc_no='+encodeURIComponent(doc_no));
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  const scanned = d.blocks.filter(b=>b.scanned).concat(d.extra_blocks||[]);
  window._storeLoc = {};
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('internalReceive')">‹</button><h1>ตรวจรับและจัดเก็บ</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">${d.doc_no}</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">หน่วยงานที่รับ</td><td class="auto">${d.to_dept||'-'}</td></tr>
          <tr><td class="lbl">รหัสพนักงานผู้รับ <span class="req">*</span></td><td class="in">
            <div class="row gap-sm"><input id="st2_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'st2_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('st2_emp').value=v;lookupEmp($('st2_emp'),'st2_emp_n')})">📷</button></div>
            <div id="st2_emp_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">จำนวนบล็อกที่สแกนถูกต้อง</td><td class="auto">${d.blocks.filter(b=>b.scanned).length}</td></tr>
          <tr><td class="lbl">จำนวนบล็อกทั้งหมด</td><td class="auto">${d.blocks.length}</td></tr>
        </table>
      </div>
      <div class="card">
        <div class="card-title">ระบุที่จัดเก็บ (บังคับกรอกทุกรายการ)</div>
        <div class="table-scroll"><table class="db1"><thead><tr><th>เลขที่บล็อก</th><th>รหัสภายใน</th><th>ลำดับสี</th><th>ที่จัดเก็บ</th></tr></thead><tbody>
          ${scanned.map((b,i)=>`<tr><td><strong>${b.block_no}</strong></td><td>${b.internal_code||'-'}</td><td>${b.color_order||'-'}</td>
            <td><input id="loc_${i}" placeholder="เช่น A1/1" oninput="setStoreLoc('${b.block_no}',this.value)" style="width:110px"/></td></tr>`).join('')||`<tr><td colspan="4" class="no-data">ไม่มีบล็อกที่สแกนถูกต้อง</td></tr>`}
        </tbody></table></div>
      </div>
      <button class="btn-danger" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="finishStore2('${doc_no}')">จบขั้นตอน</button>
    </div>`;
  window.setStoreLoc = (bno, val) => { window._storeLoc[bno] = val; };
  window.finishStore2 = async (docNo) => {
    if (!$('st2_emp').value.trim()) { toast('กรุณาระบุ/สแกนรหัสพนักงานผู้รับ','red'); return; }
    for (const b of scanned) {
      if (!(window._storeLoc[b.block_no]||'').trim()) { toast('กรุณาระบุที่จัดเก็บให้ครบทุกบล็อก','red'); return; }
    }
    await api('/api/internal-store?doc_no='+encodeURIComponent(docNo),'POST',{
      store_emp: $('st2_emp').value.trim(), store_dept: d.to_dept,
      date: todayISO(), time: nowTime(), locations: window._storeLoc,
    });
    toast('จบขั้นตอนตรวจรับและจัดเก็บ');
    renderPage('internal');
  };
}

// ── ส่งบล็อกขึงผ้า ──
function pageExternalStretchSend(app) {
  window._sendBlocks = [];
  const deptOpts = master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('external')">‹</button><h1>ส่งบล็อกขึงผ้า</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">อัตโนมัติ</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">หน่วยงานที่ส่ง</td><td class="in"><select id="sd_from">${deptOpts}</select></td></tr>
          <tr><td class="lbl">รหัสพนักงาน BL ผู้ส่ง</td><td class="in">
            <div class="row gap-sm"><input id="sd_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'sd_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('sd_emp').value=v;lookupEmp($('sd_emp'),'sd_emp_n')})">📷</button></div>
            <div id="sd_emp_n" class="emp-name"></div></td></tr>
          <tr><td class="lbl">หน่วยงานที่รับ</td><td class="in"><select id="sd_to">${deptOpts}</select></td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">เลขที่บล็อก (<span id="sd_count">0</span>)</span>
          <button class="scan-btn" onclick="openScan(v=>addSendBlock(v),{continuous:true})">📷 สแกนต่อเนื่อง</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .6rem">เลขที่บล็อกที่สแกน ห้ามซ้ำ</p>
        <div class="row gap-sm mb"><input id="sd_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter'){addSendBlock($('sd_block_in').value);event.preventDefault();}"/><button class="btn-secondary" onclick="addSendBlock($('sd_block_in').value)">เพิ่ม</button></div>
        <div class="table-scroll"><table class="filmtbl"><thead><tr><th>เลขที่บล็อก</th><th>ขนาดเฟรม</th><th></th></tr></thead><tbody id="sd_rows"></tbody></table></div>
      </div>
      <button class="btn-primary" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="submitSend()">SUMMIT</button>
    </div>`;

  window.addSendBlock = async (val) => {
    val = (val||'').trim(); if (!val) return;
    if (window._sendBlocks.find(b=>b.block_no===val)) { toast('เลขบล็อกซ้ำ: '+val,'red'); return; }
    let size = '-';
    try { const { data } = await api('/api/block/'+encodeURIComponent(val)); size = data.size_label || '-'; } catch {}
    window._sendBlocks.push({ block_no: val, size_label: size });
    $('sd_block_in').value = '';
    renderSendRows();
  };
  window.removeSendBlock = (i) => { window._sendBlocks.splice(i,1); renderSendRows(); };
  function renderSendRows() {
    $('sd_count').textContent = window._sendBlocks.length;
    $('sd_rows').innerHTML = window._sendBlocks.map((b,i)=>`<tr><td><strong>${b.block_no}</strong></td><td>${b.size_label}</td><td><button class="btn-icon" onclick="removeSendBlock(${i})">🗑️</button></td></tr>`).join('')
      || `<tr><td colspan="3" class="no-data">ยังไม่มีบล็อก</td></tr>`;
  }
  renderSendRows();

  window.submitSend = async () => {
    if (window._sendBlocks.length===0) { toast('กรุณาสแกน/เพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    if (!$('sd_emp').value.trim()) { toast('กรุณาระบุ/สแกนรหัสพนักงานผู้ส่ง','red'); return; }
    const body = {
      date: todayISO(), time: nowTime(),
      from_dept: $('sd_from').value, to_dept: $('sd_to').value,
      sender_emp: $('sd_emp').value.trim(),
      blocks: window._sendBlocks.map(b=>b.block_no),
    };
    const { data } = await api('/api/stretch-send','POST',body);
    toast('ส่งบล็อกขึงผ้าสำเร็จ: '+data.doc_no);
    renderPage('externalStretchSendResult',{doc_no:data.doc_no});
  };
}

function db3RowHtml(r) {
  return `<tr>
    <td>${fmtDate(r.date)}</td><td><strong>${r.doc_no}</strong></td><td><strong>${r.block_no}</strong></td>
    <td>${r.internal_codes||'-'}</td><td>${r.from_dept||'-'}</td><td>${r.sender_name||'-'}</td>
    <td>${r.revisions||'-'}</td><td>${r.color_orders||'-'}</td><td>${r.receiver_name||'-'}</td>
    <td>${r.to_dept||'-'}</td><td>${r.storage_location||'-'}</td><td>${r.remarks||'-'}</td>
  </tr>`;
}
function db3TableHtml(rows) {
  return `<div class="table-scroll"><table class="db1"><thead><tr>
    <th>วันที่</th><th>เลขที่เอกสาร</th><th>เลขที่บล็อก</th><th>รหัสภายใน</th><th>หน่วยงาน</th><th>ผู้ส่ง</th><th>Revision</th><th>สี</th><th>ผู้รับ</th><th>หน่วยงาน</th><th>ที่จัดเก็บ</th><th>หมายเหตุ</th>
  </tr></thead><tbody>${rows.length?rows.map(db3RowHtml).join(''):`<tr><td colspan="12" class="no-data">ยังไม่มีรายการ</td></tr>`}</tbody></table></div>`;
}

async function pageExternalStretchSendResult(app, {doc_no}) {
  const { data: all } = await api('/api/stretch-send-rows');
  const rows = all.filter(r=>r.doc_no===doc_no).map(r=>({ ...r, internal_codes:'-', revisions:'-', color_orders:'-', receiver_name:'-', storage_location:'-', remarks:'-' }));
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('external')">‹</button><h1>DATA BASE 3</h1>
      <button class="btn-primary btn-sm" onclick="exportRows('${doc_no}','send')">⬇ Excel</button></div>
    <div class="page"><div class="card"><div class="card-title">ฟอร์มใบเบิกจ่ายบล็อก</div>${db3TableHtml(rows)}</div></div>`;
  window._db3rows = rows;
  window.exportRows = (docNo, kind) => {
    const data = window._db3rows.map(r=>({'วันที่':fmtDate(r.date),'เลขที่เอกสาร':r.doc_no,'เลขที่บล็อก':r.block_no,'รหัสภายใน':r.internal_codes,'หน่วยงาน':r.from_dept,'ผู้ส่ง':r.sender_name,'Revision':r.revisions,'สี':r.color_orders,'ผู้รับ':r.receiver_name,'หน่วยงานถึง':r.to_dept,'ที่จัดเก็บ':r.storage_location,'หมายเหตุ':r.remarks}));
    const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DB3');XLSX.writeFile(wb,'DataBase3_'+docNo.replace(/\//g,'-')+'.xlsx');
  };
}

// ── รับบล็อกขึงผ้า ──
function pageExternalStretchReceive(app) {
  window._recvBlocks = [];
  const deptOpts = master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('');
  const empOpts = master.employees.map(e=>`<option value="${e.emp_code}">${e.emp_code} ${e.fullname}</option>`).join('');
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('external')">‹</button><h1>รับบล็อกขึงผ้า</h1></div>
    <div class="page">
      <datalist id="empList">${empOpts}</datalist>
      <div class="card">
        <table class="ftable">
          <tr><td class="lbl">เลขที่เอกสาร</td><td class="auto">อัตโนมัติ</td></tr>
          <tr><td class="lbl">วันที่</td><td class="auto">${todayStr()}</td></tr>
          <tr><td class="lbl">เวลา</td><td class="auto">${nowTime()} น.</td></tr>
          <tr><td class="lbl">หน่วยงานที่ส่ง</td><td class="in"><select id="rc_from">${deptOpts}</select></td></tr>
          <tr><td class="lbl">หน่วยงานที่รับ</td><td class="in"><select id="rc_to">${deptOpts}</select></td></tr>
          <tr><td class="lbl">รหัสพนักงาน BL ผู้รับ</td><td class="in">
            <div class="row gap-sm"><input id="rc_emp" list="empList" class="flex1" placeholder="พิมพ์ / เลือก / สแกน" oninput="lookupEmp(this,'rc_emp_n')"/><button class="scan-btn" onclick="openScan(v=>{$('rc_emp').value=v;lookupEmp($('rc_emp'),'rc_emp_n')})">📷</button></div>
            <div id="rc_emp_n" class="emp-name"></div></td></tr>
        </table>
      </div>
      <div class="card">
        <div class="row gap-sm" style="align-items:center">
          <span class="card-title flex1" style="margin:0;border:none;padding:0">เลขที่บล็อก (<span id="rc_count">0</span>)</span>
          <button class="scan-btn" onclick="openScan(v=>addRecvBlock(v),{continuous:true})">📷 สแกนต่อเนื่อง</button>
        </div>
        <p class="scan-hint" style="margin:.3rem 0 .6rem">สุ่มตรวจสอบความตึงบล็อก 10:1 (ความตึง 14-20 นิวตัน/ซม.) · เลขที่บล็อกห้ามซ้ำ</p>
        <div class="row gap-sm mb"><input id="rc_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter'){addRecvBlock($('rc_block_in').value);event.preventDefault();}"/><button class="btn-secondary" onclick="addRecvBlock($('rc_block_in').value)">เพิ่ม</button></div>
        <div class="table-scroll"><table class="filmtbl"><thead><tr><th>เลขที่บล็อก</th><th>ขนาดเฟรม</th><th>เบอร์ผ้า</th><th>ความตึง</th><th>บิดงอ</th><th>ขนาดเฟรม</th><th></th></tr></thead><tbody id="rc_rows"></tbody></table></div>
      </div>
      <button class="btn-primary" style="width:100%;padding:.9rem;font-size:1.05rem" onclick="submitReceive()">SUMMIT</button>
    </div>`;

  window.addRecvBlock = async (val) => {
    val = (val||'').trim(); if (!val) return;
    if (window._recvBlocks.find(b=>b.block_no===val)) { toast('เลขบล็อกซ้ำ: '+val,'red'); return; }
    let size='-', fabric='-';
    try { const { data } = await api('/api/block/'+encodeURIComponent(val)); size = data.size_label||'-'; fabric = data.fabric_no||'-'; } catch {}
    window._recvBlocks.push({ block_no:val, size_label:size, fabric_no:fabric, tension_value:'', twist_pass:null, frame_pass:null });
    $('rc_block_in').value = '';
    renderRecvRows();
  };
  window.removeRecvBlock = (i) => { window._recvBlocks.splice(i,1); renderRecvRows(); };
  window.setRecvTension = (i, v) => { window._recvBlocks[i].tension_value = v; };
  window.setRecvCheck = (i, key, val) => {
    const b = window._recvBlocks[i];
    const next = (b[key]===val) ? null : val;
    b[key] = next;
    $(`rc_${key}_pass_${i}`).className = 'pfbtn'+(next===1?' on-pass':'');
    $(`rc_${key}_fail_${i}`).className = 'pfbtn'+(next===0?' on-fail':'');
  };
  function renderRecvRows() {
    $('rc_count').textContent = window._recvBlocks.length;
    $('rc_rows').innerHTML = window._recvBlocks.map((b,i)=>`<tr>
      <td><strong>${b.block_no}</strong></td><td>${b.size_label}</td><td>${b.fabric_no}</td>
      <td><input type="number" step="0.1" value="${b.tension_value}" oninput="setRecvTension(${i},this.value)" style="width:70px" placeholder="นิวตัน"/></td>
      <td><button class="pfbtn" id="rc_twist_pass_pass_${i}" onclick="setRecvCheck(${i},'twist_pass',1)"></button><button class="pfbtn" id="rc_twist_pass_fail_${i}" onclick="setRecvCheck(${i},'twist_pass',0)"></button></td>
      <td><button class="pfbtn" id="rc_frame_pass_pass_${i}" onclick="setRecvCheck(${i},'frame_pass',1)"></button><button class="pfbtn" id="rc_frame_pass_fail_${i}" onclick="setRecvCheck(${i},'frame_pass',0)"></button></td>
      <td><button class="btn-icon" onclick="removeRecvBlock(${i})">🗑️</button></td>
    </tr>`).join('') || `<tr><td colspan="7" class="no-data">ยังไม่มีบล็อก</td></tr>`;
    // fix id collisions: use distinct ids per key
  }
  renderRecvRows();

  window.submitReceive = async () => {
    if (window._recvBlocks.length===0) { toast('กรุณาสแกน/เพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    if (!$('rc_emp').value.trim()) { toast('กรุณาระบุ/สแกนรหัสพนักงานผู้รับ','red'); return; }
    const body = {
      date: todayISO(), time: nowTime(),
      from_dept: $('rc_from').value, to_dept: $('rc_to').value,
      receiver_emp: $('rc_emp').value.trim(),
      blocks: window._recvBlocks.map(b=>({
        block_no: b.block_no, size_label: b.size_label==='-'?null:b.size_label, fabric_no: b.fabric_no==='-'?null:b.fabric_no,
        tension_value: parseFloat(b.tension_value)||null, twist_pass: b.twist_pass, frame_pass: b.frame_pass,
      })),
    };
    const { data } = await api('/api/stretch-receive','POST',body);
    toast('รับบล็อกขึงผ้าสำเร็จ: '+data.doc_no);
    renderPage('externalStretchReceiveResult',{doc_no:data.doc_no});
  };
}

async function pageExternalStretchReceiveResult(app, {doc_no}) {
  const { data: all4 } = await api('/api/stretch-receive-rows');
  const rows4 = all4.filter(r=>r.doc_no===doc_no);
  const rows3 = rows4.map(r=>({ date:r.date, doc_no:r.doc_no, block_no:r.block_no, internal_codes:'-',
    from_dept:r.from_dept, sender_name:'-', revisions:'-', color_orders:'-', receiver_name:r.receiver_name,
    to_dept:r.to_dept, storage_location:'-', remarks:'-' }));
  const passLbl = v => v===1?'ผ่าน':v===0?'ไม่ผ่าน':'-';
  app.innerHTML = `
    <div class="topnav"><button class="back-btn" onclick="renderPage('external')">‹</button><h1>ผลรับบล็อกขึงผ้า</h1></div>
    <div class="page">
      <div class="card"><div class="row gap-sm" style="align-items:center">
        <span class="card-title flex1" style="margin:0;border:none;padding:0">DATA BASE 3 — ฟอร์มใบเบิกจ่ายบล็อก</span>
        <button class="btn-sm btn-secondary" onclick="exportDB('db3')">⬇ Excel</button>
      </div>${db3TableHtml(rows3)}</div>

      <div class="card"><div class="row gap-sm" style="align-items:center">
        <span class="card-title flex1" style="margin:0;border:none;padding:0">DATA BASE 4 — แบบฟอร์มใบรับบล็อกขึงผ้า</span>
        <button class="btn-sm btn-secondary" onclick="exportDB('db4')">⬇ Excel</button>
      </div>
        <div class="table-scroll"><table class="db1"><thead><tr>
          <th>วันที่</th><th>เลขที่เอกสาร</th><th>เลขที่บล็อก</th><th>ขนาดเฟรม</th><th>เบอร์ผ้า</th><th>ความตึง (นิวตัน)</th><th>บล็อกบิดงอ</th><th>ขนาดเฟรม</th>
        </tr></thead><tbody>${rows4.length?rows4.map(r=>`<tr>
          <td>${fmtDate(r.date)}</td><td><strong>${r.doc_no}</strong></td><td><strong>${r.block_no}</strong></td>
          <td>${r.size_label||'-'}</td><td>${r.fabric_no||'-'}</td><td>${r.tension_value ?? '-'}</td>
          <td>${passLbl(r.twist_pass)}</td><td>${passLbl(r.frame_pass)}</td>
        </tr>`).join(''):`<tr><td colspan="8" class="no-data">ยังไม่มีรายการ</td></tr>`}</tbody></table></div>
      </div>
    </div>`;
  window.exportDB = (kind) => {
    if (kind==='db3') {
      const data = rows3.map(r=>({'วันที่':fmtDate(r.date),'เลขที่เอกสาร':r.doc_no,'เลขที่บล็อก':r.block_no,'รหัสภายใน':r.internal_codes,'หน่วยงาน':r.from_dept,'ผู้ส่ง':r.sender_name,'Revision':r.revisions,'สี':r.color_orders,'ผู้รับ':r.receiver_name,'หน่วยงานถึง':r.to_dept,'ที่จัดเก็บ':r.storage_location,'หมายเหตุ':r.remarks}));
      const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DB3');XLSX.writeFile(wb,'DataBase3_'+doc_no.replace(/\//g,'-')+'.xlsx');
    } else {
      const data = rows4.map(r=>({'วันที่':fmtDate(r.date),'เลขที่เอกสาร':r.doc_no,'เลขที่บล็อก':r.block_no,'ขนาดเฟรม':r.size_label,'เบอร์ผ้า':r.fabric_no,'ความตึง':r.tension_value,'บล็อกบิดงอ':passLbl(r.twist_pass),'ขนาดเฟรม(ตรวจ)':passLbl(r.frame_pass)}));
      const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'DB4');XLSX.writeFile(wb,'DataBase4_'+doc_no.replace(/\//g,'-')+'.xlsx');
    }
  };
}

// ══════════════════════════════════════════════════════
//  MODULE 4 – รับส่งภายนอก
// ══════════════════════════════════════════════════════
function pageExternal(app) {
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🚚 รับส่งภายนอก</h1>
    </div>
    <div class="home-grid">
      <div class="home-card" onclick="renderPage('externalStretchSend')">
        <div class="hc-icon">📤</div>
        <div class="hc-title">ส่งบล็อกขึงผ้า</div>
        <div class="hc-sub">ส่งบล็อกไปขึงผ้า</div>
      </div>
      <div class="home-card" onclick="renderPage('externalStretchReceive')">
        <div class="hc-icon">📥</div>
        <div class="hc-title">รับบล็อกขึงผ้า</div>
        <div class="hc-sub">รับบล็อกที่ขึงผ้าแล้ว</div>
      </div>
    </div>`;
}

function externalForm(app, title, type, backPage) {
  const blocks = [];
  const isReceive = type === 'receive_in';
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('${backPage}')">‹</button>
      <h1>${title}</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="grid2">
          <div class="form-group"><label>วันที่</label><input type="date" id="e_date" value="${todayISO()}"/></div>
          <div class="form-group"><label>เวลา</label><input type="time" id="e_time" value="${nowTime()}"/></div>
          <div class="form-group"><label>หน่วยงานที่ส่ง</label>
            <select id="e_from">${master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>หน่วยงานที่รับ</label>
            <select id="e_to">${master.departments.map(d=>`<option value="${d.id}" ${d.id==='KTE'&&!isReceive?'selected':d.id==='BL'&&isReceive?'selected':''}>${d.id}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-group"><label>รหัสพนักงาน BL</label>
          <div class="row gap-sm">
            <input id="e_emp" class="flex1" oninput="lookupEmp(this,'e_emp_n')"/>
            <button class="scan-btn" onclick="openScan(v=>{$('e_emp').value=v;lookupEmp($('e_emp'),'e_emp_n')})">📷</button>
          </div>
          <small id="e_emp_n" class="muted"></small>
        </div>
      </div>

      <div class="card">
        <div class="row gap-sm mb">
          <span class="card-title flex1" style="margin:0">เลขที่บล็อก</span>
          <button class="scan-btn" onclick="openScan(v=>addEBlock(v))">📷 สแกน</button>
        </div>
        <div class="row gap-sm mb">
          <input id="e_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter')addEBlock($('e_block_in').value)"/>
          <button class="btn-secondary" onclick="addEBlock($('e_block_in').value)">เพิ่ม</button>
        </div>
        <div id="e_block_list"></div>
        ${isReceive?`<p style="color:var(--muted);font-size:.8rem">* สุ่มตรวจสอบความตึง 10:1 (14-20 N/cm)</p>`:''}
      </div>

      <button class="btn-primary" style="width:100%" onclick="submitExternal('${type}')">SUMMIT</button>
    </div>`;

  window._eBlocks = blocks;
  window.addEBlock = async (val) => {
    val = val?.trim();
    if (!val) return;
    if (window._eBlocks.find(b=>b.block_no===val)) { toast('บล็อกซ้ำ!','red'); return; }
    const blkData = { block_no: val, tension1: null, tension2: null, tension_pass: 0, frame_check_pass: 1 };
    window._eBlocks.push(blkData);
    $('e_block_in').value = '';
    renderEBlocks();
  };
  window.removeEBlock = (i) => { window._eBlocks.splice(i,1); renderEBlocks(); };

  function renderEBlocks() {
    $('e_block_list').innerHTML = window._eBlocks.map((b,i)=>`
      <div style="padding:.4rem 0;border-bottom:1px solid var(--border)">
        <div class="row gap-sm">
          <strong class="flex1">${b.block_no}</strong>
          <button class="btn-icon" onclick="removeEBlock(${i})">🗑️</button>
        </div>
        ${isReceive?`
        <div class="row gap-sm mt" style="margin-top:.3rem">
          <input type="number" placeholder="ความตึง 1" step="0.1" style="width:33%"
            oninput="window._eBlocks[${i}].tension1=+this.value"/>
          <input type="number" placeholder="ความตึง 2" step="0.1" style="width:33%"
            oninput="window._eBlocks[${i}].tension2=+this.value"/>
          <label style="margin:0;display:flex;align-items:center;gap:.3rem;font-size:.8rem">
            <input type="checkbox" checked onchange="window._eBlocks[${i}].frame_check_pass=this.checked?1:0"/> เฟรมผ่าน
          </label>
        </div>`:''}
      </div>`).join('') || '<p class="no-data">ยังไม่มีบล็อก</p>';
  }
  renderEBlocks();

  window.submitExternal = async (type) => {
    if (window._eBlocks.length === 0) { toast('กรุณาเพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    if (isReceive) {
      window._eBlocks.forEach(b => {
        const t1 = b.tension1||0, t2 = b.tension2||0;
        b.tension_pass = ((!t1||(t1>=14&&t1<=20))&&(!t2||(t2>=14&&t2<=20))) ? 1 : 0;
      });
    }
    const body = {
      date: $('e_date').value, time: $('e_time').value,
      from_dept: $('e_from').value, to_dept: $('e_to').value,
      emp_code: $('e_emp').value.trim()||null,
      blocks: window._eBlocks,
    };
    const { data } = await api(`/api/external/${type}`,'POST',body);
    toast('สร้างเอกสาร: '+data.doc_no);
    renderPage('external');
  };
}

function pageExternalSend(app) { externalForm(app,'📤 ส่งบล็อกขึงผ้า','send_out','external'); }
function pageExternalReceive(app) { externalForm(app,'📥 รับบล็อกขึงผ้า','receive_in','external'); }

// ══════════════════════════════════════════════════════
//  SEARCH
// ══════════════════════════════════════════════════════
function pageSearch(app) {
  app.innerHTML = `
    <div class="topnav"><h1>🔍 ค้นหา</h1></div>
    <div class="page">
      <div class="card">
        <div class="card-title">1. ค้นหาเลขที่บล็อก</div>
        <div class="row gap-sm">
          <input id="q_block" class="flex1" placeholder="เลขบล็อก" onkeydown="if(event.key==='Enter')searchBlock()"/>
          <button class="scan-btn" onclick="openScan(v=>{$('q_block').value=v;searchBlock()})">📷</button>
          <button class="btn-primary" onclick="searchBlock()">ค้นหา</button>
        </div>
        <div id="r_block" class="mt"></div>
      </div>

      <div class="card">
        <div class="card-title">2. ค้นหารหัสภายใน</div>
        <div class="row gap-sm">
          <input id="q_code" class="flex1" placeholder="รหัสภายใน เช่น H-E-26-01"/>
          <button class="btn-primary" onclick="searchCode()">ค้นหา</button>
        </div>
        <div id="r_code" class="mt"></div>
      </div>

      <div class="card">
        <div class="card-title">3. บล็อกที่ KTE/NOVA ยังไม่ส่งคืน</div>
        <button class="btn-secondary" onclick="searchPending()">ดูรายการ</button>
        <div id="r_pending" class="mt"></div>
      </div>
    </div>`;

  window.searchBlock = async () => {
    const no = $('q_block').value.trim();
    if (!no) return;
    const { data } = await api(`/api/search/block/${no}`);
    const el = $('r_block');
    if (!data.block) { el.innerHTML = `<p style="color:var(--red)">ไม่พบบล็อก ${no}</p>`; return; }
    el.innerHTML = `
      <div style="margin-bottom:.5rem">
        <strong>${data.block.block_no}</strong>
        <span class="badge badge-blue" style="margin-left:.5rem">${data.block.status}</span>
        ขนาด: ${data.block.size_label||'-'} · ที่จัดเก็บ: ${data.block.location||'-'} · หน่วยงาน: ${data.block.current_dept||'-'}
      </div>
      ${data.pressHistory.length?`<details><summary style="cursor:pointer;color:var(--muted)">ประวัติร้องขออัด (${data.pressHistory.length})</summary>
        ${data.pressHistory.map(h=>`<div class="history-entry">${h.doc_no} · ${h.date} · ${h.status}</div>`).join('')}
      </details>`:''}
      ${data.moveHistory.length?`<details><summary style="cursor:pointer;color:var(--muted)">ประวัติการขนส่ง (${data.moveHistory.length})</summary>
        ${data.moveHistory.map(h=>`<div class="history-entry">${h.doc_no} · ${h.doc_type} · ${h.doc_date}</div>`).join('')}
      </details>`:''}
      ${data.extHistory.length?`<details><summary style="cursor:pointer;color:var(--muted)">ประวัติรับส่งภายนอก (${data.extHistory.length})</summary>
        ${data.extHistory.map(h=>`<div class="history-entry">${h.doc_no} · ${h.doc_type} · ${h.doc_date}</div>`).join('')}
      </details>`:''}`;
  };

  window.searchCode = async () => {
    const code = $('q_code').value.trim();
    if (!code) return;
    const { data } = await api(`/api/search/code?code=${encodeURIComponent(code)}`);
    $('r_code').innerHTML = data.length === 0 ? '<p style="color:var(--muted)">ไม่พบข้อมูล</p>' :
      `<div class="table-scroll"><table><thead><tr><th>รหัสภายใน</th><th>สี</th><th>Rev</th><th>ผ้า</th><th>บล็อกเดิม</th><th>บล็อกใหม่</th><th>สถานะ</th></tr></thead><tbody>
        ${data.map(r=>`<tr><td>${r.internal_code}</td><td>${r.color_order}</td><td>${r.revision}</td><td>${r.fabric_no}</td><td>${r.old_block_no}</td><td>${r.new_block_no||'-'}</td><td>${r.status}</td></tr>`).join('')}
      </tbody></table></div>`;
  };

  window.searchPending = async () => {
    const { data } = await api('/api/search/pending-external');
    $('r_pending').innerHTML = data.length === 0 ? '<p style="color:var(--green)">ไม่มีบล็อกค้างอยู่</p>' :
      `<div class="table-scroll"><table><thead><tr><th>เลขบล็อก</th><th>เอกสาร</th><th>ส่งถึง</th><th>วันที่ส่ง</th><th>ขนาด</th></tr></thead><tbody>
        ${data.map(r=>`<tr><td>${r.block_no}</td><td>${r.doc_no}</td><td>${r.to_dept}</td><td>${r.doc_date}</td><td>${r.frame_size||'-'}</td></tr>`).join('')}
      </tbody></table></div>
      <p style="color:var(--muted);font-size:.82rem">จำนวน ${data.length} บล็อก</p>`;
  };
}

// ══════════════════════════════════════════════════════
//  BLOCK REGISTRY
// ══════════════════════════════════════════════════════
async function pageBlocks(app) {
  const { data: blocks } = await api('/api/blocks');
  const statusBadge = { available:'badge-green', external:'badge-yellow', cleaning:'badge-blue', stored:'badge-gray' };
  app.innerHTML = `
    <div class="topnav"><h1>📋 ทะเบียนบล็อก</h1></div>
    <div class="page">
      <div class="card">
        <div class="card-title">📥 นำเข้าข้อมูลจาก Excel (พนักงานอัปโหลดไฟล์ที่กรอกไว้)</div>
        <p class="scan-hint" style="margin:.2rem 0 .6rem">เลือกประเภทข้อมูล แล้วเลือกไฟล์ .xlsx — เลขบล็อก/รหัสพนักงานที่มีอยู่แล้วจะอัปเดตทับ, ที่ยังไม่มีจะเพิ่มใหม่</p>
        <div class="row gap-sm" style="flex-wrap:wrap;gap:.5rem;align-items:center">
          <select id="imp_type" style="flex:1;min-width:180px">
            <option value="blocks">ทะเบียนบล็อก (เลขที่ Block, Size Block, เบอร์ผ้า)</option>
            <option value="employees">ทะเบียนพนักงาน (รหัสพนักงาน, คำนำหน้า, ชื่อ, สกุล, หน่วยงาน)</option>
          </select>
          <input type="file" id="imp_file" accept=".xlsx,.xls,.csv" style="display:none"/>
          <button class="btn-primary" onclick="document.getElementById('imp_file').click()">เลือกไฟล์ Excel</button>
          <button class="btn-sm" onclick="downloadTemplate()">📄 ฟอร์มตัวอย่าง</button>
          <button class="btn-sm" onclick="exportData()">⬇ ส่งออก Excel</button>
        </div>
        <div id="imp_status" class="scan-hint" style="margin-top:.5rem"></div>
      </div>
      <div class="card">
        <div class="card-title">เพิ่มบล็อกใหม่</div>
        <div class="row gap-sm" style="flex-wrap:wrap;gap:.5rem">
          <input id="nb_no" placeholder="เลขบล็อก" style="width:120px"/>
          <select id="nb_size" style="flex:1;min-width:150px">
            ${master.block_sizes.map(s=>`<option>${s.label}</option>`).join('')}
          </select>
          <select id="nb_fabric" style="width:120px">
            ${master.fabric_types.map(f=>`<option>${f.id}</option>`).join('')}
          </select>
          <button class="btn-primary" onclick="addNewBlock()">เพิ่ม</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">บล็อกทั้งหมด (${blocks.length})</div>
        <div class="table-scroll">
          <table>
            <thead><tr><th>เลขบล็อก</th><th>QR</th><th>ขนาด</th><th>ผ้า</th><th>สถานะ</th><th>ที่จัดเก็บ</th><th>หน่วยงาน</th><th></th></tr></thead>
            <tbody>
              ${blocks.map(b=>`<tr>
                <td><strong>${b.block_no}</strong></td>
                <td><img src="/api/qr/${b.block_no}" width="48" height="48" style="border-radius:4px;background:#fff"/></td>
                <td style="font-size:.78rem">${b.size_label||'-'}</td>
                <td style="font-size:.78rem">${b.fabric_no||'-'}</td>
                <td><span class="badge ${statusBadge[b.status]||'badge-gray'}">${b.status}</span></td>
                <td>${b.location||'-'}</td>
                <td>${b.current_dept||'-'}</td>
                <td><button class="btn-sm btn-danger" onclick="delBlock('${b.block_no}')">ลบ</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;

  window.addNewBlock = async () => {
    const block_no = $('nb_no').value.trim();
    if (!block_no) { toast('กรุณากรอกเลขบล็อก','red'); return; }
    await api('/api/block','POST',{block_no, size_label:$('nb_size').value, fabric_no:$('nb_fabric').value});
    toast('เพิ่มบล็อก '+block_no);
    renderPage('blocks');
  };

  window.delBlock = async (no) => {
    if (!confirm('ลบบล็อก '+no+' ?')) return;
    await api('/api/block/'+encodeURIComponent(no),'DELETE');
    toast('ลบบล็อก '+no);
    renderPage('blocks');
  };

  const fi = $('imp_file');
  if (fi) fi.onchange = e => { const f = e.target.files[0]; if (f) importExcel(f, $('imp_type').value); };
}

// ── Excel import / export (SheetJS on client, bulk upsert via API) ──
const _norm = v => String(v == null ? '' : v).trim();
async function importExcel(file, type) {
  const st = $('imp_status');
  if (st) st.textContent = 'กำลังอ่านไฟล์...';
  try {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(new Uint8Array(buf), { type:'array' });
    const grid = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header:1, defval:'' });
    if (!grid.length) { toast('ไฟล์ว่างเปล่า','red'); return; }
    const kw = type==='blocks' ? ['block','บล็อก','เลขที่'] : ['พนักงาน','รหัส','emp','code'];
    let hi = grid.findIndex(r => r.some(c => kw.some(k => _norm(c).toLowerCase().includes(k))));
    if (hi < 0) hi = 0;
    const header = grid[hi].map(c => _norm(c).toLowerCase());
    const find = (...keys) => header.findIndex(h => keys.some(k => h.includes(k)));
    let rows = [], ci;
    if (type === 'blocks') {
      ci = { no:find('block','บล็อก','เลขที่'), sz:find('size','ขนาด'), fb:find('เบอร์ผ้า','fabric','ผ้า') };
      if (ci.no < 0) { toast('ไม่พบคอลัมน์เลขบล็อก','red'); return; }
      for (let i=hi+1;i<grid.length;i++){ const r=grid[i]; const no=_norm(r[ci.no]); if(!no||no==='#N/A')continue;
        rows.push({ block_no:no, size_label:ci.sz>=0?_norm(r[ci.sz]):'', fabric_no:ci.fb>=0?_norm(r[ci.fb]):'' }); }
    } else {
      ci = { code:find('รหัส','emp','code'), pf:find('คำนำหน้า','prefix'), fn:find('ชื่อ'), ln:find('สกุล','นามสกุล','last'), dp:find('หน่วยงาน','dept') };
      if (ci.code < 0) { toast('ไม่พบคอลัมน์รหัสพนักงาน','red'); return; }
      for (let i=hi+1;i<grid.length;i++){ const r=grid[i]; const code=_norm(r[ci.code]); if(!code)continue;
        rows.push({ emp_code:code, prefix:ci.pf>=0?_norm(r[ci.pf]):'', firstname:ci.fn>=0?_norm(r[ci.fn]):'', lastname:ci.ln>=0?_norm(r[ci.ln]):'', dept_id:ci.dp>=0?_norm(r[ci.dp]):'' }); }
    }
    if (st) st.textContent = `กำลังนำเข้า ${rows.length} รายการ...`;
    const { data } = await api('/api/import/'+type, 'POST', { rows });
    toast(`นำเข้าสำเร็จ: เพิ่ม ${data.added}, อัปเดต ${data.updated}`);
    if (type === 'employees') { const m = await api('/api/master'); master = m.data; }
    renderPage('blocks');
  } catch (e) {
    if (st) st.textContent = '';
    toast('อ่านไฟล์ไม่ได้: '+e.message,'red');
  }
}
async function downloadTemplate() {
  const type = $('imp_type').value;
  const data = type==='blocks'
    ? [{ 'เลขที่ Block':'9999', 'Size Block':'610 mm. x 960 mm.', 'เบอร์ผ้า':'SX225B22' }]
    : [{ 'รหัสพนักงาน':'999999', 'คำนำหน้า':'นาย', 'ชื่อ':'ตัวอย่าง', 'สกุล':'นามสกุล', 'หน่วยงาน':'BL' }];
  const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type); XLSX.writeFile(wb, 'template_'+type+'.xlsx');
}
async function exportData() {
  const type = $('imp_type').value;
  let data, name;
  if (type === 'blocks') {
    const { data: blocks } = await api('/api/blocks');
    data = blocks.map(b => ({ 'เลขที่ Block':b.block_no, 'Size Block':b.size_label, 'เบอร์ผ้า':b.fabric_no, 'สถานะ':b.status, 'ที่จัดเก็บ':b.location, 'หน่วยงาน':b.current_dept }));
    name = 'blocks.xlsx';
  } else {
    data = master.employees.map(e => ({ 'รหัสพนักงาน':e.emp_code, 'คำนำหน้า':e.prefix, 'ชื่อ':e.firstname, 'สกุล':e.lastname, 'หน่วยงาน':e.dept_id }));
    name = 'employees.xlsx';
  }
  const ws = XLSX.utils.json_to_sheet(data); const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, type); XLSX.writeFile(wb, name);
}
window.downloadTemplate = downloadTemplate;
window.exportData = exportData;

// ══════════════════════════════════════════════════════
//  QR SCANNER
// ══════════════════════════════════════════════════════
let scanContinuous = false, scanSeen = null, scanLast = 0;
function openScan(cb, opts = {}) {
  scanCallback = cb;
  scanContinuous = !!opts.continuous;
  scanSeen = new Set();
  scanLast = 0;
  document.getElementById('scanModal').classList.remove('hidden');
  document.getElementById('scanManual').value = '';
  const hint = document.querySelector('.scan-hint');
  if (hint) hint.textContent = scanContinuous
    ? 'สแกนต่อเนื่องได้เลย (เลขซ้ำจะข้ามอัตโนมัติ) · หรือพิมพ์ค่าด้านล่าง:'
    : 'หรือพิมพ์ด้วยตนเอง:';
  startCameraScan();
}

function closeScan() {
  document.getElementById('scanModal').classList.add('hidden');
  stopCamera();
  scanCallback = null;
}

function scanMsg(txt) {
  const el = document.querySelector('.scan-hint');
  if (el) el.textContent = txt;
}

async function startCameraScan() {
  const video = document.getElementById('scanVideo');
  // Camera requires a secure context (https or localhost). iOS blocks it on plain http.
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    scanMsg('อุปกรณ์นี้เปิดกล้องไม่ได้ (ต้องเปิดผ่าน HTTPS) — พิมพ์ค่าด้านล่างแทน:');
    return;
  }
  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = scanStream;
    video.setAttribute('playsinline', 'true'); // required for iOS to play inline
    await video.play().catch(() => {});

    // Fast path: native BarcodeDetector (Chrome/Android)
    const hasBD = ('BarcodeDetector' in window);
    if (hasBD) scanDetector = new BarcodeDetector({ formats: ['qr_code'] });

    // Fallback path: jsQR on a canvas (works on iOS Safari)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const loop = async () => {
      if (!scanStream) return;
      try {
        if (hasBD) {
          const codes = await scanDetector.detect(video);
          if (codes.length) { finishScan(codes[0].rawValue); if (!scanContinuous) return; }
        } else if (window.jsQR && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
          if (code && code.data) { finishScan(code.data); if (!scanContinuous) return; }
        }
      } catch {}
      requestAnimationFrame(loop);
    };
    video.onplaying = () => loop();
    if (!video.paused) loop();
  } catch (e) {
    scanMsg('เปิดกล้องไม่ได้ (ยังไม่อนุญาต หรือไม่ใช่ HTTPS) — พิมพ์ค่าด้านล่างแทน:');
  }
}

function finishScan(val) {
  val = String(val || '').trim();
  if (!val) return;
  if (scanContinuous) {
    const now = Date.now();
    if (now - scanLast < 600) return;      // debounce same-frame repeats
    if (scanSeen.has(val)) { scanLast = now; return; }  // already scanned this session
    scanLast = now;
    scanSeen.add(val);
    scanCallback && scanCallback(val);
    if (navigator.vibrate) navigator.vibrate(60);
    const hint = document.querySelector('.scan-hint');
    if (hint) hint.textContent = `✅ เพิ่ม ${val} (รวม ${scanSeen.size}) · สแกนต่อได้เลย หรือกด ✕ เมื่อเสร็จ`;
    return;                                 // keep scanning
  }
  closeScan();
  scanCallback && scanCallback(val);
}

function stopCamera() {
  if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); scanStream = null; }
}

window.closeScan = closeScan;
window.manualScan = () => {
  const inp = document.getElementById('scanManual');
  const val = inp.value.trim();
  if (!val) return;
  if (scanContinuous) {
    inp.value = '';
    if (scanSeen.has(val)) { toast('เลขซ้ำ', 'red'); return; }
    scanSeen.add(val);
    scanCallback && scanCallback(val);
    const hint = document.querySelector('.scan-hint');
    if (hint) hint.textContent = `✅ เพิ่ม ${val} (รวม ${scanSeen.size}) · พิมพ์/สแกนต่อได้`;
    return;
  }
  closeScan();
  scanCallback && scanCallback(val);
};

// ══════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════
function $(id) { return document.getElementById(id); }

async function api(url, method = 'GET', body = null) {
  const opts = { method, headers: {} };
  if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  const res = await fetch(url, opts);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || 'เกิดข้อผิดพลาด');
  return json;
}

async function lookupEmp(input, nameId) {
  const code = input.value.trim();
  const el = document.getElementById(nameId);
  if (!el) return;
  if (!code) { el.textContent = ''; el.style.color = ''; return; }
  try {
    const { data } = await api(`/api/employee/${code}`);
    el.textContent = data.fullname;
    el.style.color = 'var(--green)';
  } catch {
    el.textContent = 'ไม่พบรหัสพนักงาน';
    el.style.color = 'var(--red)';
  }
}
window.lookupEmp = lookupEmp;
window.openScan = openScan;

function infoRow(label, value) {
  return `<div class="form-group"><label>${label}</label><div style="font-size:.9rem">${value}</div></div>`;
}

function fmtDate(iso) {
  if (!iso) return '-';
  const p = String(iso).slice(0,10).split('-');
  return p.length === 3 ? `${+p[2]}/${+p[1]}/${p[0]}` : iso;
}
function fmtDatePad(iso) {
  if (!iso) return '';
  const p = String(iso).slice(0,10).split('-');
  return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : iso;
}
function todayISO() { return new Date().toISOString().slice(0,10); }
function todayStr() {
  return new Date().toLocaleDateString('th-TH',{day:'numeric',month:'long',year:'numeric'});
}
function nowTime() { return new Date().toTimeString().slice(0,5); }

function toast(msg, type = 'ok') {
  const el = document.getElementById('toast');
  el.textContent = (type === 'red' ? '⚠️ ' : '✅ ') + msg;
  el.style.borderColor = type === 'red' ? 'var(--red)' : 'var(--green)';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2800);
}
