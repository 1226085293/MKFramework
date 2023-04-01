import * as cc from "cc";
import * as env from "cc/env";

const { ccclass, property, menu, executeInEditMode } = cc._decorator;

namespace _tool_adaptation_node {
	/** 适配类型 */
	export enum type {
		默认,
		自适应,
		填充宽,
		填充高,
		自动填充,
		贴上下,
		贴左右,
	}

	/** 适配模式 */
	export enum mode {
		scale,
		size,
	}

	/** 适配来源 */
	export enum source {
		canvas,
		parent,
		customize,
	}
}

/** 节点适配 */
@ccclass
@executeInEditMode
export default class tool_adaptation_node extends cc.Component {
	/* --------------- 属性 --------------- */
	@property({ displayName: "编辑器预览" })
	get editor_preview_b() {
		return this._editor_preview_b;
	}

	set editor_preview_b(valueB_) {
		this._editor_preview_b = valueB_;
		if (valueB_) {
			this.updateAdaptation();
		}
	}

	@property({ displayName: "适配模式", type: cc.Enum(_tool_adaptation_node.mode) })
	adaptMode = _tool_adaptation_node.mode.scale;

	@property({ displayName: "适配来源", type: cc.Enum(_tool_adaptation_node.source) })
	adaptSource = _tool_adaptation_node.source.canvas;

	@property({
		displayName: "自定义适配大小",
		visible: function (this: any) {
			return this.adaptSource === _tool_adaptation_node.source.customize;
		},
	})
	customAdaptSize = cc.size();

	@property
	private _type = _tool_adaptation_node.type.自适应;

	@property({ displayName: "适配类型", type: cc.Enum(_tool_adaptation_node.type) })
	get typeE() {
		return this._type;
	}

	set typeE(value_: _tool_adaptation_node.type) {
		this._type = value_;
		if (this.editor_preview_b) {
			this.updateAdaptation();
		}
	}

	@property
	private _limitMaxScaleB = false;

	@property({ displayName: "限制最大缩放" })
	get limitMaxScaleB() {
		return this._limitMaxScaleB;
	}

	set limitMaxScaleB(valueB_) {
		this._limitMaxScaleB = valueB_;
		if (this.typeE === _tool_adaptation_node.type.填充宽 || this.typeE === _tool_adaptation_node.type.填充高) {
			this.updateAdaptation();
		}
	}

	@property
	private _limitMinScaleB = false;

	@property({ displayName: "限制最小缩放" })
	get limitMinScaleB() {
		return this._limitMinScaleB;
	}

	set limitMinScaleB(valueB_) {
		this._limitMinScaleB = valueB_;
		if (this.typeE === _tool_adaptation_node.type.填充宽 || this.typeE === _tool_adaptation_node.type.填充高) {
			this.updateAdaptation();
		}
	}

	@property
	private _maxScaleV3 = cc.v3(1, 1, 1);

	@property({
		displayName: "最大缩放",
		type: cc.Vec3,
		visible: function (this: tool_adaptation_node) {
			return this.limitMaxScaleB;
		},
	})
	get maxScaleV3() {
		return this._maxScaleV3;
	}

	set maxScaleV3(valueV3_) {
		this._maxScaleV3 = valueV3_;
		if (this.typeE === _tool_adaptation_node.type.填充宽 || this.typeE === _tool_adaptation_node.type.填充高) {
			this.updateAdaptation();
		}
	}

	@property
	private _minScaleV3 = cc.v3(1, 1, 1);

	@property({
		displayName: "最小缩放",
		type: cc.Vec3,
		visible: function (this: tool_adaptation_node) {
			return this.limitMinScaleB;
		},
	})
	get minScaleV3() {
		return this._minScaleV3;
	}

	set minScaleV3(valueV3_) {
		this._minScaleV3 = valueV3_;
		if (this.typeE === _tool_adaptation_node.type.填充宽 || this.typeE === _tool_adaptation_node.type.填充高) {
			this.updateAdaptation();
		}
	}

