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

  const SLOT_ORDER = { morning: 0, evening: 1, any: 2 };
  const slotRank = (slot) => (slot in SLOT_ORDER ? SLOT_ORDER[slot] : 2);

  /** 任务在「今天页」的归属 */
  function classify(task, now = new Date()) {
    if (!task.enabled) return 'disabled';
    const due = toDate(task.nextDueAt);
    const last = task.lastDoneAt ? toDate(task.lastDoneAt) : null;
    const dayStart = startOfDay(now);
    if (last && last >= dayStart && due.getTime() > now.getTime()) return 'done';
    if (due.getTime() < dayStart.getTime()) return 'overdue';
    if (due.getTime() <= endOfDay(now).getTime()) return 'today';
    return 'upcoming';
  }

  function bucketTasks(tasks, now = new Date()) {
    const out = { overdue: [], today: [], done: [] };
    for (const t of tasks) {
      const c = classify(t, now);
      if (c === 'overdue') out.overdue.push(t);
      else if (c === 'today') out.today.push(t);
      else if (c === 'done') out.done.push(t);
    }
    out.overdue.sort((a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt));
    out.today.sort(
      (a, b) =>
        slotRank(a.slot) - slotRank(b.slot) ||
        new Date(a.nextDueAt) - new Date(b.nextDueAt)
    );
    out.done.sort((a, b) => new Date(b.lastDoneAt) - new Date(a.lastDoneAt));
    return out;
  }

  function completeTask(task, now = new Date()) {
    const at = toDate(now);
    const next = {
      ...task,
      lastDoneAt: at.toISOString(),
      nextDueAt: addHours(at, task.intervalHours).toISOString(),
      appointmentAt: task.type === 'appointment' ? null : task.appointmentAt || null,
    };
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
    return {
      task: { ...task, nextDueAt: addHours(at, task.intervalHours).toISOString() },
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
    const y = new Date(t.getTime() - DAY);
    if (sameDay(d, y)) return '昨天';
    return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  }

  /** 最近 7 天完成率 */
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

  function intervalLabel(hours) {
    if (!hours) return '';
    if (hours === 24) return '每天';
    if (hours % 24 === 0) return `每 ${hours / 24} 天`;
    return `每 ${hours} 小时`;
  }

  return {
    HOUR,
    DAY,
    uid,
    addHours,
    startOfDay,
    endOfDay,
    sameDay,
    slotRank,
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
    intervalLabel,
  };
});
