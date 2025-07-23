import { _decorator } from "cc";
import mk from "mk";
import GlobalConfig from "global_config";
const { ccclass, property } = _decorator;

@ccclass("hot_update_default")
export class hot_update_default extends mk.view_base {
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		/** 远程地址 */
		remote_url_s = "http://localhost:8080";
		/** main bundle 版本 */
		config_version_s = "";
		/** main bundle 版本 */
		main_version_s = "";
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 关闭 */
	button_close(): void {
		mk.bundle.load_scene("main", { bundle_s: GlobalConfig.Asset.bundle.main });
	}

	/** 确认 */
	async button_confirm(): Promise<void> {
		await mk.bundle.reload({
			bundle_s: GlobalConfig.Asset.bundle.config,
			origin_s: this.data.remote_url_s + "/" + GlobalConfig.Asset.bundle.config,
			version_s: this.data.config_version_s,
		});

		await mk.bundle.reload({
			bundle_s: GlobalConfig.Asset.bundle.main,
			origin_s: this.data.remote_url_s + "/" + GlobalConfig.Asset.bundle.main,
			version_s: this.data.main_version_s,
		});

		this._log.log("热更完成");
	}
}
