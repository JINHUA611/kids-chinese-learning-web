import { characters } from './data/characters.js';
import { createLearningStore } from './js/learning-store.js';
import { createMandarinSpeaker } from './js/speech.js';
import { renderCharacterImage } from './js/character-image.js';

const app = document.querySelector('#app');
const store = createLearningStore(window.localStorage);
const speakMandarin = createMandarinSpeaker();
const DAILY_GOAL = 5;
let session = null;

const icons = {
  learn: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 13c6-3 12-2 16 2 4-4 10-5 16-2v25c-6-3-12-2-16 2-4-4-10-5-16-2V13Z"/><path d="M24 15v25"/></svg>',
  review: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M39 19a16 16 0 1 0 1 12"/><path d="m33 11 7 8 3-10"/></svg>',
  known: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 41S7 32 7 19a9 9 0 0 1 17-4 9 9 0 0 1 17 4c0 13-17 22-17 22Z"/></svg>',
  progress: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 39V25h8v14M20 39V17h8v22M31 39V9h8v30"/></svg>'
};

function shell(content, options = {}) {
  const { back = false, title = '' } = options;
  app.innerHTML = `<div class="app-shell">
    <header class="topbar ${back ? '' : 'home-topbar'}">
      ${back ? '<button class="icon-button" data-route="home" aria-label="返回首页">←</button>' : '<div class="brand-mark" aria-hidden="true">小</div>'}
      <div class="topbar-title">${title || '<span>小小识字</span><small>快乐学习每一天</small>'}</div>
      ${back ? '<div class="topbar-spacer"></div>' : '<div class="sun-doodle" aria-hidden="true">☀</div>'}
    </header>
    <main>${content}</main>
  </div>`;
}

function renderHome() {
  session = null;
  const stats = store.getStats(characters);
  const isComplete = store.isLibraryComplete(characters);
  const today = store.getTodayCount(characters);
  const recent = store.getRecent(characters);
  shell(`<section class="hero">
      <div><p class="eyebrow">${isComplete ? '第一阶段完成啦！🎉' : '你好呀，小朋友！'}</p><h1>${isComplete ? `你已经完成当前全部 ${stats.total} 个汉字学习` : '今天继续识字吧 <span aria-hidden="true">🌱</span>'}</h1><p>${isComplete ? '当前字库已全部学完，可以继续扩充下一阶段字库。' : '每天认识一点点，汉字朋友越来越多。'}</p></div>
      <div class="cloud" aria-hidden="true"><span>人</span><span>山</span><span>水</span></div>
    </section>
    <section class="stats-row" aria-label="学习数据">
      ${statCard('已认识', stats.known, '个字', 'mint')}
      ${statCard('正在学习', stats.learning, '个字', 'peach')}
      ${statCard('今日学习', today, '个字', 'sky')}
    </section>
    <section class="section-block"><div class="section-heading"><h2>想做什么呢？</h2><span>点一点就开始</span></div>
      <div class="action-grid">
        ${actionCard('learn', '今日识字', '认识新的汉字朋友', '开始学习', 'yellow')}
        ${actionCard('review', '复习一下', '和学过的字再见面', '开始复习', 'green')}
        ${actionCard('known', '我认识的字', `已经认识 ${stats.known} 个字`, '去看看', 'pink')}
        ${actionCard('progress', '学习进度', `已经完成 ${stats.percent}%`, '看进度', 'blue')}
      </div>
    </section>
    <section class="recent-card"><div><p class="eyebrow">最近学习</p><h2>${recent.length ? '这些字还记得吗？' : '你的汉字旅程等你开始'}</h2></div>
      <div class="recent-chars">${recent.length ? recent.map(c => `<button data-character="${c.id}" aria-label="查看${c.char}字">${c.char}</button>`).join('') : '<span class="empty-hint">学过的字会出现在这里</span>'}</div>
    </section>`, { title: '' });
}

function statCard(label, number, unit, tone) {
  return `<article class="stat-card ${tone}"><span>${label}</span><strong>${number}</strong><small>${unit}</small></article>`;
}

function actionCard(route, title, subtitle, label, tone) {
  return `<button class="action-card ${tone}" data-route="${route}"><span class="action-icon">${icons[route]}</span><span class="action-copy"><strong>${title}</strong><small>${subtitle}</small></span><span class="action-link">${label}<b>→</b></span></button>`;
}

function startSession(mode) {
  let queue;
  if (mode === 'review') {
    queue = store.getReviewQueue(characters);
    if (!queue.length) return renderEmptyReview();
  } else {
    if (store.isLibraryComplete(characters)) return renderAllComplete();
    const unseen = characters.filter(c => !store.getRecord(c.id));
    queue = (unseen.length ? unseen : store.getPracticeQueue(characters)).slice(0, DAILY_GOAL);
  }
  session = { mode, queue, index: 0 };
  renderStudy();
}

