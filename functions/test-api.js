// Node.js 版本測試腳本（不需要 jq）
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5500';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    console.log(`\n🧪 ${name}`);
    const result = await fn();
    console.log(`✅ 成功 (HTTP ${result.status})`);
    console.log(JSON.stringify(result.data, null, 2));
  } catch (e) {
    console.log(`❌ 失敗: ${e.message}`);
  }
}

async function run() {
  console.log('🧪 Self API 測試\n');
  console.log(`📡 Base URL: ${BASE_URL}\n`);

  await test('GET /api/self/health', () => request('GET', '/api/self/health'));

  await test('POST /api/self/verify-by-tx (Demo Success TW)', () =>
    request('POST', '/api/self/verify-by-tx', { txHash: 'DEMO_SUCCESS_TW' })
  );

  await test('POST /api/self/verify-by-tx (Demo Fail)', () =>
    request('POST', '/api/self/verify-by-tx', { txHash: 'DEMO_FAIL_NOT_FOUND' })
  );

  await test('POST /api/self/verify (帶 txHash)', () =>
    request('POST', '/api/self/verify', { txHash: 'DEMO_SUCCESS_TW' })
  );

  console.log('\n✅ 測試完成！\n');
  console.log('💡 提示：');
  console.log('   - 如果所有測試都失敗，請確認 emulator 是否運行：');
  console.log('     cd functions && npm run serve');
  console.log('   - 可設定 BASE_URL 環境變數測試不同環境');
}

run().catch(console.error);



