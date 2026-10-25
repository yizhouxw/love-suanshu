(function (root) {
  'use strict';
  const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = list => list[random(0, list.length - 1)];
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const fraction = (n, d) => { const g = gcd(n, d); return d / g === 1 ? String(n / g) : `${n / g}/${d / g}`; };
  const decimal = n => String(Math.round((n + Number.EPSILON) * 10000) / 10000);
  function makeQuestion(topic) {
    const o = topic.options || {};
    const kind = topic.kind;
    let a, b, c, d, answer, text, hint, symbol;
    switch (kind) {
      case 'addsub': {
        const max = o.max || 20;
        symbol = pick(['+', '−']);
        do {
          if (symbol === '+') { a = random(o.min || 0, max); b = random(0, max - a); }
          else { a = random(o.min || 0, max); b = random(0, a); }
        } while (o.noCarry && (symbol === '+' ? a % 10 + b % 10 >= 10 : a % 10 < b % 10));
        answer = symbol === '+' ? a + b : a - b;
        text = `${a} ${symbol} ${b}`;
        hint = symbol === '+' ? '把两个数合起来；满十要进一。' : '从第一个数里去掉第二个数；可以用加法检查。';
        break;
      }
      case 'carry':
        a = random(2, 9); b = random(11 - a, 9); answer = a + b; text = `${a} + ${b}`;
        hint = `先把${a}凑成10：${b}可以分成${10 - a}和${b - (10 - a)}，再算10加剩下的数。`; break;
      case 'borrow':
        a = random(11, 18); b = random(a - 9, 9); answer = a - b; text = `${a} − ${b}`;
        hint = `想一想：${b}加几等于${a}？也可以先用10减${b}，再加${a - 10}。`; break;
      case 'chain': {
        const max = o.max || 10, first = pick(['+', '−']), second = pick(['+', '−']);
        a = random(0, max); b = random(0, first === '+' ? max - a : a);
        const intermediate = first === '+' ? a + b : a - b;
        c = random(0, second === '+' ? max - intermediate : intermediate);
        text = `${a} ${first} ${b} ${second} ${c}`; answer = second === '+' ? intermediate + c : intermediate - c;
        hint = '按从左到右的顺序，先算前两个数。'; break;
      }
      case 'oral100':
        a = random(10, 89); b = pick([random(1, 9), random(1, 9) * 10]);
        symbol = a + b <= 100 && (b > a || Math.random() > 0.5) ? '+' : '−';
        if (b > a && symbol === '−') [a, b] = [b, a];
        answer = symbol === '+' ? a + b : a - b; text = `${a} ${symbol} ${b}`; hint = '先看个位和十位，可以把数拆开来计算。'; break;
      case 'compare':
        a = random(0, o.max); b = Math.random() < 0.15 ? a : random(0, o.max);
        text = `${a} ○ ${b}`; answer = a > b ? '>' : a < b ? '<' : '='; hint = '先比位数，再从最高位开始一位一位比。'; break;
      case 'multiply':
        a = random(o.minA || 1, o.maxA || 9); b = random(o.minB || 1, o.maxB || 9);
        text = `${a} × ${b}`; answer = a * b; hint = a <= 9 && b <= 9 ? `想一想${a}和${b}对应的乘法口诀。` : `把${a}按数位拆开，分别乘${b}，再合起来。`; break;
      case 'divide':
        b = random(o.minD || 1, o.maxD || 9); c = random(1, o.maxQ || 9); a = b * c;
        text = `${a} ÷ ${b}`; answer = c; hint = `想一想：${b}乘几等于${a}？本题没有余数。`; break;
      case 'remainder':
        b = random(2, 9); c = random(1, 9); d = random(1, b - 1); a = b * c + d;
        text = `${a} ÷ ${b}`; answer = `${c}余${d}`; hint = `找到不超过${a}的最大${b}的倍数。余数必须小于${b}。`; break;
      case 'mixed':
        a = random(2, o.large ? 30 : 9); b = random(2, 9); c = random(1, 9);
        if (Math.random() < 0.5) { text = `${a} + ${b} × ${c}`; answer = a + b * c; hint = '先算乘法，再算加法。'; }
        else { text = `(${a} + ${b}) × ${c}`; answer = (a + b) * c; hint = '括号优先，先算括号里的加法。'; }
        break;
      case 'decimal':
        d = 10 ** (o.digits || 1); a = random(1, 99) / d; b = random(1, 99) / d;
        if (o.operation === 'multiply') { text = `${decimal(a)} × ${decimal(b)}`; answer = decimal(a * b); hint = '先按整数相乘，再数两个因数共有几位小数。'; }
        else if (o.operation === 'divide') { c = random(1, 99) / 10; text = `${decimal(b * c)} ÷ ${decimal(b)}`; answer = decimal(c); hint = '把除数变成整数，被除数也扩大相同的倍数。'; }
        else { if (a < b) [a, b] = [b, a]; symbol = pick(['+', '−']); text = `${decimal(a)} ${symbol} ${decimal(b)}`; answer = decimal(symbol === '+' ? a + b : a - b); hint = '小数点对齐，就是相同数位对齐，再逐位计算。'; }
        break;
      case 'fraction': {
        b = random(2, 9); d = o.same ? b : random(2, 9); a = random(1, b - 1); c = random(1, d - 1);
        symbol = o.operation === 'multiply' ? '×' : o.operation === 'divide' ? '÷' : pick(['+', '−']);
        if (symbol === '−' && a * d < c * b) { [a, c] = [c, a]; [b, d] = [d, b]; }
        if (o.proper && symbol === '+' && a + c > b) c = b - a;
        text = `${a}/${b} ${symbol} ${c}/${d}`;
        answer = symbol === '+' ? fraction(a * d + c * b, b * d) : symbol === '−' ? fraction(a * d - c * b, b * d) : symbol === '×' ? fraction(a * c, b * d) : fraction(a * d, b * c);
        hint = symbol === '÷' ? '乘第二个分数的倒数，再约分。' : symbol === '×' ? '分子乘分子、分母乘分母，再约分。' : '通分后把分子相加减，分母不变。结果可以约分。';
        break;
      }
      case 'story':
        a = random(2, (o.max || 20) - 1); b = random(1, (o.max || 20) - a);
        if (Math.random() < 0.5) { text = `小禾有${a}支彩笔，又买了${b}支。现在有多少支？`; answer = a + b; hint = '原来的支数加上新买的支数。'; }
        else { text = `树上有${a + b}只小鸟，飞走了${b}只。还剩多少只？`; answer = a; hint = '原来的只数减去飞走的只数。'; } break;
      case 'storymul':
        a = random(2, o.max || 9); b = random(2, 9);
        if (Math.random() < 0.5) { text = `每盒有${a}支铅笔，${b}盒一共有多少支？`; answer = a * b; hint = '每盒的支数 × 盒数 = 总支数。'; }
        else { text = `${a * b}个苹果平均分给${b}人，每人几个？`; answer = a; hint = '总数 ÷ 人数 = 每人分到的个数。'; } break;
      case 'area':
        a = random(2, o.max || 20); b = random(2, o.max || 20);
        if (Math.random() < 0.5) { text = `长方形长${a}厘米、宽${b}厘米，面积是多少平方厘米？`; answer = a * b; hint = '长方形面积 = 长 × 宽。'; }
        else { text = `长方形长${a}厘米、宽${b}厘米，周长是多少厘米？`; answer = 2 * (a + b); hint = '长方形周长 =（长 + 宽）× 2。'; } break;
      case 'polygon':
        a = random(2, 20); b = random(2, 10) * 2; c = random(2, 20);
        if (Math.random() < 0.5) { text = `三角形底${a}厘米、高${b}厘米，面积是多少平方厘米？`; answer = a * b / 2; hint = '三角形面积 = 底 × 高 ÷ 2。'; }
        else { text = `梯形上底${a}厘米、下底${c}厘米、高${b}厘米，面积是多少平方厘米？`; answer = (a + c) * b / 2; hint = '梯形面积 =（上底 + 下底）× 高 ÷ 2。'; } break;
      case 'factor':
        a = random(2, 30); b = random(2, 30); symbol = pick(['最大公因数', '最小公倍数']);
        text = `${a}和${b}的${symbol}是多少？`; answer = symbol === '最大公因数' ? gcd(a, b) : a * b / gcd(a, b); hint = '列出两个数的因数或倍数，找出共同的部分。'; break;
      case 'percent':
        a = random(1, 20) * 20; b = pick([5, 10, 20, 25, 50, 75]);
        text = `${a}的${b}%是多少？`; answer = decimal(a * b / 100); hint = `百分数表示每100份中的几份，计算${a} × ${b}/100。`; break;
      case 'discount':
        a = random(2, 30) * 10; b = pick([5, 6, 7, 8, 9]);
        text = `书包原价${a}元，打${b}折，现价多少元？`; answer = decimal(a * b / 10); hint = `${b}折表示按原价的${b * 10}%付款。`; break;
      case 'ratio':
        a = random(1, 9); b = random(1, 9); c = random(2, 9);
        text = `${a} : ${b} = □ : ${b * c}`; answer = a * c; hint = `比的后项乘了${c}，前项也要乘相同的数。`; break;
      case 'review':
        return makeQuestion({ ...topic, kind: pick(['mixed', 'decimal', 'fraction']), options: { digits: 2, operation: 'addsub' } });
      default: throw new Error(`Unknown question kind: ${kind}`);
    }
    return { topicId: topic.id, text, answer: String(answer), hint, kind };
  }
  function normalize(value) {
    return String(value).trim().replace(/[０-９]/g, x => String(x.charCodeAt(0) - 65296)).replace(/\s/g, '').replace(/[／]/g, '/').replace(/[。．]/g, '.').replace(/[＞]/g, '>').replace(/[＜]/g, '<').replace(/[＝]/g, '=').replace(/[−－]/g, '-');
  }
  function numeric(value) {
    const s = normalize(value);
    if (/^-?\d+(?:\.\d+)?$/.test(s)) return Number(s);
    const m = s.match(/^(-?\d+)\/(\d+)$/);
    return m && Number(m[2]) !== 0 ? Number(m[1]) / Number(m[2]) : NaN;
  }
  function isCorrect(input, expected) {
    const a = normalize(input), b = normalize(expected);
    if (!a) return false;
    if (/[<>=余]/.test(b)) return a.replace(/(?:\.\.\.|…+)/g, '余') === b;
    // Cross-multiply exact rational numbers so a rounded decimal cannot pass
    // as a recurring fraction, and large integer answers remain exact.
    const rational = s => {
      if (s.length > 80) return null;
      const f = s.match(/^(-?\d+)\/(\d+)$/);
      if (f) return BigInt(f[2]) === 0n ? null : [BigInt(f[1]), BigInt(f[2])];
      const d = s.match(/^(-?\d+)(?:\.(\d+))?$/);
      if (!d) return null;
      return [BigInt(d[1] + (d[2] || '')), 10n ** BigInt((d[2] || '').length)];
    };
    const x = rational(a), y = rational(b);
    return Boolean(x && y && x[0] * y[1] === y[0] * x[1]);
  }
  function batch(topic, count) {
    const result = [], seen = new Set();
    for (let i = 0; i < count; i++) {
      let q, tries = 0;
      do { q = makeQuestion(topic); tries++; } while (seen.has(q.text) && tries < 40);
      seen.add(q.text); result.push(q);
    }
    return result;
  }
  function choices(question) {
    if (question.kind === 'compare') return ['<', '=', '>'];
    const result = [question.answer], value = numeric(question.answer);
    let offset = 1;
    while (result.length < 4) {
      const candidate = question.kind === 'remainder' ? `${random(0, 10)}余${random(0, 1)}` : decimal(Math.max(0, value + pick([-1, 1]) * offset));
      offset++;
      if (!result.some(item => isCorrect(candidate, item))) result.push(candidate);
    }
    for (let i = result.length - 1; i > 0; i--) { const j = random(0, i); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  const api = { random, gcd, fraction, numeric, normalize, isCorrect, makeQuestion, batch, choices };
  root.Arithmetic = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
