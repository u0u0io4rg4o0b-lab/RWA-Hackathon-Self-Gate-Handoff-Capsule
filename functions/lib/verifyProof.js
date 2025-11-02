"use strict";
// functions/verifyProof.ts
// 功能 X：守門＋診斷強化版（相容舊欄位）
//
// 介面：POST /api/verifyProof
// 請求 JSON：{ proofData: {...}, requirements: string[] }
// 回應 JSON：{
//   ok: boolean,
//   results: { rule: string, pass: boolean, reason?: string }[],
//   proofHash: string,        // 舊欄位相容（= stableKey 前 16 碼）
//   stableKey: string,        // 完整去重鍵（全長 64 十六進位）
//   rid: string,              // 本次請求 ID（8 字節十六進位）
//   meta: {
//     network: string,
//     limits: { perMinute: number, maxBodyBytes: number },
//     warnings?: string[]
//   }
// }
//
// 注意：本函式不落地任何 PII；審計請由前端 JSONL 完成。
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProof = void 0;
const https_1 = require("firebase-functions/v2/https");
const crypto = __importStar(require("crypto"));
// ======================== 常數集中區 ========================
const REGION = 'us-central1';
const TIMEOUT_SECONDS = 10;
const MAX_BODY_BYTES = 10 * 1024; // 10KB
const RATE_LIMIT_PER_MINUTE = 30;
const STABLEKEY_SLICE = 16; // 舊欄位相容用
const KNOWN_RULES = new Set(['age>=18']); // 可擴充：ex. country!=OFAC
// ======================== 小工具 ============================
function stableStringify(input) {
    if (Array.isArray(input))
        return '[' + input.map(stableStringify).join(',') + ']';
    if (input && typeof input === 'object') {
        const keys = Object.keys(input).sort();
        return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(input[k])).join(',') + '}';
    }
    return JSON.stringify(input);
}
function sha256Hex(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}
function byteLengthOfJson(x) {
    try {
        return Buffer.byteLength(JSON.stringify(x ?? {}), 'utf8');
    }
    catch {
        return Infinity;
    } // 無法序列化就當作超限
}
function parseAllowedOrigins() {
    return (process.env.ALLOWED_ORIGINS || '')
        .split(',').map(s => s.trim()).filter(Boolean);
}
function setCors(res, origin) {
    const allowed = parseAllowedOrigins();
    if (origin && allowed.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Idempotency-Key');
    }
}
function genRid() {
    // 8位元組十六進位（簡短且足夠做對照）
    return crypto.randomBytes(8).toString('hex');
}
function nowTs() {
    return new Date().toISOString();
}
function evaluateRules(proofData, requirements) {
    const out = [];
    for (const rule of requirements) {
        if (!KNOWN_RULES.has(rule)) {
            out.push({ rule, pass: false, reason: '未知規則' });
            continue;
        }
        if (rule === 'age>=18') {
            const age = Number((proofData && proofData.age) ?? NaN);
            const pass = Number.isFinite(age) && age >= 18;
            out.push({ rule, pass, reason: pass ? undefined : 'age 不足 18 或格式錯誤' });
            continue;
        }
    }
    return out;
}
// ======================== 簡易節流（每 IP / 分鐘） =========
const requestLog = new Map();
function rateLimited(ip, limit) {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const list = (requestLog.get(ip) || []).filter(t => t > oneMinuteAgo);
    list.push(now);
    requestLog.set(ip, list);
    return list.length > limit;
}
// ======================== 主處理 ===========================
exports.verifyProof = (0, https_1.onRequest)({ region: REGION, timeoutSeconds: TIMEOUT_SECONDS }, async (req, res) => {
    const rid = genRid();
    const t0 = Date.now();
    setCors(res, req.headers?.origin);
    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }
    if (req.method !== 'POST') {
        res.status(405).json({ ok: false, message: '僅接受 POST', rid });
        return;
    }
    // Content-Type 檢查
    const ctype = String(req.headers['content-type'] || '');
    if (!ctype.includes('application/json')) {
        res.status(415).json({ ok: false, message: '僅接受 application/json', rid });
        return;
    }
    // 體積上限
    const body = req.body;
    const bodyBytes = byteLengthOfJson(body);
    if (bodyBytes > MAX_BODY_BYTES) {
        res.status(413).json({ ok: false, message: `payload 過大（${bodyBytes} > ${MAX_BODY_BYTES} bytes）`, rid });
        return;
    }
    // 節流（以 IP 為鍵；在 emulator/單機最有效，雲端多實例時視作軟限制）
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || 'unknown';
    if (rateLimited(ip, RATE_LIMIT_PER_MINUTE)) {
        res.status(429).json({ ok: false, message: '太多請求，請稍後再試', rid });
        return;
    }
    // 結構檢查
    const proofData = body?.proofData;
    const requirements = body?.requirements;
    if (!proofData || !Array.isArray(requirements)) {
        res.status(400).json({ ok: false, message: '缺少 proofData 或 requirements', rid });
        return;
    }
    // 去重鍵（完整 64 位十六進位）
    const canonical = stableStringify({ proofData, requirements });
    const stableKeyFull = sha256Hex(canonical);
    // 可選：Idempotency-Key 對齊提示（不擋流程）
    const warnings = [];
    const idem = String(req.headers['x-idempotency-key'] || '').trim();
    if (idem && !stableKeyFull.startsWith(idem)) {
        warnings.push('X-Idempotency-Key 與內容不一致：已忽略此標頭');
    }
    // 規則檢查
    const results = evaluateRules(proofData, requirements);
    const okAll = results.every(r => r.pass);
    // 回應（相容舊欄位 + 新增診斷）
    const elapsed = Date.now() - t0;
    res.status(200).json({
        ok: okAll,
        results,
        proofHash: stableKeyFull.slice(0, STABLEKEY_SLICE), // 舊欄位相容
        stableKey: stableKeyFull, // 完整鍵
        rid,
        meta: {
            network: process.env.NETWORK_NAME || process.env.SELF_ENV || 'local',
            limits: { perMinute: RATE_LIMIT_PER_MINUTE, maxBodyBytes: MAX_BODY_BYTES },
            warnings: warnings.length ? warnings : undefined,
            receivedAt: nowTs(),
            elapsedMs: elapsed
        }
    });
});
