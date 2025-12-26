// scripts/backup-veramo.js
import fs from "fs";
import crypto from "crypto";

const key = Buffer.from(process.env.BACKUP_KEY, "hex");
const iv = crypto.randomBytes(12);

const data = fs.readFileSync("veramo.sqlite");
const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
const tag = cipher.getAuthTag();

fs.writeFileSync("veramo.sqlite.enc", Buffer.concat([iv, tag, encrypted]));
