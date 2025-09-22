/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-restricted-imports */
import path from "path";
import childProcess from "child_process";
import fs from "fs-extra";
import prettier from "prettier";
import cjson from "cjson";

export default async function buildDTS(): Promise<void> {
	/** 插件根目录 */
	const pluginPath = path.join(__dirname, "../");
	/** api-extractor.json */
	const apiExtractor = cjson.load(path.join(pluginPath, "api-extractor.json"));
	/** 编译 tsconfig */
	const buildTsconfig = cjson.load(path.join(pluginPath, "assets/tsconfig.json"));
	/** 声明文件路径 */
	const dtsPath = (apiExtractor.dtsRollup.publicTrimmedFilePath as string).replace("<projectFolder>", pluginPath);

	// 删除 d.ts
	fs.removeSync(dtsPath);

	// 编译 ts
	await new Promise<void>((resolve, reject) => {
		childProcess.exec(
			`npx tsc -p ${path.join(pluginPath, "assets/tsconfig.json")}`,
			{
				cwd: pluginPath,
			},
			(error: childProcess.ExecException | null, stdout: string) => {
				if (error) {
					console.error(stdout);
					reject(stdout);
				} else {
					resolve();
				}
			}
		);
	});

	// 删除生成的声明文件，否则会影响生成
	fs.removeSync(dtsPath);
	// 生成 d.ts
	childProcess.execSync(`npx api-extractor run --local --diagnostics`, {
		cwd: pluginPath,
	});

	/** 声明文件 */
	let dtsFile = fs.readFileSync(dtsPath, "utf-8");

	// 添加顶部命名空间
	{
		const index = dtsFile.indexOf("export");

		dtsFile =
			dtsFile
				.slice(0, index)
				// 排除引用的绝对路径 cc.d.ts
				.replace(/(\/\/\/ <reference)([^]+?(\/>))/g, "") +
			"declare namespace mk {\n" +
			dtsFile.slice(index) +
			"\n}\n export default mk;";
	}

	// 添加全局配置引用
	dtsFile = `import GlobalConfig from "../../assets/MKFramework/Config/GlobalConfig";\n` + dtsFile;
	// 增加提示语
	dtsFile =
		`// 框架源码位于 ${path.normalize(
			"项目根目录/" + pluginPath.slice(pluginPath.indexOf("extensions")) + "assets/MKFramework"
		)} 下，你也可以在资源管理器下方的 MKFramework 查看\n` + dtsFile;

	// 禁止错误检查
	dtsFile = "//@ts-nocheck\n" + dtsFile;
	// @link 链接处理
	dtsFile = dtsFile.replace(/@link MK/g, "@link ");

	// 格式化
	{
		const configPath = path.join(Editor.Project.path, ".prettierrc.json");

		let config: prettier.Options = {
			filepath: "*.ts",
			parser: "typescript",
			// eslint-disable-next-line @typescript-eslint/naming-convention
			tabWidth: 4,
		};

		const configFile = !fs.existsSync(configPath) ? null : fs.readFileSync(configPath, "utf-8");

		if (configFile) {
			config = JSON.parse(configFile);

			if (!config.parser) {
				config.parser = "typescript";
			}
		}

		dtsFile = await prettier.format(dtsFile, config);
	}

	// 保存文件
	fs.writeFileSync(dtsPath, dtsFile);
	// 清理临时文件
	fs.remove(path.join(pluginPath, "assets", buildTsconfig.compilerOptions.outDir));
}
