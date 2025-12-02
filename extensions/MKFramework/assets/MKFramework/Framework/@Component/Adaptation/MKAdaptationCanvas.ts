import { EDITOR } from "cc/env";
import GlobalConfig from "../../../Config/GlobalConfig";
import globalEvent from "../../../Config/GlobalEvent";
import { _decorator, Component, director, Canvas, view, ResolutionPolicy, Director, screen, game } from "cc";

const { ccclass, disallowMultiple } = _decorator;

/**
 * canvas 适配
 * @noInheritDoc
 */
@ccclass
@disallowMultiple
export default class MKAdaptationCanvas extends Component {
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		// 事件监听
		globalEvent.on(globalEvent.key.resize, this.adaptation, this);
	}

	protected onEnable(): void {
		// 初始化视图
		this.adaptation();
	}

	protected onDestroy(): void {
		globalEvent.targetOff(this);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 适配 */
	async adaptation(): Promise<void> {
		const canvas = director.getScene()?.getComponentInChildren(Canvas);

		// 安检
		if (!canvas) {
			return;
		}

		/** 真实尺寸 */
		const frameSize = screen.windowSize;
		const { adaptationType, originalDesignSize } = GlobalConfig.View;

		// 固定尺寸
		if (adaptationType === GlobalConfig.View.AdaptationMode.FixedSize) {
			return view.setDesignResolutionSize(frameSize.width, frameSize.height, ResolutionPolicy.UNKNOWN);
		}

		/** 真实尺寸比设计尺寸高 */
		const isHigher = frameSize.height / frameSize.width > originalDesignSize.height / originalDesignSize.width;

		// 自适应模式
		view.setDesignResolutionSize(
			isHigher ? originalDesignSize.width : frameSize.width * (originalDesignSize.height / frameSize.height),
			isHigher ? frameSize.height * (originalDesignSize.width / frameSize.width) : originalDesignSize.height,
			isHigher ? ResolutionPolicy.FIXED_WIDTH : ResolutionPolicy.FIXED_HEIGHT
		);
	}
}

// 自动添加至场景节点
if (!(EDITOR && !window["cc"].GAME_VIEW) && GlobalConfig.View.adaptationType !== GlobalConfig.View.AdaptationMode.None) {
	const addToSceneNodeFunc = (): void => {
		const canvasNode = director.getScene()?.getComponentInChildren(Canvas)?.node;

		if (canvasNode && !canvasNode.getComponent(MKAdaptationCanvas)) {
			canvasNode.addComponent(MKAdaptationCanvas);
		}
	};

	// 防止编辑器预览报错，编辑器预览会触发两次 EVENT_AFTER_SCENE_LAUNCH 导致首次调用 setDesignResolutionSize 引擎内部报错
	director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
		setTimeout(() => {
			addToSceneNodeFunc();
			director.on(Director.EVENT_AFTER_SCENE_LAUNCH, addToSceneNodeFunc);
		}, game.frameTime);
	});
}
