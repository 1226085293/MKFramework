import run_check from "./RunCheck";

delete require.cache[__dirname + "\\Install.js"];
delete require.cache[__dirname + "\\LocalVersion.js"];
delete require.cache[__dirname + "\\BuildDTS.js"];
delete require.cache[__dirname + "\\Help.js"];
delete require.cache[__dirname + "\\TreeShaking.js"];

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
			await (await import("./Install")).default();
		}

		console.log(Editor.I18n.t("mk-framework.任务结束"));
	},

	async installDev() {
		console.log(Editor.I18n.t("mk-framework.任务开始"));
		if (run_check()) {
			await (await import("./Install")).default();
		}

		console.log(Editor.I18n.t("mk-framework.任务结束"));
	},

	async localVersion() {
		if (run_check()) {
			await (await import("./LocalVersion")).default();
		}
	},

	async build() {
		console.log(Editor.I18n.t("mk-framework.任务开始"));
		if (run_check()) {
			await (await import("./BuildDTS")).default();
		}

		console.log(Editor.I18n.t("mk-framework.任务结束"));
	},

	async help() {
		if (run_check()) {
			await (await import("./Help")).default();
		}
	},

	async treeShaking() {
		console.log(Editor.I18n.t("mk-framework.任务开始"));
		if (run_check()) {
			await (await import("./TreeShaking")).default();
		}
		console.log(Editor.I18n.t("mk-framework.任务结束"));
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
