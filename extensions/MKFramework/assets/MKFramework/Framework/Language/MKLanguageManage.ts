import { EDITOR } from "cc/env";
import GlobalConfig from "../../Config/GlobalConfig";
import * as cc from "cc";
import MKEventTarget from "../MKEventTarget";
import MKInstanceBase from "../MKInstanceBase";
import MKLogger from "../MKLogger";
import mkAsset, { MKAsset_ } from "../Resources/MKAsset";

namespace _MKLanguageManage {
	/** 多语言类型类型 */
	export type TypeType = string | number;

	/** 事件协议 */
	export interface EventProtocol {
		/** 切换语言 */
		switchLanguage(): void;
		/** 文本数据变更 */
		labelDataChange(): void;
		/** 纹理数据变更 */
		textureDataChange(): void;
	}
}

/**
 * 多语言管理器
 * @noInheritDoc
 * @remarks
 *
 * - 多语言资源单位为模块，防止无用多语言资源堆积
 *
 * - 支持多语言(文本/图片/节点)，三种方式满足任何需求
 *
 * - 支持编辑器预览
 */
export class MKLanguageManage extends MKInstanceBase {
	/* --------------- public --------------- */
	/** 事件 */
	event = new MKEventTarget<_MKLanguageManage.EventProtocol>();
	/** 文本数据 */
	labelDataTab: Record<_MKLanguageManage.TypeType, MKLanguageManage_.TypeDataStruct> = Object.create(null);
	/** 纹理数据 */
	textureDataTab: Record<_MKLanguageManage.TypeType, MKLanguageManage_.TypeDataStruct> = Object.create(null);

	/** 当前语言类型 */
	get typeStr(): keyof typeof GlobalConfig.Language.typeTab {
		return this._languageStr;
	}

	set typeStr(value_) {
		this._setTypeStr(value_);
	}

	/** 获取语言数据 */
	get data(): GlobalConfig.Language.TypeData {
		return GlobalConfig.Language.typeTab[this._languageStr];
	}

	/* --------------- private --------------- */
	/** 日志 */
	private _log = new MKLogger("MKLanguage");
	/** 当前语言类型 */
	private _languageStr = GlobalConfig.Language.defaultTypeStr;

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取文本
	 * @param type_ 类型
	 * @param markStr_ 标识
	 * @param config_ 配置
	 * @returns
	 */
	getLabel(type_: _MKLanguageManage.TypeType, markStr_: string, config_?: Partial<MKLanguageManage_.LabelConfig>): string {
		const config = new MKLanguageManage_.LabelConfig(config_);
		let resultStr = this.labelDataTab[type_]?.[markStr_]?.[GlobalConfig.Language.types[config.language]];

		// 不存在配置
		if (!resultStr) {
			if (markStr_) {
				this._log.warn(`${type_}.${markStr_}.${GlobalConfig.Language.types[config.language]}下的文本未配置！`);
			}

			return markStr_;
		}

		// 替换参数
		config.argsStrList?.forEach((vStr, kNum) => {
			resultStr = resultStr.replace(`${GlobalConfig.Language.argsHeadStr}${kNum}${GlobalConfig.Language.argsTailStr}`, vStr);
		});

		return resultStr;
	}

	/**
	 * 获取纹理
	 * @param type_ 类型
	 * @param markStr_ 标记
	 * @param target_ 跟随释放对象
	 * @param language_ 语言
	 * @returns
	 */
	async getTexture(
		type_: _MKLanguageManage.TypeType,
		markStr_: string,
		target_: MKAsset_.TypeFollowReleaseObject,
		language_: keyof typeof GlobalConfig.Language.typeTab = this._languageStr
	): Promise<cc.SpriteFrame | null> {
		const pathStr = this.textureDataTab[type_]?.[markStr_]?.[GlobalConfig.Language.types[language_]];

		if (!pathStr) {
			this._log.error(`${type_}.${markStr_}.${GlobalConfig.Language.types[language_]}下的纹理未配置！`);

			return null;
		}

		if (EDITOR) {
			const asset = await mkAsset.get(pathStr + ".png", cc.ImageAsset, target_);

			if (asset) {
				return cc.SpriteFrame.createWithImage(asset);
			}
		} else {
			const asset = await mkAsset.get(pathStr, cc.SpriteFrame, target_);

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
	addLabel(type_: _MKLanguageManage.TypeType, data_: MKLanguageManage_.TypeDataStruct): void {
		this.labelDataTab[type_] = data_;

		// 事件通知
		this.event.emit(this.event.key.labelDataChange);
	}

	/**
	 * 添加纹理数据
	 * @param type_ 类型
	 * @param data_ 数据
	 */
	addTexture(type_: _MKLanguageManage.TypeType, data_: MKLanguageManage_.TypeDataStruct): void {
		this.textureDataTab[type_] = data_;

		// 事件通知
		this.event.emit(this.event.key.textureDataChange);
	}

	/* ------------------------------- get/set ------------------------------- */
	private _setTypeStr(value_: keyof typeof GlobalConfig.Language.types): void {
		if (this._languageStr === value_) {
			return;
		}

		this._languageStr = value_;

		// 事件通知
		this.event.emit(this.event.key.switchLanguage);
	}
}

export namespace MKLanguageManage_ {
	/** 多语言数据结构 */
	export type TypeDataStruct<T extends _MKLanguageManage.TypeType = any> = Record<T, { [k in keyof typeof GlobalConfig.Language.typeTab]: string }>;

	/** 获取文本配置 */
	export class LabelConfig {
		constructor(init_?: Partial<LabelConfig>) {
			Object.assign(this, init_);
		}

		/** 语言类型 */
		language: keyof typeof GlobalConfig.Language.typeTab = MKLanguageManage.instance().typeStr;
		/** 参数 */
		argsStrList?: string[];
	}

	/** 多语言数据 */
	export abstract class BaseData<CT extends TypeDataStruct> {
		constructor(init_: CT) {
			this.data = init_;
		}

		/** 多语言键 */
		key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
			get: (target, key) => key,
		});

		/** 多语言数据 */
		data: TypeDataStruct<Exclude<keyof CT, symbol>>;
	}

	/** 多语言纹理数据 */
	export class TextureData<CT extends TypeDataStruct> extends BaseData<CT> {
		constructor(type_: string, init_: CT) {
			super(init_);
			MKLanguageManage.instance().addTexture(type_, init_);
		}
	}

	/** 多语言文本数据 */
	export class LabelData<CT extends TypeDataStruct> extends BaseData<CT> {
		constructor(type_: string, init_: CT) {
			super(init_);
			MKLanguageManage.instance().addLabel(type_, init_);
		}
	}
}

export default MKLanguageManage.instance();
