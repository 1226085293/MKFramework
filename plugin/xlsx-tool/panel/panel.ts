import fs from "fs-extra";
import path from "path";
import config from "../config";
import { createApp, App } from "vue";
import { InspectorInfo, PanelInfo, Self } from "../types";
import electron, { BrowserWindow } from "electron";
import tool from "../tool";
import xlsx from "xlsx";
import xlsx_to_ts from "../convert/xlsx_to_ts";
import xlsx_to_json from "../convert/xlsx_to_json";

// export const info: InspectorInfo = {
// 	type_s: "asset",
// 	target_s: "effect",
// };
export const info: PanelInfo = {
	title_s: "配置表",
	width_n: 500,
	height_n: 250,
	top_level_b: true,
};

export let self: Self;

export let data = {
	/** 输入路径 */
	input_path_s: "",
	/** 输入路径建议 */
	input_path_suggestion_b: false,
	/** 输入路径建议 */
	input_path_suggestion_ss: [] as string[],
	/** 输出路径 */
	output_path_s: "",
	/** 输入路径建议 */
	output_path_suggestion_b: false,
	/** 输入路径建议 */
	output_path_suggestion_ss: [] as string[],
	/** 更新配置进度(-1:未开始，0-100:更新进度) */
	update_progress_n: -1,
};

