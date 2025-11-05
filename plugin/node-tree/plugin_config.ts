import path from "path";

class plugin_config {
	/** 插件名 */
	static readonly plugin_name_s = path.basename(path.dirname(__dirname));
	/** 插件路径 */
	static readonly plugin_path_s = path.join(__dirname, "..");
	/** 代码风格 */
	static readonly code_style_s: "驼峰" | "蛇形" = "驼峰";
}

export default plugin_config;
