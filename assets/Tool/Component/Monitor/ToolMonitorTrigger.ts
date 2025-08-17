import { _decorator } from "cc";
import { EDITOR } from "cc/env";
import * as cc from "cc";
import ToolMonitorDataMethod from "./DataMethod/ToolMonitorDataMethod";
import mk from "mk";
// eslint-disable-next-line unused-imports/no-unused-imports
import { ToolMonitorTriggerEvent } from "./ToolMonitorTriggerEvent";
import ToolEnum from "../../ToolEnum";
import ToolString from "../../ToolString";
const { ccclass, property } = _decorator;

export namespace _ToolMonitorTrigger {
	@ccclass("MonitorTrigger/Trigger")
	export class Trigger {
		/* --------------- static --------------- */
		/** 事件名表 */
		static eventNameTab: Record<string, string[]>;
		/** 数据类型枚举 */
		static dataTypeEnum: any;
		/** 初始化状态 */
		private static _isInit = false;
		/** 数据类型列表 */
		private static _dataTypeStrList: string[];
		/* --------------- 属性 --------------- */
		/** 数据类型 */
		@property({ displayName: "数据类型", type: cc.Enum({}) })
		get typeNum(): number {
			return Trigger.dataTypeEnum?.[this.typeStr] ?? -1;
		}

		set typeNum(valueNum_) {
			this._setTypeNum(valueNum_);
		}

		/** 事件名 */
		@property({ displayName: "事件名", type: cc.Enum({}) })
		get eventNum(): number {
			return Trigger.eventNameTab[this.typeStr]?.indexOf(this.eventStr) ?? -1;
		}

		set eventNum(valueNum_) {
			this._setEventNum(valueNum_);
		}

		/** 事件 */
		@property({ displayName: "事件参数", type: [ToolMonitorTriggerEvent], readonly: true })
		eventParamList: any[] = [];

		/** 事件名 */
		@property({ visible: false })
		eventStr = "";

		/** 数据类型 */
		@property({ visible: false })
		typeStr = "";

		/* ------------------------------- 功能 ------------------------------- */
		/** 初始化编辑器 */
		initEditor(): void {
			if (Trigger._isInit) {
				this._updateTypeInspector();
				this._updateEventInspector();

				return;
			}

			Trigger._isInit = true;

			Trigger._dataTypeStrList = Object.keys(ToolMonitorDataMethod).filter((vStr) => ToolMonitorDataMethod[vStr]);
			Trigger.dataTypeEnum = ToolEnum.arrayToEnum(Trigger._dataTypeStrList);
			Trigger.eventNameTab = Object.create(null);

			// 初始化事件名表
			Trigger._dataTypeStrList.forEach((vStr) => {
				Trigger.eventNameTab[vStr] = Object.keys(ToolMonitorDataMethod[vStr]).filter((v2Str) => v2Str !== "checkType");
			});

			// 初始化视图
			this._updateTypeInspector();
			this._updateEventInspector();
		}

		/** 更新类型检查器 */
		private _updateTypeInspector(): void {
			if (EDITOR) {
				if (!this.typeStr) {
					this.typeStr = Trigger.dataTypeEnum[0];
				}

				cc.CCClass.Attr.setClassAttr(Trigger, "typeNum", "enumList", cc.Enum.getList(cc.Enum(Trigger.dataTypeEnum)));
			}
		}

		/** 更新事件检查器 */
		private _updateEventInspector(): boolean {
			if (EDITOR) {
				if (!this.typeStr) {
					return false;
				}

				// 更新事件名
				if (Trigger.eventNameTab[this.typeStr]?.length) {
					cc.CCClass.Attr.setClassAttr(Trigger, "eventNum", "enumList", ToolEnum.arrayToCCEnum(Trigger.eventNameTab[this.typeStr]));

					return true;
				}
			}

			return false;
		}

		/* ------------------------------- get/set ------------------------------- */
		private _setTypeNum(valueNum_: number): void {
			if (isNaN(valueNum_)) {
				return;
			}

			this.typeStr = Trigger.dataTypeEnum[valueNum_];
			// 重置事件名
			if (this._updateEventInspector()) {
				this.eventNum = 0;
			}
		}

		private _setEventNum(valueNum_: number): void {
			if (!this.typeStr) {
				return;
			}

			this.eventStr = Trigger.eventNameTab[this.typeStr][valueNum_];

			// 更新事件参数
			if (EDITOR) {
				// 延迟一帧防止编辑器展示错误
				setTimeout(() => {
					/** 参数类型 */
					const ccclass = ToolMonitorDataMethod[this.typeStr][this.eventStr]?.CCClassParams;

					// 更新参数
					this.eventParamList.splice(0, this.eventParamList.length);
					if (ccclass?.["__props__"].length) {
						this.eventParamList.push(new ccclass());
					}
				}, 0);
			}
		}
	}
}

