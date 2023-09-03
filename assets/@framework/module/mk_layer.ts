import { EDITOR } from "cc/env";
import * as cc from "cc";
import global_config from "../../@config/global_config";
// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, executeInEditMode } = cc._decorator;

export namespace _mk_layer {
	/** 全局配置 */
	export interface global_config {
		/** 层级类型枚举 */
		layer_type: any;
		/** 层间隔 */
		layer_spacing_n: number;
	}

	/** 节点扩展 */
	export interface node_extend {
		/** 层级 */
		__layer_n?: number;
		/** 层级改变定时器 */
		__layer_timer?: any;
		/** 层级刷新间隔 */
		__layer_refresh_interval_ms_n?: number;
	}
}

/**
 * 层级管理
 * @remarks
 *
 * - 动态多类型层级划分
 *
 * - 支持类型层级细粒度划分
 */
@ccclass
class mk_layer extends cc.Component {
	/* --------------- static --------------- */
	static config: _mk_layer.global_config = {
		layer_type: global_config.view.layer_type,
		layer_spacing_n: global_config.view.layer_spacing_n,
	};

	/* --------------- 属性 --------------- */
	/** 初始化编辑器 */
	@property({
		visible: false,
	})
	get init_editor(): void {
		this._init_editor();

		return;
	}

	/** 层类型 */
	@property({
		displayName: "层类型",
		type: cc.Enum({ 未初始化: 0 }),
		group: { name: "视图配置", id: "1" },
		visible: function (this: mk_layer) {
			return this._use_layer_b;
		},
	})
	layer_type_n = 0;

	/** 层级 */
	@property({
		displayName: "层级",
		tooltip: "注意：仅同级节点下生效",
		group: { name: "视图配置", id: "1" },
		min: 0,
		step: 1,
		visible: function (this: mk_layer) {
			return this._use_layer_b;
		},
	})
	get child_layer_n(): number {
		return this._child_layer_n;
	}

	set child_layer_n(value_n_) {
		this._child_layer_n = value_n_;
		this._update_layer();
	}

	/* --------------- protected --------------- */
	/**
	 * 使用 layer
	 * @defaultValue
	 * true
	 * @remarks
	 * false：关闭 layer 功能
	 */
	protected _use_layer_b = true;
	/* --------------- private --------------- */
	/** 层级 */
	@property
	private _child_layer_n = 0;

	/* ------------------------------- static ------------------------------- */
	/**
	 * 设置层级刷新间隔
	 * @param node_ 节点
	 * @param interval_ms_n_ 间隔时间（毫秒）
	 * @param recursion_b_ 递归
	 * @remarks
	 * 设置 node_ 的子节点将延迟 interval_ms_n_ 时间后更新层级
	 */
	static set_layer_refresh_interval(node_: cc.Node, interval_ms_n_: number, recursion_b_ = false): void {
		if (!node_?.isValid) {
			return;
		}

		(node_ as _mk_layer.node_extend).__layer_refresh_interval_ms_n = interval_ms_n_;

		if (!recursion_b_) {
			return;
		}

		node_.children.forEach((v) => {
			mk_layer.set_layer_refresh_interval(v, interval_ms_n_, true);
		});
	}

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad() {
		if (!this._use_layer_b) {
			return;
		}

		this._update_layer();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化编辑器 */
	protected _init_editor(): void {
		if (!this._use_layer_b) {
			return;
		}

		// 更新编辑器
		if (EDITOR) {
			// 层类型
			cc.CCClass.Attr.setClassAttr(mk_layer, "layer_type_n", "enumList", cc.Enum.getList(cc.Enum(mk_layer.config.layer_type)));
		}
	}

	/** 更新渲染顺序 */
	private _update_layer(): void {
		if (EDITOR || !this._use_layer_b || !this.node.parent) {
			return;
		}

		/** 当前层 */
		const layer_n = this.layer_type_n * mk_layer.config.layer_spacing_n + this._child_layer_n;
		/** 自己节点 */
		const self_node = this.node as cc.Node & _mk_layer.node_extend;

		// 未改变渲染顺序
		if ((self_node.__layer_n ?? 0) === layer_n) {
			return;
		}

		// 更新渲染顺序
		self_node.__layer_n = layer_n;

		/** 父节点层级数据 */
		const parent_node = this.node.parent as cc.Node & _mk_layer.node_extend;

		if (parent_node.__layer_timer) {
			return;
		}

		parent_node.getComponent(cc.UITransform)!.scheduleOnce(
			(parent_node.__layer_timer = () => {
				parent_node.__layer_timer = null;

				if (!parent_node.children) {
					return;
				}

				/** 同级节点 */
				const sibling_node_as = [...parent_node.children].sort(
					(va: cc.Node & _mk_layer.node_extend, vb: cc.Node & _mk_layer.node_extend) => (va.__layer_n ?? 0) - (vb.__layer_n ?? 0)
				);

				// 更新渲染顺序
				sibling_node_as.forEach((v, k_n) => {
					v.setSiblingIndex(k_n);
				});
			}),
			(parent_node.__layer_refresh_interval_ms_n ?? global_config.view.layer_refresh_interval_ms_n) * 0.001
		);
	}
}

export default mk_layer;
