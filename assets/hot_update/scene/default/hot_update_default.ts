import { _decorator } from "cc";
import mk from "mk";
import global_config from "global_config";
const { ccclass, property } = _decorator;

@ccclass("hot_update_default")
export class hot_update_default extends mk.view_base {
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		/** 远程地址 */
		remote_url_s = "http://localhost:8080";
		/** bundle 版本 */
		bundle_version_s = "";
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 关闭 */
	button_close(): void {
		mk.bundle.load_scene("main", { bundle_s: global_config.asset.bundle.main });
	}

	/** 确认 */
	async button_confirm(): Promise<void> {
		await mk.bundle.reload({
			bundle_s: global_config.asset.bundle.config,
			origin_s: this.data.remote_url_s + "/" + global_config.asset.bundle.config,
			version_s: this.data.bundle_version_s,
		});

		await mk.bundle.reload({
			bundle_s: global_config.asset.bundle.main,
			origin_s: this.data.remote_url_s + "/" + global_config.asset.bundle.main,
			version_s: this.data.bundle_version_s,
		});

		this._log.log("热更完成");
	}
}
