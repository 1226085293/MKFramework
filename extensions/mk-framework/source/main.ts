delete require.cache[__dirname + "\\build_dts.js"];
delete require.cache[__dirname + "\\install.js"];
delete require.cache[__dirname + "\\help.js"];
import build_dts from "./build_dts";
import help from "./help";
import install from "./install";
import local_version from "./local_version";

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
		console.log("安装开始...");
		await install();
		console.log("安装完成");
	},

	local_version() {
		local_version();
	},

	async build() {
		console.log("构建 d.ts...");
		await build_dts();
		console.log("构建 d.ts 完成");
	},

	help() {
		help();
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
