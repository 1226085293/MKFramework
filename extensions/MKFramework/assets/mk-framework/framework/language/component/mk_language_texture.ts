import { EDITOR } from "cc/env";
import global_config from "../../../config/global_config";
import language from "../mk_language_manage";
import mk_asset from "../../resources/mk_asset";
import * as cc from "cc";
import mk_language_base from "./mk_language_base";
import mk_tool from "../../@private/tool/mk_tool";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode, requireComponent } = cc._decorator;

/**
 * 多语言图片
 * @noInheritDoc
 */
@ccclass
@requireComponent(cc.Sprite)
@executeInEditMode
class mk_language_texture extends mk_language_base {
	/* --------------- static --------------- */
	/** 类型数组 */
	private static _type_ss = Object.keys(language.texture_data_tab);
	/** 注册类型 */
	private static _type_enum: any = mk_tool.enum.obj_to_enum(language.texture_data_tab);
	/* --------------- 属性 --------------- */
	get type(): number {
		return mk_language_texture._type_enum[this._type_s];
	}

	set type(value_n_) {
		this._set_type(value_n_);
	}

	@property({ override: true })
	protected _type_s = mk_language_texture._type_ss[0] ?? "";

	/* --------------- private --------------- */
	/** sprite组件 */
	private _sprite!: cc.Sprite;
	/** 初始纹理 */
	private _initial_sprite_frame: cc.SpriteFrame | null = null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable(): void {
		if (EDITOR) {
			language.event.on(language.event.key.texture_data_change, this._event_texture_data_change, this)?.call(this);
		}
	}

	protected onDisable(): void {
		if (EDITOR) {
			language.event.off(language.event.key.texture_data_change, this._event_texture_data_change, this);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置数据 */
	protected _reset_data(): void {
		// 更新类型数据
		this._data = language.texture_data_tab[this._type_s];
		if (EDITOR) {
			// 更新标记枚举
			this._mark_enum = mk_tool.enum.obj_to_enum(this._data);
			// 默认标记
			this.mark_s = this._mark_enum[0];
		}
		// 更新内容
		this._update_content();

		// 更新编辑器
		if (EDITOR) {
			if (Object.keys(mk_language_texture._type_enum).length) {
				cc.CCClass.Attr.setClassAttr(mk_language_texture, "type", "enumList", cc.Enum.getList(cc.Enum(mk_language_texture._type_enum)));
			}

			if (Object.keys(this._mark_enum).length) {
				cc.CCClass.Attr.setClassAttr(mk_language_texture, "mark_enum", "enumList", cc.Enum.getList(cc.Enum(this._mark_enum)));
			}
		}
	}

	protected async _update_content(): Promise<void> {
		if (!this._sprite) {
			return;
		}

		const mark_s = this._mark_s.slice(this._mark_s[0] === "\u200B" ? 1 : 0);
		const path_s = language.texture_data_tab[this._type_s]?.[mark_s]?.[global_config.language.types[language.type_s]];

		if (!path_s) {
			return;
		}

		if (EDITOR) {
			const asset = await mk_asset.get(path_s + ".png", cc.ImageAsset, this);

			if (!asset?._uuid) {
				return;
			}

			// @ts-ignore
			Editor.Message.request("scene", "set-property", {
				uuid: this.node.uuid,
				path: `__comps__.${this.node.components.indexOf(this._sprite)}.spriteFrame`,
				dump: {
					type: "cc.SpriteFrame",
					value: {
						uuid: asset._uuid + "@f9941",
					},
				},
			});
		} else {
			const asset = await mk_asset.get(path_s, cc.SpriteFrame, this);

			if (!asset) {
				return;
			}

			// 释放初始纹理资源
			if (this._initial_sprite_frame && this._initial_sprite_frame._uuid !== asset._uuid) {
				this._initial_sprite_frame.decRef();
				this._initial_sprite_frame = null;
			}

			this._sprite.spriteFrame = asset;
		}
	}

	protected _update_mark(): void {
		this._update_content();
	}

	protected _set_type(value_: number): void {
		this._type_s = mk_language_texture._type_enum[value_];
		this._reset_data();
	}

	protected _set_type_s(value_s_: string): void {
		if (EDITOR) {
			const type_s = mk_tool.string.fuzzy_match(mk_language_texture._type_ss, value_s_);
			const type_n = mk_language_texture._type_enum[type_s ?? ""];

			if (type_n !== undefined) {
				this._set_type(type_n);
			}
		} else {
			this._set_type(mk_language_texture._type_enum[value_s_]);
		}
	}

	protected _init_data(): void {
		this._sprite = this.node.getComponent(cc.Sprite)!;
		if (!this._sprite) {
			cc.error("节点不存在 Sprite 组件");

			return;
		}

		this._initial_sprite_frame = this._sprite.spriteFrame;

		super._init_data();
	}

	/** 初始化组件 */
	private _init_component(): void {
		/** 注册类型 */
		mk_language_texture._type_enum = mk_tool.enum.obj_to_enum(language.texture_data_tab);
		if (!EDITOR) {
			return;
		}

		/** 类型数组 */
		mk_language_texture._type_ss = Object.keys(language.texture_data_tab);
		// 更新编辑器
		this._reset_data();
	}

	/* ------------------------------- get/set ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
	private _event_texture_data_change(): void {
		this.unschedule(this._init_component);
		this.scheduleOnce(this._init_component);
	}
}

export default mk_language_texture;
