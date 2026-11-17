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
const daily = (k = 1) => ({ freqKind: 'daily', timesPerDay: k });
const every = (n, u) => ({ freqKind: 'interval', every: n, unit: u });

console.log('logic tests');

ok('addInterval 天/周', () => {
  assert.strictEqual(L.addInterval(at('2026-11-17T10:00:00'), 3, 'day').getDate(), 20);
  assert.strictEqual(L.addInterval(at('2026-11-17T10:00:00'), 2, 'week').getDate(), 1);
});

ok('addInterval 月末截断', () => {
  const d = L.addInterval(at('2026-01-31T10:00:00'), 1, 'month');
  assert.strictEqual(d.getMonth(), 1); // 2 月
  assert.strictEqual(d.getDate(), 28);
});

ok('addInterval 年', () => {
  const d = L.addInterval(at('2026-11-17T10:00:00'), 1, 'year');
  assert.strictEqual(d.getFullYear(), 2027);
});

ok('scheduleLabel', () => {
  assert.strictEqual(L.scheduleLabel(daily(1)), '每天');
  assert.strictEqual(L.scheduleLabel(daily(2)), '每天 2 次');
  assert.strictEqual(L.scheduleLabel(every(3, 'day')), '每 3 天');
  assert.strictEqual(L.scheduleLabel(every(1, 'week')), '每周');
  assert.strictEqual(L.scheduleLabel(every(2, 'month')), '每 2 月');
  assert.strictEqual(L.scheduleLabel(every(1, 'year')), '每年');
});

ok('classify 每日 2 次：未完成 → today', () => {
  const t = { id: 'a', enabled: true, ...daily(2), nextDueAt: iso(at('2026-11-17T23:59:00')) };
  assert.strictEqual(L.classify(t, [], at('2026-11-17T10:00:00')), 'today');
});

ok('classify 每日 2 次：完成 2 次 → done', () => {
  const t = { id: 'a', enabled: true, ...daily(2) };
  const recs = [
    { taskId: 'a', status: 'done', at: iso(at('2026-11-17T08:00:00')) },
    { taskId: 'a', status: 'done', at: iso(at('2026-11-17T20:00:00')) },
  ];
  assert.strictEqual(L.classify(t, recs, at('2026-11-17T21:00:00')), 'done');
});

ok('classify 每日：昨天的不算进今天', () => {
  const t = { id: 'a', enabled: true, ...daily(1) };
  const recs = [{ taskId: 'a', status: 'done', at: iso(at('2026-11-16T08:00:00')) }];
  assert.strictEqual(L.classify(t, recs, at('2026-11-17T10:00:00')), 'today');
});

ok('classify 间隔：逾期 / 今天 / 未来', () => {
  const now = at('2026-11-17T09:00:00');
  const mk = (d) => ({ id: 'x', enabled: true, ...every(3, 'day'), nextDueAt: iso(at(d)) });
  assert.strictEqual(L.classify(mk('2026-11-16T20:00:00'), [], now), 'overdue');
  assert.strictEqual(L.classify(mk('2026-11-17T20:00:00'), [], now), 'today');
  assert.strictEqual(L.classify(mk('2026-11-18T09:00:00'), [], now), 'upcoming');
});

ok('bucket 排序：逾期按时间、今天按时段', () => {
  const now = at('2026-11-17T09:00:00');
  const tasks = [
    { id: 'a', enabled: true, slot: 'evening', ...every(1, 'day'), nextDueAt: iso(at('2026-11-17T20:00:00')) },
    { id: 'b', enabled: true, slot: 'morning', ...daily(1), nextDueAt: iso(at('2026-11-17T08:00:00')) },
    { id: 'c', enabled: true, slot: 'any', ...every(1, 'day'), nextDueAt: iso(at('2026-11-16T08:00:00')) },
    { id: 'd', enabled: true, slot: 'any', ...every(1, 'day'), nextDueAt: iso(at('2026-11-15T08:00:00')) },
  ];
  const b = L.bucketTasks(tasks, [], now);
  assert.deepStrictEqual(b.today.map((t) => t.id), ['b', 'a']);
  assert.deepStrictEqual(b.overdue.map((t) => t.id), ['d', 'c']);
});

ok('完成：间隔任务按天推进', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', catId: 'c', name: '驱虫', ...every(3, 'day'), enabled: true, nextDueAt: iso(now) };
  const { task, record } = L.completeTask(t, now);
  assert.strictEqual(record.status, 'done');
  assert.strictEqual(new Date(task.nextDueAt).getDate(), 20);
});

ok('完成：每日任务下次到期是当天结束', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', catId: 'c', name: '加粮', ...daily(2), enabled: true };
  const { task } = L.completeTask(t, now);
  assert.strictEqual(new Date(task.nextDueAt).getHours(), 23);
});

ok('跳过：从此刻按周期重新计时', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', catId: 'c', name: '刷牙', ...every(3, 'day'), enabled: true, nextDueAt: iso(at('2026-11-15T10:00:00')) };
  const { task, record } = L.skipTask(t, now);
  assert.strictEqual(record.status, 'skipped');
  assert.strictEqual(new Date(task.nextDueAt).getDate(), 20);
});

ok('顺延：只推迟', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'x', ...every(1, 'day'), nextDueAt: iso(now) };
  const { task } = L.snoozeTask(t, now, 3);
  assert.strictEqual(new Date(task.nextDueAt).getHours(), 13);
});

ok('dueLabel', () => {
  const now = at('2026-11-17T10:00:00');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-17T12:00:00')) }, now), '还有 2 小时');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-20T10:00:00')) }, now), '还有 3 天');
  assert.strictEqual(L.dueLabel({ nextDueAt: iso(at('2026-11-16T10:00:00')) }, now), '已逾期 1 天');
});

ok('remainingToday', () => {
  const now = at('2026-11-17T10:00:00');
  const t = { id: 'a', ...daily(3) };
  const recs = [{ taskId: 'a', status: 'done', at: iso(at('2026-11-17T08:00:00')) }];
  assert.strictEqual(L.remainToday(t, recs, now), 2);
});

ok('migrateTask 旧数据', () => {
  assert.deepStrictEqual(
    (({ freqKind, timesPerDay }) => ({ freqKind, timesPerDay }))(L.migrateTask({ intervalHours: 12 })),
    { freqKind: 'daily', timesPerDay: 2 }
  );
  assert.deepStrictEqual(
    (({ freqKind, every, unit }) => ({ freqKind, every, unit }))(L.migrateTask({ intervalHours: 48 })),
    { freqKind: 'interval', every: 2, unit: 'day' }
  );
  assert.deepStrictEqual(
    (({ freqKind, every, unit }) => ({ freqKind, every, unit }))(L.migrateTask({ intervalHours: 8760 })),
    { freqKind: 'interval', every: 1, unit: 'year' }
  );
  assert.deepStrictEqual(
    (({ freqKind, every, unit }) => ({ freqKind, every, unit }))(L.migrateTask({ intervalHours: 720 })),
    { freqKind: 'interval', every: 1, unit: 'month' }
  );
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

console.log(`\n${pass} passed`);
