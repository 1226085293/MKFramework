import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import prettier from "prettier";
import { argv } from "process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonc = require("jsonc-parser");

// 参数：[ 输出生成信息(0: 不输出, 1: 输出) ]
(async () => {
	/** 项目根目录 */
	const project_path_s = path.resolve("../../");
	/** package.json */
	const package_config = jsonc.parse(fs.readFileSync("./package.json", "utf-8"));
	/** tsconfig.json */
	const ts_config = jsonc.parse(fs.readFileSync("./tsconfig.json", "utf-8"));

	// 删除输出文件夹
	fs.removeSync(ts_config.compilerOptions.outDir);
	// 编译 ts
	await new Promise<void>((resolve_f, reject_f) => {
		child_process.exec("npx -p typescript tsc", (error: child_process.ExecException | null, stdout: string, stderr: string) => {
			if (error) {
				reject_f(stdout);
			} else {
				resolve_f();
			}
		});
	});

	// 生成 d.ts
	child_process.execSync(`npx api-extractor run --local --diagnostics`);
})();
