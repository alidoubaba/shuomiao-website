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

})();


// 首页 stats 入场动效（进入视口触发一次）
(function () {
  var st = document.querySelector('.stats');
  if (!st || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { st.classList.add('reveal'); io.disconnect(); } });
  }, { threshold: 0.3 });
  io.observe(st);
})();

// H5 提速：省流模式/慢速网络下移除跨页预取，把带宽留给当前页（admin5 0825）
(function () {
  try {
    var c = navigator.connection || {};
    if (c.saveData || /2g/i.test(c.effectiveType || '')) {
      document.querySelectorAll('link[rel="prefetch"]').forEach(function (l) { l.remove(); });
    }
  } catch (e) {}
})();

// 型号导航 scroll-spy：滚动高亮当前产品对应标签（admin5 0827 ui-ux-pro-max）
(function () {
  document.querySelectorAll('.model-nav').forEach(function (nav) {
    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var secs = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); }).filter(Boolean);
    if (secs.length < 2) return;
    var order = links.map(function (_, i) { return i; }).sort(function (a, b) { return secs[a].offsetTop - secs[b].offsetTop; });
    var sortedLinks = order.map(function (i) { return links[i]; });
    var sortedSecs = order.map(function (i) { return secs[i]; });
    var ticking = false;
    function update() {
      ticking = false;
      var y = window.scrollY + window.innerHeight * 0.35;
      var cur = -1;
      sortedSecs.forEach(function (s, i) { if (s.offsetTop <= y) cur = i; });
      sortedLinks.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      setTimeout(function () { ticking = false; update(); }, 80);
    }, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(update, 120); });
    update();
  });
})();

/* 首页产品模块 精选/展开（admin5 2026-08-27） */
(function () {
  var grid = document.getElementById('prodGrid');
  var btn = document.getElementById('prodExpand');
  if (!grid || !btn) return;
  btn.addEventListener('click', function () {
    var open = grid.classList.toggle('expanded');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? '收起产品列表' : '展开全部产品';
  });
})();
