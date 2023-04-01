import * as cc from "cc";
import { EDITOR } from "cc/env";
import mk_tool from "../@private/tool/mk_tool";
import type { mk_layer_ } from "./mk_layer";
import { mk_life_cycle, _mk_life_cycle } from "./mk_life_cycle";
import dynamic_module from "../mk_dynamic_module";
import { asset } from "../mk_export";
import type { mk_ui_manage_ } from "../mk_ui_manage";
const ui_manage = dynamic_module.default(import("../mk_ui_manage"));

const { ccclass, property } = cc._decorator;

namespace _mk_view_base {
	/** 释放对象类型 */
	export type release_object_type = { clear(): void };

	/** create 配置 */
	export interface create_config extends _mk_life_cycle.create_config {
		/** 视图配置 */
		view_config: mk_view_base_.view_config;
	}

	/** 窗口配置 */
	@ccclass("framework/module/layer/wind_config")
	export class wind_config {
		/* --------------- static --------------- */
		/** 窗口动画枚举表 */
		static animation_enum_tab: {
			/** 打开动画 */
			open: Record<string | number, string | number>;
			/** 关闭动画 */
			close: Record<string | number, string | number>;
		} = {
			open: {},
			close: {},
		};

		/* --------------- 属性 --------------- */

		@property({
			displayName: "窗口打开动画",
			type: cc.Enum({ 未初始化: 0 }),
		})
		get open_animation_n(): number {
			return (wind_config.animation_enum_tab.open[this.open_animation_s] as number) ?? 0;
		}

		set open_animation_n(value_n_: number) {
			this.open_animation_s = wind_config.animation_enum_tab.open[value_n_] as string;
		}

		@property({
			displayName: "窗口关闭动画",
			type: cc.Enum({ 未初始化: 0 }),
		})
		get close_animation_n(): number {
			return (wind_config.animation_enum_tab.close[this.close_animation_s] as number) ?? 0;
		}

		set close_animation_n(value_n_: number) {
			this.close_animation_s = wind_config.animation_enum_tab.close[value_n_] as string;
		}

		/* --------------- public --------------- */
		/** 窗口打开动画 */
		@property({ visible: false })
		open_animation_s = "";

		/** 窗口关闭动画 */
		@property({ visible: false })
		close_animation_s = "";
	}
}

/** 视图基类 */
@ccclass
export class mk_view_base extends mk_life_cycle {
	/* --------------- static --------------- */
	protected static _init_data: mk_view_base_.init_data & mk_view_base_.init_config;
	/* --------------- 属性 --------------- */
	/** 窗口 */
	@property({
		displayName: "窗口",
	})
	get wind_b(): boolean {
		return this._wind_b;
	}

	set wind_b(value_b_) {
		this._set_wind_b(value_b_);
	}

	@property({
		displayName: "窗口配置",
		type: _mk_view_base.wind_config,
		visible: function (this: mk_view_base) {
			return this._wind_b;
		},
	})
	wind_config: _mk_view_base.wind_config = null!;

	@property({
		displayName: "单独展示",
		tooltip: "勾选后打开此视图将隐藏所有下级视图，关闭此视图则还原展示",
	})
	show_alone_b = false;

	@property({
		displayName: "添加遮罩",
		tooltip: "添加遮罩到根节点下",
	})
	get auto_mask_b(): boolean {
		return this._get_auto_mask_b();
	}

	set auto_mask_b(value_b_) {
		this._set_auto_mask_b(value_b_);
	}

	@property({
		displayName: "0 边距 widget",
		tooltip: "在节点上添加 0 边距 widget",
	})
	get auto_widget_b(): boolean {
		return Boolean(this.getComponent(cc.Widget));
	}

	set auto_widget_b(value_b_) {
		this._set_auto_widget_b(value_b_);
	}

	@property({
		displayName: "BlockInputEvents",
		tooltip: "在节点上添加 BlockInputEvents 组件",
	})
	get auto_block_input_b(): boolean {
		return Boolean(this.getComponent(cc.BlockInputEvents));
	}

	set auto_block_input_b(value_b_) {
		this._set_auto_block_input_b(value_b_);
	}

	/* --------------- public --------------- */
	/** 视图数据（如果是 class 类似会在 close 后自动重置，根据 this._reset_data_b 控制） */
	data?: any;

	/** 视图类型 */
	get type_s(): string {
		return this._view_config.type_s;
	}

	/** 模块配置 */
	set config(config_: _mk_view_base.create_config) {
		super.config = config_;
		if (config_.view_config) {
			this._view_config.prefab_tab = config_.view_config.prefab_tab ?? this._view_config.prefab_tab;
			this._view_config.type_s = config_.view_config.type_s ?? this._view_config.type_s;
		}
	}

