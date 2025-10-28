// public/js/self-gate.js
//
// 這支腳本控制 Self Gate 頁面的互動流程：取得使用者輸入的
// proofData，送到後端進行驗證，並於成功後記錄兩筆日誌。

document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('btnVerify');
  const textarea = document.getElementById('proofInput');
  const status = document.getElementById('result');
  if (!button || !textarea || !status) return;

  button.addEventListener('click', async () => {
    status.textContent = '';
    const text = textarea.value.trim();
    if (!text) {
      alert('請貼上 proof JSON');
      return;
    }
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      alert('JSON 格式錯誤');
      return;
    }
    // 準備 payload。若 FLAGS.MOCK_VERIFICATION 為真，直接當作成功。
    const payload = { proofData: body.proofData || body, requirements: body.requirements || [] };
    let ok = false;
    let errorText = '';
    if (CONFIG.FLAGS.MOCK_VERIFICATION) {
      ok = true;
    } else {
      try {
        const resp = await fetch(CONFIG.API_BASE + CONFIG.VERIFY_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await resp.json();
        ok = Boolean(data && data.ok);
        if (!ok) errorText = data && data.message ? data.message : '驗證失敗';
      } catch (e) {
        ok = false;
        errorText = String(e);
      }
    }
    if (!ok) {
      status.style.color = '#b91c1c';
      status.textContent = '失敗：' + errorText;
      return;
    }
    // 生成雜湊並記錄日誌。使用固定條款字串做為範例。
    const termsText = 'RWA Demo Terms v1';
    const termsHash = await computeHash(termsText);
    const proofHash = await computeHash(sortedJson(payload.proofData));
    // 新增兩筆記錄：一筆代表條款，一筆代表 proof 本身
    await addLogEntry({ type: 'TERMS_HASHED', ref: 'terms:v1', hashValue: termsHash });
    await addLogEntry({ type: 'PROOF_ACCEPTED', ref: 'proof', hashValue: proofHash });
    status.style.color = '#15803d';
    status.textContent = '成功：已驗證並記錄日誌';
  });
});