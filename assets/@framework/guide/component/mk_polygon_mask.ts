import * as cc from "cc";
import { EDITOR } from "cc/env";
import monitor from "../../mk_monitor";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, requireComponent } = cc._decorator;

/**
 * 多边形遮罩
 * - 跟踪节点父节点不能变更，否则可能会导致坐标错误
 */
@ccclass("mk_polygon_mask")
@requireComponent([cc.Mask, cc.PolygonCollider2D])
export class mk_polygon_mask extends cc.Component {
	/* --------------- 属性 --------------- */
	@property({ visible: false })
	get init_editor(): void {
		this._init_editor();
		return;
	}

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

	/** 遮罩组件 */
	private _mask!: cc.Mask;
	/** 多边形点 */
	private _point_v2s!: cc.Vec2[];
	/** 碰撞多边形点 */
	private _point2_v2s!: cc.Vec2[];

	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		/** 多边形组件 */
		const polygon_comp = this.getComponent(cc.PolygonCollider2D)!;

		// 更新数据
		{
			this._mask = this.getComponent(cc.Mask)!;
			this._point2_v2s = this._point_v2s = polygon_comp.points.map((v) => v.clone().add(polygon_comp.offset));
		}

		// 更新视图
		{
			// 更新坐标
			if (this._track_node) {
				this.track_node = this._track_node;
			}
			polygon_comp.destroy();
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 更新遮罩 */
	private _update_mask(): void {
		if (this._mask.type !== cc.Mask.Type.GRAPHICS_STENCIL) {
			return;
		}

		/** 绘图组件 */
		const graphics_comp = this.node.getComponent(cc.Graphics)!;
		/** 多边形坐标 */
		const point_v2s = this._point2_v2s;

		// 绘制遮罩
		if (point_v2s.length > 1) {
			graphics_comp.clear();
			graphics_comp.moveTo(point_v2s[0].x, point_v2s[0].y);
			for (let k_n = 1, len_n = point_v2s.length; k_n < len_n; ++k_n) {
				graphics_comp.lineTo(point_v2s[k_n].x, point_v2s[k_n].y);
			}
			graphics_comp.close();
			graphics_comp.stroke();
			graphics_comp.fill();
		}
	}

	/** 初始化编辑器 */
	private _init_editor(): void {
		/** 多边形组件 */
		const polygon_comp = this.getComponent(cc.PolygonCollider2D)!;

		// 初始化数据
		this._point2_v2s = polygon_comp.points.map((v) => v.clone().add(polygon_comp.offset));

		// 初始化遮罩
		{
			this._mask = this.getComponent(cc.Mask)!;
			this._mask.type = cc.Mask.Type.GRAPHICS_STENCIL;
		}

		// 监听多边形坐标变更
		{
			monitor.clear(this);
			monitor
				.on(
					polygon_comp as any,
					"_points",
					() => {
						this._update_mask();
					},
					this
				)
				?.call(this, polygon_comp.points);
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
				this._update_mask();
			};

			this._track_node.getComponent(cc.Widget)?.updateAlignment();
			update_pos_f();
			// 防止跟踪节点及其父节点 widget 适配后坐标不一致
			this.scheduleOnce(update_pos_f);
		}
	}
}
