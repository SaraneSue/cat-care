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
    ['加猫粮', 'food', { d: 2 }, 'morning'],
    ['换水', 'food', { d: 1 }, 'morning'],
    ['洗水碗', 'food', { n: 2, u: 'day' }, 'evening'],
    ['饮水机清洗', 'food', { n: 1, u: 'week' }, 'evening'],
    ['饮水机滤芯', 'food', { n: 1, u: 'month' }, 'any'],
    ['零食 / 保健品', 'food', { d: 1 }, 'evening'],
    ['换粮过渡', 'food', { d: 1 }, 'morning'],
    ['铲猫砂', 'litter', { d: 2 }, 'morning'],
    ['补猫砂', 'litter', { n: 1, u: 'week' }, 'any'],
    ['换猫砂 / 洗盆', 'litter', { n: 2, u: 'week' }, 'any'],
    ['排便排尿观察', 'litter', { d: 1 }, 'evening'],
    ['梳毛', 'groom', { n: 3, u: 'day' }, 'evening'],
    ['剪指甲', 'groom', { n: 2, u: 'week' }, 'evening'],
    ['刷牙', 'groom', { n: 3, u: 'day' }, 'evening'],
    ['洗耳', 'groom', { n: 1, u: 'week' }, 'evening'],
    ['眼部清洁', 'groom', { n: 2, u: 'day' }, 'morning'],
    ['下巴清洁', 'groom', { n: 1, u: 'week' }, 'evening'],
    ['洗澡', 'groom', { n: 2, u: 'month' }, 'any'],
    ['剃脚毛', 'groom', { n: 2, u: 'month' }, 'any'],
    ['猫三联（幼猫）', 'medical', { n: 28, u: 'day' }, 'any', 'appointment'],
    ['猫三联（加强）', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['狂犬疫苗', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['体内驱虫', 'medical', { n: 3, u: 'month' }, 'any'],
    ['体外驱虫', 'medical', { n: 1, u: 'month' }, 'any'],
    ['年度体检', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['洗牙', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['心脏超声', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['绝育', 'medical', { n: 1, u: 'year' }, 'any', 'appointment'],
    ['用药 / 复诊', 'medical', { d: 1 }, 'any'],
    ['保险续费', 'medical', { n: 1, u: 'year' }, 'any'],
    ['称体重', 'monitor', { n: 1, u: 'month' }, 'any'],
    ['饮水观察', 'monitor', { d: 1 }, 'evening'],
    ['尿团观察', 'monitor', { d: 1 }, 'evening'],
    ['猫窝清洗', 'env', { n: 3, u: 'week' }, 'any'],
    ['猫爬架清洁', 'env', { n: 2, u: 'month' }, 'any'],
    ['玩具清洁', 'env', { n: 1, u: 'month' }, 'any'],
    ['全屋吸毛', 'env', { n: 1, u: 'week' }, 'any'],
    ['猫包清洁', 'env', { n: 1, u: 'month' }, 'any'],
    ['陪玩', 'env', { d: 1 }, 'evening'],
  ].map(([name, category, freq, slot, type]) => ({
    name,
    category,
    slot,
    type: type || 'interval',
    freqKind: freq.d ? 'daily' : 'interval',
    timesPerDay: freq.d || 1,
    every: freq.n || 1,
    unit: freq.u || 'day',
    metric: name === '称体重' ? 'weight' : null,
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
  let needsSave = false;
  let data = load();
  let tab = 'today';
  let planFilter = 'all';
  let planScope = 'all';
  let tplScope = 'family';
  let planManage = false;
  const selectedTasks = new Set();
  let doneOpen = false;
  let toastTimer = null;

  function defaultData() {
    return {
      version: 1,
      families: [{ id: 'fam', name: '我的家' }],
      activeFamily: 'fam',
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
      if (!Array.isArray(d.families) || !d.families.length) {
        const fid = (d.family && d.family.id) || 'fam';
        const fname = (d.family && d.family.name) || '我的家';
        d.families = [{ id: fid, name: fname }];
        needsSave = true;
      }
      delete d.family;
      if (!d.activeFamily || !d.families.some((f) => f.id === d.activeFamily)) {
        d.activeFamily = d.families[0].id;
        needsSave = true;
      }
      if (d.cats.some((c) => !c.familyId)) {
        d.cats = d.cats.map((c) => ({ ...c, familyId: c.familyId || d.activeFamily }));
        needsSave = true;
      }
      if (d.tasks.some((t) => !t.scope || (t.scope === 'family' && !t.familyId))) {
        d.tasks = d.tasks.map((t) => {
          const shared = ['food', 'litter', 'env'].includes(t.category);
          const scope = t.scope || (shared ? 'family' : 'cat');
          const cat = d.cats.find((c) => c.id === t.catId);
          return {
            ...t,
            scope,
            catId: scope === 'family' ? null : t.catId,
            familyId:
              scope === 'family' ? t.familyId || d.activeFamily : (cat ? cat.familyId : d.activeFamily),
          };
        });
        needsSave = true;
      }
      if (d.records.some((r) => !r.familyId)) {
        d.records = d.records.map((r) => {
          const t = d.tasks.find((x) => x.id === r.taskId);
          const c = d.cats.find((x) => x.id === r.catId);
          return {
            ...r,
            familyId: r.familyId || (t && t.familyId) || (c && c.familyId) || d.activeFamily,
          };
        });
        needsSave = true;
      }
      if (d.tasks.some((t) => t.metric === undefined)) {
        needsSave = true;
        d.tasks = d.tasks.map((t) => ({
          ...t,
          metric: t.metric || (t.category === 'monitor' && /体重/.test(t.name) ? 'weight' : null),
        }));
      }
      if (d.cats.some((c) => !Array.isArray(c.weights))) {
        needsSave = true;
        d.cats = d.cats.map((c) => ({ ...c, weights: Array.isArray(c.weights) ? c.weights : [] }));
      }
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

  const activeFamily = () =>
    data.families.find((f) => f.id === data.activeFamily) || data.families[0];
  const familyName = () => (activeFamily() || {}).name || '我的家';
  const familyId = () => (activeFamily() || {}).id;
  const familyCats = () => data.cats.filter((c) => c.familyId === familyId());

  function currentTasks() {
    const ids = new Set(familyCats().map((c) => c.id));
    return data.tasks.filter((t) =>
      t.scope === 'family' ? t.familyId === familyId() : ids.has(t.catId)
    );
  }

  function scopeLabel(t) {
    if (t.scope === 'family') return '全家';
    const c = data.cats.find((x) => x.id === t.catId);
    return c ? c.name : '未分配';
  }

  function visiblePlanTasks() {
    let list = currentTasks();
    if (planScope === 'family') list = list.filter((t) => t.scope === 'family');
    else if (planScope !== 'all')
      list = list.filter((t) => t.scope === 'cat' && t.catId === planScope);
    if (planFilter !== 'all') list = list.filter((t) => t.category === planFilter);
    return list;
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
    const top = $('topbar');
    top.innerHTML = `
      <div class="brand">${icon('cat')}<span>猫咪照料</span></div>
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
    const scrollTop = v.scrollTop;
    const finish = () => {
      if (scrollTop) v.scrollTop = scrollTop;
    };
    if (!data.cats.length) {
      v.innerHTML = onboardingHTML();
      return;
    }
    if (tab === 'today') v.innerHTML = todayHTML();
    else if (tab === 'plan') v.innerHTML = planHTML();
    else if (tab === 'records') v.innerHTML = recordsHTML();
    else v.innerHTML = meHTML();
    finish();
  }

  /* ---------------- 渲染：今天 ---------------- */
  function taskMeta(t, records) {
    if (t.type === 'appointment') {
      if (t.appointmentAt) {
        return `预约 ${L.formatDate(t.appointmentAt)}${t.hospital ? ' · ' + t.hospital : ''}`;
      }
      return `该预约了 · ${L.scheduleLabel(t)}`;
    }
    return `${L.scheduleLabel(t)} · ${L.slotName(t.slot)}`;
  }

  function taskRow(t, cls, records, showTag) {
    const c = CATS[t.category] || CATS.food;
    const daily = t.freqKind === 'daily';
    const need = Math.max(1, t.timesPerDay || 1);
    const done = daily ? L.doneCountOn(t, records, new Date()) : 0;
    return `
      <div class="task ${cls}" data-act="taskDetail" data-id="${t.id}">
        <span class="cat-icon" style="background:${c.bg};color:${c.fg}">${icon(c.icon)}</span>
        <div class="task-main">
          <div class="task-name">${esc(t.name)}${showTag ? `<span class="scope-tag">${esc(scopeLabel(t))}</span>` : ''}</div>
          <div class="task-meta">${esc(taskMeta(t, records))}</div>
        </div>
        ${daily && need > 1 ? `<span class="count">${done}/${need}</span>` : ''}
        <button class="check ${cls === 'done' ? 'on' : ''}" data-act="complete" data-id="${t.id}" aria-label="完成">${icon('check')}</button>
      </div>`;
  }

  function todayHTML() {
    const now = new Date();
    const recs = data.records;
    const stateOf = (t) => L.classify(t, recs, now);
    const slotRank = (t) => ({ morning: 0, evening: 1, any: 2 }[t.slot] ?? 2);
    const bySlot = (a, b) =>
      slotRank(a) - slotRank(b) || new Date(a.nextDueAt) - new Date(b.nextDueAt);

    const enabled = currentTasks().filter((t) => t.enabled);
    const overdue = enabled
      .filter((t) => stateOf(t) === 'overdue')
      .sort((a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt));
    const done = enabled
      .filter((t) => stateOf(t) === 'done')
      .sort((a, b) => new Date(b.lastDoneAt || 0) - new Date(a.lastDoneAt || 0));
    const familyToday = enabled
      .filter((t) => t.scope === 'family' && stateOf(t) === 'today')
      .sort(bySlot);
    const perCat = familyCats().map((cat) => ({
      cat,
      list: enabled
        .filter((t) => t.scope === 'cat' && t.catId === cat.id && stateOf(t) === 'today')
        .sort(bySlot),
    }));
    const todayCount = familyToday.length + perCat.reduce((n, g) => n + g.list.length, 0);
    const total = overdue.length + todayCount + done.length;
    const pct = total ? Math.round((done.length / total) * 100) : 0;
    const dateStr = `${now.getMonth() + 1} 月 ${now.getDate()} 日`;

    if (!total) {
      const noCats = familyCats().length === 0;
      return `
        <div class="empty">
          ${icon('cat')}
          <div class="empty-title">${noCats ? '这个家庭还没有猫咪' : '今天没有要做的'}</div>
          <div class="empty-sub">${noCats ? '先添加一只猫，再给它安排照料计划' : '去「计划」里加几项，或者明天再来看看'}</div>
          ${noCats ? '<button class="btn" data-act="addCat" style="max-width:200px;margin-top:16px">添加猫咪</button>' : ''}
        </div>`;
    }

    const doneBlock = done.length
      ? `<div class="section-title" data-act="toggleDone">
           已完成 · ${done.length}
           <span class="count">${doneOpen ? '收起' : '展开'}</span>
         </div>
         <div class="${doneOpen ? '' : 'hidden'}">
           ${done.map((t) => taskRow(t, 'done', recs, true)).join('')}
         </div>`
      : '';

    const catSections = perCat
      .map(
        ({ cat, list }) => `
        <div class="cat-section-head">
          <span class="avatar xs">${icon('cat')}</span>
          <span class="cat-section-name">${esc(cat.name)}</span>
          <span class="cat-section-count">${list.length ? `${list.length} 项` : '今天没有安排'}</span>
        </div>
        ${list.map((t) => taskRow(t, '', recs, false)).join('')}`
      )
      .join('');

    return `
      <div class="hero">
        <div class="hero-top"><span>今天</span><span>${dateStr}</span></div>
        <div class="hero-count">${done.length} <small>/ ${total}</small></div>
        <div class="hero-sub">${esc(familyName())} · ${familyCats().length} 只猫 · 已完成 ${done.length} 件</div>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <span class="hero-cat">${icon('cat')}</span>
      </div>
      ${
        overdue.length
          ? `<div class="section-title danger">已逾期 · ${overdue.length}</div>
             ${overdue.map((t) => taskRow(t, 'overdue', recs, true)).join('')}`
          : ''
      }
      ${
        familyToday.length
          ? `<div class="section-title">全家 · ${familyToday.length}</div>
             ${familyToday.map((t) => taskRow(t, '', recs, false)).join('')}`
          : ''
      }
      ${catSections}
      ${doneBlock}
      ${
        todayCount === 0 && overdue.length === 0
          ? '<div class="hint-block">今天的事都做完了，厉害。</div>'
          : ''
      }
    `;
  }

  /* ---------------- 渲染：计划 ---------------- */
  function planHTML() {
    const SHORT = {
      food: '饮食',
      litter: '排泄',
      groom: '清洁',
      medical: '医疗',
      monitor: '监测',
      env: '环境',
    };
    const scopes = [['all', '全部'], ['family', '全家']].concat(
      familyCats().map((c) => [c.id, c.name])
    );
    if (!scopes.some(([k]) => k === planScope)) planScope = 'all';

    const scopeChips = scopes
      .map(
        ([k, label]) =>
          `<button class="chip ${planScope === k ? 'on' : ''}" data-act="scopeFilter" data-key="${k}">${esc(label)}</button>`
      )
      .join('');
    const catChips = [['all', '全部'], ...CAT_KEYS.map((k) => [k, SHORT[k]])]
      .map(
        ([k, label]) =>
          `<button class="chip ${planFilter === k ? 'on' : ''}" data-act="filter" data-key="${k}">${label}</button>`
      )
      .join('');

    const visible = visiblePlanTasks();
    const sections = [];
    if (planScope === 'all') {
      const fam = visible.filter((t) => t.scope === 'family');
      if (fam.length) sections.push({ title: '全家', list: fam });
      familyCats().forEach((c) => {
        const list = visible.filter((t) => t.scope === 'cat' && t.catId === c.id);
        if (list.length) sections.push({ title: c.name, list });
      });
    } else {
      CAT_KEYS.forEach((k) => {
        const list = visible.filter((t) => t.category === k);
        if (list.length) sections.push({ title: CATS[k].name, list });
      });
    }

    const rowHTML = (t, off) => {
      const c = CATS[t.category] || CATS.food;
      const last = t.lastDoneAt ? `上次 ${L.formatDay(t.lastDoneAt)}` : '从未记录';
      const picked = selectedTasks.has(t.id);
      return `
        <div class="plan-row ${off ? 'off' : ''} ${picked ? 'picked' : ''}" data-act="${planManage ? 'toggleSelect' : 'taskEdit'}" data-id="${t.id}">
          ${planManage ? `<span class="pick ${picked ? 'on' : ''}">${picked ? icon('check') : ''}</span>` : ''}
          <span class="cat-icon" style="background:${c.bg};color:${c.fg};width:36px;height:36px;border-radius:12px">${icon(c.icon)}</span>
          <div class="plan-main">
            <div class="plan-name">${esc(t.name)}${off ? ' · 已停用' : ''}</div>
            <div class="plan-meta">${L.scheduleLabel(t)} · ${last}</div>
          </div>
          ${planManage ? '' : icon('chev', 'chev')}
        </div>`;
    };

    const body = sections
      .map((sec) => {
        const on = sec.list.filter((t) => t.enabled);
        const off = sec.list.filter((t) => !t.enabled);
        return `
          <div class="plan-group">
            <div class="section-title">${esc(sec.title)}</div>
            ${on.map((t) => rowHTML(t, false)).join('')}
            ${off.map((t) => rowHTML(t, true)).join('')}
          </div>`;
      })
      .join('');

    return `
      <div class="chips">${scopeChips}</div>
      <div class="chips" style="padding-top:0">${catChips}</div>
      ${
        visible.length
          ? `<div class="plan-tools">
              <span class="plan-hint">${planManage ? `已选 ${selectedTasks.size} 项` : '点任务修改计划 · 右下角 ＋ 添加照料项'}</span>
              <button class="link-btn" data-act="toggleManage">${planManage ? '完成' : '管理'}</button>
            </div>`
          : ''
      }
      ${
        visible.length
          ? body
          : `<div class="empty">${icon('cat')}<div class="empty-title">这里还没有计划</div><div class="empty-sub">点右下角的 ＋ 从模板里挑</div></div>`
      }
      ${planManage ? '<div style="height:80px"></div>' : ''}
      ${
        planManage
          ? `<div class="manage-bar">
              <button class="mb-btn" data-act="selectAll">${selectedTasks.size === visible.length && visible.length ? '取消全选' : '全选'}</button>
              <button class="mb-btn strong" data-act="deleteSelected" ${selectedTasks.size ? '' : 'disabled'}>删除所选${selectedTasks.size ? ` (${selectedTasks.size})` : ''}</button>
              <button class="mb-btn danger" data-act="clearAll">清空全部</button>
            </div>`
          : visible.length
          ? `<button class="fab" data-act="addTask" aria-label="添加照料项">${icon('plus')}</button>`
          : `<button class="fab" data-act="addTask" aria-label="添加照料项">${icon('plus')}</button>`
      }
    `;
  }

  /* ---------------- 渲染：记录 ---------------- */
  function recordsHTML() {
    const recs = data.records
      .filter((r) => r.familyId === familyId())
      .slice()
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
            const task = data.tasks.find((t) => t.id === r.taskId);
            const name = r.name || (task || {}).name || '已删除';
            const amount = r.amount && task && isWeightTask(task) ? ` · ${r.amount} kg` : '';
            const tag = task ? scopeLabel(task) : '—';
            return `<div class="rec">
              <span class="rec-time">${hh}:${mm}</span>
              <span class="rec-name">${esc(name)}${amount}</span>
              <span class="scope-tag">${esc(tag)}</span>
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
    const lastBackup = data.settings.backupAt
      ? `${L.formatDay(data.settings.backupAt)}备份`
      : '还没备份过';

    const catRows = familyCats()
      .map((c) => {
        const w = weightOf(c);
        const sub = [c.breed, w ? `${w} kg` : '未记录体重'].filter(Boolean).join(' · ');
        return `<button class="list-row" data-act="editCat" data-id="${c.id}">
          <span class="avatar sm">${icon('cat')}</span>
          <span class="grow">
            <span class="row-name">${esc(c.name)}</span>
            <span class="row-sub">${esc(sub)}</span>
          </span>
          ${miniWeightChart(c)}
          ${icon('chev')}
        </button>`;
      })
      .join('');

    return `
      <div class="me-card" data-act="familyMenuSheet">
        <span class="avatar">${icon('home')}</span>
        <div class="grow">
          <div class="me-name">${esc(familyName())}</div>
          <div class="me-sub">${familyCats().length} 只猫</div>
        </div>
        ${icon('chev', 'chev')}
      </div>

      <div class="section-title">猫咪</div>
      ${catRows || '<div class="hint-block">还没有猫咪</div>'}
      <button class="list-row" data-act="addCat">
        <span class="grow">添加猫咪</span>${icon('plus')}
      </button>

      <div class="section-title">数据</div>
      <button class="list-row" data-act="backup">
        <span class="grow">导出备份</span><span class="hint">${lastBackup}</span>${icon('down')}
      </button>
      <button class="list-row" data-act="import">
        <span class="grow">导入恢复</span>${icon('up')}
      </button>

      <div class="section-title">其他</div>
      <button class="list-row" data-act="about">
        <span class="grow">关于与免责声明</span>${icon('chev')}
      </button>
      <div class="hint-block">v1.0 · 数据只存在这台设备上，记得偶尔导出备份。</div>
    `;
  }

  function familyMenuSheet() {
    const rows = data.families
      .map(
        (f) => `<button class="list-row" data-act="switchFamily" data-id="${f.id}">
          <span class="grow">${esc(f.name)}</span>
          ${f.id === data.activeFamily ? '<span class="hint">当前</span>' : ''}
          ${icon('chev')}
        </button>`
      )
      .join('');
    openSheet(`
      ${sheetHead('家庭')}
      ${rows}
      <button class="list-row" data-act="addFamily"><span class="grow">添加家庭</span>${icon('plus')}</button>
      <button class="list-row" data-act="manageFamily"><span class="grow">管理「${esc(familyName())}」</span>${icon('chev')}</button>
    `);
  }

  function addFamilySheet() {
    openSheet(`
      ${sheetHead('添加家庭')}
      <div class="field">
        <label class="label">家庭名称</label>
        <input class="input" id="newFamilyName" placeholder="比如：爸妈家" />
      </div>
      <button class="btn" id="createFamily">创建</button>
    `);
    $('createFamily').addEventListener('click', () => {
      const name = $('newFamilyName').value.trim();
      if (!name) return toast('给家庭起个名字');
      const id = L.uid();
      data.families.push({ id, name });
      data.activeFamily = id;
      planScope = 'all';
      planManage = false;
      selectedTasks.clear();
      save();
      closeSheet();
      render();
      toast('已添加家庭');
      setTimeout(() => {
        if (!data.cats.some((c) => c.familyId === id)) catSheet(null);
      }, 320);
    });
  }

  function familySheet() {
    const cats = familyCats()
      .map(
        (c) => `<button class="list-row" data-act="editCat" data-id="${c.id}">
          <span class="grow">${esc(c.name)}</span>${icon('chev')}
        </button>`
      )
      .join('');
    openSheet(`
      ${sheetHead('管理家庭')}
      <div class="field">
        <label class="label">家庭名称</label>
        <input class="input" id="familyInput" value="${esc(familyName())}" />
      </div>
      <button class="btn" id="saveFamily">保存名称</button>
      <div class="section-title">猫咪</div>
      ${cats || '<div class="hint-block">这个家庭还没有猫咪</div>'}
      <button class="list-row" data-act="addCat"><span class="grow">添加猫咪</span>${icon('plus')}</button>
    `);
    $('saveFamily').addEventListener('click', () => {
      const v = $('familyInput').value.trim();
      if (!v) return toast('给家庭起个名字');
      activeFamily().name = v;
      save();
      closeSheet();
      render();
      toast('已保存');
    });
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

  let closeTimer = null;

  function openSheet(html) {
    clearTimeout(closeTimer);
    sheetRoot.innerHTML = `<div class="sheet-mask" data-act="closeSheet"></div><div class="sheet">${html}</div>`;
    sheetRoot.hidden = false;
    requestAnimationFrame(() => sheetRoot.classList.add('open'));
  }

  function closeSheet() {
    sheetRoot.classList.remove('open');
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      sheetRoot.hidden = true;
      sheetRoot.innerHTML = '';
    }, 220);
  }

  function sheetHead(title) {
    return `<div class="sheet-head"><div class="sheet-title">${title}</div><button class="sheet-close" data-act="closeSheet">×</button></div>`;
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
        ${
          cat
            ? `<div class="field">
                <label class="label">体重变化</label>
                ${
                  (cat.weights || []).length >= 2
                    ? `<div class="wchart-box">${weightChart(cat)}</div>`
                    : `<div class="hint-block">${
                        (cat.weights || []).length
                          ? '再填写一次体重并保存，就能看到变化曲线。'
                          : '填写体重并保存后，这里会记录每次变化。'
                      }</div>`
                }
              </div>`
            : ''
        }
        ${cat ? `<input type="hidden" name="catId" value="${cat.id}" />` : ''}
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

  const weightOf = (cat) => {
    const ws = (cat && cat.weights) || [];
    return ws.length ? ws[ws.length - 1].kg : cat && cat.weight ? Number(cat.weight) : null;
  };

  function isWeightTask(t) {
    return t.metric === 'weight' || (t.category === 'monitor' && /体重/.test(t.name || ''));
  }

  function weightChart(cat) {
    const ws = ((cat && cat.weights) || [])
      .slice()
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .slice(-12);
    if (ws.length < 2) return '';
    const w = 300;
    const h = 96;
    const vals = ws.map((x) => x.kg);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (max - min < 0.2) {
      min -= 0.1;
      max += 0.1;
    }
    const lo = min - (max - min) * 0.15;
    const hi = max + (max - min) * 0.15;
    const padL = 6;
    const padR = 6;
    const padT = 10;
    const padB = 16;
    const pts = ws.map((x, i) => {
      const px = padL + (i * (w - padL - padR)) / (ws.length - 1);
      const py = h - padB - ((x.kg - lo) / (hi - lo)) * (h - padT - padB);
      return [Math.round(px), Math.round(py)];
    });
    const line = pts.map((pt) => pt.join(',')).join(' ');
    const area = `${padL},${h - padB} ${line} ${w - padR},${h - padB}`;
    const dots = pts
      .map(
        (pt, i) =>
          `<circle cx="${pt[0]}" cy="${pt[1]}" r="${i === pts.length - 1 ? 3.4 : 2.2}" fill="${i === pts.length - 1 ? '#2F9C7C' : '#9BD6C3'}"/>`
      )
      .join('');
    return `<svg class="wchart" viewBox="0 0 ${w} ${h}" role="img" aria-label="体重变化">
      <polygon points="${area}" fill="rgba(47,156,124,.10)"/>
      <polyline points="${line}" fill="none" stroke="#2F9C7C" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${dots}
      <text x="${pts[0][0]}" y="${h - 4}" font-size="10" fill="#B49C8F">${ws[0].kg}</text>
      <text x="${w - padR}" y="${h - 4}" font-size="10" fill="#2F9C7C" text-anchor="end">${ws[ws.length - 1].kg} kg</text>
    </svg>`;
  }

  function miniWeightChart(cat) {
    const ws = ((cat.weights || [])
      .slice()
      .sort((a, b) => new Date(a.at) - new Date(b.at))
      .slice(-12));
    if (ws.length < 2) return '';
    const vals = ws.map((x) => x.kg);
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (max - min < 0.2) {
      min -= 0.1;
      max += 0.1;
    }
    const w = 100;
    const h = 36;
    const pad = 4;
    const pts = ws.map((x, i) => {
      const px = pad + (i * (w - pad * 2)) / (ws.length - 1);
      const py = h - pad - ((x.kg - min) / (max - min)) * (h - pad * 2);
      return [Math.round(px * 10) / 10, Math.round(py * 10) / 10];
    });
    const last = pts[pts.length - 1];
    return `<svg class="minichart" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts
      .map((pt) => pt.join(','))
      .join(' ')}" fill="none" stroke="#2F9C7C" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${last[0]}" cy="${last[1]}" r="2.8" fill="#2F9C7C"/></svg>`;
  }

  function weightSheet(task, onDone, catId) {
    const cat = catId ? data.cats.find((c) => c.id === catId) : activeCat();
    const lw = weightOf(cat);
    openSheet(`
      ${sheetHead('记录体重')}
      <div class="hint-block" style="margin-bottom:12px">${esc(task ? task.name : '体重')} · ${L.formatDate(new Date())}</div>
      <div class="field">
        <label class="label">体重（kg）</label>
        <input class="input" type="number" step="0.1" min="0" id="weightInput" value="${lw || ''}" placeholder="4.8" inputmode="decimal" />
      </div>
      <button class="btn" id="weightSave">保存并完成</button>
      <button class="btn btn-ghost" style="margin-top:10px" data-act="closeSheet">取消</button>
    `);
    $('weightSave').addEventListener('click', () => {
      const v = parseFloat($('weightInput').value);
      closeSheet();
      onDone(Number.isFinite(v) && v > 0 ? Math.round(v * 10) / 10 : null);
    });
    setTimeout(() => {
      const el = $('weightInput');
      if (el) el.focus();
    }, 300);
  }

  function doComplete(id, kg) {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const { task, record } = L.completeTask(data.tasks[idx], new Date());
    if (kg) record.amount = kg;
    record.familyId =
      task.familyId ||
      (task.catId && (data.cats.find((c) => c.id === task.catId) || {}).familyId) ||
      familyId();
    data.tasks[idx] = task;
    data.records.push(record);
    if (kg) {
      const cat = data.cats.find((c) => c.id === task.catId);
      if (cat) {
        cat.weights = cat.weights || [];
        cat.weights.push({ at: record.at, kg });
        cat.weight = String(kg);
      }
    }
    save();
    render();
    toast(kg ? `已记录 ${kg} kg` : '已完成');
  }

  /* ---------- 详情：只看计划 + 记录 ---------- */
  function taskDetailSheet(id) {
    const t = data.tasks.find((x) => x.id === id);
    if (!t) return;
    const isDaily = t.freqKind === 'daily';
    const need = Math.max(1, t.timesPerDay || 1);
    const doneToday = L.doneCountOn(t, data.records, new Date());
    const todayRecs = data.records
      .filter((r) => r.taskId === t.id && r.status === 'done' && L.sameDay(r.at, new Date()))
      .sort((a, b) => new Date(a.at) - new Date(b.at));
    const hist = data.records
      .filter((r) => r.taskId === t.id)
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .slice(0, 6);

    const row = (k, v) => `<div class="info-row"><span>${k}</span><span>${v}</span></div>`;
    const planRows = [
      row('归属', scopeLabel(t)),
      row('频率', L.scheduleLabel(t)),
      row('时段', L.slotName(t.slot)),
      row('上次照料', t.lastDoneAt ? L.formatDate(t.lastDoneAt) : '还没有记录'),
      isDaily ? row('今日进度', `${doneToday} / ${need} 次`) : row('下次到期', L.dueLabel(t)),
    ];
    if (t.appointmentAt) {
      planRows.push(row('预约', `${L.formatDate(t.appointmentAt)}${t.hospital ? ' · ' + esc(t.hospital) : ''}`));
    }

    openSheet(`
      ${sheetHead(esc(t.name))}
      ${
        isDaily
          ? `<div class="today-count">
              <span class="today-num">${doneToday}<small>/${need}</small></span>
              <span class="today-label">今天已记录 ${doneToday} 次${doneToday >= need ? '，已完成' : ''}</span>
            </div>
             ${
               todayRecs.length
                 ? `<div class="time-chips">${todayRecs
                     .map((r) => `<span class="time-chip">${new Date(r.at).getHours().toString().padStart(2, '0')}:${new Date(r.at).getMinutes().toString().padStart(2, '0')}</span>`)
                     .join('')}</div>`
                 : ''
             }`
          : ''
      }
      <div class="info-card">${planRows.join('')}</div>
      <div class="btn-row" style="margin-top:16px">
        <button class="btn" data-act="complete" data-id="${t.id}">${isDaily ? '记录一次' : '完成打卡'}</button>
        ${
          isDaily
            ? ''
            : `<button class="btn btn-ghost" data-act="skip" data-id="${t.id}">跳过</button>
               <button class="btn btn-ghost" data-act="snooze" data-id="${t.id}">推迟</button>`
        }
      </div>
      ${
        hist.length
          ? `<div class="section-title" style="margin-top:6px">最近记录</div>
             <div class="hist-list">${hist
               .map((r) => {
                 const d = new Date(r.at);
                 const hh = `${d.getHours()}`.padStart(2, '0');
                 const mm = `${d.getMinutes()}`.padStart(2, '0');
                 const amount = r.amount && isWeightTask(t) ? ` · ${r.amount} kg` : '';
                 return `<div class="hist-row"><span>${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}${amount}</span><span class="${r.status}">${r.status === 'done' ? '完成' : '跳过'}</span></div>`;
               })
               .join('')}</div>`
          : ''
      }
      <div class="hint-block" style="text-align:center;padding-top:14px">要改频率或时段，去「计划」页点这一项</div>
    `);
  }

  /* ---------- 编辑：只改计划 ---------- */
  function taskSheet(id) {
    const cat = familyCats()[0] || activeCat() || data.cats[0] || { id: null };
    const task =
      data.tasks.find((t) => t.id === id) || {
        id: null,
        catId: cat.id,
        name: '',
        category: 'food',
        type: 'interval',
        freqKind: 'daily',
        timesPerDay: 1,
        every: 3,
        unit: 'day',
        slot: 'any',
        nextDueAt: new Date().toISOString(),
        lastDoneAt: null,
        appointmentAt: null,
        hospital: '',
        enabled: true,
        metric: null,
      };
    const isNew = !task.id;
    const catRows = CAT_KEYS.map(
      (k) =>
        `<option value="${k}" ${task.category === k ? 'selected' : ''}>${CATS[k].name}</option>`
    ).join('');
    const scopeOf = task.id
      ? task.scope === 'family'
        ? 'family'
        : task.catId
      : familyCats()[0]
      ? familyCats()[0].id
      : 'family';

    const sel =
      task.freqKind === 'daily'
        ? 'daily'
        : task.every === 1 && task.unit === 'week'
        ? 'weekly'
        : task.every === 1 && task.unit === 'month'
        ? 'monthly'
        : task.every === 1 && task.unit === 'year'
        ? 'yearly'
        : 'custom';
    const unitOptions = [
      ['day', '天'],
      ['week', '周'],
      ['month', '月'],
      ['year', '年'],
    ]
      .map(([u, label]) => `<option value="${u}" ${task.unit === u ? 'selected' : ''}>${label}</option>`)
      .join('');
    const radio = (val, label, tail) => `
      <label class="freq-row ${sel === val ? 'on' : ''}">
        <input type="radio" name="freq" value="${val}" ${sel === val ? 'checked' : ''} />
        <span class="freq-name">${label}</span>
        ${tail || ''}
      </label>`;

    openSheet(`
      ${sheetHead(isNew ? '新建照料项' : '编辑计划')}
      <form id="taskForm">
        <input type="hidden" name="taskId" value="${task.id || ''}" />
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
          <label class="label">归属</label>
          <div class="seg" id="scopeSeg">
            <button type="button" class="${scopeOf === 'family' ? 'on' : ''}" data-scope="family">全家</button>
            ${familyCats()
              .map(
                (c) =>
                  `<button type="button" class="${scopeOf === c.id ? 'on' : ''}" data-scope="${c.id}">${esc(c.name)}</button>`
              )
              .join('')}
          </div>
          <div class="hint-block" style="padding-top:6px">「全家」的任务所有猫共享一条记录</div>
        </div>

        <div class="field">
          <label class="label">频率</label>
          <div class="freq-list" id="freqList">
            ${radio('daily', '每天', `<span class="freq-tail"><input class="mini" type="number" name="times" min="1" max="20" value="${task.timesPerDay || 1}" ${sel === 'daily' ? '' : 'disabled'} /> 次</span>`)}
            ${radio('weekly', '每周')}
            ${radio('monthly', '每月')}
            ${radio('yearly', '每年')}
            ${radio('custom', '自定义', `<span class="freq-tail">每 <input class="mini" type="number" name="every" min="1" max="365" value="${task.every || 1}" ${sel === 'custom' ? '' : 'disabled'} /> <select name="unit" class="mini-select" ${sel === 'custom' ? '' : 'disabled'}>${unitOptions}</select></span>`)}
          </div>
        </div>

        <div class="field">
          <label class="label">时段</label>
          <div class="seg" id="slotSeg">
            ${['morning', 'evening', 'any']
              .map(
                (sl) =>
                  `<button type="button" class="${task.slot === sl ? 'on' : ''}" data-slot="${sl}">${L.slotName(sl)}</button>`
              )
              .join('')}
          </div>
        </div>

        <div class="field">
          <label class="label">上次照料（留空表示还没做过）</label>
          <input class="input" type="datetime-local" name="lastDone" value="${task.lastDoneAt ? toLocalInput(task.lastDoneAt) : ''}" />
          <div class="hint-block" style="padding-top:6px">填了上次时间，会按频率自动算下次；留空则从现在开始算。</div>
        </div>

        <div class="field">
          <label class="label">类型</label>
          <div class="seg" id="typeSeg">
            <button type="button" class="${task.type === 'interval' ? 'on' : ''}" data-seg="interval">周期任务</button>
            <button type="button" class="${task.type === 'appointment' ? 'on' : ''}" data-seg="appointment">预约任务</button>
          </div>
        </div>

        <div class="field ${task.type === 'appointment' ? '' : 'hidden'}" id="apptFields">
          <label class="label">预约时间（可选）</label>
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
    const freqList = $('freqList');
    const enableHidden = { value: String(task.enabled ? 1 : 0) };

    const syncFreq = () => {
      const val = freqList.querySelector('input[name="freq"]:checked').value;
      [...freqList.querySelectorAll('.freq-row')].forEach((row) => {
        const on = row.querySelector('input[name="freq"]').value === val;
        row.classList.toggle('on', on);
        row.querySelectorAll('input:not([name="freq"]), select').forEach((el) => {
          el.disabled = !on;
        });
      });
    };
    freqList.addEventListener('change', syncFreq);

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

    $('scopeSeg').addEventListener('click', (e) => {
      const b = e.target.closest('[data-scope]');
      if (!b) return;
      [...$('scopeSeg').children].forEach((x) => x.classList.toggle('on', x === b));
    });

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

      const freq = fd.get('freq');
      let freqKind = 'interval';
      let timesPerDay = 1;
      let every = 1;
      let unit = 'day';
      if (freq === 'daily') {
        freqKind = 'daily';
        timesPerDay = Math.max(1, Math.min(20, parseInt(fd.get('times'), 10) || 1));
      } else if (freq === 'weekly') {
        every = 1;
        unit = 'week';
      } else if (freq === 'monthly') {
        every = 1;
        unit = 'month';
      } else if (freq === 'yearly') {
        every = 1;
        unit = 'year';
      } else {
        every = Math.max(1, Math.min(365, parseInt(fd.get('every'), 10) || 1));
        unit = fd.get('unit') || 'day';
      }

      const slotBtn = $('slotSeg').querySelector('.on');
      const slot = slotBtn ? slotBtn.dataset.slot : 'any';
      const lastRaw = fd.get('lastDone');
      const last = lastRaw ? new Date(lastRaw) : null;
      const type = typeHidden.value;
      const appointmentRaw = fd.get('appointmentAt');
      const appointmentAt = appointmentRaw ? new Date(appointmentRaw) : null;
      const now = new Date();

      const metric =
        name === '称体重' || (fd.get('category') === 'monitor' && /体重/.test(name))
          ? 'weight'
          : null;
      const scopeBtn = $('scopeSeg') ? $('scopeSeg').querySelector('.on') : null;
      const scopeVal = scopeBtn ? scopeBtn.dataset.scope : 'family';
      if (metric && scopeVal === 'family') return toast('体重需要指定一只猫');

      const payload = {
        name,
        category: fd.get('category'),
        type,
        freqKind,
        timesPerDay,
        every,
        unit,
        slot,
        lastDoneAt: last ? last.toISOString() : null,
        appointmentAt:
          type === 'appointment' && appointmentAt ? appointmentAt.toISOString() : null,
        hospital: String(fd.get('hospital') || '').trim(),
        enabled: enableHidden.value === '1',
        metric,
        scope: scopeVal === 'family' ? 'family' : 'cat',
        catId: scopeVal === 'family' ? null : scopeVal,
        familyId:
          scopeVal === 'family'
            ? familyId()
            : (data.cats.find((c) => c.id === scopeVal) || {}).familyId || familyId(),
      };

      if (freqKind === 'daily') {
        payload.nextDueAt = L.endOfDay(now).toISOString();
      } else if (last) {
        payload.nextDueAt = L.nextDueFor(payload, last).toISOString();
      } else {
        payload.nextDueAt = now.toISOString();
      }

      const existingId = fd.get('taskId');
      if (existingId) {
        const idx = data.tasks.findIndex((t) => t.id === existingId);
        data.tasks[idx] = { ...data.tasks[idx], ...payload };
      } else {
        data.tasks.push({
          id: L.uid(),
          doneCount: 0,
          note: '',
          createdAt: now.toISOString(),
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
    const scopedTasks =
      tplScope === 'family'
        ? data.tasks.filter((t) => t.scope === 'family' && t.familyId === familyId())
        : data.tasks.filter((t) => t.scope === 'cat' && t.catId === tplScope);
    const existing = new Set(scopedTasks.map((t) => t.name));
    const scopes = [['family', '全家']].concat(familyCats().map((c) => [c.id, c.name]));
    if (!scopes.some(([k]) => k === tplScope)) tplScope = 'family';
    const scopeChips = scopes
      .map(
        ([k, label]) =>
          `<button class="chip ${tplScope === k ? 'on' : ''}" data-act="tplScope" data-key="${k}">${esc(label)}</button>`
      )
      .join('');
    const targetName =
      tplScope === 'family'
        ? '全家'
        : (familyCats().find((c) => c.id === tplScope) || {}).name || '全家';

    const rows = CAT_KEYS.map((k) => {
      const list = TEMPLATES.filter((t) => t.category === k);
      return `
        <div class="section-title">${CATS[k].name}</div>
        ${list
          .map((t) => {
            const added = existing.has(t.name);
            return `<div class="plan-row ${added ? 'off' : ''}" data-act="addTemplate" data-name="${esc(t.name)}">
              <span class="cat-icon" style="background:${CATS[k].bg};color:${CATS[k].fg};width:36px;height:36px;border-radius:12px">${icon(CATS[k].icon)}</span>
              <div class="plan-main">
                <div class="plan-name">${esc(t.name)}</div>
                <div class="plan-meta">${L.scheduleLabel(t)} · ${L.slotName(t.slot)}</div>
              </div>
              ${added ? '<span class="hint">已添加</span>' : icon('plus')}
            </div>`;
          })
          .join('')}`;
    }).join('');

    openSheet(`
      ${sheetHead('选择照料项')}
      <div class="chips">${scopeChips}</div>
      <div class="hint-block" style="margin-bottom:8px">加到「${esc(targetName)}」，点一项即加入</div>
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
    const t = data.tasks.find((x) => x.id === id);
    if (!t) return;
    if (isWeightTask(t)) {
      weightSheet(t, (kg) => doComplete(id, kg));
      return;
    }
    doComplete(id, null);
  }

  function skip(id) {
    const idx = data.tasks.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const { task, record } = L.skipTask(data.tasks[idx], new Date());
    data.tasks[idx] = task;
    if (record) {
      record.familyId =
        task.familyId ||
        (task.catId && (data.cats.find((c) => c.id === task.catId) || {}).familyId) ||
        familyId();
      data.records.push(record);
    }
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
    let target = tplScope;
    if (target === 'family' && tpl.metric === 'weight') {
      toast('称体重需要指定一只猫');
      return;
    }
    if (target !== 'family' && !familyCats().some((c) => c.id === target)) target = 'family';
    const now = new Date();
    data.tasks.push({
      id: L.uid(),
      catId: target === 'family' ? null : target,
      scope: target === 'family' ? 'family' : 'cat',
      familyId:
        target === 'family'
          ? familyId()
          : (familyCats().find((c) => c.id === target) || {}).familyId || familyId(),
      name: tpl.name,
      category: tpl.category,
      type: tpl.type,
      freqKind: tpl.freqKind,
      timesPerDay: tpl.timesPerDay,
      every: tpl.every,
      unit: tpl.unit,
      slot: tpl.slot,
      nextDueAt:
        tpl.freqKind === 'daily' ? L.endOfDay(now).toISOString() : now.toISOString(),
      lastDoneAt: null,
      appointmentAt: null,
      hospital: '',
      enabled: true,
      doneCount: 0,
      createdAt: now.toISOString(),
      metric: tpl.metric || null,
    });
    save();
    render();
    templateSheet();
    const where =
      target === 'family'
        ? '全家'
        : (familyCats().find((c) => c.id === target) || {}).name || '全家';
    toast('已添加 ' + tpl.name + ' · ' + where);
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
          if (!Array.isArray(data.families) || !data.families.length) {
            const f = data.family || {};
            data.families = [{ id: f.id || 'fam', name: f.name || '我的家' }];
          }
          delete data.family;
          if (!data.activeFamily || !data.families.some((f) => f.id === data.activeFamily)) {
            data.activeFamily = data.families[0].id;
          }
          data.cats = (data.cats || []).map((c) => ({
            ...c,
            familyId: c.familyId || data.activeFamily,
            weights: Array.isArray(c.weights) ? c.weights : [],
          }));
          data.tasks = (data.tasks || []).map((t) => {
            const shared = ['food', 'litter', 'env'].includes(t.category);
            const scope = t.scope || (shared ? 'family' : 'cat');
            const cat = data.cats.find((c) => c.id === t.catId);
            return {
              ...t,
              scope,
              catId: scope === 'family' ? null : t.catId,
              familyId:
                scope === 'family'
                  ? t.familyId || data.activeFamily
                  : cat
                  ? cat.familyId
                  : data.activeFamily,
              metric:
                t.metric !== undefined
                  ? t.metric
                  : t.category === 'monitor' && /体重/.test(t.name)
                  ? 'weight'
                  : null,
            };
          });
          data.records = (data.records || []).map((r) => {
            const t = data.tasks.find((x) => x.id === r.taskId);
            const c = data.cats.find((x) => x.id === r.catId);
            return {
              ...r,
              familyId: r.familyId || (t && t.familyId) || (c && c.familyId) || data.activeFamily,
            };
          });
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
      planManage = false;
      selectedTasks.clear();
      render();
      $('view').scrollTop = 0;
      return;
    }
    if (act === 'familyMenuSheet') return familyMenuSheet();
    if (act === 'manageFamily') return familySheet();
    if (act === 'addFamily') return addFamilySheet();
    if (act === 'switchFamily') {
      data.activeFamily = id;
      planScope = 'all';
      planManage = false;
      selectedTasks.clear();
      save();
      closeSheet();
      render();
      return;
    }
    if (act === 'logWeightCat') {
      const cid = id;
      weightSheet(
        null,
        (kg) => {
          if (!kg) return;
          const c = data.cats.find((x) => x.id === cid);
          if (!c) return;
          c.weights = c.weights || [];
          c.weights.push({ at: new Date().toISOString(), kg });
          c.weight = String(kg);
          save();
          render();
          toast(`已记录 ${kg} kg`);
        },
        cid
      );
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
    if (act === 'editCat') return catSheet(id || (activeCat() || {}).id);
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
    if (act === 'taskDetail') return taskDetailSheet(id);
    if (act === 'taskEdit') return taskSheet(id);
    if (act === 'addTask') return templateSheet();
    if (act === 'addTemplate') return addTemplate(el.dataset.name);
    if (act === 'tplScope') {
      tplScope = el.dataset.key;
      templateSheet();
      return;
    }
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
    if (act === 'toggleManage') {
      planManage = !planManage;
      selectedTasks.clear();
      render();
      return;
    }
    if (act === 'toggleSelect') {
      if (selectedTasks.has(id)) selectedTasks.delete(id);
      else selectedTasks.add(id);
      render();
      return;
    }
    if (act === 'scopeFilter') {
      planScope = el.dataset.key;
      selectedTasks.clear();
      render();
      return;
    }
    if (act === 'selectAll') {
      const list = visiblePlanTasks();
      if (selectedTasks.size === list.length) selectedTasks.clear();
      else list.forEach((t) => selectedTasks.add(t.id));
      render();
      return;
    }
    if (act === 'deleteSelected') {
      const ids = [...selectedTasks];
      if (!ids.length) return;
      return confirmSheet(`删除选中的 ${ids.length} 个任务？相关记录也会一起删掉。`, () => {
        const set = new Set(ids);
        data.tasks = data.tasks.filter((t) => !set.has(t.id));
        data.records = data.records.filter((r) => !set.has(r.taskId));
        selectedTasks.clear();
        planManage = false;
        save();
        render();
        toast('已删除 ' + ids.length + ' 项');
      });
    }
    if (act === 'clearAll') {
      const list = data.tasks;
      if (!list.length) return;
      return confirmSheet(`清空「${esc(familyName())}」的全部 ${list.length} 个计划？记录也会一起删掉。`, () => {
        const set = new Set(list.map((t) => t.id));
        data.tasks = data.tasks.filter((t) => !set.has(t.id));
        data.records = data.records.filter((r) => !set.has(r.taskId));
        selectedTasks.clear();
        planManage = false;
        save();
        render();
        toast('已清空计划');
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
    const formId = f.getAttribute('id');

    if (formId === 'onboardForm') {
      e.preventDefault();
      const name = String(new FormData(f).get('name') || '').trim();
      if (!name) return toast('给猫起个名字');
      const id = L.uid();
      data.cats.push({
        id,
        name,
        breed: '',
        birthday: '',
        weight: '',
        familyId: familyId(),
        weights: [],
      });
      data.activeCat = id;
      save();
      render();
      return;
    }

    if (formId === 'catForm') {
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
      const cid = fd.get('catId');
      const w = parseFloat(payload.weight);
      const validW = Number.isFinite(w) && w > 0;
      const at = new Date().toISOString();
      if (cid) {
        const c = data.cats.find((x) => x.id === cid);
        const changed = validW && Number(c.weight) !== w;
        Object.assign(c, payload);
        if (changed) {
          c.weights = c.weights || [];
          c.weights.push({ at, kg: w });
        }
      } else {
        const id = L.uid();
        data.cats.push({
          id,
          familyId: familyId(),
          weights: validW ? [{ at, kg: w }] : [],
          ...payload,
        });
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
    const famId = 'fam_demo';
    const catA = 'cat_demo';
    const catB = 'cat_demo2';
    const mk = (name, category, freq, slot, scope, catId, extra) =>
      Object.assign(
        {
          id: 't_' + name,
          catId: scope === 'family' ? null : catId || catA,
          scope,
          familyId: famId,
          name,
          category,
          type: 'interval',
          freqKind: freq.d ? 'daily' : 'interval',
          timesPerDay: freq.d || 1,
          every: freq.n || 1,
          unit: freq.u || 'day',
          slot,
          nextDueAt: at(0, 23, 59),
          lastDoneAt: null,
          appointmentAt: null,
          hospital: '',
          enabled: true,
          doneCount: 0,
          createdAt: now.toISOString(),
          metric: name === '称体重' ? 'weight' : null,
        },
        extra || {}
      );

    const tasks = [
      mk('加猫粮', 'food', { d: 2 }, 'morning', 'family', null, { lastDoneAt: at(0, 8, 10) }),
      mk('换水', 'food', { d: 1 }, 'morning', 'family', null, { lastDoneAt: at(0, 8, 12) }),
      mk('铲猫砂', 'litter', { d: 2 }, 'evening', 'family'),
      mk('陪玩', 'env', { d: 1 }, 'evening', 'family'),
      mk('体外驱虫', 'medical', { n: 1, u: 'month' }, 'any', 'cat', catA, {
        nextDueAt: at(-2, 10, 0),
        lastDoneAt: at(-32, 10, 0),
      }),
      mk('年度体检', 'medical', { n: 1, u: 'year' }, 'any', 'cat', catA, {
        type: 'appointment',
        nextDueAt: at(0, 9, 0),
        lastDoneAt: at(-365, 9, 0),
      }),
      mk('刷牙', 'groom', { n: 3, u: 'day' }, 'evening', 'cat', catA, {
        nextDueAt: at(2, 21, 0),
        lastDoneAt: at(-1, 21, 0),
      }),
      mk('剪指甲', 'groom', { n: 2, u: 'week' }, 'evening', 'cat', catB),
      mk('称体重', 'monitor', { n: 1, u: 'month' }, 'any', 'cat', catB, {
        nextDueAt: at(20, 10, 0),
        lastDoneAt: at(-10, 10, 0),
      }),
      mk('猫窝清洗', 'env', { n: 3, u: 'week' }, 'any', 'family'),
    ];
    const records = [
      { id: 'r1', taskId: 't_加猫粮', catId: null, familyId: famId, at: at(0, 8, 10), status: 'done', name: '加猫粮' },
      { id: 'r2', taskId: 't_换水', catId: null, familyId: famId, at: at(0, 8, 12), status: 'done', name: '换水' },
      { id: 'r3', taskId: 't_铲猫砂', catId: null, familyId: famId, at: at(-1, 21, 0), status: 'done', name: '铲猫砂' },
      { id: 'r4', taskId: 't_刷牙', catId: catA, familyId: famId, at: at(-1, 21, 5), status: 'done', name: '刷牙' },
      { id: 'r5', taskId: 't_陪玩', catId: null, familyId: famId, at: at(-1, 20, 30), status: 'skipped', name: '陪玩' },
    ];
    return {
      version: 1,
      families: [{ id: famId, name: '我的家' }],
      activeFamily: famId,
      cats: [
        {
          id: catA,
          familyId: famId,
          name: '年糕',
          breed: '英短',
          birthday: '2024-05-01',
          weight: '4.8',
          weights: [
            { at: at(-150, 10, 0), kg: 4.4 },
            { at: at(-120, 10, 0), kg: 4.5 },
            { at: at(-90, 10, 0), kg: 4.6 },
            { at: at(-60, 10, 0), kg: 4.9 },
            { at: at(-30, 10, 0), kg: 4.9 },
            { at: at(-2, 10, 0), kg: 4.8 },
          ],
        },
        {
          id: catB,
          familyId: famId,
          name: '布丁',
          breed: '橘猫',
          birthday: '2025-03-10',
          weight: '3.2',
          weights: [
            { at: at(-120, 10, 0), kg: 2.8 },
            { at: at(-60, 10, 0), kg: 3.0 },
            { at: at(-10, 10, 0), kg: 3.2 },
          ],
        },
      ],
      activeCat: catA,
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
  if (needsSave) save();










  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
})();
