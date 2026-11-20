// Films play only when pressed, from youtube-nocookie, so nothing loads from YouTube before that.
const ROOT = document.body.dataset.root || './';
const embed = (id) => `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&cc_load_policy=1`;

function frameFor(id, title) {
  const frame = document.createElement('iframe');
  frame.src = embed(id);
  frame.title = title || 'Film';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.className = 'player';
  return frame;
}

// Plays a film in the large player at the top of the page.
function playOnStage(stage, a) {
  stage.querySelector('.poster, .player').replaceWith(frameFor(a.dataset.video, a.dataset.title));
  stage.classList.add('playing');
  stage.querySelector('[data-stage-title]').textContent = a.dataset.title;
  stage.querySelector('[data-stage-date]').textContent = a.dataset.date;
  stage.querySelector('[data-stage-link]').href = a.href;
  const blurb = stage.querySelector('[data-stage-blurb]');
  if (blurb) blurb.hidden = true;
  document.querySelectorAll('.row a.now').forEach((x) => x.classList.remove('now'));
  document.querySelectorAll(`.row a[data-id="${CSS.escape(a.dataset.id)}"]`).forEach((x) => x.classList.add('now'));
  stage.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.addEventListener('click', (event) => {
  const poster = event.target.closest('.poster[data-video]');
  if (poster) {
    const stage = poster.closest('[data-stage]');
    poster.replaceWith(frameFor(poster.dataset.video, poster.getAttribute('aria-label')));
    if (stage) { stage.classList.add('playing'); const blurb = stage.querySelector('[data-stage-blurb]'); if (blurb) blurb.hidden = true; }
    return;
  }
  const a = event.target.closest('.row a[data-video]');
  const stage = document.querySelector('[data-stage]');
  if (a && stage && !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0) { event.preventDefault(); playOnStage(stage, a); }
});

// Menus: one open at a time; a click elsewhere, or on a link inside, closes them.
document.addEventListener('toggle', (event) => {
  const m = event.target;
  if (m.classList && m.classList.contains('menu') && m.open) document.querySelectorAll('details.menu[open]').forEach((o) => { if (o !== m) o.open = false; });
}, true);
document.addEventListener('click', (event) => {
  const inside = event.target.closest('details.menu');
  document.querySelectorAll('details.menu[open]').forEach((o) => { if (o !== inside || event.target.closest('.drop a')) o.open = false; });
});

// Tabs: one view at a time.
function showTab(box, name) {
  const btn = box && box.querySelector(`[data-tab="${name}"]`);
  if (!btn) return;
  box.querySelectorAll('[data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
  box.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
}
document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-tabs] [data-tab]');
  if (btn) showTab(btn.closest('[data-tabs]'), btn.dataset.tab);
});

// "All films": the type sub-tabs and the topic chips filter the list together. A chip
// shows how many films it has within the chosen type, and hides when it has none.
function filterAll() {
  const list = document.querySelector('[data-all]');
  if (!list) return;
  const typeBtn = document.querySelector('[data-type-filter] [aria-selected="true"]');
  const type = typeBtn ? typeBtn.dataset.sub : '';
  const chips = document.querySelector('[data-chips]');
  const pressed = chips && chips.querySelector('[aria-pressed="true"]');
  const topic = pressed ? pressed.dataset.topic : '';
  const inType = [...list.children].filter((li) => !type || li.dataset.type === type);
  let shown = 0;
  for (const li of list.children) {
    const hit = inType.includes(li) && (!topic || li.dataset.topics.split(' ').includes(topic));
    li.hidden = !hit;
    if (hit) shown += 1;
  }
  if (chips) {
    for (const c of chips.querySelectorAll('[data-topic]')) {
      const n = c.dataset.topic ? inType.filter((li) => li.dataset.topics.split(' ').includes(c.dataset.topic)).length : inType.length;
      const count = c.querySelector('span');
      if (count) count.textContent = n;
      c.hidden = !!c.dataset.topic && !n && c !== pressed;
    }
  }
  const none = document.querySelector('[data-none]');
  if (none) none.hidden = shown > 0;
}
function pickTopic(key) {
  const chips = document.querySelector('[data-chips]');
  if (chips) chips.querySelectorAll('[data-topic]').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.topic === key)));
  filterAll();
}
document.addEventListener('click', (event) => {
  const chip = event.target.closest('[data-chips] [data-topic]');
  if (chip) pickTopic(chip.dataset.topic);
});

// Sub-tabs: narrow a view to one family of series, one type or one section.
// When only a few groups are left, they open.
document.addEventListener('click', (event) => {
  const btn = event.target.closest('[data-subtabs] [data-sub]');
  if (!btn) return;
  const bar = btn.closest('[data-subtabs]');
  bar.querySelectorAll('[data-sub]').forEach((b) => b.setAttribute('aria-selected', String(b === btn)));
  if (bar.hasAttribute('data-type-filter')) { filterAll(); return; }
  const key = btn.dataset.sub;
  const items = [...bar.parentElement.children].filter((el) => el !== bar && el.dataset.sub !== undefined);
  const shown = items.filter((el) => !key || el.dataset.sub === key);
  items.forEach((el) => { el.hidden = !shown.includes(el); });
  if (key && shown.length <= 3) shown.forEach((el) => { if (el.tagName === 'DETAILS') el.open = true; });
});

