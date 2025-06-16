import fs from "fs";
import path from "path";
import config from "../config";
import { createApp, App } from "vue";
import { InspectorInfo, PanelInfo, Self } from "../types";
import electron, { BrowserWindow } from "electron";
import tool from "../tool";

// export const info: InspectorInfo = {
// 	type_s: "asset",
// 	target_s: "effect",
// };
export const info: PanelInfo = {
	title_s: "选择版本",
	width_n: 300,
	height_n: 200,
	top_level_b: true,
};

export let self: Self;

export let data = {
	extension_name_s: "扩展名",
	version_ss: ["测试1", "测试2"] as string[],
	version_index_n: -1,
	init_data: null! as [string, string[]],
};

export let methods = {
	async click_download(): Promise<void> {
		if (data.version_index_n < 0) {
			Editor.Dialog.warn("请选择版本");
			return;
		}

		let result = await Editor.Dialog.info(`确认下载 ${data.extension_name_s}(${data.version_ss[data.version_index_n]})？`, {
			buttons: ["确认", "取消"],
		});

		if (result.response !== 0) {
			return;
		}

		await Editor.Message.request(config.plugin_name_s, "store.on_download", data.version_ss[data.version_index_n]);
		tool.close_panel(path.basename(__filename.slice(0, -3)));
	},

	on_select_version(index_n_: number): void {
		data.version_index_n = index_n_;
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
		data.init_data = arguments as any;
		data.extension_name_s = data.init_data[0];
		data.version_ss = data.init_data[1];
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

			window.addEventListener("close", () => {
				console.log("窗口关闭");
			});
		}
	},
	// update(dump: any) {
	// 	self.dump = dump;
	// },
	beforeClose() {},
	close() {},
});
