import { _decorator } from "cc";
import mk from "mk";
import global_config from "../../../@config/global_config";
const { ccclass, property } = _decorator;

@ccclass("resources_hot_update")
export class resources_hot_update extends mk.view_base {
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		/** 远程地址 */
		remote_url_s = "http://localhost:8080/config";
		/** bundle 名 */
		bundle_s = "config";
		/** bundle 版本 */
		bundle_version_s = "";
		/** 游戏版本 */
		game_version_s = global_config.constant.version_s;
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}
	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 确认 */
	async button_confirm(): Promise<void> {
		await mk.bundle.reload({
			bundle_s: this.data.bundle_s,
			origin_s: this.data.remote_url_s,
			version_s: this.data.bundle_version_s,
		});

		this.data.game_version_s = global_config.constant.version_s;
	}
}
