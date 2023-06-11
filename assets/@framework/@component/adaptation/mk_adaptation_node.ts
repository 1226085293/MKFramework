import * as cc from "cc";
import * as env from "cc/env";
import global_event from "../../../@config/global_event";
import { mk_log } from "../../mk_logger";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

namespace _mk_adaptation_node {
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
export default class mk_adaptation_node extends cc.Component {
	/* --------------- 属性 --------------- */
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

	@property({ displayName: "适配模式", type: cc.Enum(_mk_adaptation_node.mode) })
	adaptation_mode = _mk_adaptation_node.mode.scale;

	@property({ displayName: "适配来源", type: cc.Enum(_mk_adaptation_node.source) })
	adaptation_source = _mk_adaptation_node.source.canvas;

	@property({
		displayName: "自定义适配大小",
		visible: function (this: any) {
			return this.adaptSource === _mk_adaptation_node.source.customize;
		},
	})
	custom_adapt_size = cc.size();

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

	@property
	private _type = _mk_adaptation_node.type.自适应;

	@property
	private _limit_max_scale_b = false;

	@property({ displayName: "限制最大缩放" })
	get limit_max_scale_b(): boolean {
		return this._limit_max_scale_b;
	}

	set limit_max_scale_b(value_b_) {
		this._limit_max_scale_b = value_b_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	@property
	private _limit_min_scale_b = false;

	@property({ displayName: "限制最小缩放" })
	get limit_min_scale_b(): boolean {
		return this._limit_min_scale_b;
	}

	set limit_min_scale_b(value_b_) {
		this._limit_min_scale_b = value_b_;
		if (this.type === _mk_adaptation_node.type.填充宽 || this.type === _mk_adaptation_node.type.填充高) {
			this.update_adaptation();
		}
	}

	@property
	private _max_scale_v3 = cc.v3(1, 1, 1);

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

	@property
	private _min_scale_v3 = cc.v3(1, 1, 1);

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
	/** 初始大小 */
	private _init_size!: cc.Size;
	/** 编辑器预览 */
	private _editor_preview_b = false;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		if (env.EDITOR) {
			this.update_adaptation();
		}

		// 更新初始节点大小
		if (this.adaptation_mode === _mk_adaptation_node.mode.size) {
			this._init_size = this.getComponent(cc.UITransform)!.contentSize;
		}
	}

	onEnable(): void {
		this.update_adaptation();

		if (this.adaptation_source === _mk_adaptation_node.source.canvas) {
			global_event.on(global_event.key.resize, this._event_global_resize, this);
		} else {
			this.node.parent?.on(cc.Node.EventType.SIZE_CHANGED, this._node_size_changed, this);
		}

		this.node.on(cc.Node.EventType.SIZE_CHANGED, this._node_size_changed, this);
	}

	onDisable(): void {
		if (this.adaptation_source === _mk_adaptation_node.source.canvas) {
			global_event.off(global_event.key.resize, this._event_global_resize, this);
		} else {
			this.node.parent?.off(cc.Node.EventType.SIZE_CHANGED, this._node_size_changed, this);
		}

		this.node.off(cc.Node.EventType.SIZE_CHANGED, this._node_size_changed, this);
	}

	/* ------------------------------- 功能函数 ------------------------------- */
	/** 延迟更新适配 */
	private _delayed_update_adaptation(time_ms_n_ = 50): void {
		this.scheduleOnce(() => {
			this.update_adaptation();
		}, time_ms_n_ * 0.001);
	}

