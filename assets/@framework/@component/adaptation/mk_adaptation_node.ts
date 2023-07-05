import * as cc from "cc";
import global_event from "../../../@config/global_event";
import { mk_log } from "../../mk_logger";
import { EDITOR } from "cc/env";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

namespace _mk_adaptation_node {
	/** 适配类型 */
	export enum type {
		默认,
		自适应,
		填充宽高,
		填充宽,
		填充高,
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
export default class mk_adaptation_node extends cc.Component {
	/* --------------- 属性 --------------- */
	/** 编辑器预览 */
	@property({ displayName: "编辑器预览" })
	get editor_preview_b(): boolean {
		return this._editor_preview_b;
	}

	set editor_preview_b(value_b_) {
		this._editor_preview_b = value_b_;
		if (value_b_) {
			this.update_adaptation();
		}
	}

	/** 适配模式 */
	@property({ displayName: "适配模式", type: cc.Enum(_mk_adaptation_node.mode) })
	adaptation_mode = _mk_adaptation_node.mode.scale;

	/** 适配来源 */
	@property({ displayName: "适配来源", type: cc.Enum(_mk_adaptation_node.source) })
	adaptation_source = _mk_adaptation_node.source.canvas;

	/** 原始大小 */
	@property({
		displayName: "原始大小",
		visible(this: mk_adaptation_node) {
			return this.adaptation_mode === _mk_adaptation_node.mode.size;
		},
	})
	original_size = cc.size();

	/** 自定义适配大小 */
	@property({
		displayName: "自定义适配大小",
		visible(this: mk_adaptation_node) {
			return this.adaptation_source === _mk_adaptation_node.source.customize;
		},
	})
	custom_adapt_size = cc.size();

	/** 适配类型 */
	@property({ displayName: "适配类型", type: cc.Enum(_mk_adaptation_node.type) })
	get type(): _mk_adaptation_node.type {
		return this._type;
	}

	set type(value_: _mk_adaptation_node.type) {
		this._type = value_;
		if (this.editor_preview_b) {
			this.update_adaptation();
		}
	}

	/** 限制最大缩放 */
	@property({
		displayName: "限制最大缩放",
		visible(this: mk_adaptation_node) {
			return this.adaptation_mode === _mk_adaptation_node.mode.scale;
		},
	})
	get limit_max_scale_b(): boolean {
		return this._limit_max_scale_b;
	}

	set limit_max_scale_b(value_b_) {
		this._limit_max_scale_b = value_b_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	/** 限制最小缩放 */
	@property({
		displayName: "限制最小缩放",
		visible(this: mk_adaptation_node) {
			return this.adaptation_mode === _mk_adaptation_node.mode.scale;
		},
	})
	get limit_min_scale_b(): boolean {
		return this._limit_min_scale_b;
	}

	set limit_min_scale_b(value_b_) {
		this._limit_min_scale_b = value_b_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	/** 最大缩放 */
	@property({
		displayName: "最大缩放",
		type: cc.Vec3,
		visible: function (this: mk_adaptation_node): boolean {
			return this.limit_max_scale_b;
		},
	})
	get max_scale_v3(): cc.Vec3 {
		return this._max_scale_v3;
	}

	set max_scale_v3(value_v3_) {
		this._max_scale_v3 = value_v3_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	/** 最小缩放 */
	@property({
		displayName: "最小缩放",
		type: cc.Vec3,
		visible: function (this: mk_adaptation_node): boolean {
			return this.limit_min_scale_b;
		},
	})
	get min_scale_v3(): cc.Vec3 {
		return this._min_scale_v3;
	}

	set min_scale_v3(value_v3_) {
		this._min_scale_v3 = value_v3_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	/* --------------- private --------------- */
	/** 适配类型 */
	@property
	private _type = _mk_adaptation_node.type.填充宽高;

	/** 限制最大缩放 */
	@property
	private _limit_max_scale_b = false;

	/** 限制最小缩放 */
	@property
	private _limit_min_scale_b = false;

	/** 最大缩放 */
	@property
	private _max_scale_v3 = cc.v3(1, 1, 1);

	/** 最小缩放 */
	@property
	private _min_scale_v3 = cc.v3(1, 1, 1);

	/** 编辑器预览 */
	private _editor_preview_b = false;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		if (EDITOR) {
			if (this.original_size.equals(cc.size())) {
				this.original_size = this.node.getComponent(cc.UITransform)!.contentSize.clone();
			}

			this.update_adaptation();
		}
	}

	onEnable(): void {
		this.update_adaptation();

		if (this.adaptation_source === _mk_adaptation_node.source.canvas) {
			global_event.on(global_event.key.resize, this._event_global_resize, this);
		} else if (this.adaptation_source === _mk_adaptation_node.source.parent) {
			this.node.parent?.on(cc.Node.EventType.SIZE_CHANGED, this._event_node_size_changed, this);
		}

		if (this.node.getComponent(cc.Sprite)) {
			this.node.on(cc.Sprite.EventType.SPRITE_FRAME_CHANGED, this._event_node_sprite_frame_changed, this);
		}

		this.node.on(cc.Node.EventType.SIZE_CHANGED, this._event_node_size_changed, this);
	}

	onDisable(): void {
		if (this.adaptation_source === _mk_adaptation_node.source.canvas) {
			global_event.off(global_event.key.resize, this._event_global_resize, this);
		} else if (this.adaptation_source === _mk_adaptation_node.source.parent) {
			this.node.parent?.off(cc.Node.EventType.SIZE_CHANGED, this._event_node_size_changed, this);
		}

		this.node.off(cc.Sprite.EventType.SPRITE_FRAME_CHANGED, this._event_node_sprite_frame_changed, this);
		this.node.off(cc.Node.EventType.SIZE_CHANGED, this._event_node_size_changed, this);
	}

	/* ------------------------------- 功能函数 ------------------------------- */
	/** 延迟更新适配 */
	private _delayed_update_adaptation(time_ms_n_ = 50): void {
		this.scheduleOnce(() => {
			this.update_adaptation();
		}, time_ms_n_ * 0.001);
	}

	/** 填充宽高 */
	private _fill_width_and_height(design_size_: cc.Size, frame_size_: cc.Size): void {
		const scale_v2 = cc.v2(design_size_.width / frame_size_.width, design_size_.height / frame_size_.height);

		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.original_size.width * scale_v2.x, this.original_size.height * scale_v2.y);
		}
	}

	/** 填充宽 */
	private _fill_width(design_size_: cc.Size, frame_size_: cc.Size): void {
		const scale_n = design_size_.width / frame_size_.width;
		const scale_v2 = cc.v2(scale_n, scale_n);

		if (this.limit_max_scale_b) {
			scale_v2.x = Math.min(scale_v2.x, this.max_scale_v3.x);
			scale_v2.y = Math.min(scale_v2.y, this.max_scale_v3.y);
		}

		if (this.limit_min_scale_b) {
			scale_v2.x = Math.max(scale_v2.x, this.min_scale_v3.x);
			scale_v2.y = Math.max(scale_v2.y, this.min_scale_v3.y);
		}

		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.original_size.width * scale_v2.x, this.original_size.height * scale_v2.y);
		}
	}

