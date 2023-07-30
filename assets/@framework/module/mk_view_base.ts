import * as cc from "cc";
import { EDITOR } from "cc/env";
import mk_tool from "../@private/tool/mk_tool";
import { mk_life_cycle, _mk_life_cycle } from "./mk_life_cycle";
import dynamic_module from "../mk_dynamic_module";
import type { mk_ui_manage_ } from "../mk_ui_manage";
import mk_asset from "../resources/mk_asset";
import type { _mk_layer } from "./mk_layer";
import global_config from "../../@config/global_config";
import { mk_audio, mk_audio_ } from "../audio/mk_audio_export";
import mk_game from "../mk_game";
const ui_manage = dynamic_module.default(import("../mk_ui_manage"));
const { ccclass, property } = cc._decorator;

namespace _mk_view_base {
	/** create 配置 */
	export interface create_config extends _mk_life_cycle.create_config {
		/** 视图配置 */
		view_config: mk_view_base_.view_config;
	}

	/** 全局配置 */
	export interface global_config extends _mk_layer.global_config {
		/** 默认遮罩 */
		mask_data_tab: {
			/** 节点名 */
			node_name_s?: string;
			/** 预制体路径 */
			prefab_path_s: string;
		};
		/** 窗口动画 */
		readonly window_animation_tab: Readonly<{
			/** 打开动画 */
			open: Record<string, (value: cc.Node) => void | Promise<void>>;
			/** 关闭动画 */
			close: Record<string, (value: cc.Node) => void | Promise<void>>;
		}>;
	}

	/** 动画配置 */
	@ccclass("mk_view_base/animation_config")
	export class animation_config {
		/* --------------- static --------------- */
		/** 动画枚举表 */
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
		/**
		 * @internal
		 */
		@property({
			displayName: "打开动画",
			type: cc.Enum({ 未初始化: 0 }),
		})
		get open_animation_n(): number {
			return (animation_config.animation_enum_tab.open[this.open_animation_s] as number) ?? 0;
		}

		/**
		 * @internal
		 */
		set open_animation_n(value_n_: number) {
			this.open_animation_s = animation_config.animation_enum_tab.open[value_n_] as string;
		}

		/**
		 * @internal
		 */
		@property({
			displayName: "关闭动画",
			type: cc.Enum({ 未初始化: 0 }),
		})
		get close_animation_n(): number {
			return (animation_config.animation_enum_tab.close[this.close_animation_s] as number) ?? 0;
		}

		/**
		 * @internal
		 */
		set close_animation_n(value_n_: number) {
			this.close_animation_s = animation_config.animation_enum_tab.close[value_n_] as string;
		}

		/* --------------- public --------------- */
		/** 打开动画 */
		@property({ visible: false })
		open_animation_s = "";

		/** 关闭动画 */
		@property({ visible: false })
		close_animation_s = "";
	}
}

/** 视图基类 */
@ccclass
export class mk_view_base extends mk_life_cycle {
	/* --------------- static --------------- */
	static config: _mk_view_base.global_config = {
		layer_type: global_config.view.layer_type,
		layer_spacing_n: global_config.view.layer_spacing_n,
		mask_data_tab: global_config.view.mask_data_tab,
		window_animation_tab: {
			open: {
				无: null!,
			},
			close: {
				无: null!,
			},
		},
	};

	/* --------------- 属性 --------------- */
	@property({
		displayName: "单独展示",
		tooltip: "勾选后打开此视图将隐藏所有下级视图，关闭此视图则还原展示",
		group: { name: "视图配置", id: "1" },
	})
	show_alone_b = false;

	@property({
		displayName: "动画配置",
		type: _mk_view_base.animation_config,
		group: { name: "视图配置", id: "1" },
	})
	animation_config: _mk_view_base.animation_config = null!;

	@property({
		displayName: "添加遮罩",
		tooltip: "添加遮罩到根节点下",
		group: { name: "快捷操作", id: "1" },
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
		group: { name: "快捷操作", id: "1" },
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
		group: { name: "快捷操作", id: "1" },
	})
	get auto_block_input_b(): boolean {
		return Boolean(this.getComponent(cc.BlockInputEvents));
	}

	set auto_block_input_b(value_b_) {
		this._set_auto_block_input_b(value_b_);
	}

	/* --------------- public --------------- */
	/**
	 * 视图数据
	 * @remarks
	 * 如果是 class 类型数据会在 close 后自动重置，根据 this._reset_data_b 控制
	 */
	data?: any;

	/** 视图类型 */
	get type_s(): string {
		return this._view_config.type_s;
	}

	/** 模块配置 */
	set config(config_: _mk_view_base.create_config) {
		if (config_.static_b !== undefined) {
			this._static_b = config_.static_b;
		}

		if (config_.view_config) {
			this._view_config.prefab_tab = config_.view_config.prefab_tab ?? this._view_config.prefab_tab;
			this._view_config.type_s = config_.view_config.type_s ?? this._view_config.type_s;
		}
	}

