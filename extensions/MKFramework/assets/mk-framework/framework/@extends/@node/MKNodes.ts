import * as cc from "cc";
import GlobalConfig from "../../../Config/GlobalConfig";
import GlobalEvent from "../../../Config/GlobalEvent";

class NodeExtends {
	constructor(node_: cc.Node) {
		this._node = node_;

		this._node.components.forEach((v) => {
			if (v instanceof cc.Label) {
				this.label = v;
			} else if (v instanceof cc.Sprite) {
				this.sprite = v;
			} else if (v instanceof cc.UIOpacity) {
				this._uiOpacity = v;
			} else if (v instanceof cc.UITransform) {
				this.transform = v;
			} else if (cc.Animation && v instanceof cc.Animation) {
				this.animation = v;
			} else if (v instanceof cc.EditBox) {
				this.editBox = v;
			} else if (v instanceof cc.RichText) {
				this.richText = v;
			} else if (v instanceof cc.Layout) {
				this.layout = v;
			} else if (v instanceof cc.ProgressBar) {
				this.progressBar = v;
			} else if (v instanceof cc.Slider) {
				this.slider = v;
			} else if (v instanceof cc.Toggle) {
				this.toggle = v;
			}
		});

		node_.on(cc.Node.EventType.PARENT_CHANGED, this._onNodeParentChanged, this);
		this._onNodeParentChanged();
	}

	/* --------------- static --------------- */
	/** 节点扩展数据 */
	static nodeExtendsMap = new Map<cc.Node, NodeExtends>();
	/** 渲染顺序更新倒计时 */
	static orderUpdateTimer: any = null;
	/** 全局配置 */
	private static _config = GlobalConfig.View.config;
	/** 渲染顺序更新时间 */
	private static _orderUpdateTimeNum = 0;
	/** 更新任务 */
	private static _orderUpdateTaskFuncList: Function[] = [];
	/* --------------- public --------------- */
	label!: cc.Label;
	sprite!: cc.Sprite;
	transform!: cc.UITransform;
	animation!: cc.Animation;
	editBox!: cc.EditBox;
	richText!: cc.RichText;
	layout!: cc.Layout;
	progressBar!: cc.ProgressBar;
	slider!: cc.Slider;
	toggle!: cc.Toggle;

	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	get orderNum(): number {
		return this._orderNum;
	}

	set orderNum(valueNum_: number) {
		this._setOrderNum(valueNum_);
	}

	/** 宽 */
	get width(): number {
		return this.transform.width;
	}

	set width(valueNum_) {
		this.transform.width = valueNum_;
	}

	/** 高 */
	get height(): number {
		return this.transform.height;
	}

	set height(valueNum_) {
		this.transform.height = valueNum_;
	}

	/** 透明度 */
	get opacity(): number {
		return this._uiOpacity.opacity;
	}

	set opacity(valueNum_) {
		this._uiOpacity.opacity = valueNum_;
	}

	/** 锚点 */
	get anchor(): Readonly<cc.Vec2> {
		return this.transform.anchorPoint;
	}

	set anchor(valueV2_: cc.Vec2) {
		this.transform.anchorPoint = valueV2_;
	}

	/* --------------- private --------------- */
	/** 持有节点 */
	private _node: cc.Node;
	/** 节点渲染次序 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	private _orderNum = NaN;
	/** 节点渲染次序更新时间 */
	private _orderTimestampNum = 0;
	/** 透明度组件 */
	private _uiOpacity!: cc.UIOpacity;
	/* ------------------------------- 节点事件 ------------------------------- */
	private _onNodeParentChanged(): void {
		if (!this._node.parent?.isValid) {
			return;
		}

		// 避免 children 数据未更新
		if (!this._node.parent.children.includes(this._node)) {
			this._node.parent.once(
				cc.Node.EventType.CHILD_ADDED,
				() => {
					this._setOrderNum(this._orderNum, true);
				},
				this
			);
		} else {
			this._setOrderNum(this._orderNum, true);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _setOrderNum(valueNum_: number, isForce_ = false): void {
		if (
			// 节点失效
			!this._node.isValid ||
			// 未改变渲染顺序
			(this._orderNum === valueNum_ &&
				// 强制更新
				!isForce_)
		) {
			return;
		}

		// 更新渲染顺序
		this._orderNum = valueNum_;
		this._orderTimestampNum = Date.now();

		const parent = MKN(this._node.parent!);

		// 父节点不存在
		if (!parent) {
			return;
		}

		/** 距离上次更新的时间 */
		const timeSinceLastUpdateNum = Date.now() - NodeExtends._orderUpdateTimeNum;

		// 添加任务
		NodeExtends._orderUpdateTaskFuncList.push((): void => {
			// (节点/父节点)失效
			if (!this._node.isValid || !parent._node.isValid || this._node.parent !== parent._node) {
				return;
			}

			/** 同级节点 */
			const nodeList = [...parent._node.children].sort((va, vb) => {
				const vaInfo = MKN(va, false);
				const vbInfo = MKN(vb, false);
				const vaOrder = vaInfo?._orderNum ?? 0;
				const vbOrder = vbInfo?._orderNum ?? 0;

				if (vaOrder === vbOrder) {
					return (vaInfo?._orderTimestampNum ?? 0) - (vbInfo?._orderTimestampNum ?? 0);
				} else {
					return vaOrder - vbOrder;
				}
			});

			// 更新渲染顺序
			nodeList.forEach((v, kN) => {
				v.setSiblingIndex(kN);
			});
		});

		// 已经准备更新
		if (NodeExtends.orderUpdateTimer !== null) {
			return;
		}

		// 小于间隔时间更新
		if (NodeExtends.orderUpdateTimer === null && timeSinceLastUpdateNum < NodeExtends._config.layerRefreshIntervalMsNum) {
			NodeExtends.orderUpdateTimer = setTimeout(() => {
				// 清理定时器数据
				NodeExtends.orderUpdateTimer = null;
				// 更新时间
				NodeExtends._orderUpdateTimeNum = Date.now();
				// 更新渲染顺序
				NodeExtends._orderUpdateTaskFuncList.splice(0, NodeExtends._orderUpdateTaskFuncList.length).forEach((vFunc) => vFunc());
			}, NodeExtends._config.layerRefreshIntervalMsNum - timeSinceLastUpdateNum);

			return;
		}

		// 更新时间
		NodeExtends._orderUpdateTimeNum = Date.now();
		// 更新渲染顺序
		NodeExtends._orderUpdateTaskFuncList.splice(0, NodeExtends._orderUpdateTaskFuncList.length).forEach((vFunc) => vFunc());
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function MKN(node_: cc.Node, isForce_ = true): NodeExtends {
	if (!node_?.isValid) {
		return null!;
	}

	let nodeExtend = NodeExtends.nodeExtendsMap.get(node_) ?? null;

	if (!nodeExtend && isForce_) {
		nodeExtend = new NodeExtends(node_);
		NodeExtends.nodeExtendsMap.set(node_, nodeExtend);
	}

	return nodeExtend!;
}

namespace MKN {
	/** 清理节点数据 */
	export function clear(): void {
		// 清理定时器
		if (NodeExtends.orderUpdateTimer) {
			clearTimeout(NodeExtends.orderUpdateTimer);
			NodeExtends.orderUpdateTimer = null;
		}

		// 清理节点数据
		NodeExtends.nodeExtendsMap.clear();
	}
}

// 切换场景后自动清理
cc.director.on(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, MKN.clear, this);
// 重启时自动清理
GlobalEvent.on(GlobalEvent.key.restart, MKN.clear, this);

export default MKN;
