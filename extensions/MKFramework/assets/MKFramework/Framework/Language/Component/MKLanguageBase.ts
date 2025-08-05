import language, { MKLanguageManage_ } from "../MKLanguageManage";
import { EDITOR } from "cc/env";
import MKTool from "../../@Private/Tool/MKTool";
import MKLifeCycle from "../../Module/MKLifeCycle";
// eslint-disable-next-line unused-imports/no-unused-imports
import { _decorator, Enum } from "cc";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * 多语言组件基类
 * @noInheritDoc
 */
@ccclass
@executeInEditMode
abstract class MKLanguageBase extends MKLifeCycle {
	/* --------------- 属性 --------------- */
	/** 模糊匹配类型 */
	@property({ displayName: "模糊匹配", serializable: false, group: { name: "类型", id: "0" } })
	isFuzzyMatchType = false;

	/** 类型 */
	@property({
		displayName: "键",
		group: { name: "类型", id: "0" },
		visible: function (this: MKLanguageBase) {
			return this.isFuzzyMatchType;
		},
	})
	get typeStr(): string {
		return this._typeStr;
	}

	set typeStr(valueStr_) {
		this._setTypeStr(valueStr_);
	}

	/** 类型 */
	@property({
		displayName: "键",
		type: Enum({ 未初始化: 0 }),
		group: { name: "类型", id: "0" },
		visible: function (this: MKLanguageBase) {
			return !this.isFuzzyMatchType;
		},
	})
	get type(): number {
		return 0;
	}

	set type(value_) {
		this._setType(value_);
	}

	/** 模糊匹配语言标识 */
	@property({ displayName: "模糊匹配", serializable: false, group: { name: "语言标识", id: "1" } })
	isFuzzyMatchMark = false;

	/** 语言标识 */
	@property({
		displayName: "键",
		group: { name: "语言标识", id: "1" },
		visible: function (this: MKLanguageBase) {
			return this.isFuzzyMatchMark;
		},
	})
	get markStr(): string {
		return this._markStr;
	}

	set markStr(valueStr_) {
		this._setMarkStr(valueStr_);
	}

	/** 语言标识枚举 */
	@property({
		displayName: "键",
		type: Enum({}),
		group: { name: "语言标识", id: "1" },
		visible: function (this: MKLanguageBase) {
			return !this.isFuzzyMatchMark;
		},
	})
	get markEnum(): number {
		return this._markEnum?.[this._markStr] ?? 0;
	}

	set markEnum(value_) {
		this._setMark(this._markEnum?.[value_]);
	}

	/* --------------- protected --------------- */
	/** 类型 */
	@property
	protected _typeStr = "";

	/** 语言标识 */
	@property
	protected _markStr = "";

	protected _isUseLayer = false;
	/** 当前类型数据 */
	protected _data?: MKLanguageManage_.TypeDataStruct;
	/** 标记枚举数据 */
	protected _markEnum?: any;
	/* ------------------------------- 抽象函数 ------------------------------- */
	/** 更新内容 */
	protected abstract _updateContent(): void;
	/** 更新标记 */
	protected abstract _updateMark(): void;
	/** 设置类型 */
	protected abstract _setType(valueNum_: number): void;
	/** 设置类型字符串 */
	protected abstract _setTypeStr(valueStr_: string): void;
	/** 重置数据 */
	protected abstract _resetData(): void;
	/* ------------------------------- 生命周期 ------------------------------- */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	protected create(): void | Promise<void> {
		// 初始化数据
		this._initData();
	}

	protected open(): void | Promise<void> {
		this._initEvent(true);
	}

	close(): void | Promise<void> {
		this._initEvent(false);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化数据 */
	protected _initData(): void {
		this._resetData();
	}

	/** 初始化事件 */
	protected _initEvent(isInit_: boolean): void {
		if (isInit_) {
			language.event.on(language.event.key.switchLanguage, this._onSwitchLanguage, this);
		} else {
			language.event.off(language.event.key.switchLanguage, this._onSwitchLanguage, this);
		}
	}

	/** 设置标识 */
	protected _setMark(valueStr_: string): void {
		if (!this._data) {
			return;
		}

		if (this._markStr === valueStr_) {
			return;
		}

		// 更新标记
		this._markStr = valueStr_;

		this._updateMark();

		// 刷新编辑器
		if (!this.isFuzzyMatchMark) {
			this.isFuzzyMatchMark = !this.isFuzzyMatchMark;
			this.isFuzzyMatchMark = !this.isFuzzyMatchMark;
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	protected _setMarkStr(valueStr_: string): void {
		if (EDITOR) {
			const typeStr = MKTool.string.fuzzyMatch(Object.keys(this._data ?? {}), valueStr_);

			if (typeStr) {
				this._setMark(typeStr);
			}
		} else {
			this._setMark(valueStr_);
		}
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	protected _onSwitchLanguage(): void {
		this._updateContent();
	}
}

export default MKLanguageBase;
