(function (root) {
  'use strict';
  const topic = (id, title, desc, kind, options = {}, phase = '核心练习') => ({ id, title, desc, kind, options, phase });
  const books = [
    { grade: 1, term: 1, edition: '2024 秋修订线索', status: '参考新版目录', extra: '认识立体图形；数学游戏', topics: [
      topic('1a-five', '5以内加减法', '从数一数开始，理解合起来与拿走。', 'addsub', { max: 5 }, '起步巩固'),
      topic('1a-ten', '10以内加减法', '练习数的分与合，熟悉加减关系。', 'addsub', { max: 10 }),
      topic('1a-chain', '连加、连减与混合', '按从左到右的顺序，完成两步计算。', 'chain', { max: 10 }),
      topic('1a-twenty', '11～20的简单加减', '十和几组成十几，先练不进位计算。', 'addsub', { max: 20, noCarry: true }),
      topic('1a-carry', '20以内进位加法', '试试凑十法，把十个合在一起。', 'carry', {}, '应用提升')
    ] },
    { grade: 1, term: 2, edition: '2025 春修订线索', status: '参考新版目录', extra: '认识平面图形；欢乐购物街', topics: [
      topic('1b-borrow', '20以内退位减法', '想加算减，练习十几减几。', 'borrow', {}, '起步巩固'),
      topic('1b-number', '100以内数的认识', '比一比大小，建立数的顺序感。', 'compare', { max: 100 }),
      topic('1b-oral', '100以内口算加减', '两位数加减一位数、整十数。', 'oral100'),
      topic('1b-written', '100以内笔算加减', '数位对齐，留意进位和退位。', 'addsub', { max: 100, min: 10 }),
      topic('1b-model', '数量间的加减关系', '在生活小故事中选择加法或减法。', 'story', { max: 20 }, '应用提升')
    ] },
    { grade: 2, term: 1, edition: '2025 秋修订线索', status: '参考新版目录', extra: '分类与整理；厘米和米；校园小导游', topics: [
      topic('2a-mul6', '1～6的表内乘法', '用相同加数与乘法口诀理解乘法。', 'multiply', { maxA: 6, maxB: 6 }, '起步巩固'),
      topic('2a-div6', '1～6的表内除法', '把乘法口诀变成平均分的小帮手。', 'divide', { maxD: 6, maxQ: 6 }),
      topic('2a-mul9', '7～9的表内乘法', '继续探索完整的九九乘法表。', 'multiply', { minA: 7, maxA: 9, maxB: 9 }),
      topic('2a-div9', '7～9的表内除法', '用乘除关系检查自己的答案。', 'divide', { maxD: 9, maxQ: 9 }, '应用提升')
    ] },
    { grade: 2, term: 2, edition: '2026 春修订线索', status: '参考新版教学计划', extra: '时间在哪里；数学实践活动', topics: [
      topic('2b-rem', '有余数的除法', '分不完的部分是余数，余数要比除数小。', 'remainder', {}, '起步巩固'),
      topic('2b-story', '数量间的乘除关系', '每份数、份数、总数，相互找一找。', 'storymul', { max: 9 }),
      topic('2b-number', '万以内数的认识', '比较四位数，先看数位再看数字。', 'compare', { max: 9999 }),
      topic('2b-add', '万以内的加减法', '从三位数起步，练习进位与退位。', 'addsub', { max: 9999, min: 100 }, '应用提升')
    ] },
    { grade: 3, term: 1, edition: '2025 秋修订线索', status: '参考新版目录', extra: '观察物体；毫米、分米和千米；线和角', topics: [
      topic('3a-mixed', '两步混合运算', '先乘除，后加减；有括号先算括号。', 'mixed', {}, '起步巩固'),
      topic('3a-mul', '多位数乘一位数', '先算口算乘法，再试两、三位数。', 'multiply', { minA: 10, maxA: 999, maxB: 9 }),
      topic('3a-frac', '同分母分数加减', '分母不变，把相同大小的份数合起来。', 'fraction', { same: true, proper: true }, '应用提升')
    ] },
    { grade: 3, term: 2, edition: '2026 春修订线索', status: '参考新版目录', extra: '生活中的运动现象；长方形和正方形；图形的面积；数据收集', topics: [
      topic('3b-div', '除数是一位数的除法', '从整除题起步，注意商的数位。', 'divide', { maxD: 9, maxQ: 99 }, '起步巩固'),
      topic('3b-area', '周长与面积计算', '把长方形的长和宽，变成生活问题。', 'area', { max: 20 }),
      topic('3b-dec', '简单小数加减', '认识十分位，把小数点对齐。', 'decimal', { digits: 1, operation: 'addsub' }, '应用提升')
    ] },
    { grade: 4, term: 1, edition: '2026 秋修订线索', status: '参考新版目录', extra: '万以上数的认识；角的度量；平行四边形和梯形；条形统计图', topics: [
      topic('4a-number', '大数比较', '比较万以上的数，关注数位顺序。', 'compare', { max: 9999999 }, '起步巩固'),
      topic('4a-mul', '多位数乘两位数', '用分步计算，理解两位数乘法。', 'multiply', { minA: 100, maxA: 999, minB: 10, maxB: 99 }),
      topic('4a-model', '加法模型和乘法模型', '通过单价、数量与总价建立数量关系。', 'storymul', { max: 30 }, '应用提升')
    ] },
    { grade: 4, term: 2, edition: '衔接建议，待新版下册核对', status: '建议专题 · 待核', provisional: true, extra: '图形与统计专题请结合学校课本安排', topics: [
      topic('4b-div', '除数是两位数的除法', '练习试商，本应用先提供整除题。', 'divide', { minD: 10, maxD: 99, maxQ: 99 }, '起步巩固'),
      topic('4b-mixed', '两步加乘与括号', '练习加法与乘法的两步运算，包含小括号。', 'mixed', { large: true }),
      topic('4b-dec', '小数加减法', '把小数点对齐，再按位相加减。', 'decimal', { digits: 2, operation: 'addsub' }, '应用提升')
    ] },
    { grade: 5, term: 1, edition: '2026 秋修订线索', status: '参考新版目录', extra: '观察简单组合体；图形的运动；用字母表示数量关系；多边形面积；可能性', topics: [
      topic('5a-dmul', '小数乘法', '先按整数相乘，再确定小数位数。', 'decimal', { digits: 1, operation: 'multiply' }, '起步巩固'),
      topic('5a-ddiv', '小数除法', '利用商不变规律，本应用提供有限小数商。', 'decimal', { digits: 1, operation: 'divide' }),
      topic('5a-area', '三角形与梯形面积', '找到底和高，记得最后除以2。', 'polygon', {}, '应用提升')
    ] },
    { grade: 5, term: 2, edition: '衔接建议，待新版下册核对', status: '建议专题 · 待核', provisional: true, extra: '分数意义、因数与倍数等请按实际教材进度选练', topics: [
      topic('5b-factor', '最大公因数与最小公倍数', '练习2～30两数的最大公因数或最小公倍数。', 'factor', {}, '起步巩固'),
      topic('5b-fsame', '同分母分数加减', '回顾分数单位，巩固基本计算。', 'fraction', { same: true }),
      topic('5b-fdiff', '分数加减（含异分母）', '先通分，再计算、约分；随机题也可能同分母。', 'fraction', {}, '应用提升')
    ] },
    { grade: 6, term: 1, edition: '2026 秋修订线索', status: '参考新版目录', extra: '确定位置；圆；生活中的负数；综合实践', topics: [
      topic('6a-fmul', '分数乘法', '分子相乘、分母相乘，可以先约分。', 'fraction', { operation: 'multiply' }, '起步巩固'),
      topic('6a-fdiv', '分数除法', '除以非零分数，等于乘它的倒数。', 'fraction', { operation: 'divide' }),
      topic('6a-percent', '百分数', '理解百分之几，求一个数的百分之几。', 'percent', {}, '应用提升')
    ] },
    { grade: 6, term: 2, edition: '衔接建议，待新版下册核对', status: '建议专题 · 待核', provisional: true, extra: '圆柱、圆锥等空间内容不在当前算术练习范围内', topics: [
      topic('6b-ratio', '相等比填空', '在相等的比中填前项；暂不含正反比例应用。', 'ratio', {}, '起步巩固'),
      topic('6b-percent', '折扣求现价', '按五至九折求现价；暂不含成数、税率与利率。', 'discount'),
      topic('6b-review', '整数两步与小数、分数加减复习', '轮换练习两步加乘、小数加减和分数加减。', 'review', {}, '应用提升')
    ] }
  ];
  const sources = [
    { title: '人教社 · 小学数学新教材简介', tag: '官方编写说明', url: 'https://www.pep.com.cn/xw/zt/hd/12/xjcjs/xx/202409/t20240920_1995566.html', note: '说明新版结构与编写思路，未提供四至六年级新版下册完整目录；不能据此确认专题顺序。' },
    { title: '教育部 · 义务教育数学课程标准（2022年版）', tag: '官方课标', url: 'https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html', note: '作为学段与“数与代数”能力划分的基础；课标不等同于每学期教学进度。' },
    { title: '国家中小学智慧教育平台', tag: '官方资源', url: 'https://basic.smartedu.cn/', note: '查阅实际电子教材和课程资源；使用时选择人教版及相应年级、册次。部分资源可能需要登录。' },
    { title: '芜湖市教育局 · 2026秋教材目录更新通报', tag: '版本核验', url: 'https://jyj.wuhu.gov.cn/xwzx/tzgg/8953250.html', note: '确认四、五、六年级上册2026年新编版本已有目录变化，不沿用旧版整套目录。' },
    { title: '教师之家 · 一年级新版目录', tag: '第三方目录', url: 'https://www.renjiaoshe.com/jiaocai/2412.html', note: '核对一年级上册的数、加减法与进位加法主题；下册见相邻册次。非官方教材授权。' },
    { title: '二一教育 · 二年级上册新版教学计划', tag: '教学参考', url: 'https://zy.21cnjy.com/23522641', note: '参考1～6乘法、1～6除法、7～9乘除法的学习顺序；周次安排由本校决定。' },
    { title: '二一教育 · 二年级下册2026教学计划', tag: '教学参考', url: 'https://zy.21cnjy.com/25180444', note: '参考有余数除法、乘除关系、万以内数与加减法的专题范围。' },
    { title: '课本网 · 三年级上册新版课题', tag: '第三方目录', url: 'https://kebenwang.cn/book/51/chapter/827', note: '交叉核对混合运算、多位数乘一位数与分数初步认识。' },
    { title: '文可居 · 三年级下册2026教学设计目录', tag: '教学参考', url: 'https://wenkeju.com/doc/d7l2p8p2h0515l2lhjmg', note: '用于除数是一位数、周长面积、简单小数的专题归类；不复制付费教学内容。' },
    { title: '四年级上册2026修订内容对照', tag: '第三方参考', url: 'https://lovejll.cn/math-happy-4a-index/math-happy-4a-index', note: '交叉核对多位数乘两位数与加法、乘法模型；两位数除法移至下册的线索待课本复核。' },
    { title: '点读宝 · 五年级上册2026目录', tag: '第三方目录', url: 'https://www.ai2book.com/diandu/book/45884', note: '核对小数乘除法及多边形面积；新版用字母表示数不直接等同于旧版简易方程。' },
    { title: '六年级上册2026教师用书介绍', tag: '第三方参考', url: 'https://www.sohu.com/a/1090474759_120904083', note: '参考分数乘法、分数除法、百分数专题范围。' }
  ];
  const data = { books, sources, gradeNames: ['一', '二', '三', '四', '五', '六'], researchedAt: '2026-10-28' };
  root.Curriculum = data;
  if (typeof module !== 'undefined') module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
