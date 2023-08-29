import { EDITOR } from "cc/env";
import global_config from "../../@config/global_config";
import * as cc from "cc";
import mk_event_target from "../mk_event_target";
import mk_instance_base from "../mk_instance_base";
import mk_logger from "../mk_logger";
import mk_asset, { mk_asset_ } from "../resources/mk_asset";

namespace _mk_language_manage {
	/** 多语言类型类型 */
	export type type_type = string | number;

	/** 事件协议 */
	export interface event_protocol {
		/** 切换语言 */
		switch_language(): void;
		/** 文本数据变更 */
		label_data_change(): void;
		/** 纹理数据变更 */
		texture_data_change(): void;
	}
}

/**
 * 多语言管理
 * @remarks
 * - 多语言资源单位为模块，防止无用多语言资源堆积
 * - 支持多语言(文本/图片/节点)，三种方式满足任何需求
 * - 支持编辑器预览
 */
class mk_language_manage extends mk_instance_base {
	/* --------------- public --------------- */
	/** 事件 */
	event = new mk_event_target<_mk_language_manage.event_protocol>();
	/** 文本数据 */
	label_data_tab: Record<_mk_language_manage.type_type, mk_language_manage_.data_struct> = Object.create(null);
	/** 纹理数据 */
	texture_data_tab: Record<_mk_language_manage.type_type, mk_language_manage_.data_struct> = Object.create(null);

	/** 当前语言类型 */
	get type_s(): keyof typeof global_config.language.type_tab {
		return this._language_s;
	}

	set type_s(value_) {
		this._set_type_s(value_);
	}

	/** 获取语言数据 */
	get data(): global_config.language.type_data {
		return global_config.language.type_tab[this._language_s];
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log = new mk_logger("language");
	/** 当前语言类型 */
	private _language_s = global_config.language.default_type_s;

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取文本
	 * @param type_ 类型
	 * @param mark_s_ 标识
	 * @param config_ 配置
	 * @returns
	 */
	get_label(type_: _mk_language_manage.type_type, mark_s_: string, config_?: Partial<mk_language_manage_.label_config>): string {
		const config = new mk_language_manage_.label_config(config_);
		let result_s: string = this.label_data_tab[type_]?.[mark_s_]?.[global_config.language.type[config.language]];

		// 不存在配置
		if (!result_s) {
			if (mark_s_) {
				this._log.warn(`${type_}.${mark_s_}.${global_config.language.type[config.language]}下的文本未配置！`);
			}

			return mark_s_;
		}

		// 替换参数
		config.args_ss?.forEach((v_s, k_n) => {
			result_s = result_s.replace(`${global_config.language.args_head_s}${k_n}${global_config.language.args_tail_s}`, v_s);
		});

		return result_s;
	}

	/**
	 * 获取纹理
	 * @param type_ 类型
	 * @param mark_s_ 标记
	 * @param target_ 跟随释放对象
	 * @param language_ 语言
	 * @returns
	 */
	async get_texture(
		type_: _mk_language_manage.type_type,
		mark_s_: string,
		target_: mk_asset_.follow_release_object,
		language_ = this._language_s
	): Promise<cc.SpriteFrame | null> {
		const path_s: string = this.texture_data_tab[type_]?.[mark_s_]?.[global_config.language.type[language_]];

		if (!path_s) {
			this._log.error(`${type_}.${mark_s_}.${global_config.language.type[language_]}下的纹理未配置！`);

			return null;
		}

		if (EDITOR) {
			const asset = await mk_asset.get(path_s + ".png", cc.ImageAsset, target_);

			if (asset) {
				return cc.SpriteFrame.createWithImage(asset);
			}
		} else {
			const asset = await mk_asset.get(path_s, cc.SpriteFrame, target_);

			if (asset) {
				return asset;
			}
		}

		return null;
	}

	/**
	 * 添加文本数据
	 * @param type_ 类型
	 * @param data_ 数据
	 */
	add_label(type_: _mk_language_manage.type_type, data_: mk_language_manage_.data_struct): void {
		this.label_data_tab[type_] = data_;

		// 事件通知
		this.event.emit(this.event.key.label_data_change);
	}

	/**
	 * 添加纹理数据
	 * @param type_ 类型
	 * @param data_ 数据
	 */
	add_texture(type_: _mk_language_manage.type_type, data_: mk_language_manage_.data_struct): void {
		this.texture_data_tab[type_] = data_;

		// 事件通知
		this.event.emit(this.event.key.texture_data_change);
	}

	/* ------------------------------- get/set ------------------------------- */
	private _set_type_s(value_: keyof typeof global_config.language.type): void {
		if (this._language_s === value_) {
			return;
		}

		this._language_s = value_;

		// 事件通知
		this.event.emit(this.event.key.switch_language);
	}
}

export namespace mk_language_manage_ {
	/** 多语言数据结构 */
	export type data_struct<T extends _mk_language_manage.type_type = any> = Record<
		T,
		{ [k in keyof typeof global_config.language.type_tab]: string }
	>;

	/** 获取文本配置 */
	export class label_config {
		constructor(init_?: Partial<label_config>) {
			Object.assign(this, init_);
		}

		/** 语言类型 */
		language = mk_language_manage.instance().type_s;
		/** 参数 */
		args_ss?: string[];
	}

	/** 多语言数据 */
	export abstract class base_data<CT extends data_struct> {
		constructor(init_: CT) {
			this.data = init_;
		}

		/** 多语言键 */
		key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});

		/** 多语言数据 */
		data: data_struct<Exclude<keyof CT, symbol>>;
	}

	/** 多语言纹理数据 */
	export class texture_data<CT extends data_struct> extends base_data<CT> {
		constructor(type_: string, init_: CT) {
			super(init_);
			mk_language_manage.instance().add_texture(type_, init_);
		}
	}

	/** 多语言文本数据 */
	export class label_data<CT extends data_struct> extends base_data<CT> {
		constructor(type_: string, init_: CT) {
			super(init_);
			mk_language_manage.instance().add_label(type_, init_);
		}
	}
}

export default mk_language_manage.instance();
