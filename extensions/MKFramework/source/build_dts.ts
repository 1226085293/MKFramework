import path from "path";
import child_process from "child_process";
import fs from "fs-extra";
import prettier from "prettier";
import cjson from "cjson";
import { argv, cwd } from "process";

export default async function run(): Promise<void> {
	/** 插件根目录 */
	const plugin_path_s = path.join(__dirname, "../");
	/** api-extractor.json */
	const api_extractor = cjson.load(path.join(plugin_path_s, "api-extractor.json"));
	/** 编译 tsconfig */
	const build_tsconfig = cjson.load(path.join(plugin_path_s, "assets/tsconfig.json"));
	/** 声明文件路径 */
	const dts_path_s = (api_extractor.dtsRollup.publicTrimmedFilePath as string).replace("<projectFolder>", plugin_path_s);

	// 删除 d.ts
	fs.removeSync(dts_path_s);

	// 编译 ts
	await new Promise<void>((resolve_f, reject_f) => {
		child_process.exec(
			`npx tsc -p ${path.join(plugin_path_s, "assets/tsconfig.json")}`,
			{
				cwd: plugin_path_s,
			},
			(error: child_process.ExecException | null, stdout: string, stderr: string) => {
				if (error) {
					console.error(stdout);
					reject_f(stdout);
				} else {
					resolve_f();
				}
			}
		);
	});

	// 删除生成的声明文件，否则会影响生成
	fs.removeSync(dts_path_s);
	// 生成 d.ts
	child_process.execSync(`npx api-extractor run --local --diagnostics`, {
		cwd: plugin_path_s,
	});

	/** 声明文件 */
	let dts_file_s = fs.readFileSync(dts_path_s, "utf-8");

	// 添加顶部命名空间
	{
		const index_n = dts_file_s.indexOf("export");

		dts_file_s =
			dts_file_s
				.slice(0, index_n)
				// 排除引用的绝对路径 cc.d.ts
				.replace(/(\/\/\/ <reference)([^]+?(\/>))/g, "") +
			"declare namespace mk {\n" +
			dts_file_s.slice(index_n) +
			"\n}\n export default mk;";
	}

	// 添加全局配置引用
	dts_file_s = `import global_config from "../../assets/mk-framework/@config/global_config";\n` + dts_file_s;
	// 禁止错误检查
	dts_file_s = "//@ts-nocheck\n" + dts_file_s;
	// @link 链接处理
	dts_file_s = dts_file_s.replace(/@link mk_/g, "@link ");

	// 格式化
	{
		const config_path_s = path.join(Editor.Project.path, ".prettierrc.json");

		let config: prettier.Options = {
			filepath: "*.ts",
			parser: "typescript",
			// eslint-disable-next-line @typescript-eslint/naming-convention
			tabWidth: 4,
		};

		const config_file_s = !fs.existsSync(config_path_s) ? null : fs.readFileSync(config_path_s, "utf-8");

		if (config_file_s) {
			config = JSON.parse(config_file_s);

			if (!config.parser) {
				config.parser = "typescript";
			}
		}

		dts_file_s = await prettier.format(dts_file_s, config);
	}

	// 保存文件
	fs.writeFileSync(dts_path_s, dts_file_s);
	// 清理临时文件
	fs.remove(path.join(plugin_path_s, "assets", build_tsconfig.compilerOptions.outDir));
}

if (argv.slice(2)[0] === "build") {
	(global.Editor as any) = {
		Project: {
			path: cwd(),
		},
	};

	run();
}
