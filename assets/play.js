// Click-to-play: a film's poster turns into the YouTube player only when pressed,
// from youtube-nocookie, so nothing loads from YouTube before that.
document.addEventListener('click', (event) => {
  const poster = event.target.closest('.poster[data-video]');
  if (!poster) return;
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(poster.dataset.video)}?autoplay=1&rel=0&cc_load_policy=1`;
  frame.title = poster.getAttribute('aria-label') || 'Film';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.className = 'player';
  poster.replaceWith(frame);
});
