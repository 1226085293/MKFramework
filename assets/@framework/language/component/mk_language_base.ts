import * as cc from "cc";
import language, { mk_language_manage_ } from "../mk_language_manage";
import { EDITOR } from "cc/env";
import mk_logger from "../../mk_logger";
import mk_tool from "../../@private/tool/mk_tool";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

@ccclass
@executeInEditMode
abstract class mk_language_base extends cc.Component {
	/* --------------- 属性 --------------- */
	/** 模糊匹配类型 */
	@property({ displayName: "模糊匹配", serializable: false, group: { name: "类型", id: "0" } })
	fuzzy_match_type_b = false;

	/** 类型 */
	@property({
		displayName: "键",
		group: { name: "类型", id: "0" },
		visible: function (this: mk_language_base) {
			return this.fuzzy_match_type_b;
		},
	})
	get type_s(): string {
		return this._type_s;
	}

	set type_s(value_s_) {
		this._set_type_s(value_s_);
	}

	/** 类型 */
	@property({
		displayName: "键",
		type: cc.Enum({ 未初始化: 0 }),
		group: { name: "类型", id: "0" },
		visible: function (this: mk_language_base) {
			return !this.fuzzy_match_type_b;
		},
	})
	get type(): number {
		return 0;
	}

	set type(value_) {
		this._set_type(value_);
	}

	/** 模糊匹配语言标识 */
	@property({ displayName: "模糊匹配", serializable: false, group: { name: "语言标识", id: "1" } })
	fuzzy_match_mark_b = false;

	/** 语言标识 */
	@property({
		displayName: "键",
		group: { name: "语言标识", id: "1" },
		visible: function (this: mk_language_base) {
			return this.fuzzy_match_mark_b;
		},
	})
	get mark_s(): string {
		return this._mark_s;
	}

	set mark_s(value_s_) {
		this._set_mark_s(value_s_);
	}

	/** 语言标识枚举 */
	@property({
		displayName: "键",
		type: cc.Enum({}),
		group: { name: "语言标识", id: "1" },
		visible: function (this: mk_language_base) {
			return !this.fuzzy_match_mark_b;
		},
	})
	get mark_enum(): number {
		return this._mark_enum?.[this._mark_s] ?? 0;
	}

	set mark_enum(value_) {
		this._set_mark(this._mark_enum?.[value_]);
	}

	/* --------------- protected --------------- */
	/** 类型 */
	@property
	protected _type_s = "";

	/** 语言标识 */
	@property
	protected _mark_s = "";

	/** 当前类型数据 */
	protected _data?: mk_language_manage_.data_struct;
	/** 标记枚举数据 */
	protected _mark_enum?: any;
	/** 日志 */
	protected _log = new mk_logger(cc.js.getClassName(this));
	/* ------------------------------- 抽象函数 ------------------------------- */
	/** 更新内容 */
	protected abstract _update_content(): void;
	/** 更新标记 */
	protected abstract _update_mark(): void;
	/** 设置类型 */
	protected abstract _set_type(value_n_: number): void;
	/** 设置类型字符串（模糊匹配） */
	protected abstract _set_type_s(value_s_: string): void;
	/** 重置数据 */
	protected abstract _reset_data(): void;
	/* ------------------------------- 生命周期 ------------------------------- */
	onLoad() {
		// 初始化数据
		this._init_data();
	}

	onEnable() {
		this._init_event(true);
	}

	onDisable() {
		this._init_event(false);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	protected _init_data(): void {
		this._reset_data();
	}

	/** 初始化事件 */
	protected _init_event(state_b_: boolean): void {
		if (state_b_) {
			language.event.on(language.event.key.switch_language, this._event_switch_language, this);
		} else {
			language.event.off(language.event.key.switch_language, this._event_switch_language, this);
		}
	}

	/** 设置标识 */
	protected _set_mark(value_s_: string): void {
		if (!this._data) {
			return;
		}
		if (this._mark_s === value_s_) {
			return;
		}
		// if (!this._data[value_s_]?.[global_config.language.type[language.type]]) {
		// 	return;
		// }

		// 更新标记
		this._mark_s = value_s_;

		this._update_mark();

		// 刷新编辑器
		if (!this.fuzzy_match_mark_b) {
			this.fuzzy_match_mark_b = !this.fuzzy_match_mark_b;
			this.fuzzy_match_mark_b = !this.fuzzy_match_mark_b;
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	protected _set_mark_s(value_s_: string): void {
		if (EDITOR) {
			const type_s = mk_tool.string.fuzzy_match(Object.keys(this._data ?? {}), value_s_);

			if (type_s) {
				this._set_mark(type_s);
			}
		} else {
			this._set_mark(value_s_);
		}
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	protected _event_switch_language(): void {
		this._update_content();
	}
}

export default mk_language_base;