export let methods = {
	/** 点击更新配置 */
	async click_export_config(type_s_: "ts" | "json"): Promise<void> {
		if (!data.input_path_s || !fs.existsSync(data.input_path_s)) {
			Editor.Dialog.error("输入路径错误");
			return;
		}

		if (!data.output_path_s || !fs.existsSync(data.output_path_s)) {
			Editor.Dialog.error("输出路径错误");
			return;
		}

		// 更新进度
		data.update_progress_n = 0;

		/** xlsx 文件 */
		let xlsx_file_ss = fs.readdirSync(data.input_path_s).filter((v_s) => !v_s.startsWith("~$") && v_s.endsWith(".xlsx"));
		/** 输出数据表 */
		let output_data_tab: Record<string, Record<string, any>> = {};
		/** 输出注释 */
		let output_attractor_desc_tab: Record<string, string[]> = {};
		/** 输出属性名 */
		let output_attractor_name_tab: Record<string, string[]> = {};
		/** 输出文件类型 */
		let output_attractor_type_tab: Record<string, string[]> = {};
		/** 输出文件名对应路径表 */
		let output_file_to_path_tab: Record<string, string> = {};
		/** 输出目录 db 路径 */
		let output_db_path_s = data.output_path_s.replace(path.join(Editor.Project.path, path.sep), "db://").replaceAll("\\", "/");
		/** 配置表名正则 */
		let config_name_reg = /^c_/;
		/** 获取配置文件名 */
		let get_config_name_f = (value_s: string): string => {
			return `${value_s.slice(2)}_config`;
		};

		// 清空输出目录
		fs.emptyDirSync(data.output_path_s);
		Editor.Message.send("asset-db", "refresh-asset", output_db_path_s);

		// 读取配置文件
		{
			let read_data_f = (type_s: string, value_s: string): any => {
				if (type_s === "number") {
					return Number(value_s);
				} else if (type_s === "string") {
					value_s = String(value_s);
					if (value_s[0] === value_s.slice(-1)[0] && '"' === value_s[0]) {
						value_s = `${value_s.slice(1, -1)}`;
					}
					return value_s;
				} else if (type_s === "boolean") {
					return ["true", "TRUE"].includes(value_s) ? true : ["false", "FALSE"].includes(value_s) ? false : Boolean(value_s);
				} else if (type_s.endsWith("[]")) {
					try {
						let data_as: any[] = [];
						let raw_data_as = JSON.parse(value_s) as any[];
						type_s = type_s.slice(0, -2);

						raw_data_as.forEach((v) => {
							data_as.push(read_data_f(type_s, typeof v === "string" ? v : JSON.stringify(v)));
						});

						return data_as;
					} catch (e) {
						return e;
					}
				} else if (type_s.startsWith("[") && type_s.endsWith("]")) {
					try {
						let data_as: any[] = [];
						let type_ss: string[] = type_s
							.slice(1, -1)
							.split(",")
							.map((v_s) => v_s.trim());
						let value_as: any[] = JSON.parse(value_s);

						value_as.forEach((v, k_n) => {
							data_as.push(read_data_f(type_ss[k_n], typeof v === "string" ? v : JSON.stringify(v)));
						});

						return data_as;
					} catch (e) {
						return e;
					}
				}

				return "";
			};
			let default_value_f = (type_s: string): any => {
				if (type_s === "number") {
					return 0;
				} else if (type_s === "string") {
					return "";
				} else if (type_s === "boolean") {
					return false;
				} else if (type_s.endsWith("[]")) {
					return [];
				} else if (type_s.startsWith("[") && type_s.endsWith("]")) {
					return [];
				}

				return "";
			};

			for (let v_s of xlsx_file_ss) {
				await new Promise<void>((resolve_f) => {
					setTimeout(resolve_f, 100);
				});

				let path_s = path.join(data.input_path_s, v_s);
				let workbook = xlsx.readFile(path_s);

				workbook.SheetNames.forEach((v2_s) => {
					// 识别配置表
					if (!v2_s || !config_name_reg.test(v2_s)) {
						return;
					}

					let sheet = workbook.Sheets[v2_s];
					/** 按行读取的数据 */
					let data_as: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
					/** 输出数据 */
					let output: any = {};
					/** 注释 */
					let attractor_desc_ss = data_as[0].slice(1).map((v3) => String(v3 ?? ""));
					/** 属性名 */
					let attractor_name_ss = data_as[1].slice(1).map((v3) => String(v3 ?? ""));
					/** 类型 */
					let attractor_type_ss = data_as[2].slice(1).map((v3) => String(v3 ?? ""));

					data_as.slice(3).forEach((v3_as, k3_n) => {
						if (!v3_as.length) {
							return;
						}

						let data: any = {};

						attractor_name_ss.forEach((v4_s, k4_n) => {
							if (!v4_s) {
								return;
							}

							let index_n = k4_n + 1;
							let type_s = attractor_type_ss[k4_n];
							let value_s = v3_as[index_n];

							// undefined，适配之前的生成结果
							if (value_s !== undefined) {
								let parse_result = read_data_f(type_s, value_s);

								if (parse_result instanceof Error) {
									console.error(
										`${path.basename(v_s, path.extname(v_s))}/${v2_s} 解析错误(行${k3_n + 4}列${String.fromCharCode(
											65 + k4_n + 1
										)}) ：`,
										parse_result
									);
								} else {
									data[v4_s] = read_data_f(type_s, value_s);
								}
							} else {
								data[v4_s] = default_value_f(type_s);
							}
						});

						if ((data.id_n ?? "") !== "") {
							output[data.id_n] = data;
						}
					});

					try {
						output_file_to_path_tab[v2_s] = path_s;
						output_attractor_desc_tab[v2_s] = attractor_desc_ss;
						output_attractor_name_tab[v2_s] = attractor_name_ss;
						output_attractor_type_tab[v2_s] = attractor_type_ss;
						output_data_tab[v2_s] = output;
					} catch (e) {
						delete output_data_tab[v2_s];
						console.error("解析错误", `${v_s}-${v2_s}`, e);
					}
				});
				data.update_progress_n += Math.floor(80 / xlsx_file_ss.length);
			}
			data.update_progress_n = 80;
		}

		// 生成文件
		{
			let file_ss = Object.keys(output_data_tab);
			let finish_n = 0;

			for (let v_s of file_ss) {
				let file_name_s = `${get_config_name_f(v_s)}`;
				let input_path_s = output_file_to_path_tab[v_s];
				let output_path_s = path.join(data.output_path_s, `${file_name_s}.${type_s_}`);
				let file_s = (type_s_ === "ts" ? xlsx_to_ts : xlsx_to_json)(
					output_data_tab[v_s],
					output_attractor_desc_tab[v_s],
					output_attractor_name_tab[v_s],
					output_attractor_type_tab[v_s],
					output_path_s,
					input_path_s,
					v_s
				);

				fs.writeFile(output_path_s, file_s, (...args) => {
					++finish_n;
					// 更新进度
					data.update_progress_n += (finish_n / file_ss.length) * 20;

					if (finish_n === file_ss.length) {
						data.update_progress_n = 100;
						setTimeout(() => {
							data.update_progress_n = -1;
						}, 300);
					}
				});
			}

			if (!file_ss.length) {
				data.update_progress_n = -1;
			}
		}

		Editor.Message.send("asset-db", "refresh-asset", output_db_path_s);
		console.log("完成");
	},

	/** 点击输入路径框 */
	click_input_path_box(): void {
		if (!data.input_path_suggestion_ss.length) {
			return;
		}

		data.input_path_suggestion_b = !data.input_path_suggestion_b;
	},

	/** 点击输入路径建议 */
	click_input_path_suggestion(index_n_: number): void {
		data.input_path_s = data.input_path_suggestion_ss[index_n_] || data.input_path_suggestion_ss[0];
		data.input_path_suggestion_b = false;
		this._update_config();
	},

	/** 点击删除输入路径建议 */
	click_remove_input_path_suggestion(index_n_: number): void {
		let deleted_value_s = data.input_path_suggestion_ss[index_n_];

		data.input_path_suggestion_ss.splice(index_n_, 1);
		data.input_path_suggestion_b = false;

		// 如果删除选中的路径
		if (data.input_path_s === deleted_value_s) {
			data.input_path_s = data.input_path_suggestion_ss[0];
		}
		this._update_config();
	},

	/** 点击选择输入路径 */
	async click_select_input_path(): Promise<void> {
		let result = await Editor.Dialog.select({
			type: "directory",
			title: "选择输入路径",
			multi: false,
			path: data.input_path_s,
		});

		if (result.canceled) {
			return;
		}

		let path_s = path.resolve(result.filePaths[0]);

		data.input_path_s = path_s;
		if (!data.input_path_suggestion_ss.includes(path_s)) {
			data.input_path_suggestion_ss.unshift(path_s);
		}
		this._update_config();
	},

	/** 点击输出路径框 */
	click_output_path_box(): void {
		if (!data.output_path_suggestion_ss.length) {
			return;
		}

		data.output_path_suggestion_b = !data.output_path_suggestion_b;
	},

	/** 点击输出路径建议 */
	click_output_path_suggestion(index_n_: number): void {
		data.output_path_s = data.output_path_suggestion_ss[index_n_];
		data.output_path_suggestion_b = false;
		this._update_config();
	},

	/** 点击删除输出路径建议 */
	click_remove_output_path_suggestion(index_n_: number): void {
		let deleted_value_s = data.output_path_suggestion_ss[index_n_];

		data.output_path_suggestion_ss.splice(index_n_, 1);
		data.output_path_suggestion_b = false;

		// 如果删除选中的路径
		if (data.output_path_s === deleted_value_s) {
			data.output_path_s = data.output_path_suggestion_ss[0];
		}
		this._update_config();
	},

	/** 点击选择输出路径 */
	async click_select_output_path(): Promise<void> {
		let result = await Editor.Dialog.select({
			type: "directory",
			title: "选择输出路径",
			multi: false,
			path: data.output_path_s,
		});

		if (result.canceled) {
			return;
		}

		let path_s = path.resolve(result.filePaths[0]);

		data.output_path_s = path_s;
		if (!data.output_path_suggestion_ss.includes(path_s)) {
			data.output_path_suggestion_ss.unshift(path_s);
		}
		this._update_config();
	},

	/** 初始化 */
	async _init(): Promise<void> {
		data.input_path_s = (await Editor.Profile.getConfig(config.plugin_name_s, "input_path_s")) ?? "";
		data.output_path_s = (await Editor.Profile.getConfig(config.plugin_name_s, "output_path_s")) ?? "";
		data.input_path_suggestion_ss = JSON.parse((await Editor.Profile.getConfig(config.plugin_name_s, "input_path_suggestion_ss")) ?? "[]");
		data.output_path_suggestion_ss = JSON.parse((await Editor.Profile.getConfig(config.plugin_name_s, "output_path_suggestion_ss")) ?? "[]");
	},

	/** 更新配置 */
	_update_config(): void {
		Editor.Profile.setConfig(config.plugin_name_s, "input_path_s", data.input_path_s);
		Editor.Profile.setConfig(config.plugin_name_s, "input_path_suggestion_ss", JSON.stringify(data.input_path_suggestion_ss));
		Editor.Profile.setConfig(config.plugin_name_s, "output_path_s", data.output_path_s);
		Editor.Profile.setConfig(config.plugin_name_s, "output_path_suggestion_ss", JSON.stringify(data.output_path_suggestion_ss));
	},
};

export const panel = Editor.Panel.define({
	template: `<div id="app" class="w-full h-full"><panel></panel></div>`,
	get style() {
		return tool.get_panel_content(__filename).style_s;
	},
	$: {
		app: "#app",
	},
	methods: {},
	ready() {
		if (this.$.app) {
			const app = createApp({});
			app.config.compilerOptions.isCustomElement = (tag: string) => tag.startsWith("ui-");
			app.component("panel", {
				template: tool.get_panel_content(__filename).html_s,
				data() {
					return data;
				},
				methods: methods,
				mounted() {
					self = this as any;
					data = (this as any).$data;
					methods._init();
				},
			});
			app.mount(this.$.app);
		}

		// 非 inspector 面板 F5 刷新
		if (!(info as any).target_s) {
			window.addEventListener("keydown", function (event) {
				if (event.key === "F5") {
					window.location.reload();
				}
			});
		}
	},
	// update(dump: any) {
	// 	self.dump = dump;
	// },
	beforeClose() {},
	close() {},
});
