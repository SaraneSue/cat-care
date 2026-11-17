const assert = require('assert');
const L = require('../logic.js');

let pass = 0;
function ok(name, fn) {
  fn();
  pass++;
  console.log('  ✓ ' + name);
}

const at = (s) => new Date(s);
const iso = (d) => new Date(d).toISOString();

console.log('logic tests');

ok('addHours 跨天', () => {
  const d = L.addHours(at('2026-11-17T23:00:00'), 3);
  assert.strictEqual(d.getDate(), 18);
  assert.strictEqual(d.getHours(), 2);
});

ok('classify: 今天到期', () => {
  const now = at('2026-11-17T09:00:00');
  const t = { enabled: true, nextDueAt: iso(at('2026-11-17T20:00:00')) };
  assert.strictEqual(L.classify(t, now), 'today');
});

ok('classify: 昨天到期 → 逾期', () => {
  const now = at('2026-11-17T09:00:00');
  const t = { enabled: true, nextDueAt: iso(at('2026-11-16T20:00:00')) };
  assert.strictEqual(L.classify(t, now), 'overdue');
});

ok('classify: 今天已完成且未到下次 → done', () => {
  const now = at('2026-11-17T09:00:00');
  const t = {
    enabled: true,
    lastDoneAt: iso(at('2026-11-17T08:00:00')),
    nextDueAt: iso(at('2026-11-17T20:00:00')),
  };
  assert.strictEqual(L.classify(t, now), 'done');
});

ok('classify: 今天已完成但 12h 后又到期 → today', () => {
  const now = at('2026-11-17T21:00:00');
  const t = {
    enabled: true,
    lastDoneAt: iso(at('2026-11-17T08:00:00')),
    nextDueAt: iso(at('2026-11-17T20:00:00')),
  };
  assert.strictEqual(L.classify(t, now), 'today');
});

ok('classify: 明天到期 → upcoming', () => {
  const now = at('2026-11-17T09:00:00');
  const t = { enabled: true, nextDueAt: iso(at('2026-11-18T09:00:00')) };
  assert.strictEqual(L.classify(t, now), 'upcoming');
});

ok('classify: 停用 → disabled', () => {
  const t = { enabled: false, nextDueAt: iso(at('2026-11-17T09:00:00')) };
  assert.strictEqual(L.classify(t, new Date()), 'disabled');
});

ok('bucket 排序：逾期按时间、今天按时段', () => {
  const now = at('2026-11-17T09:00:00');
  const tasks = [
    { id: 'a', enabled: true, slot: 'evening', nextDueAt: iso(at('2026-11-17T20:00:00')) },
    { id: 'b', enabled: true, slot: 'morning', nextDueAt: iso(at('2026-11-17T08:00:00')) },
    { id: 'c', enabled: true, slot: 'any', nextDueAt: iso(at('2026-11-16T08:00:00')) },
    { id: 'd', enabled: true, slot: 'any', nextDueAt: iso(at('2026-11-15T08:00:00')) },
  ];
  const b = L.bucketTasks(tasks, now);
  assert.deepStrictEqual(b.today.map((t) => t.id), ['b', 'a']);
  assert.deepStrictEqual(b.overdue.map((t) => t.id), ['d', 'c']);
});

ok('完成：按间隔推进', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', catId: 'c', name: '加粮', type: 'interval', intervalHours: 12, enabled: true, nextDueAt: iso(now) };
  const { task, record } = L.completeTask(t, now);
  assert.strictEqual(record.status, 'done');
  assert.strictEqual(new Date(task.nextDueAt).getHours(), 22);
  assert.strictEqual(task.lastDoneAt, now.toISOString());
});

ok('跳过：从此刻重新计时', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', catId: 'c', name: '刷牙', type: 'interval', intervalHours: 72, enabled: true, nextDueAt: iso(at('2026-11-15T10:00:00')) };
  const { task, record } = L.skipTask(t, now);
  assert.strictEqual(record.status, 'skipped');
  assert.strictEqual(new Date(task.nextDueAt).getTime(), now.getTime() + 72 * L.HOUR);
});

ok('顺延：只推迟，不改间隔', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', intervalHours: 12, nextDueAt: iso(now) };
  const { task } = L.snoozeTask(t, now, 3);
  assert.strictEqual(new Date(task.nextDueAt).getTime(), now.getTime() + 3 * L.HOUR);
});

ok('dueLabel', () => {
  const now = at('2026-11-17T10:00:00');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-17T12:00:00')) }, now), '还有 2 小时');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-20T10:00:00')) }, now), '还有 3 天');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-16T10:00:00')) }, now), '已逾期 1 天');
});

ok('weekStats 只算最近 7 天', () => {
  const now = at('2026-11-17T10:00:00');
  const recs = [
    { at: iso(at('2026-11-17T08:00:00')), status: 'done' },
    { at: iso(at('2026-11-16T08:00:00')), status: 'done' },
    { at: iso(at('2026-11-16T09:00:00')), status: 'skipped' },
    { at: iso(at('2026-10-01T09:00:00')), status: 'done' },
  ];
  const s = L.weekStats(recs, now);
  assert.deepStrictEqual([s.done, s.skipped, s.rate], [2, 1, 67]);
});

ok('intervalLabel', () => {
  assert.strictEqual(L.intervalLabel(12), '每 12 小时');
  assert.strictEqual(L.intervalLabel(24), '每天');
  assert.strictEqual(L.intervalLabel(48), '每 2 天');
  assert.strictEqual(L.intervalLabel(720), '每 30 天');
});

console.log(`\n${pass} passed`);
