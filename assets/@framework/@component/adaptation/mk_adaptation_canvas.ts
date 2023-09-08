import { EDITOR } from "cc/env";
import global_config from "../../../@config/global_config";
import global_event from "../../../@config/global_event";
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

		switch (global_config.view.adaptation_type) {
			// 自适应
			case global_config.view.adaptation_mode.adaptive: {
				/** 设计尺寸 */
				const design_size = global_config.view.original_design_size;
				/** 真实尺寸比设计尺寸高 */
				const higher_b = frame_size.height / frame_size.width > design_size.height / design_size.width;

				if (higher_b) {
					cc.view.setDesignResolutionSize(
						design_size.width,
						frame_size.height * (design_size.width / frame_size.width),
						cc.ResolutionPolicy.FIXED_WIDTH
					);
				} else {
					cc.view.setDesignResolutionSize(
						frame_size.width * (design_size.height / frame_size.height),
						design_size.height,
						cc.ResolutionPolicy.FIXED_HEIGHT
					);
				}

				break;
			}

			// 固定尺寸
			case global_config.view.adaptation_mode.fixed_size: {
				cc.view.setDesignResolutionSize(frame_size.width, frame_size.height, cc.ResolutionPolicy.UNKNOWN);
				break;
			}
		}
	}
}

// 自动添加至场景节点
if (!EDITOR && global_config.view.adaptation_type !== global_config.view.adaptation_mode.none) {
	cc.director.on(cc.Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		const canvas_node = cc.director.getScene()?.getComponentInChildren(cc.Canvas)?.node;

		if (!canvas_node || canvas_node.getComponent(mk_adaptation_canvas)) {
			return;
		}

		canvas_node.addComponent(mk_adaptation_canvas);
	});
}
