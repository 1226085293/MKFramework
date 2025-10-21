import mkLanguageManage from "../MKLanguageManage";
import MKLanguageBase from "./MKLanguageBase";
import { EDITOR } from "cc/env";
// eslint-disable-next-line unused-imports/no-unused-imports
import { _decorator, CCString, Label, RichText, director, Component, js, Canvas, Layout, HorizontalTextAlignment, CCClass, Enum } from "cc";
import mkToolEnum from "../../@Private/Tool/MKToolEnum";
import mkToolString from "../../@Private/Tool/MKToolString";

const { ccclass, property, menu, executeInEditMode } = _decorator;

/**
 * 多语言文本
 * @noInheritDoc
 */
@ccclass
@executeInEditMode
class MKLanguageLabel extends MKLanguageBase {
	/* --------------- static --------------- */
	/** 类型数组 */
	private static _typeStrList = Object.keys(mkLanguageManage.labelDataTab);
	/** 注册类型 */
	private static _typeEnum: any = mkToolEnum.objToEnum(mkLanguageManage.labelDataTab);
	/* --------------- 属性 --------------- */
	/** label 适配 */
	@property({
		displayName: "水平对齐适配",
		tooltip: "根据语言配置设置 Label 的水平对齐方式 Horizontal Align",
	})
	isDirectionAdaptation = false;

	get type(): number {
		return MKLanguageLabel._typeEnum[this._typeStr];
	}

	set type(value_) {
		this._setType(value_);
	}

	/** 参数 */
	@property({
		displayName: "参数",
		type: [CCString],
	})
	get argsStrList(): string[] {
		return this._argsStrList;
	}

	set argsStrList(valueStrList_: string[]) {
		this._setArgsStrList(valueStrList_);
	}

	/* --------------- protected --------------- */
	@property({ override: true })
	protected _typeStr = "";

	/* --------------- private --------------- */
	@property([CCString])
	private _argsStrList: string[] = [];

	/** label组件 */
	private _label!: Label | RichText | null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable(): void {
		super.onEnable();
		if (EDITOR) {
			mkLanguageManage.event.on(mkLanguageManage.event.key.labelDataChange, this._onLabelDataChange, this)?.call(this);
		}
	}

	protected onDisable(): void {
		super.onDisable();
		if (EDITOR) {
			mkLanguageManage.event.targetOff(this);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置数据 */
	protected _resetData(): void {
		// 更新类型数据
		this._data = mkLanguageManage.labelDataTab[this._typeStr];
		if (EDITOR) {
			// 更新标记枚举
			this._markEnum = mkToolEnum.objToEnum(this._data);
			// 默认标记
			this.markStr = this._markEnum[this.markStr] !== undefined ? this.markStr : this._markEnum[0];
			// 清理数据
			this._argsStrList = this._argsStrList || [];
		}

		// 方向适配
		this._directionAdaptation();
		// 更新内容
		this._updateContent();
		// 更新编辑器
		this._updateEditor();
	}

	protected _updateContent(): void {
		if (this._label) {
			const markStr = this._markStr.slice(this._markStr[0] === "\u200B" ? 1 : 0);

			this._label.string = mkLanguageManage.getLabel(this._typeStr, markStr, { argsStrList: this._argsStrList }) ?? "";
		}
	}

	protected _updateMark(): void {
		this.argsStrList = [];
	}

	protected _setType(value_: number): void {
		this._typeStr = MKLanguageLabel._typeEnum[value_];
		this._resetData();
	}

	protected _setTypeStr(valueStr_: string): void {
		if (EDITOR) {
			const typeStr = mkToolString.fuzzyMatch(MKLanguageLabel._typeStrList, valueStr_);
			const typeNum = MKLanguageLabel._typeEnum[typeStr ?? ""];

			if (typeNum !== undefined) {
				this._setType(typeNum);
			}
		} else {
			this._setType(MKLanguageLabel._typeEnum[valueStr_]);
		}
	}

	protected _initData(): void {
		this._label = this.node.getComponent(Label) ?? this.node.getComponent(RichText);

		if (!this._label) {
			this._log.error("节点不存在 Label | RichText 组件");

			return;
		}

		// 初始化类型
		if (!this._typeStr) {
			if (!(EDITOR && !window["cc"].GAME_VIEW)) {
				this._log.error("当前节点缺少多语言类型", this.node[" INFO "]);
				this._typeStr = MKLanguageLabel._typeStrList[0];
			}
			// 设置默认类型
			else {
				(async () => {
					const scene = director.getScene()!;
					/** 用户组件 */
					let userComp: Component | undefined;

					// 预制体
					if (scene.name === "New Node") {
						userComp = director.getScene()!.children[0].children[1].components.find((v) => !js.getClassName(v).startsWith(""));
					}
					// 场景
					else {
						const canvas = director.getScene()!.getComponentInChildren(Canvas)!.node;

						userComp = canvas.components.find((v) => !js.getClassName(v).startsWith(""));
					}

					this._typeStr = mkLanguageManage.labelDataTab[js.getClassName(userComp)]
						? js.getClassName(userComp)
						: MKLanguageLabel._typeStrList[0] ?? "";
				})();
			}
		}

		super._initData();
	}

	/** 方向适配 */
	private _directionAdaptation(): void {
		if (!this.isDirectionAdaptation || !this._label) {
			return;
		}

		this._label.horizontalAlign =
			mkLanguageManage.data.dire === Layout.HorizontalDirection.LEFT_TO_RIGHT ? HorizontalTextAlignment.LEFT : HorizontalTextAlignment.RIGHT;
	}

	/** 初始化组件 */
	private _initComponent(): void {
		// 注册类型
		MKLanguageLabel._typeEnum = mkToolEnum.objToEnum(mkLanguageManage.labelDataTab);

		if (!EDITOR) {
			return;
		}

		// 类型数组
		MKLanguageLabel._typeStrList = Object.keys(mkLanguageManage.labelDataTab);
		// 更新编辑器
		this._updateEditor();
	}

	/** 更新编辑器 */
	private _updateEditor(): void {
		if (!EDITOR) {
			return;
		}

		// 更新标记枚举
		if (!this._markEnum) {
			this._markEnum = mkToolEnum.objToEnum(this._data);
		}

		// 更新属性
		{
			if (MKLanguageLabel._typeEnum && Object.keys(MKLanguageLabel._typeEnum).length) {
				CCClass.Attr.setClassAttr(MKLanguageLabel, "type", "enumList", Enum.getList(Enum(MKLanguageLabel._typeEnum)));
			}

			if (this._markEnum && Object.keys(this._markEnum).length) {
				CCClass.Attr.setClassAttr(MKLanguageLabel, "markEnum", "enumList", Enum.getList(Enum(this._markEnum)));
			}
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _setArgsStrList(valueStrList_: string[]): void {
		if (!this._label || !this._data) {
			return;
		}

		this._argsStrList = valueStrList_;
		// 更新文本
		this._updateContent();
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	protected _onSwitchLanguage(): void {
		this._directionAdaptation();
		super._onSwitchLanguage();
	}

	private _onLabelDataChange(): void {
		this.unschedule(this._initComponent);
		this.scheduleOnce(this._initComponent);
	}
}

export default MKLanguageLabel;