	/** 自适应 */
	private _self_adaption(design_size_: cc.Size, frame_size_: cc.Size): void {
		const scale_v2 = cc.v2(design_size_.width / frame_size_.width, design_size_.height / frame_size_.height);

		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(scale_v2.x, scale_v2.y);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this._init_size.width * scale_v2.x, this._init_size.height * scale_v2.y);
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
			this.node.getComponent(cc.UITransform)!.setContentSize(this._init_size.width * scale_v2.x, this._init_size.height * scale_v2.y);
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
			this.node.getComponent(cc.UITransform)!.setContentSize(this._init_size.width * scale_v2.x, this._init_size.height * scale_v2.y);
		}
	}

	/** 默认 */
	private _default(design_size_: cc.Size, frame_size_: cc.Size): void {
		if (this.adaptation_mode === _mk_adaptation_node.mode.scale) {
			this.node.setScale(1, 1);
		} else {
			this.node.getComponent(cc.UITransform)!.setContentSize(this._init_size.width, this._init_size.height);
		}
	}

	/** 自动填充 */
	private _auto_fill(design_size_: cc.Size, frame_size_: cc.Size): void {
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
			this.node.getComponent(cc.UITransform)!.setContentSize(this._init_size.width * scale_v2.x, this._init_size.height * scale_v2.x);
		}
	}

	/** 贴上下 */
	private _stick_up_and_down(adapt_node_: cc.Node | null, design_size_: cc.Size, frame_size_: cc.Size): void {
		const ui_transform = this.node.getComponent(cc.UITransform)!;

		if (adapt_node_) {
			const ui_transform2 = adapt_node_.getComponent(cc.UITransform)!;

			ui_transform.setContentSize(
				frame_size_.width,
				design_size_.height * (1 - ui_transform2.anchorY) - Math.abs(ui_transform2.convertToNodeSpaceAR(this.node.worldPosition).y)
			);
		} else {
			ui_transform.setContentSize(frame_size_.width, design_size_.height * 0.5);
		}
	}

	/** 贴左右 */
	private _stick_left_and_right(adapt_node_: cc.Node | null, design_size_: cc.Size, frame_size_: cc.Size): void {
		const ui_transform = this.node.getComponent(cc.UITransform)!;

		if (adapt_node_) {
			const ui_transform2 = adapt_node_.getComponent(cc.UITransform)!;

			ui_transform.setContentSize(
				design_size_.width * (1 - ui_transform2.anchorX) - Math.abs(ui_transform2.convertToNodeSpaceAR(this.node.worldPosition).x),
				frame_size_.height
			);
		} else {
			ui_transform.setContentSize(design_size_.width * 0.5, frame_size_.height);
		}
	}

	/** 更新适配 */
	update_adaptation(): void {
		if (env.EDITOR && !this.editor_preview_b) {
			return;
		}

		try {
			/** 设计尺寸 */
			let design_size: cc.Size;
			/** 真实尺寸 */
			const frame_size = this.node.getComponent(cc.UITransform)!.contentSize;
			/** 缩放比例 */
			let scale_n: number;
			/** 适配父节点 */
			let adapt_node: cc.Node | null = null;

			switch (this.adaptation_source) {
				case _mk_adaptation_node.source.canvas:
					adapt_node = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!.node;
					design_size = adapt_node.getComponent(cc.UITransform)!.contentSize;
					break;
				case _mk_adaptation_node.source.parent:
					adapt_node = this.node.parent!;
					design_size = adapt_node.getComponent(cc.UITransform)!.contentSize;
					break;
				case _mk_adaptation_node.source.customize:
					design_size = this.custom_adapt_size;
					break;
			}

			switch (this.type) {
				case _mk_adaptation_node.type.自适应:
					this._self_adaption(design_size, frame_size);
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
				case _mk_adaptation_node.type.自动填充:
					this._auto_fill(design_size, frame_size);
					break;
				case _mk_adaptation_node.type.贴上下:
					this._stick_up_and_down(adapt_node, design_size, frame_size);
					break;
				case _mk_adaptation_node.type.贴左右:
					this._stick_left_and_right(adapt_node, design_size, frame_size);
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
	private _node_size_changed(): void {
		// 更新初始节点大小
		if (this.adaptation_mode === _mk_adaptation_node.mode.size) {
			this._init_size = this.getComponent(cc.UITransform)!.contentSize;
		}

		this._delayed_update_adaptation();
	}
}
