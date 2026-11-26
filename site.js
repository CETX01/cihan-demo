(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // Ölçü çizimi: görünür olunca kendini çizer
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var draws = $$('[data-draw]');
  if (draws.length && !reduce && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.35 });
    draws.forEach(function (d) { d.classList.add('anim'); io.observe(d); });
  }

  // Ana sayfa slaytları (A ve B): otomatik geçiş, ilerleme çizgisi bitince olur
  $$('[data-slider]').forEach(function (slider) {
    var slides = $$('[data-slide]', slider), dots = $$('[data-go]', slider), pauseBtn = $('[data-pause]', slider), slCount = $('[data-count]', slider), cur = 0, userPaused = !!reduce;
    if (!slides.length) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var fill = function () { return dots.length ? $('[data-go][aria-current] [data-fill]', slider) : $('[data-fill]', slider); };
    var show = function (n) {
      cur = (n + slides.length) % slides.length;
      slides.forEach(function (sl, i) { var on = i === cur; sl.classList.toggle('is-active', on); if (on) { sl.removeAttribute('inert'); sl.removeAttribute('aria-hidden'); } else { sl.setAttribute('inert', ''); sl.setAttribute('aria-hidden', 'true'); } });
      dots.forEach(function (d, i) { if (i === cur) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (slCount) slCount.textContent = pad(cur + 1);
      var f = fill(); if (f) { f.style.animation = 'none'; void f.offsetWidth; f.style.animation = ''; }
    };
    var setPaused = function (p) { userPaused = p; if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', p ? 'true' : 'false'); pauseBtn.setAttribute('aria-label', p ? 'Otomatik geçişi başlat' : 'Otomatik geçişi durdur'); } slider.classList.toggle('playing', !p); };
    $$('[data-fill]', slider).forEach(function (f) { f.addEventListener('animationend', function () { if (!userPaused && f === fill()) show(cur + 1); }); });
    var prev = $('[data-prev]', slider), next = $('[data-next]', slider);
    if (prev) prev.addEventListener('click', function () { show(cur - 1); });
    if (next) next.addEventListener('click', function () { show(cur + 1); });
    dots.forEach(function (d) { d.addEventListener('click', function () { show(+d.getAttribute('data-go')); }); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!userPaused); });
    var hold = function (on) { slider.classList.toggle('hold', on); };
    slider.addEventListener('mouseenter', function () { hold(true); });
    slider.addEventListener('mouseleave', function () { hold(slider.contains(document.activeElement)); });
    slider.addEventListener('focusin', function () { hold(true); });
    slider.addEventListener('focusout', function (e) { if (!slider.contains(e.relatedTarget)) hold(slider.matches(':hover')); });
    slider.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') show(cur + 1); else if (e.key === 'ArrowLeft') show(cur - 1); });
    var x0 = null;
    slider.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
    setPaused(userPaused); show(0);
  });
  requestAnimationFrame(function () { document.documentElement.classList.add('sl-ready'); });

  // Sekmeli öne çıkan ürünler
  $$('[data-tabs]').forEach(function (list) {
    var tabs = $$('[role=tab]', list);
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var sel = function (i, focus) {
      tabs.forEach(function (t, k) { var on = k === i; t.setAttribute('aria-selected', on ? 'true' : 'false'); t.tabIndex = on ? 0 : -1; panels[k].hidden = !on; panels[k].classList.toggle('is-in', on); });
      if (focus) tabs[i].focus();
    };
    panels.forEach(function (p) { if (p.hasAttribute('data-hide')) p.hidden = true; });
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { sel(i); });
      t.addEventListener('keydown', function (e) {
        var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (n === undefined) return; e.preventDefault(); sel((n + tabs.length) % tabs.length, true);
      });
    });
  });

  // Mobil menü
  var toggle = $('#nav-toggle'), nav = $('#ana-menu');
  if (toggle && nav) {
    var setOpen = function (open) { nav.classList.toggle('open', open); toggle.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
  }

  // Deneme sürümünde dosyası bağlı olmayan indirme bağlantıları
  var toast = $('#toast'), toastTimer;
  $$('[data-demo]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!toast) return;
      toast.textContent = 'Deneme sürümü: bu dosya henüz bağlı değil.';
      toast.hidden = false; clearTimeout(toastTimer);
      toastTimer = setTimeout(function () { toast.hidden = true; }, 4000);
    });
  });

  // Ürün ailesi süzgeci
  var chips = $$('.fchip'), cards = $$('#urun-listesi .pcard'), count = $('#filter-count');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.getAttribute('data-filter'), n = 0;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      cards.forEach(function (card) { var show = f === '*' || card.getAttribute('data-sec') === f; card.hidden = !show; if (show) n++; });
      if (count) count.textContent = n + ' ürün';
    });
  });

  // İletişim formu
  var form = $('#iletisim-formu');
  if (form) {
    var status = $('#form-durum'), button = $('#gonder'), sent = false;
    var rules = {
      ad: function (v) { return v.trim().length >= 2 ? '' : 'Adınızı ve soyadınızı yazın.'; },
      eposta: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Geçerli bir e-posta adresi yazın (örnek: ad@firma.com).'; },
      konu: function (v) { return v ? '' : 'Bir konu seçin.'; },
      mesaj: function (v) { return v.trim().length >= 10 ? '' : 'Mesajınızı en az 10 karakter olacak şekilde yazın.'; }
    };
    var check = function (id) {
      var el = $('#' + id), err = $('#' + id + '-hata'), msg = rules[id](el.value);
      el.setAttribute('aria-invalid', msg ? 'true' : 'false'); err.textContent = msg; err.hidden = !msg;
      return !msg;
    };
    Object.keys(rules).forEach(function (id) {
      var el = $('#' + id); el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', function () { if ($('#' + id).getAttribute('aria-invalid') === 'true') check(id); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sent) return;
      var bad = Object.keys(rules).filter(function (id) { return !check(id); });
      if (bad.length) { status.hidden = true; $('#' + bad[0]).focus(); return; }
      sent = true; button.disabled = true;
      var blocked = $('#website').value !== '';
      status.setAttribute('data-state', blocked ? 'blocked' : 'demo');
      status.textContent = blocked ? 'Mesajınız alınamadı. Lütfen telefonla ulaşın.' : 'Deneme sürümü: form henüz bir sunucuya bağlı değil, mesajınız gönderilmedi. Bilgileriniz doğru biçimde dolduruldu.';
      status.hidden = false;
    });
  }
})();

