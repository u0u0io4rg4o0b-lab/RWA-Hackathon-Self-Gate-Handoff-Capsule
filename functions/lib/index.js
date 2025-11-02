"use strict";
// functions/index.ts
//
// 此檔案為 Firebase Cloud Functions 的進入點。它匯出兩個
// HTTP 端點：rpcHealthCheck 用於檢查 Celo RPC 節點的健康，
// verifyProof 用於驗證使用者提交的 proof。
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyProof = exports.rpcHealthCheck = void 0;
var rpcHealthCheck_1 = require("./rpcHealthCheck");
Object.defineProperty(exports, "rpcHealthCheck", { enumerable: true, get: function () { return rpcHealthCheck_1.rpcHealthCheck; } });
var verifyProof_1 = require("./verifyProof");
Object.defineProperty(exports, "verifyProof", { enumerable: true, get: function () { return verifyProof_1.verifyProof; } });
