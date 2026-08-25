// 硕秒科技官网 · 交互脚本（移动端菜单 / 数据表筛选 / 回到顶部 / 当前页高亮）
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('mainNav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.classList.remove('open'); }
    });
  }

  // 当前页导航高亮
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
  });

  // 数据表筛选（data.html）
  var filter = document.getElementById('gasFilter');
  if (filter) {
    var tables = document.querySelectorAll('table[data-filterable]');
    var hint = document.getElementById('filterHint');
    filter.addEventListener('input', function () {
      var q = filter.value.trim().toLowerCase();
      var shown = 0;
      tables.forEach(function (t) {
        t.querySelectorAll('tbody tr').forEach(function (tr) {
          var hit = !q || tr.textContent.toLowerCase().indexOf(q) !== -1;
          tr.style.display = hit ? '' : 'none';
          if (hit) shown++;
        });
      });
      if (hint) hint.textContent = q ? '匹配 ' + shown + ' 条记录' : '';
    });
  }

  // 回到顶部
  var top = document.querySelector('.to-top');
  if (top) {
    window.addEventListener('scroll', function () {
      top.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // 年份
  document.querySelectorAll('.js-year').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // 首页主图轮播（成像示意 + 三款主营产品）
  var hc = document.getElementById('heroCarousel');
  if (hc) {
    var slides = Array.prototype.slice.call(hc.querySelectorAll('.hc-link'));
    var dots = Array.prototype.slice.call(hc.querySelectorAll('.hc-dots button'));
    var tag = document.getElementById('heroTag');
    var caps = ['气体检漏光谱成像仪 · 气云成像示意', 'TF900 · 点型气体探测器', 'X-4 · 四合一气体检测仪', 'Ex-IPgas M10 · 气体检漏光谱成像仪'];
    var cur = 0, timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) {
      cur = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === cur); d.setAttribute('aria-selected', k === cur ? 'true' : 'false'); });
      if (tag) tag.textContent = caps[cur] || '';
    }
    function play() { timer = setInterval(function () { show(cur + 1); }, 4000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { stop(); show(k); if (!reduced) play(); }); });
    // 仅真实鼠标悬停时暂停；触屏点按不会误停自动轮播
    hc.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') stop(); });
    hc.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !reduced && !timer) play(); });
    if (!reduced) play();
  }

  // 产品主图轮播（产品图 + 样本示意图，多图自动切换）
  document.querySelectorAll('.pc-carousel').forEach(function (box) {
    var slides = Array.prototype.slice.call(box.querySelectorAll('.pc-slide'));
    if (slides.length < 2) return;
    var dots = Array.prototype.slice.call(box.querySelectorAll('.pc-dots button'));
    var cap = box.closest('figure') ? box.closest('figure').querySelector('figcaption') : null;
    var cur = 0, timer = null;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function show(i) {
      cur = ((i % slides.length) + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('on', k === cur); });
      dots.forEach(function (d, k) { d.classList.toggle('on', k === cur); d.setAttribute('aria-selected', k === cur ? 'true' : 'false'); });
      if (cap) cap.textContent = slides[cur].getAttribute('data-cap') || cap.textContent;
    }
    function play() { timer = setInterval(function () { show(cur + 1); }, 4000); }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    dots.forEach(function (d, k) { d.addEventListener('click', function () { stop(); show(k); if (!reduced) play(); }); });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') stop(); });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse' && !reduced && !timer) play(); });
    if (!reduced) play();
  });

  // 手机端规格表 4列 -> 2列（label|value），避免窄屏挤压换行
  function collapseSpecTables() {
    var narrow = window.matchMedia('(max-width: 600px)').matches;
    document.querySelectorAll('table.spec').forEach(function (t) {
      if (narrow && !t.dataset.split) {
        t.dataset.split = '1';
        t.querySelectorAll('tr').forEach(function (tr) {
          var cells = tr.children;
          if (cells.length === 4) {
            var second = document.createElement('tr');
            second.appendChild(cells[2].cloneNode(true));
            second.appendChild(cells[3].cloneNode(true));
            tr.parentNode.insertBefore(second, tr.nextSibling);
            tr.removeChild(cells[3]); tr.removeChild(cells[2]);
          }
        });
      }
    });
  }
  collapseSpecTables();

  // 产品跳转条：点击/滚动联动，高亮并自动居中当前标签
  var jump = document.querySelector('.prod-jump');
  if (jump) {
    var inner = jump.querySelector('.inner');
    var links = Array.prototype.slice.call(jump.querySelectorAll('a'));
    var sections = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
    // 目标区块缺失的标签整组跳过，防止排序比较器抛错
    var bad = links.map(function (_, i) { return i; }).filter(function (i) { return !sections[i]; });
    bad.reverse().forEach(function (i) { links.splice(i, 1); sections.splice(i, 1); });
    // 按文档位置排序，保证滚动联动与页面顺序一致
    var order = links.map(function (_, i) { return i; }).sort(function (a, b) { return sections[a].offsetTop - sections[b].offsetTop; });
    links = order.map(function (i) { return links[i]; });
    sections = order.map(function (i) { return sections[i]; });
    var centered = -1;
    var lockUntil = 0, lockTarget = -1;
    function center(a) {
      inner.scrollTo({ left: a.offsetLeft - (inner.clientWidth - a.offsetWidth) / 2, behavior: 'smooth' });
    }
    function setActive(i) {
      links.forEach(function (a, k) { a.classList.toggle('active', k === i); });
      if (i !== centered) { centered = i; center(links[i]); }
    }
    function update() {
      if (lockTarget >= 0) {
        if (Math.abs(window.scrollY - lockTarget) > 8 && Date.now() < lockUntil) return;
        lockTarget = -1;
      }
      var y = window.scrollY + window.innerHeight * 0.3;
      var cur = -1;
      sections.forEach(function (s, i) { if (s && s.offsetTop <= y) cur = i; });
      if (cur < 0) cur = 0;
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 60) cur = links.length - 1;
      setActive(cur);
    }
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      setTimeout(function () { ticking = false; update(); }, 60);
    }, { passive: true });
    links.forEach(function (a, i) {
      a.addEventListener('click', function () {
        lockTarget = sections[i].offsetTop - 140;
        lockUntil = Date.now() + 1600;
        setActive(i);
      });
    });
    update();
  }
})();