// 3D ürün görünümü: bölüm ekrana gelince model-viewer yüklenir, hazır olunca fotoğrafın yerini alır
(function () {
  var st = document.querySelector('[data-studio]');
  if (!st) return;
  var stage = st.querySelector('[data-stage]'), canvas = st.querySelector('[data-canvas]'), status = st.querySelector('[data-status]');
  var controls = st.querySelector('[data-controls]'), load = st.querySelector('[data-load]'), poster = st.querySelector('.studio-poster');
  var rot = st.querySelector('[data-act="rotate"]'), mv = null, started = false;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var say = function (t) { status.textContent = t; status.hidden = !t; };
  var fail = function (t) { say(t); load.hidden = false; started = false; };
  function start() {
    if (location.protocol === 'file:') { say('3D görünüm, dosya çift tıklanarak açıldığında çalışmaz; site sunucudan açılınca görünür.'); return; }
    if (started) return; started = true; load.hidden = true; say('3D model yükleniyor…');
    self.ModelViewerElement = self.ModelViewerElement || {}; self.ModelViewerElement.meshoptDecoderLocation = '3d/meshopt_decoder.js';
    import('./3d/model-viewer.min.js').then(function () { return customElements.whenDefined('model-viewer'); }).then(function () {
      mv = document.createElement('model-viewer');
      [['alt', st.dataset.alt], ['camera-controls', ''], ['touch-action', 'pan-y'], ['interaction-prompt', 'none'], ['camera-orbit', st.dataset.orbit],
       ['environment-image', 'neutral'], ['shadow-intensity', '.6'], ['shadow-softness', '.9'], ['exposure', '1'], ['rotation-per-second', '12deg']]
        .forEach(function (a) { mv.setAttribute(a[0], a[1]); });
      if (!reduce) mv.setAttribute('auto-rotate', ''); else rot.setAttribute('aria-pressed', 'false');
      mv.addEventListener('load', function () { say(''); controls.hidden = false; st.classList.add('is-3d'); }, { once: true });
      mv.addEventListener('error', function () { fail('3D model açılamadı.'); });
      canvas.appendChild(mv); mv.src = st.dataset.src;
    }).catch(function () { fail('3D görüntüleyici açılamadı.'); });
  }
  st.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]'); if (!b || !mv) return;
    var a = b.getAttribute('data-act');
    if (a === 'rotate') { var on = mv.toggleAttribute('auto-rotate'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    if (a === 'reset') { mv.cameraOrbit = st.dataset.orbit; mv.cameraTarget = 'auto auto auto'; mv.fieldOfView = 'auto'; mv.jumpCameraToGoal(); }
    if (a === 'full') { if (document.fullscreenElement) document.exitFullscreen(); else if (stage.requestFullscreen) stage.requestFullscreen().catch(function () {}); }
  });
  load.addEventListener('click', start);
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (x) { return x.isIntersecting; })) { io.disconnect(); start(); } }, { rootMargin: '200px' });
    io.observe(stage);
  } else start();
})();
