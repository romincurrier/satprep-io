import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);
const app=express();
const port=process.env.PORT||3000;
const candidates=[path.join(__dirname,"runtime_assets"),path.join(__dirname,"dist")];
const webRoot=candidates.find(d=>fs.existsSync(path.join(d,"index.html")));
if(!webRoot){console.error("No built index.html found. Checked:",candidates);process.exit(1);}
console.log("SATprep.io serving frontend from:",webRoot);
app.use(express.static(webRoot));
app.get("/health",(_req,res)=>res.json({ok:true,app:"SATprep.io"}));
app.get("*",(_req,res)=>res.sendFile(path.join(webRoot,"index.html")));
app.listen(port,"0.0.0.0",()=>console.log(`SATprep.io listening on port ${port}`));
