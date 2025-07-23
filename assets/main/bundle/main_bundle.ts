import mk from "mk";
import main_config from "./main_config";
import main_event_protocol from "./main_event";
import * as cc from "cc";
import GlobalConfig from "global_config";

class main_bundle extends mk.bundle_.bundle_manage_base {
	name_s = "main";
	event = new mk.event_target<main_event_protocol>();
	storage = new mk.storage<main_config.storage_data>({
		name_s: "main_bundle",
		data: {
			bundle_version_tab: {},
		},
	});

	/* ------------------------------- 生命周期 ------------------------------- */
	open(): void {
		GlobalConfig.view.config.window_animation_tab.open["默认"] = (node) => {
			node = node.getChildByName("窗口") ?? node;
			// 防止 widget 没有进行适配（3.6.3 - 3.7.0）
			node.getComponentsInChildren(cc.Widget).forEach((v) => v.updateAlignment());
			node.setScale(0, 0);

			return new Promise<void>((resolve_f) => {
				cc.tween(node)
					.to(0.2, { scale: cc.v3(1.1, 1.1) })
					.to(0.1, { scale: cc.v3(0.95, 0.95) })
					.to(0.05, { scale: cc.v3(1, 1, 1) })
					.call(() => {
						resolve_f();
					})
					.start();
			});
		};

		GlobalConfig.view.config.window_animation_tab.close["默认"] = (node) => {
			node = node.getChildByName("窗口") ?? node;

			return new Promise<void>((resolve_f) => {
				cc.tween(node)
					.to(0.2, { scale: cc.v3(0, 0) })
					.call(() => {
						setTimeout(() => {
							node.setScale(1, 1, 1);
						}, 0);

						resolve_f();
					})
					.start();
			});
		};
	}
}

export default new main_bundle();
