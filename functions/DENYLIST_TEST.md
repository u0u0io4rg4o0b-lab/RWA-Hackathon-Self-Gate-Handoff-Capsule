# Denylist 測試指南

## 📋 功能說明

Denylist 使用 `sha256(subject/address/did)` 雜湊作為鍵，不留明文識別。

## 🔧 設定 Denylist

### 1. 建立 denylist.json

```bash
cd functions
cp denylist.example.json denylist.json
```

### 2. 編輯 denylist.json

填入要封鎖的用戶識別子雜湊（sha256）：

```json
[
  "3ad71b01b247e3f205d5c19dc0b35aedddf04f9ab0e153c4d74d046ef4b2c824",
  "a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5a0b1c2d3e4f5"
]
```

### 3. 產生雜湊

**方法 A：Node.js**
```javascript
const crypto = require('crypto');
const subject = 'did:web:example.com:blocked_user'; // 或 address
const hash = crypto.createHash('sha256').update(subject).digest('hex');
console.log(hash); // 將此雜湊加入 denylist.json
```

**方法 B：命令列**
```bash
cd functions
node -e "const crypto=require('crypto'); const h=crypto.createHash('sha256').update('did:web:example.com:blocked_user').digest('hex'); console.log(h)"
```

## 🧪 測試 Denylist

### 1. 設定映射（讓某個 txHash 對應到 blocked user）

編輯 `demoTxMap.json`，加入一個對應到 blocked user 的 txHash：

```json
[
  {
    "txHash": "0xBLOCKED_USER_TX_HASH",
    "subject": "did:web:example.com:blocked_user",
    "country": "TW",
    "age_verified": true,
    "ofac_checked": true,
    "sanctioned": false
  }
]
```

### 2. 計算 blocked user 的雜湊

```bash
cd functions
node -e "const crypto=require('crypto'); const h=crypto.createHash('sha256').update('did:web:example.com:blocked_user').digest('hex'); console.log(h)"
```

輸出範例：`3ad71b01b247e3f205d5c19dc0b35aedddf04f9ab0e153c4d74d046ef4b2c824`

### 3. 加入 denylist.json

```json
[
  "3ad71b01b247e3f205d5c19dc0b35aedddf04f9ab0e153c4d74d046ef4b2c824"
]
```

### 4. 測試封鎖

```bash
curl -X POST http://localhost:5500/api/self/verify-by-tx \
  -H "Content-Type: application/json" \
  -d '{"txHash":"0xBLOCKED_USER_TX_HASH"}' | jq .
```

**預期回應：**
```json
{
  "status": "invalid",
  "txHash": "0xBLOCKED_USER_TX_HASH",
  "reason": "DENYLISTED_USER"
}
```

## 📊 工作流程

1. **驗證交易** → 取得 `subject/address/did`
2. **計算雜湊** → `sha256(subject)` = 64 位 hex
3. **比對 denylist** → 檢查 `denylist.json` 是否包含此雜湊
4. **回傳結果** → 若命中，回傳 `DENYLISTED_USER`；否則繼續驗證

## ✅ 設計原則

- ✅ **不留明文**：denylist 只存雜湊，不存原始識別子
- ✅ **可替換來源**：可以從外部 API、資料庫或其他來源載入
- ✅ **易於維護**：JSON 格式，可直接編輯
- ✅ **快速比對**：使用 Set 資料結構，O(1) 查詢

## 🔄 重啟服務

更新 denylist.json 後，需重啟 emulator 以載入新的 denylist：

```bash
pkill -f "firebase emulators:start"
cd functions
npm run serve
```

## 💡 進階：從外部來源載入

未來可以擴充為從外部 API 載入 denylist：

```typescript
async function loadDenylistFromAPI(): Promise<Set<string>> {
  const resp = await fetch('https://your-api.com/denylist');
  const list = await resp.json();
  return new Set(list);
}
```



