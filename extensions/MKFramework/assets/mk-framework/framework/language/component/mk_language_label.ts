import * as cc from "cc";
import language from "../mk_language_manage";
import mk_language_base from "./mk_language_base";
import { EDITOR } from "cc/env";
import language_manage from "../mk_language_manage";
import mk_tool from "../../@private/tool/mk_tool";
import mk_language_manage from "../mk_language_manage";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

/**
 * 多语言文本
 * @noInheritDoc
 */
@ccclass
@executeInEditMode
class mk_language_label extends mk_language_base {
	/* --------------- static --------------- */
	/** 类型数组 */
	private static _type_ss = Object.keys(language.label_data_tab);
	/** 注册类型 */
	private static _type_enum: any = mk_tool.enum.obj_to_enum(language.label_data_tab);
	/* --------------- 属性 --------------- */
	/** label 适配 */
	@property({
		displayName: "水平对齐适配",
		tooltip: "根据语言配置设置 Label 的水平对齐方式 Horizontal Align",
	})
	direction_adaptation_b = false;

	get type(): number {
		return mk_language_label._type_enum[this._type_s];
	}

	set type(value_) {
		this._set_type(value_);
	}

	/** 参数 */
	@property({
		displayName: "参数",
		type: [cc.CCString],
	})
	get args_ss(): string[] {
		return this._args_ss;
	}

	set args_ss(value_ss_: string[]) {
		this._set_args_ss(value_ss_);
	}

	/* --------------- protected --------------- */
	@property({ override: true })
	protected _type_s = "";

	/* --------------- private --------------- */
	@property([cc.CCString])
	private _args_ss: string[] = [];

	/** label组件 */
	private _label!: cc.Label | cc.RichText | null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable(): void {
		if (EDITOR) {
			language.event.on(language.event.key.label_data_change, this._event_label_data_change, this)?.call(this);
		}
	}

	protected onDisable(): void {
		if (EDITOR) {
			language.event.off(language.event.key.label_data_change, this._event_label_data_change, this);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置数据 */
	protected _reset_data(): void {
		// 更新类型数据
		this._data = language.label_data_tab[this._type_s];
		if (EDITOR) {
			// 更新标记枚举
			this._mark_enum = mk_tool.enum.obj_to_enum(this._data);
			// 默认标记
			this.mark_s = this._mark_enum[this.mark_s] !== undefined ? this.mark_s : this._mark_enum[0];
			// 清理数据
			this._args_ss = this._args_ss || [];
		}

		// 方向适配
		this._direction_adaptation();
		// 更新内容
		this._update_content();
		// 更新编辑器
		this._update_editor();
	}

	protected _update_content(): void {
		if (this._label) {
			const mark_s = this._mark_s.slice(this._mark_s[0] === "\u200B" ? 1 : 0);

			this._label.string = language.get_label(this._type_s, mark_s, { args_ss: this._args_ss }) ?? "";
		}
	}

	protected _update_mark(): void {
		this.args_ss = [];
	}

	protected _set_type(value_: number): void {
		this._type_s = mk_language_label._type_enum[value_];
		this._reset_data();
	}

	protected _set_type_s(value_s_: string): void {
		if (EDITOR) {
			const type_s = mk_tool.string.fuzzy_match(mk_language_label._type_ss, value_s_);
			const type_n = mk_language_label._type_enum[type_s ?? ""];

			if (type_n !== undefined) {
				this._set_type(type_n);
			}
		} else {
			this._set_type(mk_language_label._type_enum[value_s_]);
		}
	}

	protected _init_data(): void {
		this._label = this.node.getComponent(cc.Label) ?? this.node.getComponent(cc.RichText);

		if (!this._label) {
			this._log.error("节点不存在 Label | RichText 组件");

			return;
		}

		// 初始化类型
		if (!this._type_s) {
			if (!EDITOR) {
				this._log.error("当前节点缺少多语言类型", this.node[" INFO "]);
				this._type_s = mk_language_label._type_ss[0];
			}
			// 设置默认类型
			else {
				(async () => {
					const scene = cc.director.getScene()!;
					/** 用户组件 */
					let user_comp: cc.Component | undefined;

					// 预制体
					if (scene.name === "New Node") {
						user_comp = cc.director.getScene()!.children[0].children[1].components.find((v) => !cc.js.getClassName(v).startsWith("cc."));
					}
					// 场景
					else {
						const canvas = cc.director.getScene()!.getComponentInChildren(cc.Canvas)!.node;

						user_comp = canvas.components.find((v) => !cc.js.getClassName(v).startsWith("cc."));
					}

					this._type_s = language_manage.label_data_tab[cc.js.getClassName(user_comp)]
						? cc.js.getClassName(user_comp)
						: mk_language_label._type_ss[0] ?? "";
				})();
			}
		}

		super._init_data();
	}

	/** 方向适配 */
	private _direction_adaptation(): void {
		if (!this.direction_adaptation_b || !this._label) {
			return;
		}

		this._label.horizontalAlign =
			mk_language_manage.data.dire === cc.Layout.HorizontalDirection.LEFT_TO_RIGHT
				? cc.HorizontalTextAlignment.LEFT
				: cc.HorizontalTextAlignment.RIGHT;
	}

	/** 初始化组件 */
	private _init_component(): void {
		// 注册类型
		mk_language_label._type_enum = mk_tool.enum.obj_to_enum(language.label_data_tab);

		if (!EDITOR) {
			return;
		}

		// 类型数组
		mk_language_label._type_ss = Object.keys(language.label_data_tab);
		// 更新编辑器
		this._update_editor();
	}

	/** 更新编辑器 */
	private _update_editor(): void {
		if (!EDITOR) {
			return;
		}

		// 更新标记枚举
		if (!this._mark_enum) {
			this._mark_enum = mk_tool.enum.obj_to_enum(this._data);
		}

		// 更新属性
		{
			if (mk_language_label._type_enum && Object.keys(mk_language_label._type_enum).length) {
				cc.CCClass.Attr.setClassAttr(mk_language_label, "type", "enumList", cc.Enum.getList(cc.Enum(mk_language_label._type_enum)));
			}

			if (this._mark_enum && Object.keys(this._mark_enum).length) {
				cc.CCClass.Attr.setClassAttr(mk_language_label, "mark_enum", "enumList", cc.Enum.getList(cc.Enum(this._mark_enum)));
			}
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_args_ss(value_ss_: string[]): void {
		if (!this._label || !this._data) {
			return;
		}

		this._args_ss = value_ss_;
		// 更新文本
		this._update_content();
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	protected _event_switch_language(): void {
		this._direction_adaptation();
		super._event_switch_language();
	}

	private _event_label_data_change(): void {
		this.unschedule(this._init_component);
		this.scheduleOnce(this._init_component);
	}
}

export default mk_language_label;
