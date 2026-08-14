import fs from "fs";
import path from "path";
const from=path.resolve("dist"), to=path.resolve("runtime_assets");
if(!fs.existsSync(from)){console.error("dist missing");process.exit(1);}
fs.rmSync(to,{recursive:true,force:true});
fs.cpSync(from,to,{recursive:true});
console.log("Prepared runtime_assets from dist.");