@ccclass("ToolMonitorTrigger")
export class ToolMonitorTrigger extends mk.LifeCycle {
	/* --------------- 属性 --------------- */
	/** 数据目标 */
	@property({ displayName: "数据目标", type: cc.Node })
	get dataTarget(): any {
		return this._dataTarget;
	}

	set dataTarget(value_) {
		this._setDataTarget(value_);
	}

	/** 数据键 */
	@property({ displayName: "数据键" })
	get dataKeyStr(): string {
		return this._dataKeyStr;
	}

	set dataKeyStr(valueStr_) {
		this._setDataKeyStr(valueStr_);
	}

	/** 数据键列表 */
	@property({ displayName: "数据键列表", type: cc.Enum({}) })
	get dataKeyEnum(): number {
		return -1;
	}

	set dataKeyEnum(value_) {
		if (value_ === -1) {
			return;
		}

		this.dataKeyStr += (this._dataKeyStr.length ? "." : "") + this._dataKeyEnum[value_];
	}

	/** 数据类型检查 */
	@property({ displayName: "数据类型检查", readonly: true })
	get isTypeCheck(): boolean {
		return this._getIsTypeCheck();
	}

	/** 触发事件 */
	@property({ displayName: "触发事件", type: _ToolMonitorTrigger.Trigger })
	event = new _ToolMonitorTrigger.Trigger();

	/* --------------- protected --------------- */
	protected _isUseLayer = false;
	/* --------------- private --------------- */
	/** 数据键 */
	@property
	private _dataKeyStr = "";

	/** 数据目标 */
	@property(cc.Node)
	private _dataTarget: cc.Node = null!;

	/** 调用时间表 */
	private _callTimeTab: Record<string, number> = Object.create(null);
	/** 用户组件 */
	private _userComp?: cc.Component;
	/** 上个数据键 */
	private _preDataKeyStr = "";
	/** 填充字符 */
	private _fillerCharacterStrList: string[] = [];
	/** 数据键列表枚举 */
	private _dataKeyEnum: any;
	/** 父数据 */
	private _dataParent: any;
	/** 监听数据 */
	private _monitorData: {
		data: any;
		keyStr: string;
	} | null = null;

	/* ------------------------------- 生命周期 ------------------------------- */
	async open(): Promise<void | Promise<void>> {
		await this.monitor(this._dataTarget, this._dataKeyStr);
	}

