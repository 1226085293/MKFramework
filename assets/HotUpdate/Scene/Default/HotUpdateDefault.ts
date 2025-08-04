import { _decorator } from "cc";
import mk from "mk";
import GlobalConfig from "global_config";
const { ccclass, property } = _decorator;

@ccclass("HotUpdateDefault")
export class HotUpdateDefault extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = new (class {
		/** 远程地址 */
		remoteUrlStr = "http://localhost:8080";
		/** main bundle 版本 */
		configVersionStr = "";
		/** main bundle 版本 */
		mainVersionStr = "";
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 关闭 */
	buttonClose(): void {
		mk.bundle.loadScene("main", { bundleStr: GlobalConfig.Asset.bundle.main });
	}

	/** 确认 */
	async buttonConfirm(): Promise<void> {
		await mk.bundle.reload({
			bundleStr: GlobalConfig.Asset.bundle.Config,
			originStr: this.data.remoteUrlStr + "/" + GlobalConfig.Asset.bundle.Config,
			versionStr: this.data.configVersionStr,
		});

		await mk.bundle.reload({
			bundleStr: GlobalConfig.Asset.bundle.main,
			originStr: this.data.remoteUrlStr + "/" + GlobalConfig.Asset.bundle.main,
			versionStr: this.data.mainVersionStr,
		});

		this._log.log("热更完成");
	}
}
