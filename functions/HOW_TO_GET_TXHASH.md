# 如何取得 Celo Sepolia txHash（真鏈測試用）

## 🎯 快速方法（推薦）

### 方法 1：使用 Self Playground（最簡單）

1. **打開 Self Playground**
   - Staging（測試用）：https://playground.staging.self.xyz/
   - Mainnet（真實）：https://playground.self.xyz/

2. **完成驗證流程**
   - 選擇「Celo Sepolia」網路
   - 用手機 Self App 掃描 QR Code
   - 完成驗證後，頁面會顯示 `txHash`（格式：`0x...`）

3. **複製 txHash**
   - 直接複製頁面上顯示的 `txHash`
   - 貼到你的測試命令中

---

### 方法 2：從 Blockscout 查找範例交易

1. **打開 Celo Sepolia Explorer**
   - https://celo-sepolia.blockscout.com/

2. **搜尋 Self 相關合約**
   - 在搜尋框輸入 Self Hub Contract 地址（如果已知）
   - 或直接瀏覽最近的交易列表

3. **複製 txHash**
   - 點擊任意交易
   - 複製頁面頂部的 `txHash`（`0x...`）

---

### 方法 3：使用你們的前端整合

如果你們已經整合了 Self SDK（`@selfxyz/core`），在驗證流程中：

```javascript
// 範例：使用 Self SDK 產生交易
const selfApp = new SelfAppBuilder({...}).build();
const result = await selfApp.verify();
const txHash = result.txHash; // 取得 txHash
```

---

### 方法 4：使用 Demo txHash（快速測試）

如果尚未有真實交易，可以用內建的 demo：

```bash
# Demo 成功（TW）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"DEMO_SUCCESS_TW"}'

# Demo 成功（US）
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"DEMO_SUCCESS_US"}'
```

---

### 方法 5：自訂固定 txHash（用 demoTxMap.json）

建立自訂映射，使用任意 `0x...` txHash：

1. **建立映射檔**
   ```bash
   cd functions
   cp demoTxMap.example.json demoTxMap.json
   ```

2. **編輯 `demoTxMap.json`**
   ```json
   [
     {
       "txHash": "0x你的自訂txHash（66字元）",
       "country": "TW",
       "age_verified": true,
       "ofac_checked": true,
       "sanctioned": false
     }
   ]
   ```

3. **測試**
   ```bash
   curl -X POST http://localhost:5500/api/self/verify-by-tx \
     -H "Content-Type: application/json" \
     -d '{"txHash":"0x你的自訂txHash"}'
   ```

---

## ✅ 驗證 txHash 格式

txHash 必須符合以下格式：
- 以 `0x` 開頭
- 總長度 66 字元（0x + 64 hex）
- 例如：`0x8412a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2`

---

## 🧪 測試流程

取得 txHash 後，依序測試：

### 1. 設定環境變數
```bash
cd functions
cp env.example .env
# 編輯 .env，確認 CELO_RPC_ENDPOINT=https://forno.celo-sepolia.celo-testnet.org
```

### 2. 啟動服務
```bash
npm run serve
```

### 3. 測試 API
```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x你的真實txHash"}' | jq .
```

### 4. 預期回應
```json
{
  "status": "verified",
  "txHash": "0x...",
  "country": "TW",
  "age_verified": true,
  "ofac_checked": true,
  "sanctioned": false,
  "source": "self.celo.sepolia",
  "explorerUrl": "https://celo-sepolia.blockscout.com/tx/0x..."
}
```

### 5. 前端測試
- 打開 `http://localhost:5500/self-onchain.html`
- 貼上 txHash → 送出驗證
- 應該看到「✅ 驗證成功：TW / 年齡已驗證 / 非 OFAC / 非制裁地區」

---

## ⚠️ 常見問題

### Q: 為什麼回傳 `RECEIPT_NOT_FOUND`？
**A:** 可能原因：
- txHash 輸入錯誤
- 交易尚未被確認（等待幾秒後重試）
- 交易在錯誤的網路（確認是 Celo Sepolia，非 mainnet）

### Q: 如何確認交易在 Sepolia？
**A:** 打開 Blockscout 檢查：
- 如果 `https://celo-sepolia.blockscout.com/tx/0x...` 能找到 → 正確
- 如果找不到，可能在 mainnet（用 `https://celoscan.io/tx/0x...` 檢查）

### Q: 如何快速產生一個測試 txHash？
**A:** 使用 demo 映射（方法 5）：
- 建立 `demoTxMap.json`
- 填入任意格式正確的 `0x...`（66字元）
- 即可立即測試完整流程

---

## 📝 下一步

取得真實 txHash 後，就可以：
1. ✅ 測試真鏈查詢（`/api/self/verify-by-tx`）
2. ✅ 驗證前端顯示（`self-onchain.html`）
3. 🔜 解析 Self 事件 ABI（從 `receipt.logs` 提取真實 `country/age_verified/ofac`）



