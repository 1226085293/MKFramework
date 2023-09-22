import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_event from "../../@config/global_event";
import global_config from "../../@config/global_config";
import { mk_log } from "../mk_logger";
import mk_monitor from "../mk_monitor";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, requireComponent, executeInEditMode } = cc._decorator;

/**
 * 多边形遮罩
 * @noInheritDoc
 * @remarks
 *
 * - 多边形图片遮罩
 *
 * - 多边形触摸屏蔽
 */
@ccclass
@executeInEditMode
@requireComponent([cc.PolygonCollider2D])
export class mk_polygon_mask extends cc.Component {
	/* --------------- 属性 --------------- */
	/** 遮罩组件 */
	@property({ displayName: "遮罩组件", type: cc.Mask })
	mask: cc.Mask | null = null;

	/** 屏蔽触摸 */
	@property({ displayName: "屏蔽触摸", tooltip: "屏蔽展示区域外的触摸事件" })
	shield_touch_b = true;

	/** 跟踪节点 */
	@property({
		displayName: "跟踪节点",
		type: cc.Node,
		tooltip: "遮罩对应的节点",
	})
	get track_node(): cc.Node {
		return this._track_node;
	}

	set track_node(value_) {
		this._set_track_node(value_);
	}

	/* --------------- public --------------- */
	/** 偏移坐标 */
	get offset_v3(): cc.Vec3 {
		return this._offset_v3;
	}

	set offset_v3(value_v3_) {
		this._set_offset_v3(value_v3_);
	}

	/* --------------- private --------------- */
	/** 跟踪节点 */
	@property(cc.Node)
	private _track_node: cc.Node = null!;

	/** 跟踪节点初始坐标 */
	@property
	private _track_node_start_pos_v3 = cc.v3();

	/** 初始设计尺寸 */
	private _initial_design_size = cc.size();
	/** 偏移坐标 */
	private _offset_v3 = cc.v3();
	/** 多边形本地点 */
	private _polygon_local_point_v2s!: cc.Vec2[];
	/** 当前多边形本地点 */
	private _current_polygon_local_point_v2s!: cc.Vec2[];
	/** 多边形世界点 */
	private _polygon_world_point_v2s!: cc.Vec2[];
	/** 当前多边形世界点 */
	private _current_polygon_world_point_v2s!: cc.Vec2[];
	/** 跟踪节点世界坐标 */
	private _track_node_world_pos_v3 = cc.v3();
	/** 输入事件 */
	private _input_event_as = [
		cc.Node.EventType.TOUCH_START,
		cc.Node.EventType.TOUCH_END,
		cc.Node.EventType.TOUCH_MOVE,
		cc.Node.EventType.MOUSE_DOWN,
		cc.Node.EventType.MOUSE_MOVE,
		cc.Node.EventType.MOUSE_UP,
		cc.Node.EventType.MOUSE_ENTER,
		cc.Node.EventType.MOUSE_LEAVE,
		cc.Node.EventType.MOUSE_WHEEL,
	];

	/** 临时变量 */
	private _temp_tab = {
		v2: cc.v2(),
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		if (this.getComponent(cc.Mask)) {
			mk_log.error("不能在 mask 组件的节点上添加组件");
			this.destroy();

			return;
		}

		/** 多边形组件 */
		const polygon_comp = this.getComponent(cc.PolygonCollider2D)!;

		// 更新初始设计尺寸
		this._initial_design_size = cc.view.getDesignResolutionSize();
		// 初始化跟踪节点世界坐标
		this._track_node?.getWorldPosition(this._track_node_world_pos_v3);

		// 更新数据
		this._current_polygon_world_point_v2s = this._polygon_world_point_v2s = polygon_comp.worldPoints.map((v_v2) =>
			v_v2.clone().add(polygon_comp.offset)
		);

		this._current_polygon_local_point_v2s = this._polygon_local_point_v2s = polygon_comp.points.map((v_v2) =>
			v_v2.clone().add(polygon_comp.offset)
		);

		// 更新视图
		{
			if (EDITOR) {
				// 初始化遮罩
				if (this.mask) {
					this.mask.type = cc.Mask.Type.GRAPHICS_STENCIL;
				}

				// 监听多边形坐标变更
				{
					const event_polygon_position_change_f = (): void => {
						this._current_polygon_local_point_v2s = this._polygon_local_point_v2s = polygon_comp.points.map((v) =>
							v.clone().add(polygon_comp.offset)
						);

						this._update_mask();
					};

					mk_monitor.on(polygon_comp as any, "_points", event_polygon_position_change_f, this);
					mk_monitor.on(polygon_comp.offset, "x", event_polygon_position_change_f, this);
					mk_monitor.on(polygon_comp.offset, "y", event_polygon_position_change_f, this);
				}

				this.update_mask();

				return;
			}

			this.update_mask();

			polygon_comp.destroy();
		}

		// 全局事件
		global_event.on(global_event.key.resize, this._event_global_resize, this);
	}

