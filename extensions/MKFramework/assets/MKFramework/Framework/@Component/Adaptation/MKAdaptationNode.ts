// eslint-disable-next-line unused-imports/no-unused-imports
import { _decorator, Component, size, Vec3, v3, UITransform, Sprite, Size, v2, director, Canvas, Enum, Node } from "cc";
import GlobalEvent from "../../../Config/GlobalEvent";
import { mkLog } from "../../MKLogger";
import { EDITOR } from "cc/env";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = _decorator;

namespace _MKAdaptationNode {
	/** 适配类型 */
	export enum Type {
		默认,
		缩放,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		自适应_展示完,
		// eslint-disable-next-line @typescript-eslint/naming-convention
		自适应_填充满,
		填充宽,
		填充高,
	}

	/** 适配模式 */
	export enum Mode {
		Scale,
		Size,
	}

	/** 适配来源 */
	export enum Source {
		Canvas,
		Parent,
		Customize,
	}
}

/**
 * 节点适配
 * @noInheritDoc
 */
@ccclass
@executeInEditMode
export default class MKAdaptationNode extends Component {
	/* --------------- 属性 --------------- */
	/** 编辑器预览 */
	@property({ displayName: "编辑器预览" })
	get isEditorPreview(): boolean {
		return this._isEditorPreview;
	}

	set isEditorPreview(value_) {
		this._isEditorPreview = value_;
		if (value_) {
			this.updateAdaptation();
		}
	}

	/** 适配模式 */
	@property({ displayName: "适配模式", type: Enum(_MKAdaptationNode.Mode) })
	adaptationMode = _MKAdaptationNode.Mode.Scale;

	/** 适配来源 */
	@property({ displayName: "适配来源", type: Enum(_MKAdaptationNode.Source) })
	adaptationSource = _MKAdaptationNode.Source.Canvas;

	/** 原始大小 */
	@property({
		displayName: "原始大小",
		visible(this: MKAdaptationNode) {
			return this.adaptationMode === _MKAdaptationNode.Mode.Size;
		},
	})
	originalSize = size();

	/** 自定义适配大小 */
	@property({
		displayName: "自定义适配大小",
		visible(this: MKAdaptationNode) {
			return this.adaptationSource === _MKAdaptationNode.Source.Customize;
		},
	})
	customAdaptSize = size();

	/** 适配类型 */
	@property({ displayName: "适配类型", type: Enum(_MKAdaptationNode.Type) })
	get type(): _MKAdaptationNode.Type {
		return this._type;
	}

	set type(value_: _MKAdaptationNode.Type) {
		this._type = value_;
		if (this.isEditorPreview) {
			this.updateAdaptation();
		}
	}

	/** 限制最大缩放 */
	@property({
		displayName: "限制最大缩放",
		visible(this: MKAdaptationNode) {
			return this.adaptationMode === _MKAdaptationNode.Mode.Scale;
		},
	})
	get isLimitMaxScale(): boolean {
		return this._isLimitMaxScale;
	}

	set isLimitMaxScale(value_) {
		this._isLimitMaxScale = value_;
		if (this.type === _MKAdaptationNode.Type.填充宽 || this.type === _MKAdaptationNode.Type.填充高) {
			this.updateAdaptation();
		}
	}

	/** 限制最小缩放 */
	@property({
		displayName: "限制最小缩放",
		visible(this: MKAdaptationNode) {
			return this.adaptationMode === _MKAdaptationNode.Mode.Scale;
		},
	})
	get isLimitMinScale(): boolean {
		return this._isLimitMinScale;
	}

	set isLimitMinScale(value_) {
		this._isLimitMinScale = value_;
		if (this.type === _MKAdaptationNode.Type.填充宽 || this.type === _MKAdaptationNode.Type.填充高) {
			this.updateAdaptation();
		}
	}

