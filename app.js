(function () {
  'use strict';

  const L = window.Logic;
  const LS_KEY = 'catcare.v1';
  const $ = (id) => document.getElementById(id);

  /* ---------------- 元数据 ---------------- */
  const CATS = {
    food: { name: '饮食饮水', icon: 'bowl', bg: '#FFE3CF', fg: '#E86A2E' },
    litter: { name: '排泄猫砂', icon: 'litter', bg: '#EFE6D8', fg: '#A0784E' },
    groom: { name: '身体清洁', icon: 'sparkle', bg: '#FFEFC7', fg: '#D99A1F' },
    medical: { name: '医疗预防', icon: 'cross', bg: '#FFE1DC', fg: '#D9534F' },
    monitor: { name: '健康监测', icon: 'heart', bg: '#E4F4EC', fg: '#2F9C7C' },
    env: { name: '环境与陪伴', icon: 'paw', bg: '#E8F0FE', fg: '#4A7BD0' },
  };
  const CAT_KEYS = Object.keys(CATS);

  const TEMPLATES = [
    ['加猫粮', 'food', 12, 'morning'],
    ['换水', 'food', 24, 'morning'],
    ['洗水碗', 'food', 48, 'evening'],
    ['饮水机清洗', 'food', 168, 'evening'],
    ['饮水机滤芯', 'food', 720, 'any'],
    ['零食 / 保健品', 'food', 24, 'evening'],
    ['换粮过渡', 'food', 24, 'morning'],
    ['铲猫砂', 'litter', 12, 'morning'],
    ['补猫砂', 'litter', 168, 'any'],
    ['换猫砂 / 洗盆', 'litter', 336, 'any'],
    ['排便排尿观察', 'litter', 24, 'evening'],
    ['梳毛', 'groom', 72, 'evening'],
    ['剪指甲', 'groom', 336, 'evening'],
    ['刷牙', 'groom', 72, 'evening'],
    ['洗耳', 'groom', 168, 'evening'],
    ['眼部清洁', 'groom', 48, 'morning'],
    ['下巴清洁', 'groom', 168, 'evening'],
    ['洗澡', 'groom', 1440, 'any'],
    ['剃脚毛', 'groom', 1440, 'any'],
    ['猫三联（幼猫）', 'medical', 672, 'any', 'appointment'],
    ['猫三联（加强）', 'medical', 8760, 'any', 'appointment'],
    ['狂犬疫苗', 'medical', 8760, 'any', 'appointment'],
    ['体内驱虫', 'medical', 2160, 'any'],
    ['体外驱虫', 'medical', 720, 'any'],
    ['年度体检', 'medical', 8760, 'any', 'appointment'],
    ['洗牙', 'medical', 8760, 'any', 'appointment'],
    ['心脏超声', 'medical', 8760, 'any', 'appointment'],
    ['绝育', 'medical', 8760, 'any', 'appointment'],
    ['用药 / 复诊', 'medical', 24, 'any'],
    ['保险续费', 'medical', 8760, 'any'],
    ['称体重', 'monitor', 720, 'any'],
    ['饮水观察', 'monitor', 24, 'evening'],
    ['尿团观察', 'monitor', 24, 'evening'],
    ['猫窝清洗', 'env', 504, 'any'],
    ['猫爬架清洁', 'env', 1440, 'any'],
    ['玩具清洁', 'env', 720, 'any'],
    ['全屋吸毛', 'env', 168, 'any'],
    ['猫包清洁', 'env', 720, 'any'],
    ['陪玩', 'env', 24, 'evening'],
  ].map(([name, category, hours, slot, type]) => ({
    name,
    category,
    hours,
    slot,
    type: type || 'interval',
  }));

  /* ---------------- 图标 ---------------- */
  const PATHS = {
    bowl: '<path d="M3 11h18c0 5.2-4 8.5-9 8.5S3 16.2 3 11Z" fill="currentColor"/><rect x="2" y="8.6" width="20" height="3" rx="1.5" fill="currentColor"/>',
    litter: '<rect x="4" y="9" width="16" height="11" rx="3" fill="currentColor"/><rect x="6" y="5.5" width="12" height="3.2" rx="1.6" fill="currentColor"/>',
    sparkle:
      '<path d="M12 2.4l2 5.9 5.9 2-5.9 2-2 5.9-2-5.9-5.9-2 5.9-2 2-5.9Z" fill="currentColor"/>',
    cross:
      '<rect x="10" y="2.6" width="4" height="18.8" rx="2" fill="currentColor"/><rect x="2.6" y="10" width="18.8" height="4" rx="2" fill="currentColor"/>',
    heart:
      '<path d="M12 20.4S4 15.7 4 10.6A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 8 2.6c0 5.1-8 9.8-8 9.8Z" fill="currentColor"/>',
    paw: '<ellipse cx="12" cy="16" rx="4.6" ry="3.6" fill="currentColor"/><circle cx="7" cy="10.4" r="1.9" fill="currentColor"/><circle cx="10.6" cy="8.2" r="1.9" fill="currentColor"/><circle cx="14.4" cy="8.2" r="1.9" fill="currentColor"/><circle cx="17" cy="10.6" r="1.9" fill="currentColor"/>',
    check: '<path d="M5 12.6l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6Z" fill="currentColor"/>',
    chev: '<path d="M6 9.2l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    home: '<path d="M12 3.2 3.4 10v10.4h6.2v-6h4.8v6h6.2V10Z" fill="currentColor"/>',
    list: '<rect x="4" y="4.6" width="16" height="2.6" rx="1.3" fill="currentColor"/><rect x="4" y="10.7" width="16" height="2.6" rx="1.3" fill="currentColor"/><rect x="4" y="16.8" width="10.5" height="2.6" rx="1.3" fill="currentColor"/>',
    clock:
      '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.4V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    cat: '<path d="M5.3 9.3 4 4.1l4.7 2.4c1-.4 2.1-.6 3.3-.6s2.3.2 3.3.6L20 4.1l-1.3 5.2A7.6 7.6 0 0 1 20 13.2c0 4.2-3.6 7.2-8 7.2s-8-3-8-7.2c0-1.5.5-2.9 1.3-3.9Z" fill="currentColor"/><circle cx="9.3" cy="12.6" r="1.15" fill="#FFFAE8"/><circle cx="14.7" cy="12.6" r="1.15" fill="#FFFAE8"/><path d="M12 14.7l1.1 1.1h-2.2Z" fill="#FFFAE8"/>',
    down: '<path d="M12 3v11m0 0 4-4m-4 4-4-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2.4h16V17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    up: '<path d="M12 15V4m0 0 4 4m-4-4L8 8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 17v2.4h16V17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    trash:
      '<path d="M5 7h14M9 7V5.2h6V7m-8 0 .8 12h8.4L17 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    info: '<circle cx="12" cy="12" r="8.6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 10.6V17M12 7.6v.2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  };
  function icon(name, cls) {
    return `<svg viewBox="0 0 24 24" class="${cls || ''}" aria-hidden="true">${PATHS[name] || ''}</svg>`;
  }

  /* ---------------- 状态 ---------------- */
  let data = load();
  let tab = 'today';
  let planFilter = 'all';
  let doneOpen = false;
  let toastTimer = null;

  function defaultData() {
    return {
      version: 1,
      cats: [],
      activeCat: null,
      tasks: [],
      records: [],
      settings: { backupAt: null, createdAt: new Date().toISOString() },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (!raw) return defaultData();
      const d = JSON.parse(raw);
      if (!d || !Array.isArray(d.cats)) return defaultData();
      d.tasks = d.tasks || [];
      d.records = d.records || [];
      d.settings = d.settings || { backupAt: null };
      return d;
    } catch (e) {
      console.warn('读取数据失败，使用空数据', e);
      return defaultData();
    }
  }

  function save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) {
      toast('保存失败，存储空间可能已满');
    }
  }

  function activeCat() {
    return data.cats.find((c) => c.id === data.activeCat) || data.cats[0] || null;
  }

  function catTasks() {
    const cat = activeCat();
    if (!cat) return [];
    return data.tasks.filter((t) => t.catId === cat.id);
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function toast(msg) {
    const el = $('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800);
  }

  /* ---------------- 渲染：外壳 ---------------- */
  function render() {
    renderTop();
    renderView();
    renderTabs();
  }

  function renderTop() {
    const cat = activeCat();
    const top = $('topbar');
    if (!cat) {
      top.innerHTML = '';
      return;
    }
    top.innerHTML = `
      <button class="cat-switch" data-act="catMenu">
        <span class="avatar">${icon('cat')}</span>
        <span class="cat-name">${esc(cat.name)}</span>
        ${icon('chev', 'chev')}
      </button>
      <span class="spacer"></span>
      <button class="icon-btn" data-act="backup" aria-label="备份">${icon('down')}</button>
    `;
  }

  function renderTabs() {
    const items = [
      ['today', '今天', 'home'],
      ['plan', '计划', 'list'],
      ['records', '记录', 'clock'],
      ['me', '我的', 'cat'],
    ];
    $('tabbar').innerHTML = items
      .map(
        ([key, label, ic]) => `
      <button class="tab ${tab === key ? 'on' : ''}" data-act="tab" data-tab="${key}">
        ${icon(ic)}<span>${label}</span>
      </button>`
      )
      .join('');
  }

  function renderView() {
    const v = $('view');
    if (!data.cats.length) {
      v.innerHTML = onboardingHTML();
      return;
    }
    if (tab === 'today') v.innerHTML = todayHTML();
    else if (tab === 'plan') v.innerHTML = planHTML();
    else if (tab === 'records') v.innerHTML = recordsHTML();
    else v.innerHTML = meHTML();
  }

  /* ---------------- 渲染：今天 ---------------- */
  function taskMeta(t) {
    if (t.type === 'appointment') {
      if (t.appointmentAt) {
        return `预约 ${L.formatDate(t.appointmentAt)}${t.hospital ? ' · ' + t.hospital : ''}`;
      }
      return `该预约了 · ${L.intervalLabel(t.intervalHours)}`;
    }
    return `${L.intervalLabel(t.intervalHours)} · ${L.slotName(t.slot)}`;
  }

  function taskRow(t, cls) {
    const c = CATS[t.category] || CATS.food;
    return `
      <div class="task ${cls}" data-act="openTask" data-id="${t.id}">
        <span class="cat-icon" style="background:${c.bg};color:${c.fg}">${icon(c.icon)}</span>
        <div class="task-main">
          <div class="task-name">${esc(t.name)}</div>
          <div class="task-meta">${esc(taskMeta(t))}</div>
        </div>
        <button class="check ${cls === 'done' ? 'on' : ''}" data-act="complete" data-id="${t.id}" aria-label="完成">${icon('check')}</button>
      </div>`;
  }

  function todayHTML() {
    const now = new Date();
    const b = L.bucketTasks(catTasks(), now);
    const total = b.overdue.length + b.today.length + b.done.length;
    const pct = total ? Math.round((b.done.length / total) * 100) : 0;
    const dateStr = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;

    if (!total) {
      return `
        <div class="empty">
          ${icon('cat')}
          <div class="empty-title">今天没有要做的</div>
          <div class="empty-sub">去「计划」里加几项，或者明天再来看看</div>
        </div>`;
    }

    const doneBlock = b.done.length
      ? `
        <div class="section-title" data-act="toggleDone">
          已完成 · ${b.done.length}
          <span class="count">${doneOpen ? '收起' : '展开'}</span>
        </div>
        <div class="${doneOpen ? '' : 'hidden'}">
          ${b.done.map((t) => taskRow(t, 'done')).join('')}
        </div>`
      : '';

    return `
      <div class="hero">
        <div class="hero-top"><span>今天</span><span>${dateStr}</span></div>
        <div class="hero-count">${b.done.length} <small>/ ${total}</small></div>
        <div class="hero-sub">已完成 ${b.done.length} 件，还有 ${total - b.done.length} 件</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span class="hero-cat">${icon('cat')}</span>
      </div>
      ${
        b.overdue.length
          ? `<div class="section-title danger">已逾期 · ${b.overdue.length}</div>
             ${b.overdue.map((t) => taskRow(t, 'overdue')).join('')}`
          : ''
      }
      ${
        b.today.length
          ? `<div class="section-title">今天 · ${b.today.length}</div>
             ${b.today.map((t) => taskRow(t, '')).join('')}`
          : ''
      }
      ${doneBlock}
      ${b.today.length === 0 && b.overdue.length === 0 ? '<div class="hint-block">今天的事都做完了，厉害。</div>' : ''}
    `;
  }

  /* ---------------- 渲染：计划 ---------------- */
  function planHTML() {
    const tasks = catTasks().filter((t) => t.enabled || true);
    const groups = CAT_KEYS.filter(
      (k) => planFilter === 'all' || planFilter === k
    )
      .map((k) => ({
        key: k,
        list: tasks.filter((t) => t.category === k && t.enabled),
        off: tasks.filter((t) => t.category === k && !t.enabled),
      }))
      .filter((g) => g.list.length || g.off.length);

    const SHORT = { food: '饮食', litter: '排泄', groom: '清洁', medical: '医疗', monitor: '监测', env: '环境' };
    const chips = [['all', '全部'], ...CAT_KEYS.map((k) => [k, SHORT[k]])]
      .map(
        ([k, label]) =>
          `<button class="chip ${planFilter === k ? 'on' : ''}" data-act="filter" data-key="${k}">${label}</button>`
      )
      .join('');

    const rowHTML = (t, off) => {
      const c = CATS[t.category] || CATS.food;
      const last = t.lastDoneAt ? `上次 ${L.formatDay(t.lastDoneAt)}` : '从未记录';
      return `
        <div class="plan-row ${off ? 'off' : ''}" data-act="openTask" data-id="${t.id}">
          <span class="cat-icon" style="background:${c.bg};color:${c.fg};width:36px;height:36px;border-radius:12px">${icon(c.icon)}</span>
          <div class="plan-main">
            <div class="plan-name">${esc(t.name)}${off ? ' · 已停用' : ''}</div>
            <div class="plan-meta">${L.intervalLabel(t.intervalHours)} · ${last}</div>
          </div>
          ${icon('chev', 'chev')}
        </div>`;
    };

    return `
      <div class="chips">${chips}</div>
      ${groups
        .map(
          (g) => `
        <div class="plan-group">
          <div class="section-title">${CATS[g.key].name}</div>
          ${g.list.map((t) => rowHTML(t, false)).join('')}
          ${g.off.map((t) => rowHTML(t, true)).join('')}
        </div>`
        )
        .join('')}
      ${
        groups.length
          ? ''
          : `<div class="empty">${icon('cat')}<div class="empty-title">还没有照料项</div><div class="empty-sub">点右下角的 ＋ 从模板里挑</div></div>`
      }
      <button class="fab" data-act="addTask" aria-label="添加照料项">${icon('plus')}</button>
    `;
  }

  /* ---------------- 渲染：记录 ---------------- */
  function recordsHTML() {
    const cat = activeCat();
    const recs = data.records
      .filter((r) => r.catId === cat.id)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 80);
    const stat = L.weekStats(recs, new Date());

    const groups = [];
    let cur = null;
    for (const r of recs) {
      const day = L.formatDay(r.at);
      if (!cur || cur.day !== day) {
        cur = { day, items: [] };
        groups.push(cur);
      }
      cur.items.push(r);
    }

    const timeline = groups
      .map(
        (g) => `
        <div class="rec-day">${g.day}</div>
        ${g.items
          .map((r) => {
            const d = new Date(r.at);
            const hh = String(d.getHours()).padStart(2, '0');
            const mm = String(d.getMinutes()).padStart(2, '0');
            const name = r.name || (data.tasks.find((t) => t.id === r.taskId) || {}).name || '已删除';
            return `<div class="rec">
              <span class="rec-time">${hh}:${mm}</span>
              <span class="rec-name">${esc(name)}</span>
              <span class="rec-status ${r.status}">${r.status === 'done' ? '完成' : '跳过'}</span>
            </div>`;
          })
          .join('')}`
      )
      .join('');

    return `
      <div class="stat-card">
        <div class="stat-label">本周完成率</div>
        <div class="stat-num">${stat.rate}%</div>
        <div class="stat-sub">完成 ${stat.done} 次 · 跳过 ${stat.skipped} 次</div>
      </div>
      ${recs.length ? timeline : `<div class="empty">${icon('cat')}<div class="empty-title">还没有记录</div><div class="empty-sub">完成一次照料就会出现在这里</div></div>`}
    `;
  }

  /* ---------------- 渲染：我的 ---------------- */
  function meHTML() {
    const cat = activeCat();
    const lastBackup = data.settings.backupAt
      ? `${L.formatDay(data.settings.backupAt)}备份`
      : '还没备份过';
    return `
      <div class="me-card" data-act="editCat">
        <span class="avatar">${icon('cat')}</span>
        <div class="grow">
          <div class="me-name">${esc(cat.name)}</div>
          <div class="me-sub">${[cat.breed, cat.birthday ? cat.birthday.slice(0, 10) : ''].filter(Boolean).join(' · ') || '点击补充资料'}</div>
        </div>
        ${icon('chev', 'chev')}
      </div>

      <div class="section-title">数据</div>
      <button class="list-row" data-act="backup">
        <span class="grow">导出备份</span><span class="hint">${lastBackup}</span>${icon('down')}
      </button>
      <button class="list-row" data-act="import">
        <span class="grow">导入恢复</span>${icon('up')}
      </button>

      <div class="section-title">其他</div>
      <button class="list-row" data-act="addCat">
        <span class="grow">添加猫咪</span>${icon('plus')}
      </button>
      <button class="list-row" data-act="about">
        <span class="grow">关于与免责声明</span>${icon('chev')}
      </button>
      <div class="hint-block">v1.0 · 数据只存在这台设备上，记得偶尔导出备份。</div>
    `;
  }

  function onboardingHTML() {
    return `
      <div class="onboard">
        ${icon('cat')}
        <h1>先认识一下你的猫</h1>
        <p>名字就够了，其他可以以后再补</p>
        <form id="onboardForm">
          <div class="field">
            <input class="input" name="name" placeholder="比如：年糕" autocomplete="off" required />
          </div>
          <button class="btn" type="submit">开始</button>
        </form>
      </div>`;
  }

  /* ---------------- Sheet ---------------- */
  const sheetRoot = $('sheetRoot');

  function openSheet(html) {
    sheetRoot.innerHTML = `<div class="sheet-mask" data-act="closeSheet"></div><div class="sheet">${html}</div>`;
    sheetRoot.hidden = false;
    requestAnimationFrame(() => sheetRoot.classList.add('open'));
  }

  function closeSheet() {
    sheetRoot.classList.remove('open');
    setTimeout(() => {
      sheetRoot.hidden = true;
      sheetRoot.innerHTML = '';
    }, 220);
  }

  function sheetHead(title) {
    return `<div class="sheet-head"><div class="sheet-title">${title}</div><button class="sheet-close" data-act="closeSheet">×</button></div>`;
  }

  function catMenuSheet() {
    const rows = data.cats
      .map(
        (c) => `
      <button class="list-row" data-act="switchCat" data-id="${c.id}">
        <span class="grow">${esc(c.name)}</span>
        ${c.id === data.activeCat ? '<span class="hint">当前</span>' : ''}
        ${icon('chev')}
      </button>`
      )
      .join('');
    openSheet(`
      ${sheetHead('切换猫咪')}
      ${rows}
      <button class="list-row" data-act="addCat"><span class="grow">添加猫咪</span>${icon('plus')}</button>
    `);
  }

  function catSheet(id) {
    const cat = data.cats.find((c) => c.id === id) || null;
    openSheet(`
      ${sheetHead(cat ? '猫咪资料' : '添加猫咪')}
      <form id="catForm">
        <div class="field">
          <label class="label">名字</label>
          <input class="input" name="name" required value="${cat ? esc(cat.name) : ''}" placeholder="年糕" />
        </div>
        <div class="field">
          <label class="label">品种</label>
          <input class="input" name="breed" value="${cat ? esc(cat.breed || '') : ''}" placeholder="英短（可选）" />
        </div>
        <div class="field">
          <label class="label">生日</label>
          <input class="input" type="date" name="birthday" value="${cat && cat.birthday ? cat.birthday.slice(0, 10) : ''}" />
        </div>
        <div class="field">
          <label class="label">体重（kg）</label>
          <input class="input" type="number" step="0.1" min="0" name="weight" value="${cat && cat.weight ? cat.weight : ''}" placeholder="4.8" />
        </div>
        ${cat ? `<input type="hidden" name="id" value="${cat.id}" />` : ''}
        <button class="btn" type="submit">保存</button>
        ${cat ? `<button class="btn btn-danger" type="button" data-act="deleteCat" data-id="${cat.id}">删除这只猫</button>` : ''}
      </form>
    `);
  }

  function toLocalInput(date) {
    const d = new Date(date);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  }

  function taskSheet(id) {
    const cat = activeCat();
    const task =
      data.tasks.find((t) => t.id === id) ||
      ({
        id: null,
        catId: cat.id,
        name: '',
        category: 'food',
        type: 'interval',
        intervalHours: 24,
        slot: 'any',
        nextDueAt: new Date().toISOString(),
        lastDoneAt: null,
        appointmentAt: null,
        hospital: '',
        enabled: true,
      });

    const isNew = !task.id;
    const catRows = CAT_KEYS.map(
      (k) =>
        `<option value="${k}" ${task.category === k ? 'selected' : ''}>${CATS[k].name}</option>`
    ).join('');

    const presets = [12, 24, 48, 72, 168, 336, 720, 8760];

    openSheet(`
      ${sheetHead(isNew ? '新建照料项' : esc(task.name || '任务'))}
      ${
        isNew
          ? ''
          : `<div class="btn-row">
              <button class="btn" data-act="complete" data-id="${task.id}">完成打卡</button>
              <button class="btn btn-ghost" data-act="skip" data-id="${task.id}">跳过</button>
              <button class="btn btn-ghost" data-act="snooze" data-id="${task.id}">推迟 1 小时</button>
            </div>`
      }
      <form id="taskForm">
        <input type="hidden" name="id" value="${task.id || ''}" />
        <input type="hidden" name="type" value="${task.type}" />
        <div class="field">
          <label class="label">名称</label>
          <input class="input" name="name" required value="${esc(task.name)}" placeholder="比如：加猫粮" />
        </div>
        <div class="field">
          <label class="label">分类</label>
          <select class="select" name="category">${catRows}</select>
        </div>
        <div class="field">
          <label class="label">类型</label>
          <div class="seg" id="typeSeg">
            <button type="button" class="${task.type === 'interval' ? 'on' : ''}" data-seg="interval">周期任务</button>
            <button type="button" class="${task.type === 'appointment' ? 'on' : ''}" data-seg="appointment">预约任务</button>
          </div>
        </div>
        <div class="field">
          <label class="label">间隔（小时）</label>
          <input class="input" type="number" name="interval" min="1" max="8760" value="${task.intervalHours}" />
          <div class="presets">
            ${presets.map((h) => `<button type="button" class="preset ${task.intervalHours === h ? 'on' : ''}" data-preset="${h}">${h >= 24 ? h / 24 + ' 天' : h + ' 小时'}</button>`).join('')}
          </div>
        </div>
        <div class="field">
          <label class="label">时段</label>
          <div class="seg" id="slotSeg">
            ${['morning', 'evening', 'any']
              .map(
                (s) =>
                  `<button type="button" class="${task.slot === s ? 'on' : ''}" data-slot="${s}">${L.slotName(s)}</button>`
              )
              .join('')}
          </div>
        </div>
        <div class="field">
          <label class="label">下次到期</label>
          <input class="input" type="datetime-local" name="nextDue" value="${toLocalInput(task.nextDueAt)}" />
        </div>
        <div class="field ${task.type === 'appointment' ? '' : 'hidden'}" id="apptFields">
          <label class="label">预约时间（可选，填了就按这个日期显示）</label>
          <input class="input" type="datetime-local" name="appointmentAt" value="${task.appointmentAt ? toLocalInput(task.appointmentAt) : ''}" />
          <div style="height:10px"></div>
          <input class="input" name="hospital" value="${esc(task.hospital || '')}" placeholder="医院名称（可选）" />
        </div>
        ${
          isNew
            ? ''
            : `<div class="field">
                <label class="label">状态</label>
                <div class="seg" id="enableSeg">
                  <button type="button" class="${task.enabled ? 'on' : ''}" data-enable="1">启用</button>
                  <button type="button" class="${task.enabled ? '' : 'on'}" data-enable="0">停用</button>
                </div>
              </div>`
        }
        <button class="btn" type="submit">保存</button>
        ${isNew ? '' : `<button class="btn btn-danger" type="button" data-act="deleteTask" data-id="${task.id}">删除这个任务</button>`}
      </form>
    `);

    const form = $('taskForm');
    const typeHidden = form.querySelector('[name="type"]');
    const apptFields = $('apptFields');
    const enableHidden = { value: String(task.enabled ? 1 : 0) };

    $('typeSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-seg]');
      if (!b) return;
      typeHidden.value = b.dataset.seg;
      [...$('typeSeg').children].forEach((x) => x.classList.toggle('on', x === b));
      apptFields.classList.toggle('hidden', b.dataset.seg !== 'appointment');
    });

    $('slotSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-slot]');
      if (!b) return;
      [...$('slotSeg').children].forEach((x) => x.classList.toggle('on', x === b));
    });

    form.querySelectorAll('[data-preset]').forEach((b) =>
      b.addEventListener('click', () => {
        form.querySelector('[name="interval"]').value = b.dataset.preset;
        form.querySelectorAll('[data-preset]').forEach((x) => x.classList.toggle('on', x === b));
      })
    );

    const enableSeg = $('enableSeg');
    if (enableSeg) {
      enableSeg.addEventListener('click', (e) => {
        const b = e.target.closest('[data-enable]');
        if (!b) return;
        enableHidden.value = b.dataset.enable;
        [...enableSeg.children].forEach((x) => x.classList.toggle('on', x === b));
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      if (!name) return toast('给任务起个名字');
      const interval = Math.max(1, Math.min(8760, parseInt(fd.get('interval'), 10) || 24));
      const slotBtn = $('slotSeg').querySelector('.on');
      const slot = slotBtn ? slotBtn.dataset.slot : 'any';
      const nextDue = fd.get('nextDue') ? new Date(fd.get('nextDue')) : new Date();
      const type = typeHidden.value;
      const appointmentAt = fd.get('appointmentAt') ? new Date(fd.get('appointmentAt')) : null;

      const payload = {
        name,
        category: fd.get('category'),
        type,
        intervalHours: interval,
        slot,
        nextDueAt: nextDue.toISOString(),
        appointmentAt: type === 'appointment' ? appointmentAt && appointmentAt.toISOString() : null,
        hospital: String(fd.get('hospital') || '').trim(),
        enabled: enableHidden.value === '1',
      };

      const existingId = fd.get('id');
      if (existingId) {
        const idx = data.tasks.findIndex((t) => t.id === existingId);
        data.tasks[idx] = { ...data.tasks[idx], ...payload };
      } else {
        data.tasks.push({
          id: L.uid(),
          catId: cat.id,
          lastDoneAt: null,
          doneCount: 0,
          note: '',
          createdAt: new Date().toISOString(),
          ...payload,
        });
      }
      save();
      closeSheet();
      render();
      toast(existingId ? '已保存' : '已添加');
    });
  }

  function templateSheet() {
    const existing = new Set(catTasks().map((t) => t.name));
    const groups = CAT_KEYS.map((k) => ({
      key: k,
      list: TEMPLATES.filter((t) => t.category === k),
    }));
    const rows = groups
      .map(
        (g) => `
        <div class="section-title">${CATS[g.key].name}</div>
        ${g.list
          .map((t) => {
            const added = existing.has(t.name);
            return `<div class="plan-row ${added ? 'off' : ''}" data-act="addTemplate" data-name="${esc(t.name)}">
              <span class="cat-icon" style="background:${CATS[g.key].bg};color:${CATS[g.key].fg};width:36px;height:36px;border-radius:12px">${icon(CATS[g.key].icon)}</span>
              <div class="plan-main">
                <div class="plan-name">${esc(t.name)}</div>
                <div class="plan-meta">${L.intervalLabel(t.hours)} · ${L.slotName(t.slot)}</div>
              </div>
              ${added ? '<span class="hint">已添加</span>' : icon('plus')}
            </div>`;
          })
          .join('')}`
      )
      .join('');
    openSheet(`
      ${sheetHead('选择照料项')}
      <div class="hint-block" style="margin-bottom:8px">点一项就加入计划，可以重复添加不同间隔的同名任务。</div>
      ${rows}
      <button class="btn" data-act="closeSheet" style="margin-top:14px">完成</button>
    `);
  }

  function aboutSheet() {
    openSheet(`
      ${sheetHead('关于')}
      <div class="hint-block">
        <p>这是一个只给自己用的猫咪照料清单。数据保存在本机浏览器里，不会上传到任何服务器。</p>
        <p>护理频率是常见兽医建议的默认值，个体差异很大，请以执业兽医的建议为准。本工具只做记录与提醒清单，不提供任何诊断或用药建议。</p>
        <p>建议每两周导出一次备份，换手机或清理浏览器数据前务必先导出。</p>
        <p>v1.0 · <a href="https://github.com" target="_blank" rel="noopener">GitHub Pages</a></p>
      </div>
    `);
  }

  function confirmSheet(text, onOk) {
    openSheet(`
      ${sheetHead('确认')}
      <div class="hint-block" style="font-size:14px;color:var(--text)">${text}</div>
      <div style="height:18px"></div>
      <button class="btn" id="confirmOk">确定</button>
      <button class="btn btn-ghost" data-act="closeSheet" style="margin-top:10px">取消</button>
    `);
    $('confirmOk').addEventListener('click', () => {
      closeSheet();
      onOk();
    });
  }

  /* ---------------- 动作 ---------------- */
  function complete(id) {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const { task, record } = L.completeTask(data.tasks[idx], new Date());
    data.tasks[idx] = task;
    data.records.push(record);
    save();
    render();
    toast('已完成');
  }

  function skip(id) {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const { task, record } = L.skipTask(data.tasks[idx], new Date());
    data.tasks[idx] = task;
    if (record) data.records.push(record);
    save();
    render();
    toast('已跳过，重新计时');
  }

  function snooze(id) {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const { task } = L.snoozeTask(data.tasks[idx], new Date(), 1);
    data.tasks[idx] = task;
    save();
    render();
    toast('1 小时后再出现');
  }

  function addTemplate(name) {
    const tpl = TEMPLATES.find((t) => t.name === name);
    if (!tpl) return;
    data.tasks.push({
      id: L.uid(),
      catId: activeCat().id,
      name: tpl.name,
      category: tpl.category,
      type: tpl.type,
      intervalHours: tpl.hours,
      slot: tpl.slot,
      nextDueAt: new Date().toISOString(),
      lastDoneAt: null,
      appointmentAt: null,
      hospital: '',
      enabled: true,
      doneCount: 0,
      createdAt: new Date().toISOString(),
    });
    save();
    render();
    toast('已添加 ' + tpl.name);
  }

  function exportBackup() {
    data.settings.backupAt = new Date().toISOString();
    save();
    const payload = JSON.stringify(
      {
        format: 'catcare.backup',
        version: 1,
        exportedAt: new Date().toISOString(),
        data,
      },
      null,
      2
    );
    const blob = new Blob([payload], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    a.href = URL.createObjectURL(blob);
    a.download = `catcare-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    render();
    toast('备份已导出');
  }

  function importBackup(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!parsed || parsed.format !== 'catcare.backup' || !parsed.data) {
          return toast('这不是有效的备份文件');
        }
        if (!Array.isArray(parsed.data.cats) || !Array.isArray(parsed.data.tasks)) {
          return toast('备份内容不完整');
        }
        confirmSheet('导入会覆盖当前所有数据，确定继续吗？', () => {
          const d = parsed.data;
          data = {
            version: 1,
            cats: d.cats || [],
            activeCat: d.activeCat || (d.cats[0] && d.cats[0].id) || null,
            tasks: d.tasks || [],
            records: d.records || [],
            settings: d.settings || { backupAt: null },
          };
          if (!data.cats.length) data = defaultData();
          save();
          render();
          toast('导入成功');
        });
      } catch (e) {
        toast('文件解析失败');
      }
    };
    reader.readAsText(file);
  }

  /* ---------------- 事件 ---------------- */
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const act = el.dataset.act;
    const id = el.dataset.id;

    if (act === 'tab') {
      tab = el.dataset.tab;
      render();
      return;
    }
    if (act === 'catMenu') return catMenuSheet();
    if (act === 'switchCat') {
      data.activeCat = id;
      save();
      closeSheet();
      render();
      return;
    }
    if (act === 'addCat') return catSheet(null);
    if (act === 'editCat') return catSheet(activeCat().id);
    if (act === 'deleteCat') {
      const cat = data.cats.find((c) => c.id === id);
      return confirmSheet(`删除「${esc(cat.name)}」和它的全部记录？`, () => {
        data.cats = data.cats.filter((c) => c.id !== id);
        data.tasks = data.tasks.filter((t) => t.catId !== id);
        data.records = data.records.filter((r) => r.catId !== id);
        if (data.activeCat === id) data.activeCat = data.cats[0] ? data.cats[0].id : null;
        save();
        closeSheet();
        render();
        toast('已删除');
      });
    }
    if (act === 'complete') {
      e.stopPropagation();
      if (el.closest('.sheet')) closeSheet();
      return complete(id);
    }
    if (act === 'skip') {
      closeSheet();
      return skip(id);
    }
    if (act === 'snooze') {
      closeSheet();
      return snooze(id);
    }
    if (act === 'openTask') return taskSheet(id);
    if (act === 'addTask') return templateSheet();
    if (act === 'addTemplate') return addTemplate(el.dataset.name);
    if (act === 'deleteTask') {
      return confirmSheet('删除这个任务？历史记录也会一起删掉。', () => {
        data.tasks = data.tasks.filter((t) => t.id !== id);
        data.records = data.records.filter((r) => r.taskId !== id);
        save();
        closeSheet();
        render();
        toast('已删除');
      });
    }
    if (act === 'filter') {
      planFilter = el.dataset.key;
      render();
      return;
    }
    if (act === 'toggleDone') {
      doneOpen = !doneOpen;
      render();
      return;
    }
    if (act === 'backup') return exportBackup();
    if (act === 'import') return $('importFile').click();
    if (act === 'about') return aboutSheet();
    if (act === 'closeSheet') return closeSheet();
  });

  document.addEventListener('submit', (e) => {
    const f = e.target;

    if (f.id === 'onboardForm') {
      e.preventDefault();
      const name = String(new FormData(f).get('name') || '').trim();
      if (!name) return toast('给猫起个名字');
      const id = L.uid();
      data.cats.push({ id, name, breed: '', birthday: '', weight: '' });
      data.activeCat = id;
      save();
      render();
      return;
    }

    if (f.id === 'catForm') {
      e.preventDefault();
      const fd = new FormData(f);
      const name = String(fd.get('name') || '').trim();
      if (!name) return toast('名字不能为空');
      const payload = {
        name,
        breed: String(fd.get('breed') || '').trim(),
        birthday: String(fd.get('birthday') || ''),
        weight: String(fd.get('weight') || ''),
      };
      const cid = fd.get('id');
      if (cid) {
        const c = data.cats.find((x) => x.id === cid);
        Object.assign(c, payload);
      } else {
        const id = L.uid();
        data.cats.push({ id, ...payload });
        if (!data.activeCat) data.activeCat = id;
      }
      save();
      closeSheet();
      render();
      toast('已保存');
    }
  });

  $('importFile').addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) importBackup(file);
    e.target.value = '';
  });

  /* ---------------- 演示数据（?seed=1） ---------------- */
  function demoData() {
    const now = new Date();
    const at = (dayOffset, h, m) => {
      const d = new Date(now);
      d.setDate(d.getDate() + dayOffset);
      d.setHours(h, m || 0, 0, 0);
      return d.toISOString();
    };
    const catId = 'cat_demo';
    const mk = (name, category, hours, slot, dueOffset, dueH, dueM, extra) =>
      Object.assign(
        {
          id: 't_' + name,
          catId,
          name,
          category,
          type: 'interval',
          intervalHours: hours,
          slot,
          nextDueAt: at(dueOffset, dueH, dueM),
          lastDoneAt: null,
          appointmentAt: null,
          hospital: '',
          enabled: true,
          doneCount: 0,
          createdAt: now.toISOString(),
        },
        extra || {}
      );

    const tasks = [
      mk('加猫粮', 'food', 12, 'morning', 0, 20, 0, { lastDoneAt: at(0, 8, 10) }),
      mk('换水', 'food', 24, 'morning', 1, 8, 0, { lastDoneAt: at(0, 8, 12) }),
      mk('铲猫砂', 'litter', 12, 'evening', 0, 9, 0),
      mk('陪玩', 'env', 24, 'evening', 0, 20, 30),
      mk('体外驱虫', 'medical', 720, 'any', -2, 10, 0),
      mk('年度体检', 'medical', 8760, 'any', 0, 9, 0, { type: 'appointment' }),
      mk('刷牙', 'groom', 72, 'evening', 2, 21, 0),
      mk('剪指甲', 'groom', 336, 'evening', 5, 20, 0),
      mk('称体重', 'monitor', 720, 'any', 20, 10, 0),
    ];
    const records = [
      { id: 'r1', taskId: 't_加猫粮', catId, at: at(0, 8, 10), status: 'done', name: '加猫粮' },
      { id: 'r2', taskId: 't_换水', catId, at: at(0, 8, 12), status: 'done', name: '换水' },
      { id: 'r3', taskId: 't_铲猫砂', catId, at: at(-1, 21, 0), status: 'done', name: '铲猫砂' },
      { id: 'r4', taskId: 't_刷牙', catId, at: at(-2, 21, 5), status: 'done', name: '刷牙' },
      { id: 'r5', taskId: 't_陪玩', catId, at: at(-1, 20, 30), status: 'skipped', name: '陪玩' },
    ];
    return {
      version: 1,
      cats: [{ id: catId, name: '年糕', breed: '英短', birthday: '2024-05-01', weight: '4.8' }],
      activeCat: catId,
      tasks,
      records,
      settings: { backupAt: null, createdAt: now.toISOString() },
    };
  }

  /* ---------------- 启动 ---------------- */
  const params = new URLSearchParams(location.search);
  if (params.get('seed') === '1' && !data.cats.length) {
    data = demoData();
    save();
  }
  if (['today', 'plan', 'records', 'me'].includes(params.get('tab'))) {
    tab = params.get('tab');
  }
  if (!data.activeCat && data.cats.length) data.activeCat = data.cats[0].id;
  render();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