	protected start(): void {
		this.update_mask();
	}

	protected onEnable(): void {
		if (EDITOR) {
			return;
		}

		// 屏蔽触摸
		if (this.shield_touch_b) {
			for (const v of this._input_event_as) {
				this.node.on(v, this._event_node_input, this);
			}
		}

		this.update_mask();
	}

	protected onDisable(): void {
		// 取消屏蔽触摸
		if (this.shield_touch_b) {
			for (const v of this._input_event_as) {
				this.node.off(v, this._event_node_input, this);
			}
		}
	}

	protected update(dt_n_: number): void {
		// 原生上的 worldPosition 数据已经转到 C++ 内，所以不能监听数据
		if (!this._track_node?.worldPosition.equals(this._track_node_world_pos_v3, 1)) {
			this._track_node.getWorldPosition(this._track_node_world_pos_v3);
			this.update_mask();
		}
	}

	protected onDestroy(): void {
		mk_monitor.clear(this);
		global_event.targetOff(this);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 更新遮罩 */
	update_mask(): void {
		// 依赖数据不存在
		if (!this._polygon_local_point_v2s || !this._polygon_world_point_v2s) {
			return;
		}

		// 编辑器更新初始坐标
		if (EDITOR) {
			this._track_node_start_pos_v3 = !this._track_node ? cc.v3() : this._track_node.worldPosition.clone();
		}
		// 更新遮罩坐标
		else {
			/** 当前设计尺寸 */
			const current_design_size = cc.view.getDesignResolutionSize();
			/** 节点偏移坐标 */
			const node_offset_v3 = !this._track_node ? cc.v3() : this._track_node.worldPosition.clone().subtract(this._track_node_start_pos_v3);

			/** 屏幕偏移坐标 */
			const screen_offset_v3 = cc.v3(
				(current_design_size.width - global_config.view.original_design_size.width) * -0.5,
				(current_design_size.height - global_config.view.original_design_size.height) * -0.5
			);

			/** 屏幕偏移坐标 */
			const screen_offset2_v3 = cc.v3(
				(this._initial_design_size.width - current_design_size.width) * -0.5,
				(this._initial_design_size.height - current_design_size.height) * -0.5
			);

			this._current_polygon_local_point_v2s = this._polygon_local_point_v2s.map((v_v2) =>
				v_v2
					.clone()
					.add2f(node_offset_v3.x, node_offset_v3.y)
					.add2f(screen_offset_v3.x, screen_offset_v3.y)
					.add2f(this._offset_v3.x, this._offset_v3.y)
			);

			this._current_polygon_world_point_v2s = this._polygon_world_point_v2s.map((v_v2) =>
				v_v2
					.clone()
					.add2f(node_offset_v3.x, node_offset_v3.y)
					.add2f(screen_offset_v3.x, screen_offset_v3.y)
					.add2f(screen_offset2_v3.x, screen_offset2_v3.y)
					.add2f(this._offset_v3.x, this._offset_v3.y)
			);
		}

		this._update_mask();
	}

	/** 更新遮罩 */
	private _update_mask(): void {
		if (
			// 编辑器且节点隐藏
			(EDITOR && !this.node.active) ||
			// 遮罩类型不一致
			this.mask?.type !== cc.Mask.Type.GRAPHICS_STENCIL ||
			// 依赖数据不存在
			!this._current_polygon_local_point_v2s
		) {
			return;
		}

		/** 绘图组件 */
		const graphics_comp = this.mask.node.getComponent(cc.Graphics)!;
		/** 多边形坐标 */
		const point_v2s = this._current_polygon_local_point_v2s;

		// 绘制遮罩
		if (point_v2s.length > 1) {
			graphics_comp.clear();
			graphics_comp.moveTo(point_v2s[0].x, point_v2s[0].y);

			for (const v_v2 of point_v2s) {
				graphics_comp.lineTo(v_v2.x, v_v2.y);
			}

			graphics_comp.close();
			graphics_comp.stroke();
			graphics_comp.fill();
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_offset_v3(value_v3_: cc.Vec3): void {
		this._offset_v3.set(value_v3_);
		this.update_mask();
	}

	private _set_track_node(value_: cc.Node): void {
		this._track_node = value_;
		this._track_node.getWorldPosition(this._track_node_world_pos_v3);
		this.update_mask();
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _event_node_input(event_: cc.EventTouch | cc.EventMouse): void {
		/** 碰撞状态 */
		let collision_b = cc.Intersection2D.pointInPolygon(event_.getUILocation(this._temp_tab.v2), this._current_polygon_world_point_v2s);

		// 更新碰撞状态
		collision_b = !this.mask || this.mask.inverted ? collision_b : !collision_b;
		// 触摸穿透
		event_.preventSwallow = collision_b;
		// 拦截事件
		event_.propagationStopped = !collision_b;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private _event_global_resize(): void {
		this.unschedule(this.update_mask);
		this.scheduleOnce(this.update_mask);
	}
}
