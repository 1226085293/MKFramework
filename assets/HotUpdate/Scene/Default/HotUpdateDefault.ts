import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import GlobalConfig from "GlobalConfig";
const { ccclass, property } = _decorator;

@ccclass("HotUpdateDefault")
export class HotUpdateDefault extends mk.ViewBase {
	/* --------------- 属性 --------------- */
	@property({ displayName: "http 服务器地址", type: cc.EditBox })
	remoteUrlEditBox: cc.EditBox = null!;

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 关闭 */
	clickClose(): void {
		mk.bundle.loadScene("Main", { bundleStr: GlobalConfig.Asset.bundle.main });
	}

	/** 确认 */
	async clickConfirm(): Promise<void> {
		const versionTab: Record<string, string> = await mk.network.http.get(`${this.remoteUrlEditBox.string}/version.json`, {
			returnType: "json",
		});

		const needUpdateBundleStrList = [
			GlobalConfig.Asset.bundle.Config,
			GlobalConfig.Asset.bundle.Framework,
			GlobalConfig.Asset.bundle.main,
			GlobalConfig.Asset.bundle.resources,
			"HotUpdate",
		];

		for (const vStr of needUpdateBundleStrList) {
			// 不需要更新
			if (!versionTab[vStr] || cc.assetManager.downloader.bundleVers[vStr] === versionTab[vStr]) {
				continue;
			}

			const task = mk.bundle.reload({
				bundleStr: vStr,
				originStr: `${this.remoteUrlEditBox.string}/${vStr}`,
				versionStr: versionTab[vStr],
			});

			if (vStr !== "HotUpdate") {
				await task;
			}
		}

		this._log.log("热更完成");
	}
}
