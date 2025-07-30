import run_check from "./run_check";

delete require.cache[__dirname + "\\build_dts.js"];
delete require.cache[__dirname + "\\install.js"];
delete require.cache[__dirname + "\\help.js"];

/**
 * @en Methods within the extension can be triggered by message
 * @zh 扩展内的方法，可以通过 message 触发
 */
export const methods: Record<string, (...any: any) => any> = {
	/**
	 * @en A method that can be triggered by message
	 * @zh 通过 message 触发的方法
	 * @param str The string to be printed
	 */
	async install() {
		console.log(Editor.I18n.t("mk-framework.任务开始"));
		if (run_check()) {
			await (await import("./install")).default();
		}

		console.log(Editor.I18n.t("mk-framework.任务结束"));
	},

	async local_version() {
		if (run_check()) {
			await (await import("./local_version")).default();
		}
	},

	async build() {
		console.log(Editor.I18n.t("mk-framework.任务开始"));
		if (run_check()) {
			await (await import("./build_dts")).default();
		}

		console.log(Editor.I18n.t("mk-framework.任务结束"));
	},

	async help() {
		if (run_check()) {
			await (await import("./help")).default();
		}
	},
};

/**
 * @en The method executed when the extension is started
 * @zh 扩展启动的时候执行的方法
 */
export function load(): void {
	// Editor.Message.send('{name}', 'hello');
}

/**
 * @en Method triggered when uninstalling the extension
 * @zh 卸载扩展触发的方法
 */
export function unload(): void {
	// ...
}
