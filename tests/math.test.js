'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../src/math.js');
const { books } = require('../src/curriculum.js');

// A separate expression parser checks generated arithmetic without eval.
function evaluate(expression) {
  const tokens = expression.replace(/(\d+)\/(\d+)/g, '($1/$2)').replaceAll('−', '-').replaceAll('×', '*').replaceAll('÷', '/').match(/\d+(?:\.\d+)?|[+*/()-]/g);
  let i = 0;
  function atom() { if (tokens[i] === '(') { i++; const result = sum(); assert.equal(tokens[i++], ')'); return result; } return Number(tokens[i++]); }
  function product() { let n = atom(); while (['*', '/'].includes(tokens[i])) { const op = tokens[i++], b = atom(); n = op === '*' ? n * b : n / b; } return n; }
  function sum() { let n = product(); while (['+', '-'].includes(tokens[i])) { const op = tokens[i++], b = product(); n = op === '+' ? n + b : n - b; } return n; }
  return sum();
}

test('12 semesters have unique topics and can generate valid batches and choices', () => {
  assert.equal(books.length, 12);
  const ids = new Set();
  for (const book of books) for (const topic of book.topics) {
    assert.ok(!ids.has(topic.id)); ids.add(topic.id);
    const questions = M.batch(topic, 100);
    assert.equal(questions.length, 100);
    for (const q of questions) {
      assert.ok(q.text && q.hint && q.answer);
      assert.equal(q.topicId, topic.id);
      assert.ok(M.isCorrect(q.answer, q.answer));
      assert.ok(!M.isCorrect('', q.answer));
      const choices = M.choices(q);
      assert.equal(choices.filter(c => M.isCorrect(c, q.answer)).length, 1);
      assert.equal(new Set(choices).size, choices.length);
      if (['addsub', 'carry', 'borrow', 'chain', 'oral100', 'multiply', 'divide', 'mixed', 'decimal', 'fraction'].includes(q.kind)) {
        assert.ok(Math.abs(evaluate(q.text) - M.numeric(q.answer)) < 1e-7, `${q.text} = ${q.answer}`);
        assert.ok(M.numeric(q.answer) >= 0);
      }
      if (q.kind === 'compare') {
        const [a, b] = q.text.split(' ○ ').map(Number);
        assert.equal(q.answer, a > b ? '>' : a < b ? '<' : '=');
      }
      if (q.kind === 'remainder') {
        const [a, b] = q.text.split(' ÷ ').map(Number), [quotient, remainder] = q.answer.split('余').map(Number);
        assert.equal(quotient * b + remainder, a);
        assert.ok(remainder > 0 && remainder < b);
      }
      if (topic.options.noCarry) {
        const [a, op, b] = q.text.split(' ');
        assert.ok(op === '+' ? Number(a) % 10 + Number(b) % 10 < 10 : Number(a) % 10 >= Number(b) % 10);
      }
      if (q.kind === 'carry') { const [a, b] = q.text.split(' + ').map(Number); assert.ok(a < 10 && b < 10 && a + b > 10 && a + b <= 20); }
      if (q.kind === 'borrow') { const [a, b] = q.text.split(' − ').map(Number); assert.ok(a % 10 < b && a > 10 && a < 20); }
    }
  }
});

test('grading supports equivalent fractions, decimals, zero and full-width input', () => {
  for (const [input, answer] of [['2/4', '1/2'], ['0.5', '1/2'], ['０．５０', '1/2'], [' ０ ', '0'], ['6/3', '2'], ['＞', '>'], ['3…1', '3余1']]) assert.ok(M.isCorrect(input, answer), `${input} should equal ${answer}`);
  for (const input of ['', ' ', 'NaN', 'Infinity', '1/0', '1/2/3', '0x10', '2+2', '<script>']) assert.ok(!M.isCorrect(input, '0'));
  assert.ok(!M.isCorrect('0.333', '1/3'));
  assert.ok(!M.isCorrect('0.3333333333333333', '1/3'));
  assert.ok(!M.isCorrect('98000.00001', '98000'));
  assert.ok(!M.isCorrect('3余2', '3余1'));
  assert.ok(!M.isCorrect('=', '>'));
});

test('small topic pools still produce 100 questions without hanging', () => {
  const questions = M.batch({ id: 'small', kind: 'addsub', options: { max: 1 } }, 100);
  assert.equal(questions.length, 100);
  assert.ok(questions.every(q => M.numeric(q.answer) <= 1));
});
