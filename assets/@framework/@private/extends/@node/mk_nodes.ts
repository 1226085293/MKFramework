import * as cc from "cc";
import global_config from "../../../../@config/global_config";

class node_extends {
	constructor(node_: cc.Node) {
		this._node = node_;

		this._node.components.forEach((v) => {
			if (v instanceof cc.Label) {
				this.label = v;
			} else if (v instanceof cc.Sprite) {
				this.sprite = v;
			} else if (v instanceof cc.UIOpacity) {
				this.ui_opacity = v;
			} else if (v instanceof cc.UITransform) {
				this.ui_transform = v;
			} else if (v instanceof cc.Animation) {
				this.animation = v;
			} else if (v instanceof cc.EditBox) {
				this.edit_box = v;
			} else if (v instanceof cc.RichText) {
				this.rich_text = v;
			} else if (v instanceof cc.Layout) {
				this.layout = v;
			} else if (v instanceof cc.ProgressBar) {
				this.progress_bar = v;
			} else if (v instanceof cc.Slider) {
				this.slider = v;
			} else if (v instanceof cc.Toggle) {
				this.toggle = v;
			}
		});
	}

	/* --------------- static --------------- */
	/** 节点扩展数据 */
	static node_extends_map = new Map<cc.Node, node_extends>();
	/** 渲染顺序更新倒计时 */
	static order_update_timer: any = null;
	/** 渲染顺序更新时间 */
	private static _order_update_time_n = 0;
	/** 更新任务 */
	private static _order_update_task_fs: Function[] = [];
	/* --------------- public --------------- */
	label!: cc.Label;
	sprite!: cc.Sprite;
	ui_opacity!: cc.UIOpacity;
	ui_transform!: cc.UITransform;
	animation!: cc.Animation;
	edit_box!: cc.EditBox;
	rich_text!: cc.RichText;
	layout!: cc.Layout;
	progress_bar!: cc.ProgressBar;
	slider!: cc.Slider;
	toggle!: cc.Toggle;

	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	get order_n(): number {
		return this._order_n;
	}

	set order_n(value_n_: number) {
		this._set_order_n(value_n_);
	}

	/** 宽 */
	get width(): number {
		return this.ui_transform.width;
	}

	set width(value_n_) {
		this.ui_transform.width = value_n_;
	}

	/** 高 */
	get height(): number {
		return this.ui_transform.height;
	}

	set height(value_n_) {
		this.ui_transform.height = value_n_;
	}

	/** 透明度 */
	get opacity(): number {
		return this.ui_opacity.opacity;
	}

	set opacity(value_n_) {
		this.ui_opacity.opacity = value_n_;
	}

	/** 锚点 */
	get anchor(): Readonly<cc.Vec2> {
		return this.ui_transform.anchorPoint;
	}

	set anchor(value_v2_: cc.Vec2) {
		this.ui_transform.anchorPoint = value_v2_;
	}

	/* --------------- private --------------- */
	/** 持有节点 */
	private _node: cc.Node;
	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _order_n = 0;
	/* ------------------------------- 功能 ------------------------------- */

	/* ------------------------------- get/set ------------------------------- */
	private _set_order_n(value_n_: number): void {
		if (
			// 未改变渲染顺序
			this._order_n === value_n_ ||
			// 节点失效
			!this._node.isValid
		) {
			return;
		}

		/** 父节点层级数据 */
		const parent = MKN(this._node.parent!);

		if (!parent) {
			this._node.once(
				cc.Node.EventType.PARENT_CHANGED,
				() => {
					// 延迟一帧避免 children 数据未更新
					setTimeout(() => {
						this._set_order_n(value_n_);
					}, 0);
				},
				this
			);

			return;
		}

		// 更新渲染顺序
		this._order_n = value_n_;

		/** 距离上次更新的时间 */
		const time_since_last_update_n = Date.now() - node_extends._order_update_time_n;

		// 添加任务
		node_extends._order_update_task_fs.push((): void => {
			// (节点/父节点)失效
			if (!this._node.isValid || !parent._node.isValid || this._node.parent !== parent._node) {
				return;
			}

			/** 同级节点 */
			const node_as = [...parent._node.children].sort((va, vb) => (MKN(va, false)?._order_n ?? 0) - (MKN(vb, false)?._order_n ?? 0));

			// 更新渲染顺序
			node_as.forEach((v, k_n) => {
				v.setSiblingIndex(k_n);
			});
		});

		// 已经准备更新
		if (node_extends.order_update_timer !== null) {
			return;
		}

		// 小于间隔时间更新
		if (node_extends.order_update_timer === null && time_since_last_update_n < global_config.view.layer_refresh_interval_ms_n) {
			node_extends.order_update_timer = setTimeout(() => {
				// 清理定时器数据
				node_extends.order_update_timer = null;
				// 更新时间
				node_extends._order_update_time_n = Date.now();
				// 更新渲染顺序
				node_extends._order_update_task_fs.splice(0, node_extends._order_update_task_fs.length).forEach((v_f) => v_f());
			}, global_config.view.layer_refresh_interval_ms_n - time_since_last_update_n);

			return;
		}

		// 延迟一帧避免同帧内使用 children 下标获取节点不正确
		setTimeout(() => {
			// 更新时间
			node_extends._order_update_time_n = Date.now();
			// 更新渲染顺序
			node_extends._order_update_task_fs.splice(0, node_extends._order_update_task_fs.length).forEach((v_f) => v_f());
		}, 0);
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function MKN(node_: cc.Node, force_b_ = true): node_extends {
	if (!node_?.isValid) {
		return null!;
	}

	let node_extend = node_extends.node_extends_map.get(node_) ?? null;

	if (!node_extend && force_b_) {
		node_extend = new node_extends(node_);
		node_extends.node_extends_map.set(node_, node_extend);
	}

	return node_extend!;
}

namespace MKN {
	/** order 刷新间隔时间（毫秒） */
	export const order_refresh_interval_ms_n = global_config.view.layer_refresh_interval_ms_n;

	/** 清理节点数据 */
	export function clear(): void {
		// 清理定时器
		if (node_extends.order_update_timer) {
			clearTimeout(node_extends.order_update_timer);
			node_extends.order_update_timer = null;
		}

		// 清理节点数据
		node_extends.node_extends_map.clear();
	}
}

// 切换场景后自动清理
cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, MKN.clear, this);

export default MKN;
