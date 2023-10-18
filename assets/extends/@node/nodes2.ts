import * as cc from "cc";
import global_config from "../../@config/global_config";

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
	private static _node_extends_map = new Map<cc.Node, node_extends>();
	/** 渲染顺序更新时间 */
	private static _order_update_time_n = 0;
	/** 更新任务 */
	private static _order_update_task_fs: Function[] = [];
	/** 渲染顺序更新倒计时 */
	private static _order_update_timer: any = null;
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
	// /** 宽 */
	// width: number;
	// /** 高 */
	// height: number;
	// /** 透明度 */
	// opacity: number;
	// /** 锚点 */
	// anchor: cc.Vec2;

	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	get order_n(): number {
		return this._order_n;
	}

	set order_n(value_n_: number) {
		this._set_order_n(value_n_);
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
		// 未改变渲染顺序
		if (this._order_n === value_n_) {
			return;
		}

		// 更新渲染顺序
		this._order_n = value_n_;

		/** 父节点层级数据 */
		const parent = N(this._node.parent!);

		if (!parent) {
			return;
		}

		/** 距离上次更新的时间 */
		const time_since_last_update_n = Date.now() - node_extends._order_update_time_n;

		// 添加任务
		node_extends._order_update_task_fs.push((): void => {
			if (!parent._node.isValid || parent._node.children.length === 0) {
				return;
			}

			/** 同级节点 */
			const node_as = [...parent._node.children].sort((va, vb) => (N(va, false)?._order_n ?? 0) - (N(vb, false)?._order_n ?? 0));

			// 更新渲染顺序
			node_as.forEach((v, k_n) => {
				v.setSiblingIndex(k_n);
			});
		});

		// 小于间隔时间更新
		if (time_since_last_update_n < global_config.view.layer_refresh_interval_ms_n) {
			// 清理定时器
			clearTimeout(node_extends._order_update_timer);

			node_extends._order_update_timer = setTimeout(() => {
				// 更新时间
				node_extends._order_update_time_n = Date.now();
				// 更新渲染顺序
				node_extends._order_update_task_fs.splice(0, node_extends._order_update_task_fs.length).forEach((v_f) => v_f());
			}, global_config.view.layer_refresh_interval_ms_n - time_since_last_update_n);

			return;
		}

		// 更新时间
		node_extends._order_update_time_n = Date.now();
		// 更新渲染顺序
		node_extends._order_update_task_fs.splice(0, node_extends._order_update_task_fs.length).forEach((v_f) => v_f());
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function N(node_: cc.Node, force_b_ = true): node_extends {
	if (!node_) {
		return null!;
	}

	return null!;
}
