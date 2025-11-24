import { EDITOR } from "cc/env";
import GlobalConfig from "../../Config/GlobalConfig";
import MKN from "../@Extends/@Node/MKNodes";
import { _decorator, Component, Enum, CCClass } from "cc";

const { ccclass, property, executeInEditMode } = _decorator;

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
class MKLayer extends Component {
	/* --------------- static --------------- */
	protected static _config = GlobalConfig.View.config;
	/* --------------- 属性 --------------- */
	/** 初始化编辑器 */
	@property({
		visible: false,
	})
	get initEditor(): void {
		this._initEditor();

		return;
	}

	/** 层类型 */
	@property({
		displayName: "层类型",
		type: Enum({ 未初始化: 0 }),
		group: { name: "视图配置", id: "1" },
		visible: function (this: MKLayer) {
			return this._isUseLayer;
		},
	})
	layerTypeNum = 0;

	/** 层级 */
	@property({
		displayName: "层级",
		tooltip: "注意：仅同级节点下生效",
		group: { name: "视图配置", id: "1" },
		min: 0,
		step: 1,
		visible: function (this: MKLayer) {
			return this._isUseLayer;
		},
	})
	get childLayerNum(): number {
		return this._childLayerNum;
	}

	set childLayerNum(valueNum_) {
		this._childLayerNum = valueNum_;
		this._updateLayer();
	}
	/* --------------- paragraph --------------- */
	/** 真实渲染次序 */
	get orderNum(): number {
		return this.layerTypeNum * MKLayer._config.layerSpacingNum + this._childLayerNum;
	}
	/* --------------- protected --------------- */
	/**
	 * 使用 layer
	 * @defaultValue
	 * true
	 * @remarks
	 * false：关闭 layer 功能
	 */
	protected _isUseLayer = true;
	/* --------------- private --------------- */
	/** 层级 */
	@property
	private _childLayerNum = 0;

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable() {
		if (!this._isUseLayer) {
			return;
		}

		this._updateLayer();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化编辑器 */
	protected _initEditor(): void {
		if (!this._isUseLayer) {
			return;
		}

		// 更新编辑器
		if (EDITOR) {
			// 层类型
			CCClass.Attr.setClassAttr(MKLayer, "layerTypeNum", "enumList", Enum.getList(Enum(GlobalConfig.View.LayerType)));
		}
	}

	/** 更新渲染顺序 */
	private _updateLayer(): void {
		if ((EDITOR && !window["cc"].GAME_VIEW) || !this._isUseLayer || !this.node.parent) {
			return;
		}

		// 更新渲染顺序
		MKN(this.node).orderNum = this.orderNum;
	}
}

export default MKLayer;
