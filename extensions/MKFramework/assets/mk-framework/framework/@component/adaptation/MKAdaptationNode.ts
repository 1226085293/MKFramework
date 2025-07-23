import * as cc from "cc";
import GlobalEvent from "../../../Config/GlobalEvent";
import { mkLog } from "../../MKLogger";
import { EDITOR } from "cc/env";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

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
export default class MKAdaptationNode extends cc.Component {
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
	@property({ displayName: "适配模式", type: cc.Enum(_MKAdaptationNode.Mode) })
	adaptationMode = _MKAdaptationNode.Mode.Scale;

	/** 适配来源 */
	@property({ displayName: "适配来源", type: cc.Enum(_MKAdaptationNode.Source) })
	adaptationSource = _MKAdaptationNode.Source.Canvas;

	/** 原始大小 */
	@property({
		displayName: "原始大小",
		visible(this: MKAdaptationNode) {
			return this.adaptationMode === _MKAdaptationNode.Mode.Size;
		},
	})
	originalSize = cc.size();

	/** 自定义适配大小 */
	@property({
		displayName: "自定义适配大小",
		visible(this: MKAdaptationNode) {
			return this.adaptationSource === _MKAdaptationNode.Source.Customize;
		},
	})
	customAdaptSize = cc.size();

	/** 适配类型 */
	@property({ displayName: "适配类型", type: cc.Enum(_MKAdaptationNode.Type) })
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
		type: cc.Vec3,
		visible: function (this: MKAdaptationNode): boolean {
			return this.isLimitMaxScale;
		},
	})
	get maxScaleV3(): cc.Vec3 {
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
		type: cc.Vec3,
		visible: function (this: MKAdaptationNode): boolean {
			return this.isLimitMinScale;
		},
	})
	get minScaleV3(): cc.Vec3 {
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
	private _maxScaleV3 = cc.v3(1, 1, 1);

	/** 最小缩放 */
	@property
	private _minScaleV3 = cc.v3(1, 1, 1);

	/** 编辑器预览 */
	private _isEditorPreview = false;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		if (EDITOR) {
			if (this.originalSize.equals(cc.size())) {
				this.originalSize = this.node.getComponent(cc.UITransform)!.contentSize.clone();
			}

			this.updateAdaptation();
		}
	}

	onEnable(): void {
		this.updateAdaptation();

		if (this.adaptationSource === _MKAdaptationNode.Source.Canvas) {
			GlobalEvent.on(GlobalEvent.key.resize, this._onGlobalResize, this);
		} else if (this.adaptationSource === _MKAdaptationNode.Source.Parent) {
			this.node.parent?.on(cc.Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
		}

		if (this.node.getComponent(cc.Sprite)) {
			this.node.on(cc.Sprite.EventType.SPRITE_FRAME_CHANGED, this._onNodeSpriteFrameChanged, this);
		}

		this.node.on(cc.Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
	}

	onDisable(): void {
		if (this.adaptationSource === _MKAdaptationNode.Source.Canvas) {
			GlobalEvent.off(GlobalEvent.key.resize, this._onGlobalResize, this);
		} else if (this.adaptationSource === _MKAdaptationNode.Source.Parent) {
			this.node.parent?.off(cc.Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
		}

		this.node.off(cc.Sprite.EventType.SPRITE_FRAME_CHANGED, this._onNodeSpriteFrameChanged, this);
		this.node.off(cc.Node.EventType.SIZE_CHANGED, this._onNodeSizeChanged, this);
	}

	/* ------------------------------- 功能函数 ------------------------------- */
	/** 延迟更新适配 */
	private _delayedUpdateAdaptation(timeMsNum_ = 50): void {
		this.scheduleOnce(() => {
			this.updateAdaptation();
		}, timeMsNum_ * 0.001);
	}

	/** 自适应-展示完 */
	private _adaptiveShowAll(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scale_v2 = cc.v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (scale_v2.x < scale_v2.y) {
			scale_v2.y = scale_v2.x;
		} else {
			scale_v2.x = scale_v2.y;
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width * scale_v2.x, this.originalSize.height * scale_v2.y);
		}
	}

	/** 自适应-填充满 */
	private _adaptiveFillUp(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scale_v2 = cc.v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (scale_v2.x < scale_v2.y) {
			scale_v2.x = scale_v2.y;
		} else {
			scale_v2.y = scale_v2.x;
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width * scale_v2.x, this.originalSize.height * scale_v2.y);
		}
	}

	/** 填充宽 */
	private _fillWidth(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scale_n = designSize_.width / frameSize_.width;
		const scale_v2 = cc.v2(scale_n, scale_n);

		if (this.isLimitMaxScale) {
			scale_v2.x = Math.min(scale_v2.x, this.maxScaleV3.x);
			scale_v2.y = Math.min(scale_v2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scale_v2.x = Math.max(scale_v2.x, this.minScaleV3.x);
			scale_v2.y = Math.max(scale_v2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width * scale_v2.x, this.originalSize.height * scale_v2.y);
		}
	}

	/** 填充高 */
	private _fillHeight(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scale_n = designSize_.height / frameSize_.height;
		const scale_v2 = cc.v2(scale_n, scale_n);

		if (this.isLimitMaxScale) {
			scale_v2.x = Math.min(scale_v2.x, this.maxScaleV3.x);
			scale_v2.y = Math.min(scale_v2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scale_v2.x = Math.max(scale_v2.x, this.minScaleV3.x);
			scale_v2.y = Math.max(scale_v2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width * scale_v2.x, this.originalSize.height * scale_v2.y);
		}
	}

	/** 默认 */
	private _default(designSize_: cc.Size, frameSize_: cc.Size): void {
		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(1, 1);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width, this.originalSize.height);
		}
	}

	/** 缩放 */
	private _scale(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scale_v2 = cc.v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (this.isLimitMaxScale) {
			scale_v2.x = Math.min(scale_v2.x, this.maxScaleV3.x);
			scale_v2.y = Math.min(scale_v2.y, this.maxScaleV3.y);
		}

		if (this.isLimitMinScale) {
			scale_v2.x = Math.max(scale_v2.x, this.minScaleV3.x);
			scale_v2.y = Math.max(scale_v2.y, this.minScaleV3.y);
		}

		if (this.adaptationMode === _MKAdaptationNode.Mode.Scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.originalSize.width * scale_v2.x, this.originalSize.height * scale_v2.x);
		}
	}

	/** 更新适配 */
	updateAdaptation(): void {
		if (EDITOR && !this.isEditorPreview) {
			return;
		}

		try {
			/** 设计尺寸 */
			let design_size: cc.Size;
			/** 真实尺寸 */
			let frame_size: cc.Size;
			/** 容器节点 */
			let layout_node: cc.Node | null = null;

			switch (this.adaptationMode) {
				case _MKAdaptationNode.Mode.Scale: {
					frame_size = this.node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Mode.Size: {
					frame_size = this.originalSize;
					break;
				}
			}

			switch (this.adaptationSource) {
				case _MKAdaptationNode.Source.Canvas: {
					layout_node = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!.node;
					design_size = layout_node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Source.Parent: {
					layout_node = this.node.parent!;
					design_size = layout_node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _MKAdaptationNode.Source.Customize: {
					design_size = this.customAdaptSize;
					break;
				}
			}

			switch (this.type) {
				case _MKAdaptationNode.Type.缩放:
					this._scale(design_size, frame_size);
					break;
				case _MKAdaptationNode.Type.自适应_展示完:
					this._adaptiveShowAll(design_size, frame_size);
					break;
				case _MKAdaptationNode.Type.自适应_填充满:
					this._adaptiveFillUp(design_size, frame_size);
					break;
				case _MKAdaptationNode.Type.填充宽:
					this._fillWidth(design_size, frame_size);
					break;
				case _MKAdaptationNode.Type.填充高:
					this._fillHeight(design_size, frame_size);
					break;
				case _MKAdaptationNode.Type.默认:
					this._default(design_size, frame_size);
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
			this.originalSize = this.getComponent(cc.UITransform)!.contentSize.clone();
		}

		// 适配节点
		this._delayedUpdateAdaptation(0);
	}
}
