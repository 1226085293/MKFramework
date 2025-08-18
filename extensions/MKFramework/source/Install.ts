/* eslint-disable @typescript-eslint/naming-convention */
import fs from "fs-extra";
import path from "path";
import cjson from "cjson";
import prettier from "prettier";
import axios from "axios";
import glob from "fast-glob";

// 修改模块让其正常加载
[path.join(__dirname, "../node_modules/isomorphic-git/index"), path.join(__dirname, "../node_modules/isomorphic-git/http/node/index")].forEach(
	(p) => {
		if (fs.existsSync(p + ".js") && fs.existsSync(p + ".cjs")) {
			fs.renameSync(p + ".js", p + ".temp");
			fs.renameSync(p + ".cjs", p + ".js");
		}
	}
);

import isomorphicGit from "isomorphic-git";
import http from "isomorphic-git/http/node";

export default async function install(versionStr_?: string): Promise<void> {
	/** 用户名 */
	const owner = "muzzik";
	/** 仓库路径 */
	const repo = "MKFramework";
	/** 临时路径 */
	const tempPath = Editor.Project.tmpDir;
	/** 插件路径 */
	const pluginPath = path.join(__dirname, "../").replace(/\\/g, "/");
	/** 插件项目路径 */
	const pluginProjectPath = pluginPath.slice(pluginPath.indexOf("/extensions/")).slice(1);
	/** 远程路径 */
	const remoteUrl = `https://gitee.com/${owner}/${repo}.git`;
	/** 下载路径 */
	const downloadPath = path.join(tempPath, "MKFramework");
	/** 框架代码路径 */
	const frameworkPath = "assets/MKFramework";
	/** 安装路径 */
	const installPath = path.join(__dirname, "..", frameworkPath);
	/** ts 配置 */
	const projectTsconfig = cjson.load(path.join(Editor.Project.path, "tsconfig.json"));
	/** 包配置 */
	const projectPackage = cjson.load(path.join(Editor.Project.path, "package.json"));
	/** 安装版本 */
	let version: string;
	/** 最新的稳定版本 */
	let latestStableVersionStr: string;
	/** 下个版本 */
	let nextVersionStr: string;

	await Promise.resolve()
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.安全检查"));
			let pathToCheck = path.join(__dirname, "..", frameworkPath);

			// 覆盖安装确认
			if (fs.existsSync(pathToCheck) && fs.readdirSync(pathToCheck).length !== 0) {
				const result = await Editor.Dialog.info(Editor.I18n.t("mk-framework.确认安装"), {
					buttons: [Editor.I18n.t("mk-framework.确认"), Editor.I18n.t("mk-framework.取消")],
				});

				if (result.response !== 0) {
					return Promise.reject("取消安装");
				}

				fs.emptyDirSync(installPath);
			}
		})
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.获取版本"));
			const tagsUrl = `https://gitee.com/${owner}/${repo}/tags`;
			const html = (await axios.get(tagsUrl)).data as string;
			const tags = html.match(/(?<=(data-ref="))([^"]*)(?=")/g) as string[];

			tags.sort((a, b) => {
				const aVersion = a[0] === "v" ? -Number(a.slice(1).replace(/\./g, "")) : 999;
				const bVersion = b[0] === "v" ? -Number(b.slice(1).replace(/\./g, "")) : 999;

				return aVersion - bVersion;
			});

			latestStableVersionStr = tags[0];
			nextVersionStr = "v" + (Number(latestStableVersionStr.match(/\d+/g)!.join("")) + 1).toString().replace(/(\d)(?=\d)/g, "$1.");

			version = versionStr_ || tags[0];
		})
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.下载框架") + `(${version})`);

			try {
				fs.removeSync(downloadPath);
				fs.emptyDirSync(downloadPath);
			} catch (error) {
				return error;
			}

			await isomorphicGit.clone({
				fs: fs,
				http,
				dir: downloadPath,
				url: remoteUrl,
				depth: 1,
				ref: version,
			});
		})
		// 注入框架
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.注入框架"));
			// 拷贝框架文件
			{
				fs.copySync(path.join(downloadPath, pluginProjectPath, `assets`), path.join(installPath, ".."));

				Editor.Message.send("asset-db", "refresh-asset", "db://MKFramework");
			}

			// 添加脚本模板
			{
				/** 脚本模板文件路径 */
				const scriptTemplatePath = path.join(downloadPath, ".creator/asset-template/typescript");

				if (fs.pathExistsSync(scriptTemplatePath)) {
					const files = await glob(scriptTemplatePath.replace(/\\/g, "/") + "/*.ts");

					files.forEach((f) => {
						fs.copySync(f, path.join(Editor.Project.path, ".creator/asset-template/typescript", path.basename(f)));
					});
				}
			}
		})
		// 注入声明文件
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.注入声明文件"));
			/** 框架声明文件 */
			const frameworkTsconfig = cjson.load(path.join(downloadPath, "tsconfig.json"));
			/** 声明文件路径 */
			const declarePath = path.join(pluginProjectPath, "/@types/MKFramework/");
			/** 修改 tsconfig */
			let shouldModifyTsconfig = false;

			// 拷贝 d.ts
			fs.copySync(path.join(downloadPath, declarePath), path.join(Editor.Project.path, declarePath));

			// 添加框架类型声明文件
			if (frameworkTsconfig.types?.length) {
				shouldModifyTsconfig = true;
				if (!projectTsconfig.types) {
					projectTsconfig.types = [...frameworkTsconfig.types];
				} else {
					for (const t of frameworkTsconfig.types) {
						if (!projectTsconfig.types.includes(t)) {
							projectTsconfig.types.push(t);
						}
					}
				}
			}

			// 添加 tsconfig 路径配置
			if (frameworkTsconfig.compilerOptions.paths) {
				shouldModifyTsconfig = true;
				if (!projectTsconfig.compilerOptions) {
					projectTsconfig.compilerOptions = {};
				}

				if (!projectTsconfig.compilerOptions.paths) {
					projectTsconfig.compilerOptions.paths = {};
				}

				for (const k in frameworkTsconfig.compilerOptions.paths) {
					projectTsconfig.compilerOptions.paths[k] = frameworkTsconfig.compilerOptions.paths[k];
				}
			}

			if (shouldModifyTsconfig) {
				fs.writeFileSync(
					path.join(Editor.Project.path, "tsconfig.json"),
					await prettier.format(JSON.stringify(projectTsconfig), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);
			}
		})
		// 添加导入映射
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.添加导入映射"));
			const settingPath = path.join(Editor.Project.path, "settings/v2/packages/project.json");
			const settingConfig = !fs.existsSync(settingPath) ? {} : fs.readJSONSync(settingPath);
			const importMap = fs.readJSONSync(path.join(downloadPath, "import-map.json"));

			// 防止 script 不存在
			if (!settingConfig.script) {
				settingConfig.script = {};
			}

			/** 导入映射路径 */
			let importMapPath = ((settingConfig.script.importMap ?? "") as string).replace("project:/", Editor.Project.path);

			// 已存在导入映射
			if (fs.existsSync(importMapPath) && fs.statSync(importMapPath).isFile()) {
				const importMapContent = fs.readJSONSync(importMapPath) ?? {};

				// 更新导入映射
				importMapContent.imports = importMapContent.imports ?? {};
				Object.assign(importMapContent.imports, importMap.imports);

				// 写入导入映射
				fs.writeFileSync(
					importMapPath,
					await prettier.format(JSON.stringify(importMapContent), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);
			}
			// 不存在新建导入映射
			else {
				importMapPath = path.join(Editor.Project.path, "import-map.json");

				// 写入导入映射
				fs.writeFileSync(
					importMapPath,
					await prettier.format(JSON.stringify(importMap), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);

				// 更新项目设置
				settingConfig.script.importMap = importMapPath.replace(Editor.Project.path + "\\", "project://").replace(/\\/g, "/");

				// 写入项目设置
				fs.ensureDirSync(path.dirname(settingPath));
				fs.writeFileSync(
					settingPath,
					await prettier.format(JSON.stringify(settingConfig), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);
			}
		})
		// 屏蔽 vscode 框架文件提示
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.屏蔽vscode框架文件提示"));
			const oldVscodeSettings = cjson.load(path.join(downloadPath, ".vscode/settings.json"));
			const vscodeSettingPath = path.join(Editor.Project.path, ".vscode/settings.json");
			let vscodeSettings: Record<string, any> = {};

			// 保证项目 vscode settings 目录存在
			fs.ensureDirSync(path.join(Editor.Project.path, ".vscode"));

			// 读取 settings 文件
			if (fs.existsSync(vscodeSettingPath)) {
				vscodeSettings = cjson.load(vscodeSettingPath);
			}

			vscodeSettings["typescript.preferences.autoImportFileExcludePatterns"] =
				oldVscodeSettings["typescript.preferences.autoImportFileExcludePatterns"];

			fs.writeFileSync(
				vscodeSettingPath,
				await prettier.format(JSON.stringify(vscodeSettings), {
					filepath: "*.json",
					tabWidth: 4,
					useTabs: true,
				})
			);
		})
		// 更新框架版本信息
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.更新框架版本信息"));
			if (!projectPackage["MKFramework"]) {
				projectPackage["MKFramework"] = {};
			}

			projectPackage["MKFramework"].version = versionStr_ ? `${nextVersionStr}(开发版)` : version;

			fs.writeFileSync(
				path.join(Editor.Project.path, "package.json"),
				await prettier.format(JSON.stringify(projectPackage), {
					filepath: "*.json",
					tabWidth: 4,
					useTabs: true,
				})
			);
		})
		// 清理临时文件
		.then(() => {
			console.log(Editor.I18n.t("mk-framework.清理临时文件"));
			fs.remove(downloadPath);
		})
		// 安装成功
		.then(() => {
			console.log(Editor.I18n.t("mk-framework.安装成功"));
		})
		.catch((error) => {
			if (!error) {
				return;
			}

			console.error(Editor.I18n.t("mk-framework.安装失败"));
			console.error(error);
		});
}
