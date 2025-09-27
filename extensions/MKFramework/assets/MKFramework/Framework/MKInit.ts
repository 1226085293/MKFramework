import * as mk from "./MKExport";
import GlobalConfig from "../Config/GlobalConfig";
import { EDITOR, DEBUG } from "cc/env";
import globalEvent from "../Config/GlobalEvent";
import { Director, director, profiler, screen, Size, view } from "cc";

// 初始化逻辑
if (!(EDITOR && !window["cc"].GAME_VIEW)) {
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
	screen.on("window-resize", () => {
		globalEvent.emit(globalEvent.key.resize);
	});
}

// 注册到全局
if (DEBUG) {
	window["mk"] = mk;
}

let temp: any = null;

// 防止编辑器增加 mk 提示
export default temp = mk;
