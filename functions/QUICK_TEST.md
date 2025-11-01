# 快速測試指南

## ✅ 已完成設定

1. `.env` 已建立（在 `functions/.env`）
2. RPC 連線正常（health check 成功）
3. Emulator 已重啟

## 📝 請手動更新 `.env`

因為 `.env` 檔案被 `.gitignore` 保護，請手動編輯：

```bash
cd functions
nano .env  # 或使用你喜歡的編輯器
```

將以下行：
```
CELO_RPC_ENDPOINT=https://forno.celo-sepolia.celo-testnet.org
```

改為：
```
CELO_RPC_ENDPOINT=https://celo-sepolia.blockpi.network/v1/rpc/public
SELF_ENV=sepolia
```

## 🔄 重啟 Emulator

更新 `.env` 後，重啟 emulator 以載入新設定：

```bash
# 停止舊的
pkill -f "firebase emulators:start"

# 重新啟動
cd functions
npm run serve
```

## 🧪 測試真實 txHash

### 1. 取得真實 Sepolia txHash

- **使用 Self Playground**：https://playground.staging.self.xyz/
  - 選擇「Celo Sepolia」
  - 完成驗證後取得 `txHash`

- **或從 Blockscout 找範例**：
  - https://celo-sepolia.blockscout.com/
  - 瀏覽最近的交易，複製任意 `txHash`

### 2. 測試 API

```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0x你的真實Sepolia_txHash"}' | jq .
```

### 3. 預期回應

**成功（找到交易）：**
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

**失敗（找不到交易）：**
```json
{
  "status": "invalid",
  "txHash": "0x...",
  "reason": "RECEIPT_NOT_FOUND"
}
```

## 🎯 測試 Demo txHash（快速驗證）

如果尚未有真實 txHash，可用 demo 測試：

```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"DEMO_SUCCESS_TW"}' | jq .
```

## ⚠️ 常見問題

### Q: 為什麼回傳 `RECEIPT_NOT_FOUND`？
**A:** 可能原因：
- txHash 在 mainnet（非 Sepolia）
- 交易尚未被確認
- txHash 輸入錯誤

### Q: 如何確認交易在 Sepolia？
**A:** 
1. 打開 https://celo-sepolia.blockscout.com/tx/0x...
2. 如果找不到，可能是在 mainnet（用 https://celoscan.io/tx/0x... 檢查）

### Q: 如何快速產生測試 txHash？
**A:** 使用 `demoTxMap.json`：
```bash
cd functions
cp demoTxMap.example.json demoTxMap.json
# 編輯填入任意格式正確的 0x... txHash
```

## 📋 完整測試流程

1. ✅ 更新 `.env`（手動）
2. ✅ 重啟 emulator
3. ✅ 取得真實 Sepolia txHash
4. ✅ 測試 API
5. ✅ 檢查前端顯示（`http://localhost:5500/self-onchain.html`）



