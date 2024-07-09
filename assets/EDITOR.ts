import { EDITOR } from "cc/env";

if (EDITOR) {
	Promise.all([import("protobufjs")]).catch(() => {
		console.error("项目未初始化，请在项目根目录控制台执行 npm i 完成后重启项目。", "注：当前项目为框架示例项目，并非框架！");
	});
}
