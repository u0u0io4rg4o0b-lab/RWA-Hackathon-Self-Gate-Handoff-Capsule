//js/nav.js（最小即用，純前端）
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;

  const ui = [];
  ui.push('<nav style="padding:8px 0; display:flex; gap:12px; flex-wrap:wrap;">');

  // ===== 主流程 =====
  ui.push('<span style="font-weight:700;">主流程</span>');
  ui.push('<a href="self-gate.html">Gate 流程頁</a>');
  ui.push('<a href="members.html">成員 VC</a>');
  ui.push('<a href="rent.html">租約雜湊</a>');
  ui.push('<a href="payout_verify.html">撥款前核驗</a>');
  ui.push('<a href="verify.html">日誌驗鏈</a>');

  // 分隔
  ui.push('<span style="opacity:.45;">|</span>');

  // ===== 延伸治理 =====
  ui.push('<span style="font-weight:700;">延伸治理</span>');
  ui.push('<a href="anchor.html">文件雜湊</a>');
  ui.push('<a href="bylaws.html">章程建議</a>');
  ui.push('<a href="meetings.html">會議決議</a>');
  ui.push('<a href="milestones.html">里程驗證</a>');

  ui.push('</nav><hr/>');
  nav.innerHTML = ui.join('');

  // 建議插入在 nav.js 最後一行 innerHTML 之後
const here = location.pathname.split('/').pop();
nav.querySelectorAll('a').forEach(a=>{
  const key = a.getAttribute('href');
  if (key && key.endsWith(here)) { a.style.fontWeight = '700';a.style.textDecoration = 'underline'; }
  
});

})();