	/* --------------- protected --------------- */
	/** 重置 data（close 后重置 this.data，data 必须为 class） */
	protected _reset_data_b = true;
	/** 视图配置 */
	protected _view_config = new mk_view_base_.view_config();
	/* --------------- private --------------- */
	/** 窗口 */
	@property
	private _wind_b = false;

	/** 引用节点 */
	private _quote_node_as: cc.Node[] = [];
	/** 引用资源 */
	private _quote_asset_as: cc.Asset[] = [];
	/** 引用对象 */
	private _quote_object_as: _mk_view_base.release_object_type[] = [];
	/* ------------------------------- static ------------------------------- */
	/**
	 * 初始化
	 * @param data_ 初始化数据
	 */
	static init(data_: mk_view_base_.init_data, config_?: Partial<mk_view_base_.init_config>): void {
		super.init(data_);

		mk_view_base._init_data = {
			...data_,
			...config_,
		};
	}

	/* ------------------------------- 生命周期 ------------------------------- */
	open(): void | Promise<void>;
	async open(): Promise<void> {
		// 打开动画
		if (this.wind_b && this.wind_config?.open_animation_s) {
			await mk_view_base._init_data.window_animation_tab?.open?.[this.wind_config.open_animation_s]?.(this.node);
		}
	}

	/**
	 * 关闭
	 * @param config_ 关闭配置
	 */
	close(config_?: Omit<mk_ui_manage_.close_config<any>, "type" | "all_b">): void | Promise<void>;
	async close(config_?: Omit<mk_ui_manage_.close_config<any>, "type" | "all_b">): Promise<void> {
		// 不在关闭中或者已经关闭代表外部调用
		if (!mk_tool.byte.get_bit(this._state, _mk_life_cycle.run_state.closing | _mk_life_cycle.run_state.close)) {
			await ui_manage.close(this, config_);
			throw "中断";
		}
	}

