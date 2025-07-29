import path from "path";
import cjson from "cjson";

export default function () {
	/** 包配置 */
	const project_package = cjson.load(path.join(Editor.Project.path, "package.json"));

	if (!project_package["MKFramework"]?.version_s) {
		console.log(Editor.I18n.t("MKFramework.当前项目未安装框架"));
		return;
	}

	console.log(Editor.I18n.t("MKFramework.当前项目框架版本为") + project_package["MKFramework"].version_s);
}
