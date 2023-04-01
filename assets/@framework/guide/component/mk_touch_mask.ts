import * as cc from "cc";
import { EDITOR } from "cc/env";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, requireComponent } = cc._decorator;

/**
 * 触摸遮罩
 * - 跟踪节点父节点不能变更，否则可能会导致坐标错误
 */
@ccclass("mk_touch_mask")
@requireComponent([cc.PolygonCollider2D])
export class mk_touch_mask extends cc.Component {
	/** 跟踪节点 */
	@property({
		displayName: "跟踪节点",
		type: cc.Node,
		tooltip: "用于动态坐标节点",
	})
	get track_node(): cc.Node {
		return this._track_node;
	}

	set track_node(value_) {
		this._set_track_node(value_);
	}

	/* --------------- private --------------- */
	/** 跟踪节点 */
	@property(cc.Node)
	private _track_node: cc.Node = null!;

	/** 跟踪节点初始坐标 */
	@property
	private _track_node_start_pos_v3 = cc.v3();

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

	/** 多边形点 */
	private _point_v2s!: cc.Vec2[];
	/** 碰撞多边形点 */
	private _point2_v2s!: cc.Vec2[];

	/** 临时变量 */
	private _temp_tab = {
		v2: cc.v2(),
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		/** 多边形组件 */
		const polygon_comp = this.getComponent(cc.PolygonCollider2D)!;

		// 更新坐标
		{
			this._point2_v2s = this._point_v2s = polygon_comp.worldPoints.map((v) => v.clone().add(polygon_comp.offset));
			if (this._track_node) {
				this.track_node = this._track_node;
			}
		}

		// 更新视图
		polygon_comp.destroy();
	}

	onEnable() {
		for (let i = 0; i < this._input_event_as.length; i++) {
			this.node.on(this._input_event_as[i], this._event_input, this);
		}
	}

	onDisable() {
		for (let i = 0; i < this._input_event_as.length; i++) {
			this.node.off(this._input_event_as[i], this._event_input, this);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_track_node(value_: cc.Node): void {
		this._track_node = value_;

		// 编辑器更新初始坐标
		if (EDITOR) {
			this._track_node_start_pos_v3 = !this._track_node ? cc.v3() : this._track_node.position.clone();
		}
		// 更新遮罩坐标
		else {
			const update_pos_f = (): void => {
				const offset_v3 = this._track_node.position.clone().subtract(this._track_node_start_pos_v3);

				this._point2_v2s = this._point_v2s.map((v) => v.clone().add2f(offset_v3.x, offset_v3.y));
			};

			this._track_node.getComponent(cc.Widget)?.updateAlignment();
			update_pos_f();
			// 防止跟踪节点及其父节点 widget 适配后坐标不一致
			this.scheduleOnce(update_pos_f);
		}
	}

	/* ------------------------------- 节点事件 ------------------------------- */
	private _event_input(event_: cc.EventTouch | cc.EventMouse): void {
		// 触摸穿透
		event_.preventSwallow = cc.Intersection2D.pointInPolygon(event_.getUILocation(this._temp_tab.v2), this._point2_v2s);
		// 拦截事件
		event_.propagationStopped = !event_.preventSwallow;
	}
}
