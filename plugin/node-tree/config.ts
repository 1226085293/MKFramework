import path from "path";

namespace config {
	export const plugin_path_s = path.join(__dirname, "..");
	export const plugin_name_s = path.basename(path.join(__dirname, ".."));
}

export default config;