	/* --------------- private --------------- */
	/** 初始大小 */
	private _initSize!: cc.Size;
	/** 编辑器预览 */
	private _editor_preview_b = false;
	/** 适配定时器 */
	private _adaptationTimer: any;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		if (env.EDITOR) {
			this.updateAdaptation();
		}
		// 更新初始节点大小
		if (this.adaptMode === _tool_adaptation_node.mode.size) {
			this._initSize = this.getComponent(cc.UITransform)!.contentSize;
		}
	}

	onEnable(): void {
		this.updateAdaptation();

		if (this.adaptSource === _tool_adaptation_node.source.canvas) {
			gg.globalEventTarget.on(gg.globalEventTarget.keys.view_resize_callback, this._onViewResizeCallback, this);
		} else {
			this.node.parent?.on(cc.Node.EventType.SIZE_CHANGED, this._nodeSizeChanged, this);
		}
		this.node.on(cc.Node.EventType.SIZE_CHANGED, this._nodeSizeChanged, this);
	}

	onDisable(): void {
		if (this.adaptSource === _tool_adaptation_node.source.canvas) {
			gg.globalEventTarget.off(gg.globalEventTarget.keys.view_resize_callback, this._onViewResizeCallback, this);
		} else {
			this.node.parent?.off(cc.Node.EventType.SIZE_CHANGED, this._nodeSizeChanged, this);
		}
		this.node.off(cc.Node.EventType.SIZE_CHANGED, this._nodeSizeChanged, this);
	}

	/* ------------------------------- 功能函数 ------------------------------- */
	/** 延迟更新适配 */
	private _delayedUpdateAdaptation(timeMsN_ = 50): void {
		if (this._adaptationTimer) {
			this.unschedule(this._adaptationTimer);
		}

		this.scheduleOnce(
			(this._adaptationTimer = () => {
				this._adaptationTimer = null;
				this.updateAdaptation();
			}),
			timeMsN_ * 0.001
		);
	}

	/** 自适应 */
	private _selfAdaption(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scaleV2 = cc.v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (this.adaptMode === _tool_adaptation_node.mode.scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(this._initSize.width * scaleV2.x, this._initSize.height * scaleV2.y);
		}
	}

	/** 填充宽 */
	private _fillWidth(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scaleN = designSize_.width / frameSize_.width;
		const scaleV2 = cc.v2(scaleN, scaleN);

		if (this.limitMaxScaleB) {
			scaleV2.x = Math.min(scaleV2.x, this.maxScaleV3.x);
			scaleV2.y = Math.min(scaleV2.y, this.maxScaleV3.y);
		}
		if (this.limitMinScaleB) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}
		if (this.adaptMode === _tool_adaptation_node.mode.scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(this._initSize.width * scaleV2.x, this._initSize.height * scaleV2.y);
		}
	}

	/** 填充高 */
	private _fillHeight(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scaleN = designSize_.height / frameSize_.height;
		const scaleV2 = cc.v2(scaleN, scaleN);

		if (this.limitMaxScaleB) {
			scaleV2.x = Math.min(scaleV2.x, this.maxScaleV3.x);
			scaleV2.y = Math.min(scaleV2.y, this.maxScaleV3.y);
		}
		if (this.limitMinScaleB) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}
		if (this.adaptMode === _tool_adaptation_node.mode.scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(this._initSize.width * scaleV2.x, this._initSize.height * scaleV2.y);
		}
	}

	/** 默认 */
	private _default(designSize_: cc.Size, frameSize_: cc.Size): void {
		if (this.adaptMode === _tool_adaptation_node.mode.scale) {
			this.node.setScale(1, 1);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(this._initSize.width, this._initSize.height);
		}
	}

	/** 自动填充 */
	private _autoFill(designSize_: cc.Size, frameSize_: cc.Size): void {
		const scaleV2 = cc.v2(designSize_.width / frameSize_.width, designSize_.height / frameSize_.height);

		if (scaleV2.x < scaleV2.y) {
			scaleV2.y = scaleV2.x;
		} else {
			scaleV2.x = scaleV2.y;
		}
		if (this.limitMinScaleB) {
			scaleV2.x = Math.max(scaleV2.x, this.minScaleV3.x);
			scaleV2.y = Math.max(scaleV2.y, this.minScaleV3.y);
		}
		if (this.adaptMode === _tool_adaptation_node.mode.scale) {
			this.node.setScale(scaleV2.x, scaleV2.y);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(this._initSize.width * scaleV2.x, this._initSize.height * scaleV2.x);
		}
	}

	/** 贴上下 */
	private _stickUpAndDown(adaptNode_: cc.Node, designSize_: cc.Size, frameSize_: cc.Size): void {
		if (adaptNode_) {
			const uiTransform = this.node.getComponent(cc.UITransform);
			const uiTransform2 = adaptNode_.getComponent(cc.UITransform);

			if (env.JSB) {
				logger.log(
					this.node.name + " 贴上下",
					`frameSize(${frameSize_.width}, ${frameSize_.height})`,
					`designSize(${designSize_.width}, ${designSize_.height})`,
					`uiTransform2(${uiTransform2.width}, ${uiTransform2.height}, ${uiTransform2.anchorX}, ${uiTransform2.anchorY})`,
					`uiTransform(${uiTransform.width}, ${uiTransform.height}, ${uiTransform.anchorX}, ${uiTransform2.anchorY})`,
					`uiTransform2.convertToNodeSpaceAR = , ${uiTransform2.convertToNodeSpaceAR(this.node.worldPosition)}`
				);
			}
			uiTransform.setContentSize(
				frameSize_.width,
				designSize_.height * (1 - uiTransform2.anchorY) - Math.abs(uiTransform2.convertToNodeSpaceAR(this.node.worldPosition).y)
			);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(frameSize_.width, designSize_.height * 0.5);
		}
	}

	/** 贴左右 */
	private _stickLeftAndRight(adaptNode_: cc.Node, designSize_: cc.Size, frameSize_: cc.Size): void {
		if (adaptNode_) {
			const uiTransform = this.node.getComponent(cc.UITransform);
			const uiTransform2 = adaptNode_.getComponent(cc.UITransform);

			if (env.JSB) {
				logger.log(
					this.node.name + " 贴左右",
					`frameSize(${frameSize_.width}, ${frameSize_.height})`,
					`designSize(${designSize_.width}, ${designSize_.height})`,
					`uiTransform2(${uiTransform2.width}, ${uiTransform2.height}, ${uiTransform2.anchorX}, ${uiTransform2.anchorY})`,
					`uiTransform(${uiTransform.width}, ${uiTransform.height}, ${uiTransform.anchorX}, ${uiTransform2.anchorY})`,
					`uiTransform2.convertToNodeSpaceAR = , ${uiTransform2.convertToNodeSpaceAR(this.node.worldPosition)}`
				);
			}
			uiTransform.setContentSize(
				designSize_.width * (1 - uiTransform2.anchorX) - Math.abs(uiTransform2.convertToNodeSpaceAR(this.node.worldPosition).x),
				frameSize_.height
			);
		} else {
			this.node.getComponent(cc.UITransform).setContentSize(designSize_.width * 0.5, frameSize_.height);
		}
	}

	/** 更新适配 */
	updateAdaptation(): void {
		if (env.EDITOR && !this.editor_preview_b) {
			return;
		}
		try {
			/** 设计尺寸 */
			let designSize: cc.Size;
			/** 真实尺寸 */
			let frameSize: cc.Size;
			/** 缩放比例 */
			let scaleN: number;
			/** 适配父节点 */
			let adaptNode: cc.Node;

			switch (this.adaptSource) {
				case _tool_adaptation_node.source.canvas:
					adaptNode = cc.director.getScene().getComponentInChildren(cc.Canvas).node;
					designSize = adaptNode.getComponent(cc.UITransform).contentSize;
					break;
				case _tool_adaptation_node.source.parent:
					adaptNode = this.node.parent;
					designSize = adaptNode.getComponent(cc.UITransform).contentSize;
					break;
				case _tool_adaptation_node.source.customize:
					designSize = this.customAdaptSize;
					break;
			}
			frameSize = this.node.getComponent(cc.UITransform).contentSize;
			switch (this.typeE) {
				case _tool_adaptation_node.type.自适应:
					this._selfAdaption(designSize, frameSize);
					break;
				case _tool_adaptation_node.type.填充宽:
					this._fillWidth(designSize, frameSize);
					break;
				case _tool_adaptation_node.type.填充高:
					this._fillHeight(designSize, frameSize);
					break;
				case _tool_adaptation_node.type.默认:
					this._default(designSize, frameSize);
					break;
				case _tool_adaptation_node.type.自动填充:
					this._autoFill(designSize, frameSize);
					break;
				case _tool_adaptation_node.type.贴上下:
					this._stickUpAndDown(adaptNode, designSize, frameSize);
					break;
				case _tool_adaptation_node.type.贴左右:
					this._stickLeftAndRight(adaptNode, designSize, frameSize);
					break;
			}
		} catch (error) {
			if (!env.EDITOR) {
				logger.error(error);
			}
		}
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	private _onViewResizeCallback(): void {
		// 防止部分手机旋转后未适配
		for (let kN = 1, lenN = 6; kN < lenN; ++kN) {
			this._delayedUpdateAdaptation(1000 * kN);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _nodeSizeChanged(): void {
		// 更新初始节点大小
		if (this.adaptMode === _tool_adaptation_node.mode.size) {
			this._initSize = this.getComponent(cc.UITransform).contentSize;
		}
		this._delayedUpdateAdaptation();
	}
}
