// scripts/restore-veramo.js
import fs from "fs";
import crypto from "crypto";

const key = Buffer.from(process.env.BACKUP_KEY, "hex");
if (key.length !== 32) throw new Error("BACKUP_KEY must be 32 bytes hex (64 chars)");

const buf = fs.readFileSync("veramo.sqlite.enc");

// layout: [12B iv][16B tag][ciphertext...]
const iv = buf.subarray(0, 12);
const tag = buf.subarray(12, 28);
const data = buf.subarray(28);

const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
decipher.setAuthTag(tag);

const plain = Buffer.concat([decipher.update(data), decipher.final()]);
fs.writeFileSync("veramo.sqlite", plain);
console.log("[RESTORE] veramo.sqlite restored:", plain.length, "bytes");
