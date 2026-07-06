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
    press: pagePress,
    pressNew: pagePressNew,
    pressDetail: pagePressDetail,
    pressInspect: pagePressInspect,
    pressStore: pagePressStore,
    internal: pageInternal,
    internalPrepare: pageInternalPrepare,
    internalTransport: pageInternalTransport,
    internalReceive: pageInternalReceive,
    external: pageExternal,
    externalSend: pageExternalSend,
    externalReceive: pageExternalReceive,
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
      <div class="home-card" onclick="renderPage('press')">
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
  const { data: docs } = await api('/api/clean');
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🧹 ล้าง/โค๊ตบล็อก</h1>
      <button class="btn-primary btn-sm" onclick="renderPage('cleanNew')">+ สร้าง</button>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">บันทึกการล้าง (DB1)</div>
        ${docs.length === 0 ? `<p class="no-data">ยังไม่มีรายการ</p>` : docs.map(d => `
          <div class="list-item" onclick="renderPage('cleanDetail',{doc_no:'${d.doc_no}'})">
            <div>
              <div class="list-title">${d.doc_no}</div>
              <div class="list-sub">${d.date} · ${d.process_step} · ${d.block_count} บล็อก</div>
            </div>
            <div class="list-right"><span class="chevron">›</span></div>
          </div>`).join('')}
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
    toast('บันทึกสำเร็จ: '+data.doc_no);
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
async function pagePress(app) {
  const { data: docs } = await api('/api/press');
  const statusLabel = { pending:'รอดำเนินการ', inspected:'อัดแล้ว', stored:'จัดเก็บแล้ว' };
  const statusBadge = { pending:'badge-yellow', inspected:'badge-blue', stored:'badge-green' };
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🖼️ ร้องขออัดบล็อก</h1>
      <button class="btn-primary btn-sm" onclick="renderPage('pressNew')">+ ร้องขอ</button>
    </div>
    <div class="page">
      <div class="card">
        ${docs.length===0?`<p class="no-data">ยังไม่มีรายการ</p>`:docs.map(d=>`
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
  const films = [{internal_code:'',color_order:'',revision:'',fabric_no:''}];
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('press')">‹</button>
      <h1>ร้องขออัดบล็อก</h1>
    </div>
    <div class="page">
      <div class="steps">
        <div class="step active">1.ร้องขอ</div>
        <div class="step">2.บล็อกรออัด</div>
        <div class="step">3.ตรวจรับ</div>
        <div class="step">4.จัดเก็บ</div>
      </div>
      <div class="card">
        <div class="grid2">
          <div class="form-group">
            <label>วันที่</label><input type="date" id="p_date" value="${todayISO()}"/>
          </div>
          <div class="form-group">
            <label>เวลา</label><input type="time" id="p_time" value="${nowTime()}"/>
          </div>
        </div>
        <div class="form-group">
          <label>หน่วยงาน</label>
          <select id="p_dept">${master.departments.map(d=>`<option value="${d.id}">${d.id} – ${d.name}</option>`).join('')}</select>
        </div>
        <div class="form-group">
          <label>เลขที่บล็อกเดิม</label>
          <div class="row gap-sm">
            <input id="p_old_block" placeholder="เลขบล็อก" class="flex1"/>
            <button class="scan-btn" onclick="openScan(v=>$('p_old_block').value=v)">📷</button>
          </div>
        </div>
        <div class="form-group">
          <label>ปัญหา</label>
          <select id="p_problem">
            ${master.problems.map(p=>`<option>${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>หมายเหตุ</label><textarea id="p_remark" rows="2"></textarea>
        </div>
        <div class="form-group">
          <label>รหัสพนักงานผู้ร้องขอ</label>
          <div class="row gap-sm">
            <input id="p_emp" placeholder="รหัส" class="flex1" oninput="lookupEmp(this,'p_emp_name')"/>
            <button class="scan-btn" onclick="openScan(v=>{$('p_emp').value=v;lookupEmp($('p_emp'),'p_emp_name')})">📷</button>
          </div>
          <small id="p_emp_name" class="muted"></small>
        </div>
      </div>

      <div class="card">
        <div class="row gap-sm mb">
          <span class="card-title flex1" style="margin:0">ข้อมูลฟิล์ม (สแกน QR ในบล็อก)</span>
          <button class="btn-sm btn-secondary" onclick="addFilmRow()">+ เพิ่ม</button>
        </div>
        <div class="film-row film-header" style="font-size:.7rem">
          <span>รหัสภายใน</span><span>ลำดับสี</span><span>Rev.</span><span>เบอร์ผ้า</span><span></span>
        </div>
        <div id="film_rows"></div>
      </div>

      <button class="btn-primary" style="width:100%" onclick="submitPress()">SUBMIT</button>
    </div>`;

  window._pressFilms = films;
  renderFilmRows();

  window.addFilmRow = () => {
    if (window._pressFilms.length >= 4) { toast('สูงสุด 4 ฟิล์ม','red'); return; }
    window._pressFilms.push({internal_code:'',color_order:'',revision:'',fabric_no:''});
    renderFilmRows();
  };
  window.removeFilmRow = (i) => { window._pressFilms.splice(i,1); renderFilmRows(); };

  function renderFilmRows() {
    $('film_rows').innerHTML = window._pressFilms.map((f,i)=>`
      <div class="film-row">
        <input value="${f.internal_code}" oninput="window._pressFilms[${i}].internal_code=this.value" placeholder="H-E-26-01"/>
        <input value="${f.color_order}" oninput="window._pressFilms[${i}].color_order=this.value" placeholder="1"/>
        <input value="${f.revision}" oninput="window._pressFilms[${i}].revision=this.value" placeholder="1"/>
        <select onchange="window._pressFilms[${i}].fabric_no=this.value">
          <option value="">เลือก...</option>
          ${master.fabric_types.map(ft=>`<option value="${ft.id}" ${ft.id===f.fabric_no?'selected':''}>${ft.id}</option>`).join('')}
        </select>
        <button class="btn-icon" onclick="removeFilmRow(${i})">🗑️</button>
      </div>`).join('');
  }

  window.submitPress = async () => {
    const old_block_no = $('p_old_block').value.trim();
    if (!old_block_no) { toast('กรุณากรอกเลขบล็อกเดิม','red'); return; }
    const body = {
      date: $('p_date').value,
      time: $('p_time').value,
      dept: $('p_dept').value,
      old_block_no,
      requester_emp: $('p_emp').value.trim()||null,
      problem_type: $('p_problem').value,
      remarks: $('p_remark').value.trim()||null,
      films: window._pressFilms.filter(f=>f.internal_code),
    };
    const { data } = await api('/api/press','POST',body);
    toast('ร้องขอสำเร็จ: '+data.doc_no);
    renderPage('pressDetail',{doc_no:data.doc_no});
  };
}

async function pagePressDetail(app, {doc_no}) {
  const { data: d } = await api(`/api/press/${doc_no}`);
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

function pagePressInspect(app, {doc_no}) {
  const checks = [
    {key:'dust_pass',label:'ไม่มีฝุ่น (ความสะอาดของแม่พิมพ์)'},
    {key:'grease_pass',label:'ไม่มีคราบไขมัน'},
    {key:'old_adhesive_pass',label:'ไม่มีคราบกาวอัดเดิม/หมึกพิมพ์'},
    {key:'fabric_hole_pass',label:'ผ้าสกรีนไม่ขาด/เป็นรูรั่ว'},
    {key:'dot_pass',label:'ไม่มีตามดบนแม่พิมพ์'},
    {key:'film_correct_pass',label:'ความถูกต้องของฟิล์ม TAG (ไม่กลับด้าน)'},
    {key:'adhesive_block_pass',label:'กาวไม่อุดตันบริเวณภาพ'},
    {key:'sharpness_pass',label:'ความคมชัดของภาพ'},
    {key:'register_pass',label:'REGISTER (MARK) ตรงกัน'},
  ];
  const state = {};
  checks.forEach(c => state[c.key] = null);

  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('pressDetail',{doc_no:'${doc_no}'})">‹</button>
      <h1>บันทึกตรวจรับ</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">${doc_no}</div>
        <div class="grid2">
          <div class="form-group"><label>บล็อกใหม่</label>
            <div class="row gap-sm">
              <input id="i_new_block" class="flex1" placeholder="เลขบล็อกใหม่"/>
              <button class="scan-btn" onclick="openScan(v=>$('i_new_block').value=v)">📷</button>
            </div>
          </div>
          <div class="form-group"><label>ขนาดเฟรม</label>
            <select id="i_frame">
              ${master.block_sizes.map(s=>`<option>${s.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>กำหนดวันที่เสร็จ</label><input type="date" id="i_due_date" value="${todayISO()}"/></div>
          <div class="form-group"><label>กำหนดเวลาเสร็จ</label><input type="time" id="i_due_time" value="${nowTime()}"/></div>
          <div class="form-group"><label>ความตึงบล็อก (14-20 N/cm)</label><input type="number" id="i_tension" placeholder="เช่น 17.5" step="0.1"/></div>
          <div class="form-group"><label>เวลาฉายแสง (วินาที)</label><input type="number" id="i_exposure" placeholder="วินาที" step="0.1"/></div>
        </div>
      </div>
      <div class="card">
        <div class="card-title">ผลการตรวจสอบ</div>
        ${checks.map(c=>`
          <div class="check-item">
            <label>${c.label}</label>
            <div class="check-group">
              <button id="btn_pass_${c.key}" onclick="setCheck('${c.key}',1)" class="btn-sm btn-secondary">ผ่าน</button>
              <button id="btn_fail_${c.key}" onclick="setCheck('${c.key}',0)" class="btn-sm btn-secondary">ไม่ผ่าน</button>
            </div>
          </div>`).join('')}
      </div>
      <div class="card">
        <div class="grid2">
          <div class="form-group"><label>วันที่ตรวจ</label><input type="date" id="i_date" value="${todayISO()}"/></div>
          <div class="form-group"><label>เวลา</label><input type="time" id="i_time" value="${nowTime()}"/></div>
          <div class="form-group"><label>รหัสพนักงาน BL คนที่ 1</label>
            <div class="row gap-sm">
              <input id="i_emp1" class="flex1" oninput="lookupEmp(this,'i_emp1_n')"/>
              <button class="scan-btn" onclick="openScan(v=>{$('i_emp1').value=v;lookupEmp($('i_emp1'),'i_emp1_n')})">📷</button>
            </div><small id="i_emp1_n" class="muted"></small>
          </div>
          <div class="form-group"><label>รหัสพนักงาน BL คนที่ 2</label>
            <div class="row gap-sm">
              <input id="i_emp2" class="flex1" oninput="lookupEmp(this,'i_emp2_n')"/>
              <button class="scan-btn" onclick="openScan(v=>{$('i_emp2').value=v;lookupEmp($('i_emp2'),'i_emp2_n')})">📷</button>
            </div><small id="i_emp2_n" class="muted"></small>
          </div>
        </div>
      </div>
      <button class="btn-primary" style="width:100%" onclick="submitInspect('${doc_no}')">SAVE / SUBMIT</button>
    </div>`;

  window._inspState = state;
  window.setCheck = (key, val) => {
    window._inspState[key] = val;
    $(`btn_pass_${key}`).className = 'btn-sm ' + (val===1?'sel-pass':'btn-secondary');
    $(`btn_fail_${key}`).className = 'btn-sm ' + (val===0?'sel-fail':'btn-secondary');
  };

  window.submitInspect = async (doc_no) => {
    const tension_value = parseFloat($('i_tension').value)||null;
    const tension_pass = tension_value !== null ? (tension_value >= 14 && tension_value <= 20 ? 1 : 0) : 0;
    const body = {
      new_block_no: $('i_new_block').value.trim()||null,
      frame_size: $('i_frame').value,
      due_date: $('i_due_date').value,
      due_time: $('i_due_time').value,
      tension_value, tension_pass,
      exposure_seconds: parseFloat($('i_exposure').value)||null,
      emp1_code: $('i_emp1').value.trim()||null,
      emp2_code: $('i_emp2').value.trim()||null,
      insp_date: $('i_date').value,
      insp_time: $('i_time').value,
      ...window._inspState,
    };
    await api(`/api/press/${doc_no}/inspect`,'POST',body);
    toast('บันทึกตรวจรับสำเร็จ');
    renderPage('pressDetail',{doc_no});
  };
}

function pagePressStore(app, {doc_no}) {
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('pressDetail',{doc_no:'${doc_no}'})">‹</button>
      <h1>จัดเก็บบล็อก</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">${doc_no} – ขั้นตอนที่ 4 จัดเก็บ</div>
        <div class="form-group"><label>บล็อกใหม่</label>
          <div class="row gap-sm">
            <input id="s_new" class="flex1" placeholder="เลขบล็อกใหม่"/>
            <button class="scan-btn" onclick="openScan(v=>$('s_new').value=v)">📷</button>
          </div>
        </div>
        <div class="form-group"><label>ที่จัดเก็บ (เช่น A1/1)</label><input id="s_loc" placeholder="A1/1"/></div>
        <div class="form-group"><label>หมายเหตุ</label><textarea id="s_remark" rows="2"></textarea></div>
        <div class="grid2">
          <div class="form-group"><label>วันที่จัดเก็บ</label><input type="date" id="s_date" value="${todayISO()}"/></div>
          <div class="form-group"><label>เวลา</label><input type="time" id="s_time" value="${nowTime()}"/></div>
        </div>
        <div class="form-group"><label>รหัสพนักงานผู้จัดเก็บ</label>
          <div class="row gap-sm">
            <input id="s_emp" class="flex1" oninput="lookupEmp(this,'s_emp_n')"/>
            <button class="scan-btn" onclick="openScan(v=>{$('s_emp').value=v;lookupEmp($('s_emp'),'s_emp_n')})">📷</button>
          </div>
          <small id="s_emp_n" class="muted"></small>
        </div>
      </div>
      <button class="btn-success" style="width:100%" onclick="submitStore('${doc_no}')">SUBMIT จัดเก็บ</button>
    </div>`;

  window.submitStore = async (doc_no) => {
    const body = {
      new_block_no: $('s_new').value.trim()||null,
      storage_location: $('s_loc').value.trim()||null,
      remarks: $('s_remark').value.trim()||null,
      store_date: $('s_date').value,
      store_time: $('s_time').value,
      storer_emp: $('s_emp').value.trim()||null,
    };
    await api(`/api/press/${doc_no}/store`,'POST',body);
    toast('จัดเก็บสำเร็จ');
    renderPage('pressDetail',{doc_no});
  };
}

// ══════════════════════════════════════════════════════
//  MODULE 3 – รับส่งภายใน
// ══════════════════════════════════════════════════════
async function pageInternal(app) {
  const { data: docs } = await api('/api/internal');
  const typeLabel = { prepare:'จัดเตรียม', transport:'ขนส่ง', store:'จัดเก็บ' };
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🔄 รับส่งภายใน</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="card-title">สร้างเอกสารใหม่</div>
        <div class="row gap-sm" style="flex-wrap:wrap">
          <button class="btn-primary" onclick="renderPage('internalPrepare')">📋 จัดเตรียม</button>
          <button class="btn-secondary" onclick="renderPage('internalTransport')">🚛 ขนส่ง/ตรวจรับ</button>
          <button class="btn-secondary" onclick="renderPage('internalReceive')">📦 ตรวจรับและจัดเก็บ</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">ประวัติเอกสาร</div>
        ${docs.length===0?`<p class="no-data">ยังไม่มีรายการ</p>`:docs.map(d=>`
          <div class="list-item">
            <div>
              <div class="list-title">${d.doc_no}</div>
              <div class="list-sub">${typeLabel[d.doc_type]||d.doc_type} · ${d.from_dept||''}→${d.to_dept||''} · ${d.doc_date}</div>
            </div>
            <div class="list-right"><span class="badge badge-gray">${d.status}</span></div>
          </div>`).join('')}
      </div>
    </div>`;
}

function internalPrepareForm(app, title, type, backPage, submitLabel) {
  const blocks = [];
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('${backPage}')">‹</button>
      <h1>${title}</h1>
    </div>
    <div class="page">
      <div class="steps">
        <div class="step ${type==='prepare'?'active':'done'}">1.จัดเตรียม</div>
        <div class="step ${type==='transport'?'active':type==='store'?'done':''}">2.ตรวจรับ+ขนส่ง</div>
        <div class="step ${type==='store'?'active':''}">3.ตรวจรับ+จัดเก็บ</div>
      </div>
      <div class="card">
        <div class="grid2">
          <div class="form-group"><label>วันที่</label><input type="date" id="m_date" value="${todayISO()}"/></div>
          <div class="form-group"><label>เวลา</label><input type="time" id="m_time" value="${nowTime()}"/></div>
          <div class="form-group"><label>หน่วยงานต้นทาง</label>
            <select id="m_from">${master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('')}</select>
          </div>
          <div class="form-group"><label>เตรียมให้หน่วยงาน</label>
            <select id="m_to">${master.departments.map(d=>`<option value="${d.id}">${d.id}</option>`).join('')}</select>
          </div>
        </div>
        <div class="form-group"><label>รหัสพนักงาน</label>
          <div class="row gap-sm">
            <input id="m_emp" class="flex1" oninput="lookupEmp(this,'m_emp_n')"/>
            <button class="scan-btn" onclick="openScan(v=>{$('m_emp').value=v;lookupEmp($('m_emp'),'m_emp_n')})">📷</button>
          </div>
          <small id="m_emp_n" class="muted"></small>
        </div>
      </div>

      <div class="card">
        <div class="row gap-sm mb">
          <span class="card-title flex1" style="margin:0">บล็อก (สแกน QR)</span>
          <button class="scan-btn" onclick="openScan(v=>addMBlock(v))">📷 สแกน</button>
        </div>
        <div class="row gap-sm mb">
          <input id="m_block_in" class="flex1" placeholder="พิมพ์เลขบล็อก" onkeydown="if(event.key==='Enter')addMBlock($('m_block_in').value)"/>
          <button class="btn-secondary" onclick="addMBlock($('m_block_in').value)">เพิ่ม</button>
        </div>
        <div id="m_block_list"></div>
      </div>

      <button class="btn-primary" style="width:100%" onclick="submitInternal('${type}')">${submitLabel}</button>
    </div>`;

  window._mBlocks = blocks;
  window.addMBlock = (val) => {
    val = val?.trim();
    if (!val) return;
    if (window._mBlocks.find(b=>b.block_no===val)) { toast('บล็อกซ้ำ!','red'); return; }
    window._mBlocks.push({block_no:val,internal_code:'',color_order:'',revision:'',fabric_no:''});
    $('m_block_in').value = '';
    renderMBlocks();
  };
  window.removeMBlock = (i) => { window._mBlocks.splice(i,1); renderMBlocks(); };

  function renderMBlocks() {
    $('m_block_list').innerHTML = window._mBlocks.map((b,i)=>`
      <div style="padding:.4rem 0;border-bottom:1px solid var(--border)">
        <div class="row gap-sm">
          <strong class="flex1">${b.block_no}</strong>
          <button class="btn-icon" onclick="removeMBlock(${i})">🗑️</button>
        </div>
      </div>`).join('') || '<p class="no-data">ยังไม่มีบล็อก</p>';
  }
  renderMBlocks();

  window.submitInternal = async (type) => {
    if (window._mBlocks.length === 0) { toast('กรุณาเพิ่มบล็อกอย่างน้อย 1 รายการ','red'); return; }
    const body = {
      date: $('m_date').value, time: $('m_time').value,
      from_dept: $('m_from').value, to_dept: $('m_to').value,
      emp_code: $('m_emp').value.trim()||null,
      blocks: window._mBlocks,
    };
    const { data } = await api(`/api/internal/${type}`,'POST',body);
    toast('สร้างเอกสาร: '+data.doc_no);
    renderPage('internal');
  };
}

function pageInternalPrepare(app) { internalPrepareForm(app,'📋 ขั้นตอนจัดเตรียม','prepare','internal','SUMMIT จัดเตรียม'); }
function pageInternalTransport(app) { internalPrepareForm(app,'🚛 ขั้นตอนตรวจรับ+ขนส่ง','transport','internal','SUMMIT ขนส่ง'); }
function pageInternalReceive(app) { internalPrepareForm(app,'📦 ขั้นตอนตรวจรับ+จัดเก็บ','store','internal','SUMMIT จัดเก็บ'); }

// ══════════════════════════════════════════════════════
//  MODULE 4 – รับส่งภายนอก
// ══════════════════════════════════════════════════════
async function pageExternal(app) {
  const { data: docs } = await api('/api/external');
  const typeLabel = { send_out:'ส่งออก (OU)', receive_in:'รับเข้า (IN)' };
  const typeBadge = { send_out:'badge-yellow', receive_in:'badge-green' };
  app.innerHTML = `
    <div class="topnav">
      <button class="back-btn" onclick="renderPage('home')">‹</button>
      <h1>🚚 รับส่งภายนอก</h1>
    </div>
    <div class="page">
      <div class="card">
        <div class="row gap-sm">
          <button class="btn-primary flex1" onclick="renderPage('externalSend')">📤 ส่งบล็อกขึงผ้า</button>
          <button class="btn-success flex1" onclick="renderPage('externalReceive')">📥 รับบล็อกขึงผ้า</button>
        </div>
      </div>
      <div class="card">
        <div class="card-title">ประวัติเอกสาร</div>
        ${docs.length===0?`<p class="no-data">ยังไม่มีรายการ</p>`:docs.map(d=>`
          <div class="list-item">
            <div>
              <div class="list-title">${d.doc_no}</div>
              <div class="list-sub">${d.from_dept}→${d.to_dept} · ${d.doc_date}</div>
            </div>
            <div class="list-right"><span class="badge ${typeBadge[d.doc_type]||'badge-gray'}">${typeLabel[d.doc_type]||d.doc_type}</span></div>
          </div>`).join('')}
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
