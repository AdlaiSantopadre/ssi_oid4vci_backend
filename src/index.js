// src/index.js
import dotenv from "dotenv"
import { app } from "./app.js";
import mongoose from "mongoose";

dotenv.config()

const PORT = Number(process.env.PORT ?? 3000);
if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI in .env");
await mongoose.connect(process.env.MONGODB_URI);



const port = process.env.PORT || 3000
const server = app.listen(port, () => {
  console.log(`SSI OID4VCI service running on port ${port}`)
})
process.on("SIGINT", async () => {
  await mongoose.disconnect();
  server.close(() => process.exit(0));
});
