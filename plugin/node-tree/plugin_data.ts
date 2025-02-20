import path from "path";
import plugin_config from "./plugin_config";

/** 插件数据 */
class _plugin_data {
	/* ------------------------------- segmentation ------------------------------- */
	/** 重置 */
	reset(): void {
		Object.assign(this, new _plugin_data());
	}
	/* ------------------------------- get/set ------------------------------- */
}

const plugin_data: _plugin_data = new _plugin_data();

export default plugin_data;
