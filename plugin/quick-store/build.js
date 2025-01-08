const fs = require("fs");
const child_process = require("child_process")

// 防止编辑器加载错误
let path_s = "./node_modules/entities/package.json";

if (fs.existsSync(path_s)) {
    let package_json = JSON.parse(fs.readFileSync(path_s, "utf-8"));
    package_json.exports["./lib/decode"] = package_json.exports["./lib/decode.js"];
    fs.writeFileSync(path_s, JSON.stringify(package_json))
}


child_process.execSync("tsc & npx tailwindcss -i ./tailwind.css -o ./dist/tailwind.css");