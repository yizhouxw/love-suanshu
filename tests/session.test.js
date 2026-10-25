'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const KEY = 'little-he-arithmetic-v1';
const initial = () => new Map([[KEY, JSON.stringify({ prefs: { grade: 1, term: 1, minutes: 10, count: 10, sound: false }, sessions: [], mistakes: [], active: null })]]);

// A minimal DOM and controllable clock exercise session state without a browser
// dependency. Real rendering and interactions are checked separately in the UI.
function harness(store = initial(), initialTime = 1792886400000) {
  let now = initialTime, nextId = 0;
  const nodes = new Map(), events = {}, intervals = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', textContent: '', value: '', dataset: {}, hidden: false, disabled: false, open: false, listeners: {}, classList: { toggle() {} }, setAttribute() {}, removeAttribute() {}, focus() {}, close() { this.open = false; }, showModal() { this.open = true; }, addEventListener(name, fn) { this.listeners[name] = fn; } });
    return nodes.get(selector);
  };
  const document = { title: '', querySelector: node, querySelectorAll: () => [], addEventListener: (name, fn) => { events[name] = fn; } };
  class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const sandbox = { document, Date: Clock, console, location: { hash: '' }, history: { replaceState() {} }, localStorage: { getItem: k => store.get(k) || null, setItem: (k, v) => store.set(k, v) }, setInterval(fn) { intervals.set(++nextId, fn); return nextId; }, clearInterval: id => intervals.delete(id), setTimeout() {}, clearTimeout() {}, URL, Blob };
  sandbox.window = sandbox; sandbox.scrollTo = () => {}; sandbox.addEventListener = () => {};
  const context = vm.createContext(sandbox);
  for (const filename of ['curriculum.js', 'math.js', 'app.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', filename), 'utf8'), context);
  const click = (dataset = {}) => events.click({ target: { closest: () => ({ dataset, matches: () => false }) } });
  const advance = milliseconds => { now += milliseconds; for (const fn of Array.from(intervals.values())) fn(); };
  const start = (mode = 'practice') => {
    if (mode === 'game') { node('#game-topic').value = '1a-five'; click({ action: 'start-game' }); return; }
    node('#topic-select').value = '1a-five'; click({ action: 'setup' });
    node('#duration').value = '10'; node('#question-count').value = '10'; node('#question-count').listeners.change();
    node('#setup-form').listeners.submit({ preventDefault() {} });
  };
  const input = (index, value) => node('#session-dialog').listeners.input({ target: { dataset: { answer: String(index) }, value } });
  return { node, click, start, advance, input, store, state: () => JSON.parse(store.get(KEY)), now: () => now };
}

test('wall-clock expiry submits once, saves results, and displays a rest reminder', () => {
  const h = harness(); h.start(); h.advance(600001);
  assert.equal(h.state().active, null); assert.equal(h.state().sessions.length, 1);
  assert.equal(h.state().sessions[0].reason, 'timeout'); assert.equal(h.state().sessions[0].elapsed, 600000);
  assert.equal(h.node('#result-dialog').open, true); assert.match(h.node('#result-title').textContent, /时间到/);
  h.advance(600000); assert.equal(h.state().sessions.length, 1);
});

test('pause excludes elapsed wall time and resume retains the remaining duration', () => {
  const h = harness(); h.start(); h.advance(120000); h.node('#pause-session').listeners.click();
  assert.equal(h.state().active.remaining, 480000); h.advance(1200000);
  assert.equal(h.state().sessions.length, 0); assert.equal(h.node('#timer').textContent, '08:00');
  h.node('#pause-session').listeners.click(); h.advance(480001);
  assert.equal(h.state().sessions[0].elapsed, 600000);
});

test('refresh restores skipped inputs and original deadline; expired refresh submits', () => {
  const first = harness(); first.start(); first.input(3, '999');
  const second = harness(first.store, first.now() + 120000);
  assert.equal(second.node('#session-dialog').open, true); assert.equal(second.node('#timer').textContent, '08:00');
  assert.match(second.node('#session-body').innerHTML, /value="999"/);
  const third = harness(second.store, first.now() + 600001);
  assert.equal(third.state().sessions.length, 1); assert.equal(third.state().sessions[0].reason, 'timeout');
  assert.equal(third.state().mistakes.length, 1);
});

test('wrong answers are collected, equivalent correct answers remove them on retry', () => {
  const h = harness(); h.start(); h.input(0, '999'); h.node('#finish-session').listeners.click();
  assert.equal(h.state().mistakes.length, 1);
  h.click({ action: 'retry-mistakes' }); const answer = h.state().active.questions[0].answer;
  h.input(0, answer); h.node('#finish-session').listeners.click();
  assert.equal(h.state().mistakes.length, 0); assert.equal(h.state().sessions[0].correct, 1);
});

test('game locks first answers, advances ten rounds, and saves stars', () => {
  const h = harness(); h.start('game');
  for (let i = 0; i < 10; i++) {
    const state = h.state().active, answer = state.questions[i].answer;
    h.click({ choice: answer }); h.click({ choice: '999' });
    assert.equal(h.state().active.answers[i], answer);
    h.click({ action: 'game-next' });
  }
  assert.equal(h.state().sessions[0].correct, 10); assert.equal(h.state().sessions[0].mode, 'game');
  assert.equal(h.state().active, null);
});
