import path from "path";
import electron from "electron";
import config from "./config";
import fs from "fs";

/** 插件工具集 */
class tool {
	private _panel_tab: Record<string, electron.BrowserWindow> = {};
	/* ------------------------------- segmentation ------------------------------- */
	/**
	 * 发送场景事件
	 * @param method_s_ 方法名
	 * @param args_as_ 参数
	 */
	call_scene_script(method_s_: string, ...args_as_: any[]): Promise<any> {
		return Editor.Message.request("scene", "execute-scene-script", {
			name: config.plugin_name_s,
			method: method_s_,
			args: args_as_,
		});
	}

	/**
	 * 打开面板
	 * @param panel_s_ 面板名
	 * @param args_as_ 传递到面板的参数
	 * @returns
	 */
	async open_panel(panel_s_: string, ...args_as_: any[]): Promise<electron.BrowserWindow | null> {
		let panel_name_s = `${config.plugin_name_s}.${panel_s_}`;

		if (await Editor.Panel.has(panel_name_s)) {
			Editor.Panel.focus(panel_name_s);
			return this._panel_tab[panel_name_s];
		} else {
			let old_warn_f = console.warn;
			console.warn = function () {};
			const browser_window: typeof Electron.BrowserWindow =
				electron.BrowserWindow ?? (electron.remote ?? require("@electron/remote")).BrowserWindow;
			const window_id_ns = browser_window.getAllWindows().map((v) => v.id);
			await Editor.Panel.open(`${config.plugin_name_s}.${panel_s_}`, ...(args_as_ ?? []));
			setTimeout(() => {
				console.warn = old_warn_f;
			}, 500);

			const window = browser_window.getAllWindows().find((v) => !window_id_ns.includes(v.id))!;

			if (!window) {
				console.error(`打开 ${panel_s_} 面板失败`);
				return null;
			}

			this._panel_tab[panel_name_s] = window;

			// // 打开调试
			// window.webContents.openDevTools();

			return window;
		}
	}

	/**
	 * 关闭面板
	 * @param panel_s_ 面板名
	 * @returns
	 */
	close_panel(panel_s_: string): Promise<any> {
		let panel_name_s = `${config.plugin_name_s}.${panel_s_}`;

		return Editor.Panel.close(panel_name_s);
	}

	/**
	 * 清理模块缓存
	 * @param path_s_ 模块路径
	 */
	clear_module(path_s_: string): void {
		let path_s = path_s_.replace(/\\/g, "/");

		delete require.cache[path_s.replace(/\//g, "\\")];
		delete require.cache[path_s];
	}

	/**
	 * 获取面板内容
	 * @param dir_path_s_ __direname
	 * @returns
	 */
	get_panel_content(dir_path_s_: string): {
		html_s: string;
		style_s: string;
	} {
		let file_s = fs.readFileSync(path.join(config.plugin_path_s, `panel/${path.basename(dir_path_s_, ".js")}.html`), "utf-8");

		return {
			html_s: file_s.match(/<div([\s\S]*)?<\/div>/g)![0],
			style_s: [
				file_s.match(/(?<=<style>)([^]*)(?=<\/style>)/g)?.[0] ?? "",
				fs.readFileSync(path.join(config.plugin_path_s, `dist/tailwind.css`), "utf-8"),
			].join("\n"),
		};
	}
}

export default new tool();
