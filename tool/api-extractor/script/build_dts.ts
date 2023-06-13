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
	/** api-extractor.json */
	const api_config = jsonc.parse(fs.readFileSync("./api-extractor.json", "utf-8"));
	/** 声明文件路径 */
	const dts_path_s = api_config.dtsRollup.publicTrimmedFilePath
		.replace("<projectFolder>", path.resolve())
		.replace("<unscopedPackageName>", package_config.name);

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

	// 删除生成的声明文件，否则会影响生成
	fs.removeSync(dts_path_s);
	// 生成 d.ts
	child_process.execSync(`npx api-extractor run --local --diagnostics`);

	/** 声明文件 */
	let dts_file_s = fs.readFileSync(dts_path_s, "utf-8");

	// 添加顶部命名空间
	{
		const index_n = dts_file_s.indexOf("export");

		dts_file_s = dts_file_s.slice(0, index_n) + "declare namespace mk {\n" + dts_file_s.slice(index_n) + "\n}\n export default mk;";
	}

	// // 添加全局配置引用
	// dts_file_s = '///<reference path="../assets/@config/global_config.ts"/>\n' + dts_file_s;

	// 添加全局配置引用
	dts_file_s = `import global_config from "../assets/@config/global_config"\n` + dts_file_s;
	// 禁止错误检查
	dts_file_s = "//@ts-nocheck\n" + dts_file_s;
	// @link 链接处理
	dts_file_s = dts_file_s.replace(/@link mk_/g, "@link ");

	// 格式化
	{
		let config: prettier.Options = {
			filepath: "*.ts",
			parser: "typescript",
			tabWidth: 4,
		};
		const config_file_s = fs.readFileSync(path.join(project_path_s, ".prettierrc.json"), "utf-8");

		if (config_file_s) {
			config = JSON.parse(config_file_s);

			if (!config.parser) {
				config.parser = "typescript";
			}
		}

		dts_file_s = prettier.format(dts_file_s, config);
	}

	// 保存文件
	fs.writeFileSync(dts_path_s, dts_file_s);
})();