	/** 最大缩放 */
	@property({
		displayName: "最大缩放",
		type: Vec3,
		visible: function (this: MKAdaptationNode): boolean {
			return this.isLimitMaxScale;
		},
	})
	get maxScaleV3(): Vec3 {
		return this._maxScaleV3;
	}

	set maxScaleV3(valueV3_) {
		this._maxScaleV3 = valueV3_;
		if (this.type === _MKAdaptationNode.Type.填充宽 || this.type === _MKAdaptationNode.Type.填充高) {
			this.updateAdaptation();
		}
	}

	/** 最小缩放 */
	@property({
		displayName: "最小缩放",
		type: Vec3,
		visible: function (this: MKAdaptationNode): boolean {
			return this.isLimitMinScale;
		},
	})
	get minScaleV3(): Vec3 {
		return this._minScaleV3;
	}

	set minScaleV3(valueV3_) {
		this._minScaleV3 = valueV3_;
		if (this.type === _MKAdaptationNode.Type.填充宽 || this.type === _MKAdaptationNode.Type.填充高) {
			this.updateAdaptation();
		}
	}

	/* --------------- private --------------- */
	/** 适配类型 */
	@property
	private _type = _MKAdaptationNode.Type.默认;

	/** 限制最大缩放 */
	@property
	private _isLimitMaxScale = false;

	/** 限制最小缩放 */
	@property
	private _isLimitMinScale = false;

	/** 最大缩放 */
	@property
	private _maxScaleV3 = v3(1, 1, 1);

	/** 最小缩放 */
	@property
	private _minScaleV3 = v3(1, 1, 1);