	async close(): Promise<void> {
		if (this._monitorData) {
			await mk.monitor.off(this._monitorData.data, this._monitorData.keyStr, this._monitorData.data);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 绑定数据
	 * @param target_ 数据对象
	 * @param dataKeyStr_ 数据键
	 * @param event_ 触发事件
	 * @returns
	 */
	async monitor(target_: cc.Node, dataKeyStr_: string): Promise<void> {
		/** 触发事件 */
		const event = ToolMonitorDataMethod[this.event.typeStr]?.[this.event.eventStr];

		if (!event) {
			console.error("触发事件错误", this.event.typeStr, this.event.eventStr);

			return;
		}

		// 清理事件
		if (this._monitorData) {
			await mk.monitor.off(this._monitorData.data, this._monitorData.keyStr, this._monitorData.data);
			if (!this.valid) {
				return;
			}

			this._monitorData = null;
		}

		// 更新组件数据
		{
			this._dataTarget = target_;
			this._dataKeyStr = dataKeyStr_;
		}

		/** 自定义组件 */
		const data = this._updateUserComp();
		/** 数据键 */
		let dataKeyStr: string;

		if (!data) {
			console.error("不存在用户组件");

			return;
		}

		// 获取数据和数据键
		{
			/** 末尾点下标 */
			const lastPointNum = this._dataKeyStr.lastIndexOf(".");
			/** 键头 */
			const keyHeadStr = lastPointNum === -1 ? this._dataKeyStr : this._dataKeyStr.slice(0, lastPointNum);
			/** 数据路径 */
			const dataPathStrList = lastPointNum === -1 ? [] : keyHeadStr.split(".");

			dataKeyStr = lastPointNum === -1 ? this._dataKeyStr : this._dataKeyStr.slice(lastPointNum + 1);
			this._dataParent = this._getDataFromPath(data, dataPathStrList)!;
			if (!this._dataParent) {
				console.error("数据获取错误", keyHeadStr);

				return;
			}
		}

		if (!dataKeyStr) {
			return;
		}

		// 监听数据
		await event.on(this._dataParent, dataKeyStr, this.node, this.event.eventParamList[0]);

		if (!this.valid) {
			return;
		}

		// 更新监听数据
		this._monitorData = {
			data: this._dataParent,
			keyStr: dataKeyStr,
		};
	}

	/** 初始化编辑器 */
	protected _initEditor(): void {
		super._initEditor();
		this._updateUserComp();
		this._updateDataKeyEnum();
		this.event.initEditor();
	}

	/** 更新用户组件 */
	private _updateUserComp(): cc.Component | undefined {
		this._userComp = !this._dataTarget ? undefined : this._dataTarget.components.find((v) => !cc.js.getClassName(v).startsWith("cc."));

		return this._userComp;
	}

	/** 根据路径获取数据 */
	private _getDataFromPath(data_: any, pathStrList_: string[]): any {
		for (let kNum = 0, lenNum = pathStrList_.length; kNum < lenNum; ++kNum) {
			data_ = data_[pathStrList_[kNum]];
			if (typeof data_ !== "object" || data_ === null) {
				break;
			}
		}

		return data_;
	}

	/** 更新数据键枚举 */
	private _updateDataKeyEnum(): void {
		if (!this._userComp) {
			return;
		}

		/** 数据路径 */
		const dataPathStr = !this._dataKeyStr ? [] : this._dataKeyStr.split(".");
		/** 数据目标 */
		const dataTarget = this._getDataFromPath(this._userComp, dataPathStr);

		// 更新数据键枚举
		this._dataKeyEnum = ToolEnum.objToEnum(dataTarget || {});

		// 更新编辑器数据键枚举
		if (EDITOR) {
			const ccEnum = cc.Enum.getList<Record<string, number>>(cc.Enum(this._dataKeyEnum));

			// 添加类型
			ccEnum.forEach((v) => {
				v.name += " - " + typeof dataTarget[v.name];
			});

			cc.CCClass.Attr.setClassAttr(ToolMonitorTrigger, "dataKeyEnum", "enumList", ccEnum);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _getIsTypeCheck(): boolean {
		if (!_ToolMonitorTrigger.Trigger.dataTypeEnum || !this._userComp || !this.event) {
			return false;
		}

		/** 数据类型 */
		const dataTypeStr = _ToolMonitorTrigger.Trigger.dataTypeEnum[this.event.typeNum];
		/** 检查类型函数 */
		const checkTypeFunc: (data: any) => boolean = ToolMonitorDataMethod[dataTypeStr]?.checkType;
		/** 实际数据 */
		const data = this._getDataFromPath(this._userComp, this._dataKeyStr.split("."));

		return !checkTypeFunc || checkTypeFunc(data);
	}

	private _setDataKeyStr(valueStr_: string): void {
		this._dataKeyStr = valueStr_;
		if (!this._userComp) {
			return;
		}

		/** 当前数据键头 */
		let keyHeadStr: string;

		// 初始化数据键头 | 尾
		{
			const lastPointNum = this._dataKeyStr.lastIndexOf(".");

			keyHeadStr = this._dataKeyStr.slice(0, lastPointNum !== -1 ? lastPointNum : this._dataKeyStr.length);
		}

		// 更新提示文本
		if (keyHeadStr !== this._preDataKeyStr) {
			this._preDataKeyStr = keyHeadStr;
			/** 数据路径 */
			const dataPathStrList = keyHeadStr.split(".");
			/** 数据目标 */
			let dataTarget = this._userComp;

			// 通过路径获取数据
			{
				let temp: any;

				for (let kNum = 0, lenNum = dataPathStrList.length; kNum < lenNum; ++kNum) {
					temp = dataTarget[dataPathStrList[kNum]];
					if (typeof temp !== "object" || temp === null) {
						this._preDataKeyStr = dataPathStrList.slice(0, kNum).join(".");
						break;
					}

					dataTarget = temp;
				}
			}

			// 更新文本提示
			this._fillerCharacterStrList = Object.keys(dataTarget).map((vStr) => (this._preDataKeyStr ? `${this._preDataKeyStr}.` : "") + vStr);
			// 避免一级键自动补全二级键
			if (this._userComp[this._preDataKeyStr] !== undefined) {
				this._fillerCharacterStrList.push(this._preDataKeyStr);
			}
		}

		// 更新文本
		this._dataKeyStr = ToolString.fuzzyMatch(this._fillerCharacterStrList, this._dataKeyStr) ?? this._preDataKeyStr;

		// 更新文本提示
		this._updateDataKeyEnum();
	}

	private _setDataTarget(value_: cc.Node): void {
		this._dataTarget = value_;
		this._updateUserComp();
		this.dataKeyStr = "";
	}
}
