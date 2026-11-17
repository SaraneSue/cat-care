/* 猫咪照料 · 纯逻辑层（无 DOM 依赖，可在 Node 中测试） */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Logic = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const HOUR = 3600 * 1000;
  const DAY = 24 * HOUR;

  const uid = () =>
    't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  const toDate = (v) => (v instanceof Date ? v : new Date(v));

  function addHours(date, hours) {
    return new Date(toDate(date).getTime() + hours * HOUR);
  }

  function startOfDay(date) {
    const d = new Date(toDate(date));
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function endOfDay(date) {
    const d = new Date(toDate(date));
    d.setHours(23, 59, 59, 999);
    return d;
  }

  function sameDay(a, b) {
    return startOfDay(a).getTime() === startOfDay(b).getTime();
  }

  const UNIT_CN = { day: '天', week: '周', month: '月', year: '年' };

  /** 在 from 基础上加 every 个单位；月末做截断，避免 1/31 + 1 月跳到 3/3 */
  function addInterval(from, every, unit) {
    const d = new Date(toDate(from));
    const n = Math.max(1, parseInt(every, 10) || 1);
    if (unit === 'week') {
      d.setDate(d.getDate() + n * 7);
      return d;
    }
    if (unit === 'month' || unit === 'year') {
      const day = d.getDate();
      d.setDate(1);
      if (unit === 'month') d.setMonth(d.getMonth() + n);
      else d.setFullYear(d.getFullYear() + n);
      const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(day, lastDay));
      return d;
    }
    d.setDate(d.getDate() + n);
    return d;
  }

  /** 频率的中文描述 */
  function scheduleLabel(task) {
    if (task.freqKind === 'daily') {
      const n = Math.max(1, task.timesPerDay || 1);
      return n === 1 ? '每天' : `每天 ${n} 次`;
    }
    const every = Math.max(1, task.every || 1);
    const unit = task.unit || 'day';
    if (every === 1) {
      if (unit === 'day') return '每天';
      return `每${UNIT_CN[unit]}`;
    }
    return `每 ${every} ${UNIT_CN[unit]}`;
  }

  /** 某任务在某天已完成的次数 */
  function doneCountOn(task, records, day) {
    let n = 0;
    for (const r of records) {
      if (r.taskId !== task.id || r.status !== 'done') continue;
      if (sameDay(r.at, day)) n++;
    }
    return n;
  }

  /** 每天 N 次的任务，今天还差几次 */
  function remainToday(task, records, now = new Date()) {
    const need = Math.max(1, task.timesPerDay || 1);
    return Math.max(0, need - doneCountOn(task, records, now));
  }

  /** 下次到期时间（interval 用） */
  function nextDueFor(task, from) {
    if (task.freqKind === 'daily') return endOfDay(from);
    return addInterval(from, task.every || 1, task.unit || 'day');
  }

  /** 任务在「今天页」的归属 */
  function classify(task, records, now = new Date()) {
    if (!task.enabled) return 'disabled';
    if (task.freqKind === 'daily') {
      return remainToday(task, records, now) === 0 ? 'done' : 'today';
    }
    const due = toDate(task.nextDueAt);
    const last = task.lastDoneAt ? toDate(task.lastDoneAt) : null;
    const dayStart = startOfDay(now);
    if (last && last >= dayStart && due.getTime() > now.getTime()) return 'done';
    if (due.getTime() < dayStart.getTime()) return 'overdue';
    if (due.getTime() <= endOfDay(now).getTime()) return 'today';
    return 'upcoming';
  }

  function bucketTasks(tasks, records, now = new Date()) {
    const out = { overdue: [], today: [], done: [] };
    for (const t of tasks) {
      const c = classify(t, records, now);
      if (c === 'overdue') out.overdue.push(t);
      else if (c === 'today') out.today.push(t);
      else if (c === 'done') out.done.push(t);
    }
    const byDue = (a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt);
    out.overdue.sort(byDue);
    const rank = (t) => ({ morning: 0, evening: 1, any: 2 }[t.slot] ?? 2);
    out.today.sort((a, b) => rank(a) - rank(b) || byDue(a, b));
    out.done.sort((a, b) => new Date(b.lastDoneAt || 0) - new Date(a.lastDoneAt || 0));
    return out;
  }

  function completeTask(task, now = new Date()) {
    const at = toDate(now);
    const next = { ...task, lastDoneAt: at.toISOString() };
    if (task.freqKind === 'daily') {
      next.nextDueAt = endOfDay(at).toISOString();
    } else {
      next.nextDueAt = nextDueFor(task, at).toISOString();
    }
    if (task.type === 'appointment') next.appointmentAt = null;
    return {
      task: next,
      record: {
        id: uid(),
        taskId: task.id,
        catId: task.catId,
        at: at.toISOString(),
        status: 'done',
        name: task.name,
      },
    };
  }

  function skipTask(task, now = new Date()) {
    const at = toDate(now);
    const next = {
      ...task,
      nextDueAt: nextDueFor(task, at).toISOString(),
    };
    return {
      task: next,
      record: {
        id: uid(),
        taskId: task.id,
        catId: task.catId,
        at: at.toISOString(),
        status: 'skipped',
        name: task.name,
      },
    };
  }

  function snoozeTask(task, now = new Date(), hours = 3) {
    return {
      task: { ...task, nextDueAt: addHours(now, hours).toISOString() },
      record: null,
    };
  }

  /** 人类可读的到期描述 */
  function dueLabel(task, now = new Date()) {
    const due = toDate(task.nextDueAt);
    const diff = due.getTime() - now.getTime();
    if (diff > 0) {
      const hours = Math.round(diff / HOUR);
      if (hours < 1) return '即将到期';
      if (hours < 24) return `还有 ${hours} 小时`;
      return `还有 ${Math.ceil(diff / DAY)} 天`;
    }
    const past = -diff;
    const hours = Math.floor(past / HOUR);
    if (hours < 1) return '已到期';
    if (hours < 24) return `已逾期 ${hours} 小时`;
    return `已逾期 ${Math.floor(past / DAY)} 天`;
  }

  const pad = (n) => String(n).padStart(2, '0');

  function formatDate(iso, now = new Date()) {
    const d = toDate(iso);
    const t = toDate(now);
    const diffDays = Math.round(
      (startOfDay(d).getTime() - startOfDay(t).getTime()) / DAY
    );
    const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (diffDays === 0) return `今天 ${hm}`;
    if (diffDays === -1) return `昨天 ${hm}`;
    if (diffDays === 1) return `明天 ${hm}`;
    if (d.getFullYear() === t.getFullYear())
      return `${d.getMonth() + 1} 月 ${d.getDate()} 日 ${hm}`;
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${hm}`;
  }

  function formatDay(iso, now = new Date()) {
    const d = toDate(iso);
    const t = toDate(now);
    if (sameDay(d, t)) return '今天';
    if (sameDay(d, new Date(t.getTime() - DAY))) return '昨天';
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }

  function weekStats(records, now = new Date()) {
    const since = startOfDay(now).getTime() - 6 * DAY;
    let done = 0;
    let skipped = 0;
    for (const r of records) {
      if (new Date(r.at).getTime() < since) continue;
      if (r.status === 'done') done++;
      else if (r.status === 'skipped') skipped++;
    }
    const total = done + skipped;
    return { done, skipped, rate: total ? Math.round((done / total) * 100) : 0 };
  }

  function slotName(slot) {
    return slot === 'morning' ? '早上' : slot === 'evening' ? '晚上' : '任意';
  }

  /** 旧数据（intervalHours）迁移成新频率 */
  function migrateTask(t) {
    if (t.freqKind) return t;
    const h = Number(t.intervalHours) || 24;
    const out = { ...t };
    delete out.intervalHours;
    if (h === 12) {
      out.freqKind = 'daily';
      out.timesPerDay = 2;
    } else if (h === 24) {
      out.freqKind = 'daily';
      out.timesPerDay = 1;
    } else if (h === 48) {
      out.freqKind = 'interval';
      out.every = 2;
      out.unit = 'day';
    } else if (h === 168) {
      out.freqKind = 'interval';
      out.every = 1;
      out.unit = 'week';
    } else if (h === 336) {
      out.freqKind = 'interval';
      out.every = 2;
      out.unit = 'week';
    } else if (h === 504) {
      out.freqKind = 'interval';
      out.every = 3;
      out.unit = 'week';
    } else if (h === 720) {
      out.freqKind = 'interval';
      out.every = 1;
      out.unit = 'month';
    } else if (h === 1440) {
      out.freqKind = 'interval';
      out.every = 2;
      out.unit = 'month';
    } else if (h === 2160) {
      out.freqKind = 'interval';
      out.every = 3;
      out.unit = 'month';
    } else if (h === 8760) {
      out.freqKind = 'interval';
      out.every = 1;
      out.unit = 'year';
    } else if (h % 24 === 0) {
      out.freqKind = 'interval';
      out.every = Math.max(1, Math.round(h / 24));
      out.unit = 'day';
    } else {
      out.freqKind = 'daily';
      out.timesPerDay = 1;
    }
    return out;
  }

  return {
    HOUR,
    DAY,
    uid,
    addHours,
    startOfDay,
    endOfDay,
    sameDay,
    addInterval,
    scheduleLabel,
    doneCountOn,
    remainToday,
    nextDueFor,
    classify,
    bucketTasks,
    completeTask,
    skipTask,
    snoozeTask,
    dueLabel,
    formatDate,
    formatDay,
    weekStats,
    slotName,
    migrateTask,
  };
});