// 首页全线布局：默认 9 款，按钮展开全部（admin5 2026-08-25）
document.querySelectorAll('.prod-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var grid = document.querySelector('.prod-grid');
    if (!grid) return;
    var open = grid.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '收起 ↑' : '查看全部产品 ↓';
  });
});

// 手册翻页书 v2（admin5 0825）：翻页 + 滚轮/双指/按钮缩放 + 拖拽平移
document.querySelectorAll('.flipbook').forEach(function (book) {
  var viewport = book.querySelector('.fb-viewport');
  var pagesEl = book.querySelector('.fb-pages');
  var pages = Array.prototype.slice.call(book.querySelectorAll('.fb-page'));
  var num = book.querySelector('.fb-num b');
  var zoomEl = book.querySelector('.fb-zoom');
  var prev = book.querySelector('.fb-prev');
  var next = book.querySelector('.fb-next');
  var zin = book.querySelector('.fb-zoom-in');
  var zout = book.querySelector('.fb-zoom-out');
  var cur = 0, zoom = 1, px = 0, py = 0;
  function apply() {
    pagesEl.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(' + zoom + ')';
    viewport.classList.toggle('zoomed', zoom > 1);
    if (zoomEl) zoomEl.textContent = zoom.toFixed(1) + 'x';
  }
  function setZoom(z) {
    z = Math.max(1, Math.min(4, Math.round(z * 10) / 10));
    if (z === 1) { px = 0; py = 0; }
    zoom = z; apply();
  }
  function show(i) {
    cur = Math.max(0, Math.min(pages.length - 1, i));
    pages.forEach(function (p, k) { p.classList.toggle('on', k === cur); });
    if (num) num.textContent = cur + 1;
    prev.disabled = cur === 0;
    next.disabled = cur === pages.length - 1;
  }
  prev.addEventListener('click', function (e) { e.stopPropagation(); show(cur - 1); });
  next.addEventListener('click', function (e) { e.stopPropagation(); show(cur + 1); });
  if (zin) zin.addEventListener('click', function (e) { e.stopPropagation(); setZoom(zoom + 0.5); });
  if (zout) zout.addEventListener('click', function (e) { e.stopPropagation(); setZoom(zoom - 0.5); });
  viewport.addEventListener('wheel', function (e) {
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18));
  }, { passive: false });
  viewport.addEventListener('click', function (e) {
    if (zoom > 1) return;
    var r = viewport.getBoundingClientRect();
    (e.clientX - r.left) > r.width / 2 ? show(cur + 1) : show(cur - 1);
  });
  viewport.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1); }
    if (e.key === '+' || e.key === '=') setZoom(zoom + 0.5);
    if (e.key === '-') setZoom(zoom - 0.5);
    if (e.key === '0') setZoom(1);
  });
  // 拖拽平移（放大态）
  var drag = null;
  viewport.addEventListener('pointerdown', function (e) {
    if (zoom <= 1 || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, px: px, py: py };
    try { viewport.setPointerCapture(e.pointerId); } catch (err) {}
  });
  viewport.addEventListener('pointermove', function (e) {
    if (!drag) return;
    px = drag.px + (e.clientX - drag.x); py = drag.py + (e.clientY - drag.y);
    pagesEl.style.transform = 'translate(' + px + 'px,' + py + 'px) scale(' + zoom + ')';
  });
  viewport.addEventListener('pointerup', function () { drag = null; });
  // 双指缩放
  function dist(t) { return Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY); }
  var pinch = null;
  viewport.addEventListener('touchstart', function (e) {
    if (e.touches.length === 2) pinch = { d: dist(e.touches), z: zoom };
  }, { passive: true });
  viewport.addEventListener('touchmove', function (e) {
    if (pinch && e.touches.length === 2) { e.preventDefault(); setZoom(pinch.z * dist(e.touches) / pinch.d); }
  }, { passive: false });
  viewport.addEventListener('touchend', function () { pinch = null; });
  // 单指滑动翻页（原态）
  var sx = null;
  viewport.addEventListener('touchstart', function (e) { if (e.touches.length === 1) sx = e.touches[0].clientX; }, { passive: true });
  viewport.addEventListener('touchend', function (e) {
    if (sx === null || zoom > 1) { sx = null; return; }
    var dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 40) { dx < 0 ? show(cur + 1) : show(cur - 1); }
    sx = null;
  });
  show(0); apply();
});

// 手册封面满屏弹窗（admin5 2026-08-25）：点封面打开 modal，ESC/遮罩/×关闭
document.querySelectorAll('[data-modal]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var m = document.getElementById(btn.getAttribute('data-modal'));
    if (!m) return;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    var vp = m.querySelector('.fb-viewport');
    if (vp) vp.focus();
  });
});
document.querySelectorAll('.fb-modal').forEach(function (m) {
  m.addEventListener('click', function (e) {
    if (e.target.closest('[data-close]')) {
      m.hidden = true; document.body.style.overflow = '';
    }
  });
});
document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.fb-modal:not([hidden])').forEach(function (m) { m.hidden = true; });
  document.body.style.overflow = '';
});