	/** 填充高 */
	private _fill_height(design_size_: cc.Size, frame_size_: cc.Size): void {
		const scale_n = design_size_.height / frame_size_.height;
		const scale_v2 = cc.v2(scale_n, scale_n);

		if (this.limit_max_scale_b) {
			scale_v2.x = Math.min(scale_v2.x, this.max_scale_v3.x);
			scale_v2.y = Math.min(scale_v2.y, this.max_scale_v3.y);
		}

		if (this.limit_min_scale_b) {
			scale_v2.x = Math.max(scale_v2.x, this.min_scale_v3.x);
			scale_v2.y = Math.max(scale_v2.y, this.min_scale_v3.y);
		}

		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.original_size.width * scale_v2.x, this.original_size.height * scale_v2.y);
		}
	}

	/** 默认 */
	private _default(design_size_: cc.Size, frame_size_: cc.Size): void {
		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(1, 1);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.original_size.width, this.original_size.height);
		}
	}

	/** 自适应 */
	private _auto_adaption(design_size_: cc.Size, frame_size_: cc.Size): void {
		const scale_v2 = cc.v2(design_size_.width / frame_size_.width, design_size_.height / frame_size_.height);

		if (scale_v2.x < scale_v2.y) {
			scale_v2.y = scale_v2.x;
		} else {
			scale_v2.x = scale_v2.y;
		}

		if (this.limit_min_scale_b) {
			scale_v2.x = Math.max(scale_v2.x, this.min_scale_v3.x);
			scale_v2.y = Math.max(scale_v2.y, this.min_scale_v3.y);
		}

		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this.original_size.width * scale_v2.x, this.original_size.height * scale_v2.x);
		}
	}

	/** 更新适配 */
	update_adaptation(): void {
		if (EDITOR && !this.editor_preview_b) {
			return;
		}

		try {
			/** 设计尺寸 */
			let design_size: cc.Size;
			/** 真实尺寸 */
			let frame_size: cc.Size;
			/** 容器节点 */
			let layout_node: cc.Node | null = null;

			switch (this.adaptation_mode) {
				case _mk_adaptation_node.mode.scale: {
					frame_size = this.node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _mk_adaptation_node.mode.size: {
					frame_size = this.original_size;
					break;
				}
			}

			switch (this.adaptation_source) {
				case _mk_adaptation_node.source.canvas: {
					layout_node = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!.node;
					design_size = layout_node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _mk_adaptation_node.source.parent: {
					layout_node = this.node.parent!;
					design_size = layout_node.getComponent(cc.UITransform)!.contentSize.clone();
					break;
				}

				case _mk_adaptation_node.source.customize: {
					design_size = this.custom_adapt_size;
					break;
				}
			}

			switch (this.type) {
				case _mk_adaptation_node.type.自适应:
					this._auto_adaption(design_size, frame_size);
					break;
				case _mk_adaptation_node.type.填充宽高:
					this._fill_width_and_height(design_size, frame_size);
					break;
				case _mk_adaptation_node.type.填充宽:
					this._fill_width(design_size, frame_size);
					break;
				case _mk_adaptation_node.type.填充高:
					this._fill_height(design_size, frame_size);
					break;
				case _mk_adaptation_node.type.默认:
					this._default(design_size, frame_size);
					break;
			}
		} catch (error) {
			mk_log.error(error);
		}
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private _event_global_resize(): void {
		// 防止部分手机旋转后未适配
		for (let k_n = 0, len_n = 6; k_n < len_n; ++k_n) {
			this._delayed_update_adaptation(1000 * k_n);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _event_node_size_changed(): void {
		this._delayed_update_adaptation();
	}

	private _event_node_sprite_frame_changed(): void {
		// 更新原始节点大小
		if (this.adaptation_mode === _mk_adaptation_node.mode.size) {
			this.original_size = this.getComponent(cc.UITransform)!.contentSize.clone();
		}
	}
}
