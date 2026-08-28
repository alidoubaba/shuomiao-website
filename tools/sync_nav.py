#!/usr/bin/env python3
"""导航单源生成器（admin5 2026-08-26 要求组件化单源）。

nav 结构唯一维护处在本文件 CATEGORIES；运行 `python3 tools/sync_nav.py`
将全站 5 页的主导航整体重写为同一份，消除逐页手改导致的版本漂移
（0826 曾出现跨页老版导航）。同时断言全站 css 版本号唯一。

规则：
- 分类新增/改名只改 CATEGORIES；
- 锚点 id 必须存在于 products.html（脚本自动校验）；
- 改动 css/js 需带版本时仍手动 bump 各页 ?v=（脚本只断言一致性）。
"""
import glob
import os
import re
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- 单源：产品中心一级分类（admin5 0826 口径）----
CATEGORIES = [
    ('cat-gas', '01', '气体探测器', '点型 · 可燃 · 毒性'),
    ('cat-flame', '02', '火焰探测器', '红外 · 红紫外复合 · 紫外'),
    ('cat-portable', '03', '便携式气体探测器', '单一 · 四合一'),
    ('cat-gds', '04', 'GDS 系统', '总线 · 多线控制器'),
    ('cat-other', '05', '其它', '监护 · 成像 · VOCs'),
]

PAGES = ['index.html', 'products.html', 'about.html', 'data.html', 'contact.html']

NAV_TMPL = '''<nav class="nav" id="mainNav" aria-label="主导航">
      <a href="index.html">首页</a>
      <div class="nav-drop"><a href="products.html">产品中心</a>
        <div class="nav-mega" aria-label="产品分类">
          <div class="nm-cols">
{cats}
          </div>
        </div>
      </div>
      <a href="about.html">关于我们</a>
      <a href="data.html">技术资料</a>
      <a href="contact.html">联系我们</a>
    </nav>'''

CAT_TMPL = '            <a class="nm-cat" href="products.html#{cid}"><span class="nm-no">{no}</span>{name}<small>{sub}</small></a>'


def build_nav():
    cats = '\n'.join(CAT_TMPL.format(cid=c, no=n, name=nm, sub=s) for c, n, nm, s in CATEGORIES)
    return NAV_TMPL.format(cats=cats)


def main():
    # 锚点校验：分类 id 必须在 products.html 存在
    prod = open(os.path.join(BASE, 'products.html'), encoding='utf-8').read()
    ids = set(re.findall(r'id="([\w-]+)"', prod))
    missing = [c for c, _, _, _ in CATEGORIES if c not in ids]
    if missing:
        sys.exit('ERROR: 分类锚点在 products.html 缺失: %s' % missing)

    nav = build_nav()
    pat = re.compile(r'<nav class="nav" id="mainNav" aria-label="主导航">[\s\S]*?</nav>')
    for page in PAGES:
        p = os.path.join(BASE, page)
        s = open(p, encoding='utf-8').read()
        if not pat.search(s):
            sys.exit('ERROR: %s 未找到主导航块' % page)
        n = pat.sub(lambda m: nav, s, count=1)
        if n != s:
            open(p, 'w', encoding='utf-8').write(n)
            print('%s nav 已更新' % page)
        else:
            print('%s nav 无变化' % page)

    # css 版本唯一性断言（0825 版本断链教训）
    vers = set()
    for p in glob.glob(os.path.join(BASE, '*.html')):
        vers.update(re.findall(r'style\.min\.css\?v=(\S+)"', open(p, encoding='utf-8').read()))
    print('css 版本: %s' % (vers if len(vers) == 1 else '!!不一致!! ' + str(vers)))
    return 0 if len(vers) == 1 else 1


if __name__ == '__main__':
    sys.exit(main())