	/* --------------- protected --------------- */
	/**
	 * 重置 data
	 * @remarks
	 * close 后重置 this.data，data 必须为 class 类型
	 */
	protected _reset_data_b = true;
	/** 视图配置 */
	protected _view_config = new mk_view_base_.view_config();

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		/** 参数表 */
		const attr_tab = cc.CCClass.Attr.getClassAttrs(this["__proto__"].constructor);
		/** 参数键列表 */
		const attr_key_ss = Object.keys(attr_tab);

		// 初始化音频单元
		attr_key_ss.forEach((v_s) => {
			if (!v_s.endsWith("$_$ctor")) {
				return;
			}

			/** 属性名 */
			const name_s = v_s.slice(0, -7);

			// 初始化音频单元
			if (this[name_s] instanceof mk_audio_._unit) {
				mk_audio._add(this[name_s]);
			}
		});
	}

	protected open(): void | Promise<void>;
	protected async open(): Promise<void> {
		/** 打开动画函数 */
		const open_animation_f = mk_view_base.config.window_animation_tab?.open?.[this.animation_config?.open_animation_s];

		// 更新 widget，防止在节点池内 widget 未更新
		cc.view.emit("canvas-resize");

		// 打开动画
		if (open_animation_f) {
			await open_animation_f(this.node);
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

	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected late_close?(): void | Promise<void>;
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected async late_close?(): Promise<void> {
		/** 关闭动画函数 */
		const close_animation_f = mk_view_base.config.window_animation_tab?.close?.[this.animation_config?.close_animation_s];

		// 关闭动画
		if (!mk_game.restarting_b && close_animation_f) {
			await close_animation_f(this.node);
		}

		// 重置数据
		this._view_config.type_s = "default";

		// 重置数据
		if (this.data && this._reset_data_b) {
			mk_tool.object.reset(this.data, true);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化编辑器 */
	protected _init_editor(): void {
		super._init_editor();
		if (!mk_view_base.config) {
			return;
		}

		// 初始化数据
		{
			// 窗口动画枚举
			if (mk_view_base.config.window_animation_tab) {
				// 打开
				if (mk_view_base.config.window_animation_tab.open) {
					_mk_view_base.animation_config.animation_enum_tab.open = cc.Enum(
						mk_tool.enum.obj_to_enum(mk_view_base.config.window_animation_tab.open)
					);

					if (this.animation_config && !this.animation_config.open_animation_s) {
						this.animation_config.open_animation_s = Object.keys(_mk_view_base.animation_config.animation_enum_tab.open)[0];
					}
				}

				// 关闭
				if (mk_view_base.config.window_animation_tab.close) {
					_mk_view_base.animation_config.animation_enum_tab.close = cc.Enum(
						mk_tool.enum.obj_to_enum(mk_view_base.config.window_animation_tab.close)
					);

					if (this.animation_config && !this.animation_config.close_animation_s) {
						this.animation_config.close_animation_s = Object.keys(_mk_view_base.animation_config.animation_enum_tab.close)[0];
					}
				}
			}
		}

		// 更新编辑器
		if (EDITOR) {
			// 窗口动画
			if (mk_view_base.config.window_animation_tab) {
				if (mk_view_base.config.window_animation_tab.open) {
					cc.CCClass.Attr.setClassAttr(
						_mk_view_base.animation_config,
						"open_animation_n",
						"enumList",
						cc.Enum.getList(_mk_view_base.animation_config.animation_enum_tab.open)
					);
				}

				if (mk_view_base.config.window_animation_tab.close) {
					cc.CCClass.Attr.setClassAttr(
						_mk_view_base.animation_config,
						"close_animation_n",
						"enumList",
						cc.Enum.getList(_mk_view_base.animation_config.animation_enum_tab.close)
					);
				}
			}
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _get_auto_mask_b(): boolean {
		if (!this.node.children.length) {
			return false;
		}

		return Boolean(this.node.children[0].getComponent(cc.Sprite) && this.node.children[0].getComponent(cc.Widget));
	}

	private async _set_auto_mask_b(value_b_: boolean): Promise<void> {
		// 添加遮罩
		if (value_b_) {
			if (!mk_view_base.config.mask_data_tab.prefab_path_s) {
				return;
			}

			const prefab = await mk_asset.get(mk_view_base.config.mask_data_tab.prefab_path_s, cc.Prefab, this);

			if (!prefab) {
				return;
			}

			const node = cc.instantiate(prefab);

			// 设置节点名
			if (mk_view_base.config.mask_data_tab.node_name_s) {
				node.name = mk_view_base.config.mask_data_tab.node_name_s;
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
	/** 视图模块配置 */
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
