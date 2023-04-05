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
}

/** 层级管理 */
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
	})
	layer_type_n = 0;

	/** 层级 */
	@property({
		displayName: "层级",
		tooltip: "注意：仅同级节点下生效",
		min: 0,
		step: 1,
	})
	get child_layer_n(): number {
		return this._child_layer_n;
	}

	set child_layer_n(value_n_) {
		this._child_layer_n = value_n_;
		this._update_priority();
	}

	/* --------------- private --------------- */
	/** 层级 */
	@property
	private _child_layer_n = 0;

	private _ui_transform!: cc.UITransform;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		// 初始化数据
		this._ui_transform = this.node.getComponent(cc.UITransform) ?? this.node.addComponent(cc.UITransform);

		this._update_priority();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化编辑器 */
	protected _init_editor(): void {
		// 初始化数据
		this._ui_transform = this.node.getComponent(cc.UITransform) ?? this.node.addComponent(cc.UITransform);

		// 更新编辑器
		if (EDITOR) {
			// 层类型
			cc.CCClass.Attr.setClassAttr(mk_layer, "layer_type_n", "enumList", cc.Enum.getList(cc.Enum(mk_layer.config.layer_type)));
		}
	}

	/** 更新渲染优先级 */
	private _update_priority(): void {
		/** 当前顺序 */
		const curr_priority_n = this.layer_type_n * mk_layer.config.layer_spacing_n + this._child_layer_n;

		// 更新 priority
		this._ui_transform.priority = curr_priority_n;
	}
}

export default mk_layer;
