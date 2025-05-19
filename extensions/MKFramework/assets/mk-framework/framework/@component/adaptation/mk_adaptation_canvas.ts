import { EDITOR } from "cc/env";
import global_config from "../../../config/global_config";
import global_event from "../../../config/global_event";
import * as cc from "cc";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, disallowMultiple } = cc._decorator;

/**
 * canvas 适配
 * @noInheritDoc
 */
@ccclass
@disallowMultiple
export default class mk_adaptation_canvas extends cc.Component {
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		// 事件监听
		global_event.on(global_event.key.resize, this.adaptation, this);
	}

	protected onEnable(): void {
		// 初始化视图
		this.adaptation();
	}

	protected onDestroy(): void {
		global_event.targetOff(this);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 适配 */
	async adaptation(): Promise<void> {
		const canvas = cc.director.getScene()?.getComponentInChildren(cc.Canvas);

		// 安检
		if (!canvas) {
			return;
		}

		/** 真实尺寸 */
		const frame_size = cc.screen.windowSize;
		const { adaptation_type, adaptation_mode, original_design_size } = global_config.view;

		// 固定尺寸
		if (adaptation_type === adaptation_mode.fixed_size) {
			return cc.view.setDesignResolutionSize(frame_size.width, frame_size.height, cc.ResolutionPolicy.UNKNOWN);
		}

		/** 真实尺寸比设计尺寸高 */
		const higher_b = frame_size.height / frame_size.width > original_design_size.height / original_design_size.width;

		// 自适应模式
		cc.view.setDesignResolutionSize(
			higher_b ? original_design_size.width : frame_size.width * (original_design_size.height / frame_size.height),
			higher_b ? frame_size.height * (original_design_size.width / frame_size.width) : original_design_size.height,
			higher_b ? cc.ResolutionPolicy.FIXED_WIDTH : cc.ResolutionPolicy.FIXED_HEIGHT
		);
	}
}

// 自动添加至场景节点
if (!EDITOR && global_config.view.adaptation_type !== global_config.view.adaptation_mode.none) {
	cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		const canvas_node = cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node;

		if (canvas_node && !canvas_node.getComponent(mk_adaptation_canvas)) {
			canvas_node.addComponent(mk_adaptation_canvas);
		}
	});
}
