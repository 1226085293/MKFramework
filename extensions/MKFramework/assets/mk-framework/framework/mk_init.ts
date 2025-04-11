import * as mk from "./mk_export";
import global_config from "../config/global_config";
import * as cc from "cc";
import { DEBUG, EDITOR } from "cc/env";
import global_event from "../config/global_event";
import * as env from "cc/env";

// 初始化逻辑
if (!EDITOR) {
	// 保存初始设计分辨率
	cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
		(global_config.view.original_design_size as cc.Size).set(cc.view.getDesignResolutionSize());
	});

	// 显示调试信息
	cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		if (global_config.constant.show_debug_info_b) {
			cc.profiler?.showStats();
		} else {
			cc.profiler?.hideStats();
		}
	});

	// 屏幕大小改变事件分发
	if ((cc.view as any).setResizeCallback) {
		(cc.view as any).setResizeCallback(() => {
			global_event.emit(global_event.key.resize);
		});
	} else {
		(cc.screen as any).on("window-resize", () => {
			global_event.emit(global_event.key.resize);
		});
	}
} else {
	// 编辑器预览模式
	if (window["cc"].GAME_VIEW) {
		(env as any).EDITOR = false;
	}
}

// 注册到全局
if (DEBUG) {
	window["mk"] = mk;
}

let temp: any = null;

// 防止编辑器增加 mk 提示
export default temp = mk;
