import * as mk from "./mk_export";
// import type * as mk from "./../../declare/mk";
import global_config from "../@config/global_config";
import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_event from "../@config/global_event";

// 初始化 log
mk.logger.init();

// 初始化 audio
mk.audio.init({
	type: global_config.audio.group,
	group: global_config.audio.group,
});

// 初始化 bundle
["extend", "config", "framework", "decorator", "tool"].forEach((v_s) => {
	mk.bundle.add({
		bundle_s: v_s,
	});
});

// 初始化 view
mk.module.view_base.init(
	{
		layer_type: global_config.view.layer_type,
		layer_spacing_n: 100,
	},
	{
		mask_node_name_s: "遮罩",
		mask_prefab_path_s: global_config.view.mask_prefab_path_s,
		window_animation_tab: {
			open: {
				默认: (node) => {
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
				},
				无: (node) => {
					// ...
				},
			},
			close: {
				默认: (node) => {
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
				},
				无: (node) => {
					// ...
				},
			},
		},
	}
);

// 初始化逻辑
if (!EDITOR) {
	// 显示 debug 信息
	cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		if (global_config.constant.show_debug_info) {
			cc.profiler.showStats();
		} else {
			cc.profiler.hideStats();
		}
	});

	// 事件分发 - 屏幕大小改变
	cc.view.setResizeCallback(() => {
		global_event.emit(global_event.key.resize);
	});

	// 初始化设计分辨率
	cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
		global_config.view.original_design_size.set(cc.view.getDesignResolutionSize());
	});
}

// 注册到全局方便调试
export default self["mk"] = mk;
