import path from "path";
import cjson from "cjson";

export default function localVersion() {
	/** 包配置 */
	const projectPackage = cjson.load(path.join(Editor.Project.path, "package.json"));

	if (!projectPackage["MKFramework"]?.version) {
		console.log(Editor.I18n.t("mk-framework.当前项目未安装框架"));
		return;
	}

	console.log(Editor.I18n.t("mk-framework.当前项目框架版本为") + projectPackage["MKFramework"].version);
}
