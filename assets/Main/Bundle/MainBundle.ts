import mk from "mk";
import MainConfig from "./MainConfig";
import MainEventProtocol from "./MainEvent";
import * as cc from "cc";
import GlobalConfig from "GlobalConfig";

class MainBundle extends mk.Bundle_.BundleManageBase {
	nameStr = "main";
	event = new mk.EventTarget<MainEventProtocol>();
	storage = new mk.Storage({
		nameStr: "main_bundle",
		data: new MainConfig.StorageData(),
	});

	/* ------------------------------- 生命周期 ------------------------------- */
	open(): void {
		GlobalConfig.View.config.windowAnimationTab.open["默认"] = (node, component: cc.Component) => {
			node = node.getChildByName("窗口") ?? node;
			// 防止 widget 没有进行适配（3.6.3 - 3.7.0）
			node.getComponentsInChildren(cc.Widget).forEach((v) => v.updateAlignment());
			node.setScale(0, 0);

			return new Promise<void>(async (resolveFunc) => {
				// 等待子组件加载完成
				await (component as mk.ViewBase)["_childrenOpenTask"].task;

				// 执行动画
				cc.tween(node)
					.to(0.2, { scale: cc.v3(1.1, 1.1) })
					.to(0.1, { scale: cc.v3(0.95, 0.95) })
					.to(0.05, { scale: cc.v3(1, 1, 1) })
					.call(() => {
						resolveFunc();
					})
					.start();
			});
		};

		GlobalConfig.View.config.windowAnimationTab.close["默认"] = (node) => {
			node = node.getChildByName("窗口") ?? node;

			return new Promise<void>((resolveFunc) => {
				cc.tween(node)
					.to(0.2, { scale: cc.v3(0, 0) })
					.call(() => {
						setTimeout(() => {
							node.setScale(1, 1, 1);
						}, 0);

						resolveFunc();
					})
					.start();
			});
		};
	}
}

export default new MainBundle();
