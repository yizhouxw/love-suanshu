(function () {
  'use strict';
  const C = window.Curriculum, M = window.Arithmetic;
  const $ = selector => document.querySelector(selector);
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
    book: '<path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
    game: '<path d="M7 7h10a4 4 0 0 1 4 3l1 7a2 2 0 0 1-3 2l-4-3H9l-4 3a2 2 0 0 1-3-2l1-7a4 4 0 0 1 4-3Z"/><path d="M6 10v5m-2-2h5m7-2h.01M19 14h.01"/>',
    pencil: '<path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14Z"/><path d="m4 14 5 5"/>',
    chart: '<path d="M4 3v18h17M8 17v-5m5 5V8m5 9V4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    check: '<path d="m5 12 4 4L20 5"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    print: '<path d="M6 8V3h12v5M6 17H3v-7h18v7h-3M6 14h12v7H6Z"/><path d="M18 11h.01"/>',
    sound: '<path d="m11 4-5 5H2v6h4l5 5ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="m11 4-5 5H2v6h4l5 5ZM16 9l6 6m0-6-6 6"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
  const topicMap = new Map(C.books.flatMap(book => book.topics.map(topic => [topic.id, { ...topic, grade: book.grade, term: book.term }])));
  const KEY = 'little-he-arithmetic-v1';
  let storageOK = true;
  let data = { prefs: { grade: 1, term: 1, minutes: 10, count: 20, sound: true }, sessions: [], mistakes: [], active: null };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved && Array.isArray(saved.sessions) && Array.isArray(saved.mistakes)) {
      data = { ...data, ...saved, prefs: { ...data.prefs, ...saved.prefs } };
      data.sessions = data.sessions.filter(s => Number.isFinite(s.correct) && Number.isFinite(s.total) && Number.isFinite(s.timestamp));
      data.mistakes = data.mistakes.filter(q => topicMap.has(q.topicId) && typeof q.text === 'string' && typeof q.answer === 'string');
      if (!C.books.some(b => b.grade === data.prefs.grade && b.term === data.prefs.term)) { data.prefs.grade = 1; data.prefs.term = 1; }
      if (data.active && (!Array.isArray(data.active.questions) || !Array.isArray(data.active.answers) || !Number.isFinite(data.active.deadline) || !data.active.questions.length || data.active.questions.some(q => !topicMap.has(q.topicId)))) data.active = null;
      if (data.active) data.active.answers = data.active.answers.map(value => typeof value === 'string' ? value : undefined);
    }
  } catch { storageOK = false; }
  let page = 'home', session = null, timerId = null, audioContext = null, previewQuestions = [], lastSession = null, toastId;
  const book = () => C.books.find(b => b.grade === data.prefs.grade && b.term === data.prefs.term);
  const bookName = (grade = data.prefs.grade, term = data.prefs.term) => `${C.gradeNames[grade - 1]}年级 · ${term === 1 ? '上' : '下'}学期`;
  const localDay = time => { const d = new Date(time); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const todaySessions = () => data.sessions.filter(s => localDay(s.timestamp) === localDay(Date.now()));
  const scopedMistakes = () => data.mistakes.filter(q => { const t = topicMap.get(q.topicId); return t.grade === data.prefs.grade && t.term === data.prefs.term; });
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch { storageOK = false; }
    $('#storage-warning').hidden = storageOK;
  }
  function hydrateIcons() { document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); }); }
  function toast(message) { clearTimeout(toastId); $('#toast').textContent = message; $('#toast').hidden = false; toastId = setTimeout(() => { $('#toast').hidden = true; }, 3500); }
  function openDialog(id) { const dialog = $(`#${id}`); if (!dialog.open) dialog.showModal(); }
  function initAudio() {
    if (!data.prefs.sound) return;
    try { audioContext ||= new (window.AudioContext || window.webkitAudioContext)(); if (audioContext.state === 'suspended') audioContext.resume().catch(() => {}); } catch { /* Visual reminders are always available. */ }
  }
  function chime(success = true) {
    if (!data.prefs.sound || !audioContext || audioContext.state !== 'running') return;
    try {
      [success ? 523 : 392, success ? 659 : 440, 784].forEach((frequency, i) => {
        const oscillator = audioContext.createOscillator(), gain = audioContext.createGain(), start = audioContext.currentTime + i * 0.18;
        oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.09, start + 0.02); gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(start); oscillator.stop(start + 0.36);
      });
    } catch { /* The result dialog still provides the reminder. */ }
  }
  function updateSound() { $('#sound-toggle').innerHTML = icon(data.prefs.sound ? 'sound' : 'muted'); $('#sound-toggle').setAttribute('aria-label', data.prefs.sound ? '关闭提示音' : '开启提示音'); $('#sound-toggle').title = data.prefs.sound ? '关闭提示音' : '开启提示音'; }
  const symbolFor = kind => ({ addsub: '+ −', carry: '+', borrow: '−', chain: '±', oral100: '±', multiply: '×', divide: '÷', remainder: '÷', mixed: '( )', fraction: '½', decimal: '.0', compare: '< >', story: '?', storymul: '×', area: '▱', polygon: '△', percent: '%', discount: '%', factor: '∩', ratio: ':', review: '±' })[kind] || '+';
  function statsMarkup() {
    const today = todaySessions(), answers = today.reduce((n, s) => n + s.total, 0), correct = today.reduce((n, s) => n + s.correct, 0), minutes = today.reduce((n, s) => n + s.elapsed, 0) / 60000;
    return `<div class="stats-strip"><div class="stat-card"><span class="stat-icon">${icon('pencil')}</span><div><div class="stat-value">${answers}<small>题</small></div><div class="stat-caption">今日练习题目</div></div></div><div class="stat-card"><span class="stat-icon">${icon('target')}</span><div><div class="stat-value">${answers ? Math.round(correct / answers * 100) : '—'}<small>${answers ? '%' : ''}</small></div><div class="stat-caption">今日正确率</div></div></div><div class="stat-card"><span class="stat-icon">${icon('clock')}</span><div><div class="stat-value">${minutes > 0 && minutes < 1 ? '<1' : Math.round(minutes)}<small>分钟</small></div><div class="stat-caption">今日专注时长</div></div></div></div>`;
  }
  function topicCard(topic) {
    const history = data.sessions.filter(s => s.topicId === topic.id), total = history.reduce((n, s) => n + s.total, 0), correct = history.reduce((n, s) => n + s.correct, 0);
    return `<article class="topic-card"><div class="topic-top"><span class="topic-symbol">${escape(symbolFor(topic.kind))}</span><span class="topic-phase">${topic.phase}</span></div><h3>${topic.title}</h3><p>${topic.desc}</p><div class="topic-bottom"><span>${total ? `已练 ${total} 题 · 正确率 ${Math.round(correct / total * 100)}%` : '还未探索 · 从这里开始'}</span><button data-topic="${topic.id}">去练习 ↗</button></div></article>`;
  }
  function homeMarkup() {
    const today = todaySessions(), minutes = today.reduce((n, s) => n + s.elapsed, 0) / 60000, percent = Math.min(100, Math.round(minutes / 10 * 100)), rounds = today.length, games = today.filter(s => s.mode === 'game').length;
    return `<div class="dashboard-grid"><div><section class="hero"><div class="hero-copy"><div class="hero-pill">✧ ${bookName()} · 今日学习邀请</div><h2>把数学，变成每天的<br>一点点<em>小进步。</em></h2><p>跟着小禾，从一道题开始。<br>不着急，每一步都算数。</p><button class="primary-button" data-action="setup">开始今日练习 <span>→</span></button></div><span class="hero-circle"></span><span class="hero-shape">+</span><span class="hero-shape second">÷</span><span class="hero-shape third">✧</span><img class="buddy" src="assets/buddy.svg" alt="小狐狸小禾捧着绿色练习本"></section>${statsMarkup()}<section><div class="section-heading"><div><h2>循着课本，慢慢探索</h2><p>${bookName()} · ${book().topics.length} 个算术专题</p></div><button class="text-button" data-page="practice">全部练习 →</button></div><div class="topic-grid">${book().topics.slice(0, 4).map(topicCard).join('')}</div><p class="learning-note">ⓘ ${book().status}，练习专题非教材完整单元。<button class="text-button" data-page="sources">查看依据 ↗</button></p></section></div><aside class="right-column"><section class="panel today-plan"><div class="panel-header"><h2>我的今日小目标</h2><span>DAILY GOAL</span></div><p>每天专注一点点，积累大大的能量。</p><div class="goal-ring"><svg viewBox="0 0 128 128" aria-hidden="true"><circle class="ring-track" cx="64" cy="64" r="52"/><circle class="ring-fill" cx="64" cy="64" r="52" stroke-dasharray="${percent / 100 * 326.73} 326.73"/></svg><div class="ring-content"><strong>${percent}%</strong><small>今日专注 / 10 分钟</small></div></div><div class="goal-list"><div class="goal-item"><span class="goal-check ${rounds ? 'done' : ''}">${rounds ? '✓' : ''}</span>完成一组视算<span>小小起步</span></div><div class="goal-item"><span class="goal-check ${games ? 'done' : ''}">${games ? '✓' : ''}</span>探索一次闯关<span>快乐加倍</span></div><div class="goal-item"><span class="goal-check ${minutes >= 10 ? 'done' : ''}">${minutes >= 10 ? '✓' : ''}</span>累计专注10分钟<span>慢慢成长</span></div></div></section><section class="panel game-teaser"><div class="label">LET'S PLAY & LEARN</div><h2>小禾的星星探险</h2><p>跟着小狐狸，跨过算术小岛。<br>把每一次思考，变成一颗星星。</p>${miniScene()}<button data-page="game">出发，去探险！<span>→</span></button></section><div class="encourage"><span>☀</span><div><strong>“我再想一想”，<br>就是很棒的开始。</strong><p>送给今天认真思考的你</p></div></div></aside></div>`;
  }
  function miniScene() { return '<div class="mini-scene" aria-hidden="true"><div class="hill"></div><div class="hill second"></div><span class="island"></span><span class="island"></span><span class="island"></span><span class="star">✦</span><span class="star last">✦</span><img src="assets/buddy.svg" alt=""></div>'; }
  function practiceMarkup() {
    return `<div class="practice-banner"><div><span class="eyebrow">看一看，想一想，算一算</span><h2>专属于你的视算练习</h2><p>随机生成 10～100 题，专注时长 10～30 分钟。<br>可以在线作答，也可以打印到纸上慢慢练。</p></div><button class="primary-button" data-action="setup">配置练习 →</button></div><div class="section-heading"><div><h2>${bookName()} · 专题练习</h2><p>建议按照起步巩固 → 核心练习 → 应用提升的顺序探索</p></div></div>${book().provisional ? `<div class="notice">本学期为衔接建议，尚未逐单元核对新版下册。请按孩子实际课本选择已学内容。</div>` : ''}<div class="topic-grid practice-page-grid">${book().topics.map(topicCard).join('')}</div><div class="chapter-note"><strong>课堂延伸</strong> · ${book().extra}<br>当前应用聚焦算术与计算应用，这些主题暂不提供独立交互课程。${book().edition}。</div>`;
  }
  function gameMarkup() {
    return `<section class="game-page-hero"><div><span class="eyebrow">一起去寻找，属于你的星星</span><h2>小禾的<br>星星探险</h2><p>10 道小挑战，10 座算术小岛。<br>每答对一道题，就点亮一颗星。</p><button class="primary-button" data-action="start-game">开始探险 →</button></div><img src="assets/buddy.svg" alt="小狐狸小禾等你一起探险"></section><div class="game-topic-picker"><label for="game-topic">这次探索什么？</label><select id="game-topic">${book().topics.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}</select><span class="muted">${bookName()} · 10分钟</span></div>${mapMarkup(-1, [])}<div class="game-rules"><div class="panel"><span>✦</span><h3>动脑，点亮星星</h3><p>选出正确答案，和小禾一起前进。每题首次回答计入成绩。</p></div><div class="panel"><span>♡</span><h3>答错也没关系</h3><p>小禾会给你讲解，错题自动收好。想明白了，再向前一步。</p></div><div class="panel"><span>⚑</span><h3>收获自己的成长</h3><p>完成10题即可结束探险。累计答对的题目，会变成成长星星。</p></div></div>`;
  }
  function mapMarkup(current, answers, questions = []) {
    return `<div class="game-map" aria-label="十道题的探险进度">${Array.from({ length: 10 }, (_, i) => `<span class="map-node ${i < current ? 'passed' : i === current ? 'current' : ''}">${i < current && questions[i] ? (M.isCorrect(answers[i], questions[i].answer) ? '★' : '✓') : i === 9 ? '⚑' : i + 1}</span>`).join('')}</div>`;
  }
  function mistakesMarkup() {
    const mistakes = scopedMistakes();
    if (!mistakes.length) return `<section class="empty-state"><span>✧</span><h2>这里，留给下一次进步</h2><p>${bookName()}还没有待复习的错题。<br>做错的题会自动收在这里，练对后即可移出。</p><button class="primary-button" data-page="practice">去做一组练习 →</button></section>`;
    return `<div class="record-toolbar"><p>${bookName()} · ${mistakes.length} 道待复习的题目<br><span class="muted">答对一次即移出；先理解，再巩固。</span></p><button class="primary-button" data-action="retry-mistakes">重练这些题 →</button></div><div class="mistake-list">${mistakes.map((q, i) => `<article class="mistake-card"><div><small>${topicMap.get(q.topicId).title} · ${q.attempts || 1} 次待巩固</small><h3>${escape(q.text)}${isWord(q) ? '' : ' = ?'}</h3><p>你的答案：${escape(q.given || '未填写')}　正确答案：${escape(q.answer)}</p><small>${escape(q.hint)}</small></div><button class="secondary-button" data-retry="${i}">再想一想 ↗</button></article>`).join('')}</div>`;
  }
  function progressMarkup() {
    const totalCorrect = data.sessions.reduce((n, s) => n + s.correct, 0), totalSessions = data.sessions.length;
    const days = Array.from({ length: 7 }, (_, i) => { const date = new Date(); date.setDate(date.getDate() - (6 - i)); const list = data.sessions.filter(s => localDay(s.timestamp) === localDay(date)); return { label: `${date.getMonth() + 1}/${date.getDate()}`, count: list.reduce((n, s) => n + s.total, 0) }; });
    const max = Math.max(10, ...days.map(d => d.count));
    return `${statsMarkup()}<div class="progress-layout"><section class="panel"><h2>这周，留下的小脚印</h2><div class="week-chart">${days.map(d => `<div class="day-bar"><span>${d.count}题</span><div class="bar-fill" style="height:${d.count / max * 100}px"></div></div>`).join('')}</div><div class="chart-labels">${days.map(d => `<span>${d.label}</span>`).join('')}</div></section><section class="panel"><h2>慢慢长大的成就</h2><div class="milestones"><div class="milestone ${totalSessions >= 1 ? 'earned' : ''}"><span>♧</span>初次萌芽<br><br>完成1组练习</div><div class="milestone ${totalCorrect >= 50 ? 'earned' : ''}"><span>✦</span>星星伙伴<br><br>累计答对50题</div><div class="milestone ${totalSessions >= 10 ? 'earned' : ''}"><span>♕</span>坚持的力量<br><br>完成10组练习</div></div><p class="muted" style="margin-top:24px;line-height:1.9">已完成 ${totalSessions} 组练习，收获 ${totalCorrect} 颗成长星星。<br>所有年级、模式共同累计。</p></section></div><div class="section-heading"><h2>最近的学习记录</h2><button class="text-button" data-action="export-records">导出记录 ↓</button></div>${data.sessions.length ? `<div class="table-wrap"><table class="history-table"><thead><tr><th>日期</th><th>课程 / 专题</th><th>模式</th><th>答对 / 总题数</th><th>专注时长</th></tr></thead><tbody>${data.sessions.slice(0, 20).map(s => `<tr><td>${new Date(s.timestamp).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${bookName(s.grade, s.term)}<br>${escape(s.title)}</td><td>${s.mode === 'game' ? '星星探险' : s.mode === 'mistakes' ? '错题重练' : '专注视算'}</td><td>${s.correct} / ${s.total}</td><td>${formatTime(s.elapsed)}</td></tr>`).join('')}</tbody></table></div>` : `<section class="empty-state"><span>♧</span><h2>成长，从第一道题开始</h2><p>完成练习后，这里会记录你的每一次进步。</p><button class="primary-button" data-page="practice">开始第一次练习 →</button></section>`}<p class="source-note">记录保存在当前浏览器，最多保留最近100组、200道待复习错题。清理浏览器数据会删除记录，建议定期导出备份。</p>`;
  }
  function sourcesMarkup() {
    return `<div class="source-intro"><h2>跟着学习节奏，也尊重每个孩子的节奏</h2><p>参考人教版六三学制小学数学的公开教材目录、教学计划与2022年版课标，将“数与运算”划分为可练习的算术专题。调研日期：${C.researchedAt}。</p><p>这是一份应用内学习路径，不是官方逐周教学计划，也不代表出版社授权。先选年级与学期，再按学校已教内容选专题；时长由家庭自行安排，默认10分钟。</p></div><div class="section-heading"><h2>六年里的算术小地图</h2></div><div class="table-wrap curriculum-table"><table class="history-table"><thead><tr><th>年级 / 学期</th><th>算术专题</th><th>版本与核对状态</th></tr></thead><tbody>${C.books.map(b => `<tr><td>${bookName(b.grade, b.term)}</td><td>${b.topics.map(t => t.title).join('；')}</td><td>${b.edition}<br><small>${b.status}</small></td></tr>`).join('')}</tbody></table></div><p class="source-note">版本说明：公开网络目录存在新旧混用。已对照新版线索归类上册与一至三年级下册；尚未直接逐页核对全部官方教材。四至六年级下册明确保留为建议专题，待实际新版教材核验。几何、统计、综合实践仅列课堂延伸，当前不提供完整教学。固定周次与课时不作统一规定。</p><div class="section-heading"><h2>课程依据与学习资源</h2></div><div class="source-grid">${C.sources.map(s => `<article class="source-card"><small>${s.tag}</small><h3><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title} ↗</a></h3><p>${s.note}</p></article>`).join('')}</div><p class="source-note">题目由应用按范围随机生成，讲解为原创提示，不复制教材页面或付费习题。分数答案支持等值分数与有限小数；余数格式如“3余1”；比较大小填写 &lt;、&gt; 或 =。浏览器或设备休眠期间无法保证即时响铃，恢复页面时会按实际剩余时间收卷。</p>`;
  }
  const pageNames = { home: '学习首页', practice: '视算练习', game: '趣味闯关', mistakes: '我的错题', progress: '成长记录', sources: '课程与资源' };
  const pageTitles = { home: '今天，也一起进步吧 <span class="wave">☀</span>', practice: '小小练习，稳稳进步', game: '让好奇心，带你去探险', mistakes: '再想一次，就更靠近答案', progress: '每一步，都有成长的痕迹', sources: '有依据的练习，有节奏的成长' };
  const descriptions = { home: '让每一个小小的答案，成为成长的大大一步。', practice: '先理解，再熟练。在熟悉的节奏里，找到自己的方法。', game: '带上思考和勇气，和小禾一起寻找算术小岛上的星星。', mistakes: '错题不是终点，而是发现新方法的起点。', progress: '记录认真的你，见证慢慢积累起来的力量。', sources: '按年级、学期与算术专题组织，结合实际课本选择学习内容。' };
  function render() {
    $('#breadcrumb').textContent = pageNames[page]; $('#page-title').innerHTML = pageTitles[page]; $('#page-description').textContent = descriptions[page];
    $('#grade-tabs').innerHTML = C.gradeNames.map((name, i) => `<button class="${data.prefs.grade === i + 1 ? 'active' : ''}" data-grade="${i + 1}" aria-pressed="${data.prefs.grade === i + 1}">${name}年级</button>`).join('');
    document.querySelectorAll('[data-term]').forEach(el => { el.classList.toggle('active', Number(el.dataset.term) === data.prefs.term); el.setAttribute('aria-pressed', Number(el.dataset.term) === data.prefs.term); });
    document.querySelectorAll('.nav-item[data-page]').forEach(el => { el.classList.toggle('active', el.dataset.page === page); if (el.dataset.page === page) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    $('#mistake-badge').textContent = data.mistakes.length;
    $('#page-content').innerHTML = ({ home: homeMarkup, practice: practiceMarkup, game: gameMarkup, mistakes: mistakesMarkup, progress: progressMarkup, sources: sourcesMarkup })[page]();
    $('#storage-warning').hidden = storageOK; hydrateIcons();
  }
  function navigate(next) { if (!(next in pageNames)) return; page = next; history.replaceState(null, '', `#${page}`); render(); window.scrollTo({ top: 0, behavior: 'instant' }); }
  function openSetup(topicId) {
    const topics = book().topics;
    $('#topic-select').innerHTML = topics.map(t => `<option value="${t.id}">${t.title}</option>`).join('');
    if (topics.some(t => t.id === topicId)) $('#topic-select').value = topicId;
    $('#duration').value = Math.min(30, Math.max(10, data.prefs.minutes)); $('#duration-label').textContent = `${$('#duration').value} 分钟`;
    $('#question-count').value = [10, 20, 40, 60, 100].includes(data.prefs.count) ? data.prefs.count : 20;
    refreshPreview(); openDialog('setup-dialog');
  }
  function refreshPreview() {
    previewQuestions = M.batch(topicMap.get($('#topic-select').value), Number($('#question-count').value));
    const word = isWord(previewQuestions[0]);
    $('#question-preview').classList.toggle('story-preview', word);
    $('#question-preview').innerHTML = previewQuestions.slice(0, word ? 2 : 3).map(q => `<span>${escape(q.text)}${isWord(q) ? '' : q.kind === 'compare' ? '' : ' = ?'}</span>`).join('');
  }
  const isWord = q => ['story', 'storymul', 'area', 'polygon', 'factor', 'percent', 'discount', 'ratio'].includes(q.kind);
  const placeholder = q => q.kind === 'compare' ? '填写 <、> 或 =' : q.kind === 'remainder' ? '例如：3余1' : q.kind === 'fraction' ? '例如：1/2' : '填入答案';
  function startSession(mode, topicId, questions) {
    const topic = topicMap.get(topicId) || book().topics[0];
    initAudio();
    const duration = (mode === 'game' ? 10 : data.prefs.minutes) * 60000;
    session = { mode, topicId: topic.id, title: mode === 'mistakes' ? '错题重练' : topic.title, grade: data.prefs.grade, term: data.prefs.term, questions: questions || M.batch(topic, mode === 'game' ? 10 : data.prefs.count), answers: [], duration, remaining: duration, deadline: Date.now() + duration, paused: false, index: 0, startedAt: Date.now() };
    if (mode === 'game') session.options = session.questions.map(M.choices);
    data.active = session; save();
    $('#setup-dialog').close(); openDialog('session-dialog'); renderSession(); startTicker();
    if (mode !== 'game') $('#session-body input')?.focus();
  }
  function remainingTime() { return session.paused ? session.remaining : Math.max(0, session.deadline - Date.now()); }
  function formatTime(ms) { const seconds = Math.max(0, Math.ceil(ms / 1000)); return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
  function tick() {
    if (!session) return;
    const remaining = remainingTime(); $('#timer').textContent = formatTime(remaining); $('#timer').classList.toggle('urgent', remaining < 60000);
    document.title = `${formatTime(remaining)} · ${session.paused ? '已暂停' : '小禾算术'}`;
    if (remaining <= 0 && !session.paused) finishSession('timeout');
  }
  function startTicker() { clearInterval(timerId); tick(); if (session) timerId = setInterval(tick, 250); }
  function renderSession() {
    if (!session) return;
    $('#session-title').textContent = session.title; $('#session-mode').textContent = `${bookName(session.grade, session.term)} · ${session.mode === 'game' ? '星星探险' : session.mode === 'mistakes' ? '错题重练' : '专注视算'}`;
    $('#pause-session').textContent = session.paused ? '继续' : '暂停';
    $('#finish-session').disabled = false;
    $('#answer-progress').textContent = session.mode === 'game' ? `已探索 ${session.answers.filter(x => x !== undefined && x !== '').length} / 10 座小岛` : `已填写 ${session.answers.filter(x => x !== undefined && x.trim() !== '').length} / ${session.questions.length}`;
    $('#session-help').textContent = session.mode === 'game' ? '选好答案后，看看讲解再前进' : '输入答案后按 Enter 跳到下一题';
    if (session.paused) { $('#session-body').innerHTML = '<div class="pause-overlay"><span>☁</span><h3>让小脑袋休息一下</h3><p>计时已经暂停，准备好后再继续。</p><button class="primary-button" data-action="resume">继续练习 →</button></div>'; $('#finish-session').disabled = true; return; }
    if (session.mode === 'game') { renderGame(); return; }
    $('#session-body').innerHTML = `<div class="question-grid">${session.questions.map((q, i) => `<label class="question-item ${isWord(q) ? 'word-problem' : ''}"><span class="question-number">第 ${String(i + 1).padStart(2, '0')} 题</span><span class="question-text">${escape(q.text)}${isWord(q) || q.kind === 'compare' ? '' : ' = ?'}</span><input class="answer-input" data-answer="${i}" aria-label="第${i + 1}题答案：${escape(q.text)}" autocomplete="off" maxlength="40" inputmode="${['fraction', 'compare', 'remainder'].includes(q.kind) ? 'text' : 'decimal'}" placeholder="${escape(placeholder(q))}" value="${escape(session.answers[i] || '')}"></label>`).join('')}</div>`;
  }
  function renderGame() {
    const i = session.index, q = session.questions[i], selected = session.answers[i], answered = selected !== undefined;
    $('#session-body').innerHTML = `<div class="active-game">${mapMarkup(i, session.answers, session.questions)}<div class="game-question ${isWord(q) ? 'word-problem' : ''}"><p>第 ${i + 1} 座小岛 · ${answered ? '每一次思考，都有收获' : '哪个答案能点亮这座小岛？'}</p><div class="question-text">${escape(q.text)}${isWord(q) || q.kind === 'compare' ? '' : ' = ?'}</div></div><div class="answer-choices">${session.options[i].map(choice => `<button data-choice="${escape(choice)}" ${answered ? 'disabled' : ''} class="${answered && M.isCorrect(choice, q.answer) ? 'correct' : answered && choice === selected ? 'wrong' : ''}">${escape(choice)}</button>`).join('')}</div><div class="game-feedback" aria-live="polite">${answered ? `${M.isCorrect(selected, q.answer) ? '✦ 太棒啦，点亮一颗星！' : `再想一想，答案是 ${escape(q.answer)}。`}<br>${escape(q.hint)}` : ''}</div>${answered ? `<button class="primary-button game-next" data-action="game-next">${i === 9 ? '收获探险成果 ✓' : '下一座小岛 →'}</button>` : ''}</div>`;
  }
  function pauseSession() {
    if (!session) return;
    if (!session.paused && remainingTime() <= 0) { finishSession('timeout'); return; }
    if (session.paused) { session.deadline = Date.now() + session.remaining; session.paused = false; initAudio(); }
    else { session.remaining = remainingTime(); session.paused = true; }
    data.active = session; save(); renderSession(); tick();
  }
  function rememberMistake(q, given) {
    const old = data.mistakes.find(item => item.topicId === q.topicId && item.text === q.text);
    if (old) { old.given = given; old.attempts = (old.attempts || 1) + 1; old.timestamp = Date.now(); }
    else data.mistakes.unshift({ ...q, given, attempts: 1, timestamp: Date.now() });
  }
  function finishSession(reason = 'manual') {
    if (!session) return;
    clearInterval(timerId);
    const current = session;
    const remaining = remainingTime(), elapsed = Math.max(0, Math.min(current.duration, current.duration - remaining));
    if (remaining <= 0 && !current.paused) reason = 'timeout';
    const review = current.questions.map((q, i) => ({ ...q, given: current.answers[i] || '', correct: M.isCorrect(current.answers[i] || '', q.answer) }));
    const correct = review.filter(q => q.correct).length, answered = review.filter(q => q.given.trim()).length;
    review.forEach(q => {
      if (q.correct) data.mistakes = data.mistakes.filter(item => !(item.topicId === q.topicId && item.text === q.text));
      else if (q.given.trim()) rememberMistake(q, q.given);
    });
    const record = { timestamp: Date.now(), grade: current.grade, term: current.term, topicId: current.topicId, title: current.title, mode: current.mode, total: review.length, correct, answered, elapsed, reason };
    data.sessions.unshift(record); data.sessions = data.sessions.slice(0, 100); data.mistakes = data.mistakes.slice(0, 200); data.active = null;
    lastSession = { ...current, review }; session = null; save(); $('#session-dialog').close(); document.title = '小禾算术 · 每天一点，算出成长';
    $('#result-title').textContent = reason === 'timeout' ? '时间到啦，让眼睛休息一下！' : correct === review.length ? '每一题都答对了，真棒！' : '今天的进步，值得一颗星！';
    $('#result-eyebrow').textContent = reason === 'timeout' ? '到时提醒 · 本组练习已自动收卷' : '每一次练习，都有收获';
    $('#result-message').textContent = `本次答对 ${correct} 题，收获 ${correct} 颗成长星星。${answered < review.length ? `另有 ${review.length - answered} 题未作答。` : ''}${reason === 'timeout' ? '站起来活动一下，再看看远处吧。' : '看看自己的思路，下一次会更熟练。'}`;
    $('#result-stats').innerHTML = `<div><strong>${correct}/${review.length}</strong><span>答对 / 总题数</span></div><div><strong>${Math.round(correct / review.length * 100)}%</strong><span>本次正确率</span></div><div><strong>${formatTime(elapsed)}</strong><span>专注时长</span></div>`;
    const wrong = review.filter(q => !q.correct);
    $('#result-review').innerHTML = wrong.length ? `<div class="result-review"><p class="muted" style="padding:15px 0">一起再看看 · ${wrong.length} 题（已作答错题自动收藏）</p>${wrong.map(q => `<div class="review-row"><h3>${escape(q.text)}${isWord(q) || q.kind === 'compare' ? '' : ' = ?'}</h3><p>你的答案：${escape(q.given || '未填写')}　正确答案：${escape(q.answer)}</p><small>${escape(q.hint)}</small></div>`).join('')}</div>` : '<p class="source-note">✦ 认真思考的你，正在闪闪发光。</p>';
    $('#result-retry').textContent = wrong.length ? '再练这些题 →' : '再来一组 →';
    render(); openDialog('result-dialog'); chime();
  }
  function printSheet() {
    const t = topicMap.get($('#topic-select').value);
    $('#print-area').innerHTML = `<h1>小禾算术 · ${t.title}</h1><div class="print-meta"><span>${bookName()}　姓名：________</span><span>练习时长：${$('#duration').value}分钟　日期：________</span></div><div class="print-questions">${previewQuestions.map((q, i) => `<div class="print-question ${isWord(q) ? 'word' : ''}"><span>${i + 1}. </span>${escape(q.text)}${isWord(q) ? ' 答：________' : q.kind === 'compare' ? '' : ' = ______'}</div>`).join('')}</div><small>题目由小禾算术随机生成，共${previewQuestions.length}题。打印练习不启动网页计时，也不计入在线学习记录。</small>`;
    window.print();
  }
  function exportRecords() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), sessions: data.sessions, mistakes: data.mistakes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `小禾算术-学习记录-${localDay(Date.now())}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast('学习记录已导出为 JSON 文件');
  }
  document.addEventListener('click', event => {
    const target = event.target.closest('button, a.brand'); if (!target) return;
    if (target.matches('a.brand')) { event.preventDefault(); navigate('home'); }
    if (target.dataset.page) navigate(target.dataset.page);
    if (target.dataset.grade) { data.prefs.grade = Number(target.dataset.grade); save(); render(); }
    if (target.dataset.term) { data.prefs.term = Number(target.dataset.term); save(); render(); }
    if (target.dataset.topic) openSetup(target.dataset.topic);
    if (target.dataset.close) $(`#${target.dataset.close}`).close();
    if (target.dataset.retry !== undefined) { const q = scopedMistakes()[Number(target.dataset.retry)]; if (q) startSession('mistakes', q.topicId, [q]); }
    if (target.dataset.choice !== undefined && session && !session.paused && session.answers[session.index] === undefined) {
      if (remainingTime() <= 0) { finishSession('timeout'); return; }
      session.answers[session.index] = target.dataset.choice; data.active = session; save();
      if (M.isCorrect(target.dataset.choice, session.questions[session.index].answer)) chime(); renderSession(); $('.game-next')?.focus();
    }
    switch (target.dataset.action) {
      case 'setup': openSetup(); break;
      case 'start-game': startSession('game', $('#game-topic').value); break;
      case 'retry-mistakes': { const qs = scopedMistakes().slice(0, 100); if (qs.length) startSession('mistakes', qs[0].topicId, qs); break; }
      case 'game-next': if (session && session.answers[session.index] !== undefined) { if (session.index === 9) finishSession(); else { session.index++; save(); renderSession(); $('[data-choice]')?.focus(); } } break;
      case 'resume': if (session?.paused) pauseSession(); break;
      case 'export-records': exportRecords(); break;
    }
  });
  $('#setup-form').addEventListener('submit', event => { event.preventDefault(); data.prefs.minutes = Number($('#duration').value); data.prefs.count = Number($('#question-count').value); startSession('practice', $('#topic-select').value, previewQuestions); });
  $('#duration').addEventListener('input', () => { $('#duration-label').textContent = `${$('#duration').value} 分钟`; });
  $('#topic-select').addEventListener('change', refreshPreview); $('#question-count').addEventListener('change', refreshPreview); $('#refresh-preview').addEventListener('click', refreshPreview);
  $('#print-sheet').addEventListener('click', printSheet);
  $('#sound-toggle').addEventListener('click', () => { data.prefs.sound = !data.prefs.sound; save(); updateSound(); initAudio(); toast(data.prefs.sound ? '提示音已开启；请保持页面打开' : '提示音已关闭，仍会显示到时提醒'); });
  $('#pause-session').addEventListener('click', pauseSession);
  $('#finish-session').addEventListener('click', () => finishSession(remainingTime() <= 0 ? 'timeout' : 'manual'));
  $('#leave-session').addEventListener('click', () => finishSession(remainingTime() <= 0 ? 'timeout' : 'manual'));
  $('#session-dialog').addEventListener('cancel', event => { event.preventDefault(); if (session && !session.paused) pauseSession(); });
  $('#session-dialog').addEventListener('input', event => {
    const index = event.target.dataset.answer; if (index === undefined || !session || session.paused) return;
    if (remainingTime() <= 0) { finishSession('timeout'); return; }
    session.answers[Number(index)] = event.target.value; save();
    $('#answer-progress').textContent = `已填写 ${session.answers.filter(x => x !== undefined && x.trim() !== '').length} / ${session.questions.length}`;
  });
  $('#session-dialog').addEventListener('keydown', event => { if (event.key === 'Enter' && event.target.matches('[data-answer]')) { event.preventDefault(); const next = $(`[data-answer="${Number(event.target.dataset.answer) + 1}"]`); (next || $('#finish-session')).focus(); } });
  $('#result-close').addEventListener('click', () => $('#result-dialog').close());
  $('#result-retry').addEventListener('click', () => {
    $('#result-dialog').close();
    if (!lastSession) return;
    const wrong = lastSession.review.filter(q => !q.correct);
    if (wrong.length) startSession('mistakes', wrong[0].topicId, wrong);
    else startSession(lastSession.mode === 'game' ? 'game' : 'practice', lastSession.topicId);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && session) tick(); });
  window.addEventListener('beforeunload', () => { if (session) { data.active = session; save(); } });
  const initialPage = location.hash.slice(1); if (initialPage in pageNames) page = initialPage;
  $('#date-chip').textContent = new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });
  hydrateIcons(); updateSound(); render(); save();
  if (data.active) {
    session = data.active;
    if (session.mode === 'game' && !session.options) session.options = session.questions.map(M.choices);
    openDialog('session-dialog'); renderSession(); startTicker();
  }
})();
