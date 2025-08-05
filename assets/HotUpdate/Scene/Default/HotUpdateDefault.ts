import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import GlobalConfig from "GlobalConfig";
const { ccclass, property } = _decorator;

@ccclass("HotUpdateDefault")
export class HotUpdateDefault extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "远程地址", type: cc.EditBox })
	remoteUrlEditBox: cc.EditBox = null!;

	@property({ displayName: "Config 地址", type: cc.EditBox })
	configUrlEditBox: cc.EditBox = null!;

	@property({ displayName: "Main 地址", type: cc.EditBox })
	mainUrlEditBox: cc.EditBox = null!;

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	// open(): void {}
	// close(): void {}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 关闭 */
	clickClose(): void {
		mk.bundle.loadScene("main", { bundleStr: GlobalConfig.Asset.bundle.main });
	}

	/** 确认 */
	async clickConfirm(): Promise<void> {
		await mk.bundle.reload({
			bundleStr: GlobalConfig.Asset.bundle.Config,
			originStr: this.remoteUrlEditBox.string + "/" + GlobalConfig.Asset.bundle.Config,
			versionStr: this.configUrlEditBox.string,
		});

		await mk.bundle.reload({
			bundleStr: GlobalConfig.Asset.bundle.main,
			originStr: this.remoteUrlEditBox.string + "/" + GlobalConfig.Asset.bundle.main,
			versionStr: this.mainUrlEditBox.string,
		});

		this._log.log("热更完成");
	}
}
