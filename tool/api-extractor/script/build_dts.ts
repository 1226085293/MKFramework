import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import { argv } from "process";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonc = require("jsonc-parser");

/**
 * ///<reference path="../temp/declarations/cc.d.ts"/>
///<reference path="../assets/@config/global_config.ts"/>
 */
// 参数：[ 输出生成信息(0: 不输出, 1: 输出) ]
(async () => {
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
	child_process.execSync("npx -p typescript tsc");

	// dts 入口后处理
	{
		// export declare const asset: mk_asset; 转为 static
		// (namespace _xxx/namespace xxx_) 命名空间导出 
	}

	// 删除生成的声明文件，否则会影响生成
	fs.removeSync(dts_path_s);
	// 生成 d.ts
	child_process.execSync(`npx api-extractor run --local --diagnostics`);

	/** 声明文件 */
	let dts_file_s = fs.readFileSync(dts_path_s, "utf-8");

	// 替换 import 为 reference
	{
		/** 替换表 */
		let replace_tab = {
			'cc': "../temp/declarations/cc.d.ts",
		};

		// 全局替换
		dts_file_s = dts_file_s.replace(/import ([^("|')]+)("|')([^("|')]+)("|');/g, function (value_s: string, ...args_as: any[]) {
			return `///<reference path="${replace_tab[path.basename(args_as[2])]}"/>`;
		})

		// 添加全局配置引用
		dts_file_s = '///<reference path="../assets/@config/global_config.ts"/>\n' + dts_file_s;
	}

	// 添加顶部命名空间
	{
		let index_n = dts_file_s.indexOf("\n", dts_file_s.lastIndexOf("///<reference")) + 1;

		dts_file_s = dts_file_s.slice(0, index_n) + "declare namespace mk {\n" + dts_file_s.slice(index_n) + "\n}";
	}

	// 禁止错误检查
	dts_file_s = "//@ts-nocheck\n" + dts_file_s;
	// 保存文件
	fs.writeFileSync(dts_path_s, dts_file_s);
})();
