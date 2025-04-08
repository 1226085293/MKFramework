import { EDITOR } from "cc/env";
import * as cc from "cc";
import global_config from "../../config/global_config";
import MKN from "../@extends/@node/mk_nodes";
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
}

/**
 * 层级管理
 * @noInheritDoc
 * @remarks
 *
 * - 动态多类型层级划分
 *
 * - 支持类型层级细粒度划分
 */
@ccclass
class mk_layer extends cc.Component {
	/* --------------- static --------------- */
	protected static _config = global_config.view.config;
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

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable() {
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
			cc.CCClass.Attr.setClassAttr(mk_layer, "layer_type_n", "enumList", cc.Enum.getList(cc.Enum(global_config.view.layer_type)));
		}
	}

	/** 更新渲染顺序 */
	private _update_layer(): void {
		if (EDITOR || !this._use_layer_b || !this.node.parent) {
			return;
		}

		/** 当前层 */
		const layer_n = this.layer_type_n * mk_layer._config.layer_spacing_n + this._child_layer_n;

		// 更新渲染顺序
		MKN(this.node).order_n = layer_n;
	}
}

export default mk_layer;
