import * as cc from "cc";

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
	private _node: cc.Node;
	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _order_n = 0;
	/* ------------------------------- 功能 ------------------------------- */
	/** 更新子节点渲染顺序 */
	private _update_child_order(node_: cc.Node, callback_f_?: () => any): void {
		if (!node_?.children.length) {
			return;
		}

		/** 同级节点 */
		const node_as = [...node_.children].sort((va, vb) => (N(va, false)?._order_n ?? 0) - (N(vb, false)?._order_n ?? 0));

		// 更新渲染顺序
		node_as.forEach((v, k_n) => {
			v.setSiblingIndex(k_n);
		});

		callback_f_?.();
	}

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

		// 监听节点变更
		this._node.on(
			cc.Node.EventType.PARENT_CHANGED,
			() => {
				this._update_child_order(parent._node);
			},
			this
		);

		if (parent) {
			parent._node.on(
				cc.Node.EventType.CHILD_ADDED,
				() => {
					this._update_child_order(parent._node);
				},
				this
			);

			parent._node.on(
				cc.Node.EventType.CHILD_REMOVED,
				() => {
					this._update_child_order(parent._node);
				},
				this
			);

			const listen_order_changed_f = (): void => {
				parent._node.once(
					cc.Node.EventType.SIBLING_ORDER_CHANGED,
					() => {
						this._update_child_order(parent._node, () => {
							listen_order_changed_f();
						});
					},
					this
				);
			};

			listen_order_changed_f();
		}
	}
}

const node_extends_map = new Map<cc.Node, node_extends>();
/** 渲染顺序更新时间 */
const order_update_time_map = new Map<cc.Node, number>();

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function N(node_: cc.Node, force_b_ = true): node_extends {
	if (!node_) {
		return null!;
	}

	return null!;
}
