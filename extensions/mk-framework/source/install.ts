/* eslint-disable @typescript-eslint/naming-convention */
import fs from "fs-extra";
import path from "path";
import cjson from "cjson";
import prettier from "prettier";
import axios from "axios";
import glob from "fast-glob";

// 修改模块让其正常加载
[path.join(__dirname, "../node_modules/isomorphic-git/index"), path.join(__dirname, "../node_modules/isomorphic-git/http/node/index")].forEach(
	(v_s) => {
		if (fs.existsSync(v_s + ".js") && fs.existsSync(v_s + ".cjs")) {
			fs.renameSync(v_s + ".js", v_s + ".temp");
			fs.renameSync(v_s + ".cjs", v_s + ".js");
		}
	}
);

import isomorphic_git from "isomorphic-git";
import http from "isomorphic-git/http/node";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const package_json = require("../package.json");

export default async function (): Promise<void> {
	/** 用户名 */
	const owner_s = "muzzik";
	/** 仓库路径 */
	const repo_s = "MKFramework";
	/** 临时路径 */
	const temp_path_s = Editor.Project.tmpDir;
	/** 插件路径 */
	const plugin_path_s = path.join(__dirname, "../../");
	/** 远程路径 */
	const remote_url_s = `https://gitee.com/${owner_s}/${repo_s}.git`;
	/** 下载路径 */
	const download_path_s = path.join(temp_path_s, "mk_framework");
	/** 框架代码路径 */
	const framework_path_s = "assets/mk-framework";
	/** 安装路径 */
	const install_path_s = path.join(__dirname, "..", framework_path_s);
	/** ts 配置 */
	const project_tsconfig = cjson.load(path.join(Editor.Project.path, "tsconfig.json"));
	/** 包配置 */
	const project_package = cjson.load(path.join(Editor.Project.path, "package.json"));
	/** 安装版本 */
	let version_s: string;

	Promise.resolve()
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.安全检查"));

			// 覆盖安装确认
			if (fs.existsSync(path.join(__dirname, "..", framework_path_s, "@framework"))) {
				const result = await Editor.Dialog.info(Editor.I18n.t("mk-framework.确认安装"), {
					buttons: [Editor.I18n.t("mk-framework.确认"), Editor.I18n.t("mk-framework.取消")],
				});

				if (result.response !== 0) {
					return Promise.reject("取消安装");
				}

				fs.emptyDirSync(install_path_s);
			}
		})
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.获取版本"));
			const remote_url_s = `https://gitee.com/${owner_s}/${repo_s}/tags`;
			const html_s = (await axios.get(remote_url_s)).data as string;
			const tag_ss = html_s.match(/(?<=(data-ref="))([^"]*)(?=")/g) as string[];

			tag_ss.sort((va_s, vb_s) => {
				const va_version_n = va_s[0] === "v" ? -Number(va_s.slice(1).replace(/\./g, "")) : 999;
				const vb_version_n = vb_s[0] === "v" ? -Number(vb_s.slice(1).replace(/\./g, "")) : 999;

				return va_version_n - vb_version_n;
			});

			version_s = tag_ss[0];
		})
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.下载框架") + `(${version_s})`);

			try {
				fs.removeSync(download_path_s);
				fs.emptyDirSync(download_path_s);
			} catch (error: any) {
				return error;
			}

			await isomorphic_git.clone({
				fs: fs,
				http,
				dir: download_path_s,
				url: remote_url_s,
				depth: 1,
				ref: version_s,
			});
		})
		// 版本适配
		.then(() => {
			console.log(Editor.I18n.t("mk-framework.版本适配"));
			// 3.8.0 及以上删除 userData.bundleConfigID
			if (project_package.creator?.version && Number(project_package.creator.version.replace(/\./g, "")) >= 380) {
				const file_ss = [
					`extensions/${package_json.name}/${framework_path_s}/@config.meta`,
					`extensions/${package_json.name}/${framework_path_s}/@framework.meta`,
				];

				file_ss.forEach((v_s) => {
					const data = fs.readJSONSync(path.join(download_path_s, v_s));

					delete data.userData.bundleConfigID;
					fs.writeJSONSync(path.join(download_path_s, v_s), data);
				});
			}
		})
		// 注入框架
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.注入框架"));
			// 拷贝框架文件
			{
				fs.copySync(path.join(download_path_s, `extensions/${package_json.name}/assets`), path.join(install_path_s, ".."));

				Editor.Message.send("asset-db", "refresh-asset", "db://mk-framework");
			}

			// 添加脚本模板
			{
				/** 脚本模板文件路径 */
				const script_template_path = path.join(download_path_s, ".creator/asset-template/typescript");

				if (fs.pathExistsSync(script_template_path)) {
					const file_ss = await glob(script_template_path.replace(/\\/g, "/") + "/*.ts");

					file_ss.forEach((v_s) => {
						fs.copySync(v_s, path.join(Editor.Project.path, ".creator/asset-template/typescript", path.basename(v_s)));
					});
				}
			}
		})
		// 注入声明文件
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.注入声明文件"));
			/** 框架声明文件 */
			const framework_tsconfig = cjson.load(path.join(download_path_s, "tsconfig.json"));
			/** 声明文件路径 */
			const declare_path_s = `./extensions/${package_json.name}/@types/mk-framework/`;
			/** 修改 tsconfig */
			let modify_tsconfig_b = false;

			// 拷贝 d.ts
			fs.copySync(path.join(download_path_s, declare_path_s), path.join(Editor.Project.path, declare_path_s));

			// 添加框架类型声明文件
			if (framework_tsconfig.types?.length) {
				modify_tsconfig_b = true;
				if (!project_tsconfig.types) {
					project_tsconfig.types = [...framework_tsconfig.types];
				} else {
					for (const v_s of framework_tsconfig.types) {
						if (!project_tsconfig.types.includes(v_s)) {
							project_tsconfig.types.push(v_s);
						}
					}
				}
			}

			// 添加 tsconfig 路径配置
			if (framework_tsconfig.compilerOptions.paths) {
				modify_tsconfig_b = true;
				if (!project_tsconfig.compilerOptions) {
					project_tsconfig.compilerOptions = {};
				}

				if (!project_tsconfig.compilerOptions.paths) {
					project_tsconfig.compilerOptions.paths = {};
				}

				for (const k_s in framework_tsconfig.compilerOptions.paths) {
					project_tsconfig.compilerOptions.paths[k_s] = framework_tsconfig.compilerOptions.paths[k_s];
				}
			}

			if (modify_tsconfig_b) {
				fs.writeFileSync(
					path.join(Editor.Project.path, "tsconfig.json"),
					await prettier.format(JSON.stringify(project_tsconfig), {
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
			const setting_path_s = path.join(Editor.Project.path, "settings/v2/packages/project.json");
			const setting_config_tab = !fs.existsSync(setting_path_s) ? {} : fs.readJSONSync(setting_path_s);
			const mk_import_map_tab = fs.readJSONSync(path.join(download_path_s, "import-map.json"));

			// 防止 script 不存在
			if (!setting_config_tab.script) {
				setting_config_tab.script = {};
			}

			/** 导入映射路径 */
			let import_map_path_s = ((setting_config_tab.script.importMap ?? "") as string).replace("project:/", Editor.Project.path);

			// 已存在导入映射
			if (fs.existsSync(import_map_path_s) && fs.statSync(import_map_path_s).isFile()) {
				const import_map_tab = fs.readJSONSync(import_map_path_s);

				// 更新导入映射
				Object.assign(import_map_tab.imports, mk_import_map_tab.imports);

				// 写入导入映射
				fs.writeFileSync(
					import_map_path_s,
					await prettier.format(JSON.stringify(import_map_tab), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);
			}
			// 不存在新建导入映射
			else {
				import_map_path_s = path.join(Editor.Project.path, "import-map.json");

				// 写入导入映射
				fs.writeFileSync(
					import_map_path_s,
					await prettier.format(JSON.stringify(mk_import_map_tab), {
						filepath: "*.json",
						tabWidth: 4,
						useTabs: true,
					})
				);

				// 更新项目设置
				setting_config_tab.script.importMap = import_map_path_s.replace(Editor.Project.path + "\\", "project://").replace(/\\/g, "/");

				// 写入项目设置
				fs.ensureDirSync(path.dirname(setting_path_s));
				fs.writeFileSync(
					setting_path_s,
					await prettier.format(JSON.stringify(setting_config_tab), {
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
			const vscode_setting_path_s = path.join(Editor.Project.path, ".vscode/settings.json");
			let settings_json: Record<string, any> = {};

			// 项目 vscode settings 文件不存在则创建
			if (!fs.existsSync(vscode_setting_path_s)) {
				fs.mkdirSync(path.join(Editor.Project.path, ".vscode"));
			}
			// 存在则读取
			else {
				settings_json = cjson.load(vscode_setting_path_s);
			}

			settings_json["typescript.preferences.autoImportFileExcludePatterns"] = [
				`./extensions/${package_json.name}/${framework_path_s}/@framework/**`,
			];

			fs.writeFileSync(
				vscode_setting_path_s,
				await prettier.format(JSON.stringify(settings_json), {
					filepath: "*.json",
					tabWidth: 4,
					useTabs: true,
				})
			);
		})
		// 更新框架版本信息
		.then(async () => {
			console.log(Editor.I18n.t("mk-framework.更新框架版本信息"));
			if (!project_package["mk-framework"]) {
				project_package["mk-framework"] = {};
			}
			project_package["mk-framework"].version_s = version_s;

			fs.writeFileSync(
				path.join(Editor.Project.path, "package.json"),
				await prettier.format(JSON.stringify(project_package), {
					filepath: "*.json",
					tabWidth: 4,
					useTabs: true,
				})
			);
		})
		// 清理临时文件
		.then(() => {
			console.log(Editor.I18n.t("mk-framework.清理临时文件"));
			fs.remove(download_path_s);
		})
		// 安装成功
		.then(() => {
			console.log(Editor.I18n.t("mk-framework.安装成功"));
		})
		.catch((error) => {
			if (!error) {
				return;
			}

			console.error(error);
		});
}