	protected async _late_close?(): Promise<void> {
		// 关闭动画
		if (this.wind_b && this.wind_config?.close_animation_s) {
			await mk_view_base._init_data.window_animation_tab?.close?.[this.wind_config.close_animation_s]?.(this.node);
		}

		// 重置数据
		this._view_config.type_s = "default";

		// 释放资源
		this._quote_node_as.forEach((v) => v.destroy());
		this._quote_node_as.splice(0, this._quote_node_as.length);
		this._quote_asset_as.forEach((v) => {
			if (v.isValid) {
				v.decRef();
			}
		});
		this._quote_asset_as.splice(0, this._quote_asset_as.length);
		this._quote_object_as.forEach((v) => v.clear());
		this._quote_object_as.splice(0, this._quote_object_as.length);

		// 重置数据
		if (this.data && this._reset_data_b) {
			mk_tool.object.reset(this.data);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 自动释放 */
	auto_release<T extends cc.Node | cc.Node[]>(args_: T): T;
	auto_release<T extends cc.Asset | cc.Asset[]>(args_: T): T;
	auto_release<T extends _mk_view_base.release_object_type | _mk_view_base.release_object_type[]>(args_: T): T;
	auto_release<
		T extends (cc.Asset | cc.Asset[]) | (cc.Node | cc.Node[]) | (_mk_view_base.release_object_type | _mk_view_base.release_object_type[])
	>(args_: T): T {
		if (!args_) {
			return args_;
		}
		let node_as: cc.Node[] | undefined;
		let asset_as: cc.Asset[] | undefined;
		let object_as: _mk_view_base.release_object_type[] | undefined;

		// 参数转换
		{
			if (Array.isArray(args_)) {
				if (!args_.length) {
					return args_;
				}
				if (args_[0] instanceof cc.Node) {
					node_as = args_ as any;
				} else if (args_[0] instanceof cc.Asset) {
					asset_as = args_ as any;
				} else {
					object_as = args_ as any;
				}
			} else {
				if (args_ instanceof cc.Node) {
					node_as = [args_];
				} else if (args_ instanceof cc.Asset) {
					asset_as = [args_];
				} else {
					object_as = [args_];
				}
			}
		}

		// 如果模块已经关闭则直接释放
		if (!this.open_b) {
			node_as?.forEach((v) => v.destroy());
			asset_as?.forEach((v) => v.decRef());
			object_as?.forEach((v) => v.clear());
			return args_;
		}

		// 添加引用数据
		{
			if (node_as) {
				this._quote_node_as.push(...node_as);
			}
			if (asset_as) {
				this._quote_asset_as.push(...asset_as);
			}
			if (object_as) {
				this._quote_object_as.push(...object_as);
			}
		}

		return args_;
	}

	/** 初始化编辑器 */
	protected _init_editor(): void {
		super._init_editor();
		if (!mk_view_base._init_data) {
			return;
		}

		// 初始化数据
		{
			// 窗口动画枚举
			if (mk_view_base._init_data.window_animation_tab) {
				// 打开
				if (mk_view_base._init_data.window_animation_tab.open) {
					_mk_view_base.wind_config.animation_enum_tab.open = cc.Enum(
						mk_tool.enum.obj_to_enum(mk_view_base._init_data.window_animation_tab.open)
					);
					if (this.wind_config && !this.wind_config.open_animation_s) {
						this.wind_config.open_animation_s = Object.keys(_mk_view_base.wind_config.animation_enum_tab.open)[0];
					}
				}
				// 关闭
				if (mk_view_base._init_data.window_animation_tab.close) {
					_mk_view_base.wind_config.animation_enum_tab.close = cc.Enum(
						mk_tool.enum.obj_to_enum(mk_view_base._init_data.window_animation_tab.close)
					);
					if (this.wind_config && !this.wind_config.close_animation_s) {
						this.wind_config.close_animation_s = Object.keys(_mk_view_base.wind_config.animation_enum_tab.close)[0];
					}
				}
			}
		}

		// 更新编辑器
		if (EDITOR) {
			// 遮罩类型
			if (this.wind_b) {
				// 窗口动画
				if (mk_view_base._init_data.window_animation_tab) {
					if (mk_view_base._init_data.window_animation_tab.open) {
						cc.CCClass.Attr.setClassAttr(
							_mk_view_base.wind_config,
							"open_animation_n",
							"enumList",
							cc.Enum.getList(_mk_view_base.wind_config.animation_enum_tab.open)
						);
					}
					if (mk_view_base._init_data.window_animation_tab.close) {
						cc.CCClass.Attr.setClassAttr(
							_mk_view_base.wind_config,
							"close_animation_n",
							"enumList",
							cc.Enum.getList(_mk_view_base.wind_config.animation_enum_tab.close)
						);
					}
				}
			}
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_wind_b(value_b_: boolean): void {
		this.wind_config = !value_b_ ? null! : new _mk_view_base.wind_config();
		this._wind_b = value_b_;
	}

	private _get_auto_mask_b(): boolean {
		if (!this.node.children.length) {
			return false;
		}
		return Boolean(this.node.children[0].getComponent(cc.Sprite) && this.node.children[0].getComponent(cc.Widget));
	}

	private async _set_auto_mask_b(value_b_: boolean): Promise<void> {
		// 添加遮罩
		if (value_b_) {
			if (!mk_view_base._init_data.mask_prefab_path_s) {
				return;
			}
			const prefab = await asset.get(mk_view_base._init_data.mask_prefab_path_s, cc.Prefab);

			if (!prefab) {
				return;
			}
			const node = cc.instantiate(prefab);

			// 设置节点名
			if (mk_view_base._init_data.mask_node_name_s) {
				node.name = mk_view_base._init_data.mask_node_name_s;
			}
			// 添加到父节点
			this.node.addChild(node);
			// 更新层级
			node.setSiblingIndex(0);
		}
		// 销毁遮罩
		else if (this._get_auto_mask_b()) {
			this.node.children[0].destroy();
		}
	}

	private _set_auto_widget_b(value_b_: boolean): void {
		if (value_b_) {
			const widget = this.addComponent(cc.Widget)!;

			widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
			widget.top = widget.bottom = widget.left = widget.right = 0;
		} else {
			this.getComponent(cc.Widget)?.destroy();
		}
	}

	private _set_auto_block_input_b(value_b_: boolean): void {
		if (value_b_) {
			this.addComponent(cc.BlockInputEvents);
		} else {
			this.getComponent(cc.BlockInputEvents)?.destroy();
		}
	}
}

export namespace mk_view_base_ {
	/** 初始化数据 */
	export type init_data = mk_layer_.init_data;

	/** 初始化配置 */
	export interface init_config {
		/** 遮罩节点名 */
		mask_node_name_s?: string;
		/** 遮罩预制体路径 */
		mask_prefab_path_s?: string;
		/** 窗口动画 */
		window_animation_tab?: {
			/** 打开动画 */
			open?: Record<string, (value: cc.Node) => void | Promise<void>>;
			/** 关闭动画 */
			close?: Record<string, (value: cc.Node) => void | Promise<void>>;
		};
	}

	export class view_config {
		constructor(init_?: Partial<view_config>) {
			Object.assign(this, init_);
		}

		/** 所有预制体路径|资源 */
		prefab_tab?: Record<string, cc.Prefab | string> & { default: cc.Prefab | string };
		/** 模块类型 */
		type_s = "default";
	}
}

export default mk_view_base;