	/** 编辑器预览 */
	private _isEditorPreview = false;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		if (EDITOR) {
			if (this.originalSize.equals(size())) {
				this.originalSize = this.node.getComponent(UITransform)!.contentSize.clone();
			}

			this.updateAdaptation();
		}
	}

	onEnable(): void {
		this.updateAdaptation();

		if (this.adaptationSource === _MKAdaptationNode.Source.Canvas) {
			GlobalEvent.on(GlobalEvent.key.resize, this._onGlobalResize, this);
		} else if (this.adaptationSource === _MKAdaptationNode.Source.Parent) {
			this.node.parent?.on(Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
		}

		if (this.node.getComponent(Sprite)) {
			this.node.on(Sprite.EventType.SPRITE_FRAME_CHANGED, this._onNodeSpriteFrameChanged, this);
		}

		this.node.on(Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
	}

	onDisable(): void {
		if (this.adaptationSource === _MKAdaptationNode.Source.Canvas) {
			GlobalEvent.off(GlobalEvent.key.resize, this._onGlobalResize, this);
		} else if (this.adaptationSource === _MKAdaptationNode.Source.Parent) {
			this.node.parent?.off(Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
		}

		this.node.off(Sprite.EventType.SPRITE_FRAME_CHANGED, this._onNodeSpriteFrameChanged, this);
		this.node.off(Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
	}

	/* ------------------------------- 功能函数 ------------------------------- */
	/** 延迟更新适配 */
	private _delayedUpdateAdaptation(timeMsNum_ = 50): void {
		this.scheduleOnce(() => {
			this.updateAdaptation();
		}, timeMsNum_ * 0.001);
	}

	/** 自适应-展示完 */
	private _adaptiveShowAll(designSize_: Size, frameSize_: Size): void {
		const scaleV2 = v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (scaleV2.x < scaleV2.y) {
			scaleV2.y = scaleV2.x;
		} else {
			scaleV2.x = scaleV2.y;
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width * scaleV2.x, this.originalSize.height * scaleV2.y);
		}
	}

	/** 自适应-填充满 */
	private _adaptiveFillUp(designSize_: Size, frameSize_: Size): void {
		const scaleV2 = v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (scaleV2.x < scaleV2.y) {
			scaleV2.x = scaleV2.y;
		} else {
			scaleV2.y = scaleV2.x;
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width * scaleV2.x, this.originalSize.height * scaleV2.y);
		}
	}

	/** 填充宽 */
	private _fillWidth(designSize_: Size, frameSize_: Size): void {
		const scaleNum = designSize_.width / frameSize_.width;
		const scaleV2 = v2(scaleNum, scaleNum);

		if (this.isLimitMaxScale) {
			scaleV2.x = Math.min(scaleV2.x, this.maxScaleV3.x);
			scaleV2.y = Math.min(scaleV2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width * scaleV2.x, this.originalSize.height * scaleV2.y);
		}
	}

	/** 填充高 */
	private _fillHeight(designSize_: Size, frameSize_: Size): void {
		const scaleNum = designSize_.height / frameSize_.height;
		const scaleV2 = v2(scaleNum, scaleNum);

		if (this.isLimitMaxScale) {
			scaleV2.x = Math.min(scaleV2.x, this.maxScaleV3.x);
			scaleV2.y = Math.min(scaleV2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width * scaleV2.x, this.originalSize.height * scaleV2.y);
		}
	}

	/** 默认 */
	private _default(designSize_: Size, frameSize_: Size): void {
		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(1, 1);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width, this.originalSize.height);
		}
	}

	/** 缩放 */
	private _scale(designSize_: Size, frameSize_: Size): void {
		const scaleV2 = v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (this.isLimitMaxScale) {
			scaleV2.x = Math.min(scaleV2.x, this.maxScaleV3.x);
			scaleV2.y = Math.min(scaleV2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(UITransform)!.setContentSize(this.originalSize.width * scaleV2.x, this.originalSize.height * scaleV2.x);
		}
	}

	/** 更新适配 */
	updateAdaptation(): void {
		if (EDITOR && !this.isEditorPreview) {
			return;
		}

		try {
			/** 设计尺寸 */
			let designSize: Size;
			/** 真实尺寸 */
			let frameSize: Size;
			/** 容器节点 */
			let layoutNode: Node | null = null;

			switch (this.adaptationMode) {
				case _MKAdaptationNode.Mode.Scale: {
					frameSize = this.node.getComponent(UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Mode.Size: {
					frameSize = this.originalSize;
					break;
				}
			}

			switch (this.adaptationSource) {
				case _MKAdaptationNode.Source.Canvas: {
					layoutNode = director.getScene()!.getComponentInChildren(Canvas)!.node;
					designSize = layoutNode.getComponent(UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Source.Parent: {
					layoutNode = this.node.parent!;
					designSize = layoutNode.getComponent(UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Source.Customize: {
					designSize = this.customAdaptSize;
					break;
				}
			}

			switch (this.type) {
				case _MKAdaptationNode.Type.缩放:
					this._scale(designSize, frameSize);
					break;
				case _MKAdaptationNode.Type.自适应_展示完:
					this._adaptiveShowAll(designSize, frameSize);
					break;
				case _MKAdaptationNode.Type.自适应_填充满:
					this._adaptiveFillUp(designSize, frameSize);
					break;
				case _MKAdaptationNode.Type.填充宽:
					this._fillWidth(designSize, frameSize);
					break;
				case _MKAdaptationNode.Type.填充高:
					this._fillHeight(designSize, frameSize);
					break;
				case _MKAdaptationNode.Type.默认:
					this._default(designSize, frameSize);
					break;
			}
		} catch (error) {
			mkLog.error(error);
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private _onGlobalResize(): void {
		// 防止部分手机旋转后未适配
		for (let kNum = 0, lenNum = 6; kNum < lenNum; ++kNum) {
			this._delayedUpdateAdaptation(1000 * kNum);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _onNodeSizeChanged(): void {
		this._delayedUpdateAdaptation();
	}

	private _onNodeSpriteFrameChanged(): void {
		// 更新原始节点大小
		if (this.adaptationMode === _MKAdaptationNode.Mode.Size) {
			this.originalSize = this.getComponent(UITransform)!.contentSize.clone();
		}

		// 适配节点
		this._delayedUpdateAdaptation(0);
	}
}
