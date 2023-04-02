import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import { argv } from "process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonc = require("jsonc-parser");

// 参数：[ 输出生成信息(0: 不输出, 1: 输出) ]
(async () => {
	// 删除输出文件夹
	fs.removeSync(path.join("./temp", "md"));
	// 生成 md 文件
	child_process.execSync(`npx api-documenter markdown --input-folder ./temp --output-folder ./temp/md`);

	// 清理 docfx 项目 md 文件 tool\api-extractor\docfx_project\api
	fs.readdirSync("./docfx_project/api").forEach((v_s) => {
		if (v_s.match(/\.md$/)) {
			fs.removeSync(path.join("./docfx_project/api", v_s));
		}
	});

	// 移动 md 到 docfx 项目
	fs.readdirSync("./temp/md").forEach((v_s) => {
		fs.renameSync(path.join("./temp/md", v_s), path.join("./docfx_project/api", v_s));
	});

	// 生成文档
	child_process.execSync("docfx docfx_project/docfx.json");
})();