// A link to a series (#key) or to a topic (?topic=key#all) opens that view.
function openFromLocation() {
  const id = decodeURIComponent(location.hash.slice(1));
  const topic = new URLSearchParams(location.search).get('topic');
  const box = document.querySelector('.films[data-tabs]');
  const el = id && document.getElementById(id);
  if (el && el.tagName === 'DETAILS') {
    const panel = el.closest('[data-panel]');
    if (panel) showTab(box, panel.dataset.panel);
    el.open = true;
    el.scrollIntoView({ block: 'start' });
  } else if (id === 'all' || id === 'films' || topic) {
    if (id === 'all' || topic) showTab(box, 'all');
    if (topic) pickTopic(topic);
    const target = box || document.getElementById('films');
    if (target) target.scrollIntoView({ block: 'start' });
  }
}
window.addEventListener('hashchange', openFromLocation);
document.addEventListener('DOMContentLoaded', openFromLocation);

// The header search: films, series, sections and briefs, from assets/search.json.
document.addEventListener('DOMContentLoaded', () => {
  const box = document.querySelector('[data-find]');
  const list = document.querySelector('[data-found]');
  if (!box) return;
  let index = null;
  let pos = -1;
  const load = () => index || (index = fetch(`${ROOT}assets/search.json`).then((r) => r.json()).catch(() => []));
  const href = (u) => (/^https?:/.test(u) ? u : ROOT + u);
  async function update() {
    const words = box.value.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) { list.hidden = true; return; }
    const all = await load();
    const hits = all.filter((e) => words.every((w) => e.q.includes(w) || e.t.toLowerCase().includes(w))).slice(0, 12);
    list.innerHTML = '';
    pos = -1;
    if (!hits.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'Nothing matches that search.'; list.append(li); }
    for (const h of hits) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href(h.u);
      a.textContent = h.t;
      const k = document.createElement('small');
      k.textContent = h.k;
      a.append(k);
      li.append(a);
      list.append(li);
    }
    list.hidden = false;
  }
  box.addEventListener('focus', load);
  box.addEventListener('input', update);
  box.addEventListener('keydown', (e) => {
    const links = [...list.querySelectorAll('a')];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!links.length) return;
      pos = (pos + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
      links.forEach((l, i) => l.classList.toggle('on', i === pos));
    } else if (e.key === 'Enter' && links.length) {
      location.href = links[Math.max(pos, 0)].href;
    } else if (e.key === 'Escape') { list.hidden = true; }
  });
  document.addEventListener('click', (e) => { if (!e.target.closest('.find')) list.hidden = true; });
});

// Analytics, only on a build with a Google Analytics id. The head sets the consent defaults to denied
// and loads the tag only after a yes. The visitor's choice is kept in localStorage; with no choice
// yet, the notice shows.
(() => {
  const box = document.querySelector('[data-consent]');
  if (!box || typeof window.hubAnalytics !== 'function') return;
  const KEY = 'hub-analytics';
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) { /* private window: ask each visit */ }
  if (choice !== 'yes' && choice !== 'no') box.hidden = false;
  const choose = (yes) => {
    try { localStorage.setItem(KEY, yes ? 'yes' : 'no'); } catch (e) { /* not kept */ }
    if (yes) window.hubAnalytics();
    else {
      if (window.hubAnalyticsOn) window.gtag('consent', 'update', { analytics_storage: 'denied' });
      window.hubAnalyticsOn = false;
      // A no after an earlier yes removes the cookies the yes allowed.
      for (const c of document.cookie.split(';')) {
        const name = c.split('=')[0].trim();
        if (name.startsWith('_ga')) for (const d of ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${d}`;
      }
    }
    box.hidden = true;
  };
  box.querySelector('[data-consent-yes]').addEventListener('click', () => choose(true));
  box.querySelector('[data-consent-no]').addEventListener('click', () => choose(false));
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-consent-open]')) { box.hidden = false; box.querySelector('[data-consent-yes]').focus(); }
  });

  // Events: a film played here, a link out to YouTube, and a link out to one of our sites.
  const OURS = ['rutba.io', 'tech-style.co', 'trustlist.uk', 'paritas.tech', 'rutba.pk'];
  const send = (name, params) => { if (window.hubAnalyticsOn) window.gtag('event', name, params); };
  document.addEventListener('click', (e) => {
    const play = e.target.closest('.poster[data-video], .row a[data-video]');
    if (play) {
      send('film_play', { video_id: play.dataset.video, film_title: play.dataset.title || (play.getAttribute('aria-label') || '').replace(/^Play /, '') });
      return;
    }
    const a = e.target.closest('a[href]');
    if (!a) return;
    let u;
    try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.hostname === location.hostname) return;
    const host = u.hostname.replace(/^www\./, '');
    const text = (a.dataset.title || a.textContent || '').trim().slice(0, 100);
    if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) send('film_link_click', { link_url: u.href, link_domain: host, film_title: a.dataset.title || (document.querySelector('h1') || {}).textContent || text });
    else if (OURS.some((d) => host === d || host.endsWith(`.${d}`))) send('our_site_click', { link_url: u.href, link_domain: host, link_text: text });
  }, true);
})();