function renderStudy() {
  const character = session.queue[session.index];
  const isReview = session.mode === 'review';
  shell(`<section class="study-layout">
    <div class="session-meta"><span class="mode-pill">${isReview ? '温故知新' : '今日识字'}</span><span>${session.index + 1} / ${session.queue.length}</span></div>
    <div class="mini-progress"><i style="width:${((session.index + 1) / session.queue.length) * 100}%"></i></div>
    <article class="character-card">
      <p>${isReview ? '还记得这个字吗？' : '请大声读一读'}</p>
      <div class="learning-visual">
        <button class="giant-character" data-speak="${character.id}" aria-label="${character.char}，${character.pinyin}">${character.char}</button>
        ${renderCharacterImage(character.image)}
      </div>
      <div class="pinyin">${character.pinyin}</div>
      <div class="word-chips" aria-label="点击词语听读音">${character.words.map(word => `<button type="button" data-speak="${word}" aria-label="朗读${word}">${word}<span aria-hidden="true">♪</span></button>`).join('')}</div>
      <small class="speak-hint">轻点汉字 · 听普通话读音</small>
    </article>
    <div class="decision-buttons">
      <button class="decision secondary" data-answer="learning"><span>↻</span><strong>再学学</strong><small>我们再见几次</small></button>
      <button class="decision primary" data-answer="known"><span>✓</span><strong>认识了</strong><small>真棒，继续前进</small></button>
    </div>
  </section>`, { back: true, title: isReview ? '复习一下' : '今日识字' });
}

function answer(status) {
  const current = session.queue[session.index];
  store.mark(current.id, status);
  if (session.index < session.queue.length - 1) {
    session.index += 1;
    renderStudy();
  } else renderComplete();
}

function renderComplete() {
  const stats = store.getStats(characters);
  shell(`<section class="center-message"><div class="celebrate">★</div><p class="eyebrow">完成啦</p><h1>今天表现得真棒！</h1><p>你已经认识 <strong>${stats.known}</strong> 个汉字朋友了。</p><button class="big-home-button" data-route="home">回到首页</button></section>`, { back: true, title: '学习完成' });
}

function renderEmptyReview() {
  shell(`<section class="center-message"><div class="celebrate">☁</div><h1>暂时没有需要复习的字</h1><p>继续认识新朋友吧！</p><button class="big-home-button" data-route="learn">去识字</button></section>`, { back: true, title: '复习一下' });
}

function renderAllComplete() {
  const total = characters.length;
  shell(`<section class="center-message"><div class="celebrate">★</div><p class="eyebrow">第一阶段完成啦！🎉</p><h1>全部汉字都认识了</h1><p>你已经完成当前全部 <strong>${total}</strong> 个汉字学习。</p><button class="big-home-button" data-route="home">回到首页</button></section>`, { back: true, title: '学习完成' });
}

function renderKnown(focusId) {
  const known = characters.filter(c => store.getRecord(c.id)?.status === 'known');
  const focus = focusId ? characters.find(c => c.id === focusId) : null;
  shell(`<section class="page-intro"><p class="eyebrow">我的汉字收藏</p><h1>我已经认识 <em>${known.length}</em> 个字</h1><p>每一个字，都是你努力的证明。</p></section>
    ${focus ? detailCard(focus) : ''}
    <section class="known-grid">${known.length ? known.map(c => `<button data-character="${c.id}" class="hanzi-tile"><strong>${c.char}</strong><small>${c.pinyin}</small></button>`).join('') : '<div class="empty-panel"><span>🌱</span><h2>这里还空空的</h2><p>去认识第一个汉字朋友吧！</p><button data-route="learn">开始识字</button></div>'}</section>`, { back: true, title: '我认识的字' });
}

function detailCard(c) {
  return `<article class="detail-card"><button class="detail-close" data-route="known" aria-label="关闭">×</button><strong>${c.char}</strong><div><h2>${c.pinyin}</h2><p>${c.words.join(' · ')}</p></div></article>`;
}

function renderProgress() {
  const s = store.getStats(characters);
  shell(`<section class="page-intro"><p class="eyebrow">一点一点在长大</p><h1>学习进度</h1><p>坚持每天认识几个汉字，慢慢就会读故事啦。</p></section>
    <section class="progress-overview"><div class="progress-ring" style="--progress:${s.percent * 3.6}deg"><div><strong>${s.percent}%</strong><small>整体进度</small></div></div>
      <div class="progress-copy"><h2>${s.known ? '又向前走了一步！' : '从第一个字开始吧！'}</h2><p>已认识 ${s.known} 个，共有 ${s.total} 个汉字朋友。</p><div class="wide-progress"><i style="width:${s.percent}%"></i></div></div>
    </section>
    <section class="progress-stats">
      ${progressStat('总字库', s.total, 'book')}${progressStat('已认识', s.known, 'check')}${progressStat('正在学习', s.learning, 'pencil')}${progressStat('未学习', s.unseen, 'seed')}
    </section>
    <button class="continue-button" data-route="learn">继续识字 <span>→</span></button>`, { back: true, title: '学习进度' });
}

function progressStat(label, number, icon) {
  const symbols = { book: '册', check: '✓', pencil: '✎', seed: '芽' };
  return `<article class="progress-stat ${icon}"><span>${symbols[icon]}</span><div><small>${label}</small><strong>${number}<i> 字</i></strong></div></article>`;
}

function navigate(route) {
  if (route === 'home') renderHome();
  if (route === 'learn') startSession('learn');
  if (route === 'review') startSession('review');
  if (route === 'known') renderKnown();
  if (route === 'progress') renderProgress();
}

app.addEventListener('click', event => {
  const route = event.target.closest('[data-route]')?.dataset.route;
  const answerValue = event.target.closest('[data-answer]')?.dataset.answer;
  const characterId = event.target.closest('[data-character]')?.dataset.character;
  const speakText = event.target.closest('[data-speak]')?.dataset.speak;
  if (route) navigate(route);
  else if (answerValue) answer(answerValue);
  else if (characterId) renderKnown(characterId);
  else if (speakText) speakMandarin(speakText);
});

renderHome();
