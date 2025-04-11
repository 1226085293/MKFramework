const path = require("path");
const child_process = require("child_process");
const fs = require("fs");

/**
 * @typedef {Object} proto_list
 * @property {string | undefined} namespace_s 命名空间
 * @property {string[]} proto_ss 协议文件(生成为脚本的协议文件)
 * @property {string} ts_output_path_s ts 输出路径(带脚本名)
 * @property {string} dts_output_path_s d.ts 输出路径(带脚本名)
 * @property {string[] | undefined} pbjs_parameters_ss pbjs 生成时参数(可用于裁剪代码, 命令行`npx pbjs`查看具体参数)
 */

module.exports = {
	/**
	 * 协议列表
	 * @type {proto_list[]}
	 */
	proto_list: [
		{
			"proto_ss": ["./proto/common.proto"],
			"ts_output_path_s": "./assets/resources/bundle/proto/common.ts",
			"dts_output_path_s": "./assets/resources/bundle/proto/common.d.ts"
		}
	],
	/**
		自动构建开关
		- true: 递归监听 dir_path_ss 内的文件添加/删除/修改，并触发构建指令
		- false：需要手动点击 `protobuf/构建` 才会触发构建菜单
	*/
	automatic_build_b: false,

	/** 自动构建延迟（秒），防止短时间内频繁触发构建 */
	automatic_build_delay_s_n: 2,

	/**
	 * 构建函数
	 * @param {proto_list} config_ proto 配置
	 * @returns {boolean} 成功状态
	 */
	async build_f(config_) {
		/** ts 输出路径 */
		let ts_output_path_s = config_.ts_output_path_s[0] !== "." ? config_.ts_output_path_s : path.join(__dirname, config_.ts_output_path_s);
		/** js 输出路径 */
		let js_output_path_s = path.join(path.dirname(ts_output_path_s), path.basename(ts_output_path_s, path.extname(ts_output_path_s)) + ".js");
		/** 声明文件路径 */
		let dts_path_s = config_.dts_output_path_s[0] !== "." ? config_.dts_output_path_s : path.join(__dirname, config_.dts_output_path_s);

		// 确保文件夹存在
		{
			if (!fs.existsSync(path.dirname(ts_output_path_s))) {
				fs.mkdirSync(path.dirname(ts_output_path_s));
			}

			if (!fs.existsSync(path.dirname(dts_path_s))) {
				fs.mkdirSync(path.dirname(dts_path_s));
			}
		}

		let result = await Promise.resolve()
			// 生成 js 文件
			.then(() => {
				return new Promise((resolve_f, reject_t) => {
					// 使用 es6 的生成类型
					child_process.exec(
						`npx pbjs -t static-module -w es6 -l eslint-disable --es6 --keep-case ${!config_.pbjs_parameters_ss ? "" : config_.pbjs_parameters_ss.join(" ")
						} ${!config_.namespace_s ? "" : `--root ${config_.namespace_s}`} -o ${js_output_path_s} ${config_.proto_ss.join(" ")}`,
						{
							cwd: __dirname,
						},
						(error, stdout, stderr) => {
							if (stderr) {
								console.warn(stderr);
							}

							resolve_f();
						}
					);
				});
			})
			// 生成 d.ts 文件
			.then(() => {
				// 生成 d.ts
				return new Promise((resolve_f, reject_t) => {
					child_process.exec(
						`npx pbts -m ${config_.namespace_s ? `--root ${config_.namespace_s}` : ""} -o ${dts_path_s} ${js_output_path_s}`,
						{
							cwd: __dirname,
						},
						(error, stdout, stderr) => {
							if (stderr) {
								console.warn(stderr);
							}

							resolve_f();
						}
					);
				});
			})
			// js 后处理
			.then(() => {
				let file_s = fs.readFileSync(js_output_path_s, "utf-8");

				file_s = file_s
					// 替换 import
					.replace('import * as $protobuf from "protobufjs/minimal";', fs.existsSync(path.join(__dirname, "assets/@protobufjs")) ? "const $protobuf = (globalThis || self || window).protobuf" : 'import $protobuf from "protobufjs/minimal.js";')
					// 替换 root
					.replace(/const \$root = ([^]+?);/, "const $root = {};");

				// 存在命名空间
				if (config_.namespace_s) {
					file_s = file_s.replace(/export const /g, "const ");
				}

				// 更新协议文件
				fs.writeFileSync(js_output_path_s, file_s);
			})
			// d.ts 文件后处理
			.then(() => {
				let file_s = fs.readFileSync(dts_path_s, "utf-8");

				if (config_.namespace_s) {
					file_s = `export namespace ${config_.namespace_s} {\n${file_s}\n}`;
				}
				// 添加类型声明
				file_s = `import type { Long } from "protobufjs";\n` + file_s;
				// 后处理
				file_s = file_s.replace(/\$protobuf/g, "protobuf");

				// 更新协议文件
				fs.writeFileSync(dts_path_s, file_s);
			})
			// 将 js 协议脚本转换为 ts
			.then(() => {
				let js_file_s = fs.readFileSync(js_output_path_s, "utf-8");
				/** ts 文件路径 */
				let ts_script_path_s = path.join(
					path.dirname(ts_output_path_s),
					path.basename(ts_output_path_s, path.extname(ts_output_path_s)) + ".ts"
				);
				/** d.ts 相对路径 */
				let dts_relative_path_s = path.relative(path.dirname(ts_output_path_s), path.dirname(dts_path_s)).replace(/\\/g, "/");
				/** d.ts 导入路径 */
				let dts_import_path_s = (dts_relative_path_s || "./") + path.basename(dts_path_s, ".ts");

				// 后处理
				js_file_s = js_file_s
					// 对象类型const $root: typeof import("./test.d").pb
					.replace(
						"const $root = ",
						`const $root: typeof import("${dts_import_path_s}")${config_.namespace_s ? `.${config_.namespace_s}` : ""} = `
					)
					// 修复对象类型错误
					.replace(
						/export const ([^ ]+?) = ([^ ]+?) =/g,
						function (...args_as) {
							return `export const ${args_as[1]}: typeof ${args_as[2]} = ${args_as[2]} =`;
						}
					);

				if (config_.namespace_s) {
					js_file_s = js_file_s
						// module.exports
						.replace(
							"export { $root as default }",
							`export ${config_.namespace_s ? `const ${config_.namespace_s} = ` : ""}{ ...$root }`);
				}

				fs.writeFileSync(js_output_path_s, "// @ts-nocheck\n" + js_file_s);
				fs.renameSync(js_output_path_s, ts_script_path_s);
			})
			// 捕获错误
			.catch((error) => {
				console.error("生成错误：", error);

				return false;
			})
			// 任务完成
			.then((v) => {
				return v ?? true;
			});

		return result;
	},
};
