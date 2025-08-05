import * as mk from "./MKExport";
import GlobalConfig from "../Config/GlobalConfig";
import { DEBUG, EDITOR } from "cc/env";
import GlobalEvent from "../Config/GlobalEvent";
import * as env from "cc/env";
import { Director, director, profiler, Size, view } from "cc";

// 初始化逻辑
if (!EDITOR) {
	// 保存初始设计分辨率
	director.once(Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
		(GlobalConfig.View.originalDesignSize as Size).set(view.getDesignResolutionSize());
	});

	// 显示调试信息
	director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		if (GlobalConfig.Constant.isShowDebugInfo) {
			profiler?.showStats();
		} else {
			profiler?.hideStats();
		}
	});

	// 屏幕大小改变事件分发
	if ((view as any).setResizeCallback) {
		(view as any).setResizeCallback(() => {
			GlobalEvent.emit(GlobalEvent.key.resize);
		});
	} else {
		(screen as any).on("window-resize", () => {
			GlobalEvent.emit(GlobalEvent.key.resize);
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
