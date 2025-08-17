import fs from "fs";
import path from "path";

export default function runCheck(): boolean {
	if (fs.existsSync(path.join(__dirname, "..", "node_modules"))) {
		return true;
	}

	console.error(Editor.I18n.t("mk-framework.未初始化", { plugin_path_s: path.join(__dirname, "..") }));

	return false;
}
