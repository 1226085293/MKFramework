import { EDITOR } from "cc/env";
import GlobalConfig from "../../../Config/GlobalConfig";
import language from "../MKLanguageManage";
import mkAsset from "../../Resources/MKAsset";
import MKLanguageBase from "./MKLanguageBase";
import { _decorator, Sprite, SpriteFrame, CCClass, Enum, ImageAsset, error, Asset } from "cc";
import mkToolEnum from "../../@Private/Tool/MKToolEnum";
import mkToolString from "../../@Private/Tool/MKToolString";
import MKTaskPipeline from "../../Task/MKTaskPipeline";

const { ccclass, property, menu, executeInEditMode, requireComponent } = _decorator;

/**
 * 多语言图片
 * @noInheritDoc
 */
@ccclass
@requireComponent(Sprite)
@executeInEditMode
class MKLanguageTexture extends MKLanguageBase {
	/* --------------- static --------------- */
	/** 类型数组 */
	private static _typeStrList = Object.keys(language.textureDataTab);
	/** 注册类型 */
	private static _typeEnum: any = mkToolEnum.objToEnum(language.textureDataTab);
	/* --------------- 属性 --------------- */
	get type(): number {
		return MKLanguageTexture._typeEnum[this._typeStr];
	}

	set type(valueNum_) {
		this._setType(valueNum_);
	}

	@property({ override: true })
	protected _typeStr = MKLanguageTexture._typeStrList[0] ?? "";

	/* --------------- private --------------- */
	/** sprite组件 */
	private _sprite!: Sprite;
	/** 上个纹理 */
	private _previousSpriteFrame: Asset | null = null;
	/** 任务管线 */
	private _taskPipeline = new MKTaskPipeline();
	/* ------------------------------- 生命周期 ------------------------------- */
	protected onEnable(): void {
		super.onEnable();
		if (EDITOR) {
			language.event.on(language.event.key.textureDataChange, this._onTextureDataChange, this)?.call(this);
		}
	}

	protected onDisable(): void {
		super.onDisable();
		if (EDITOR) {
			language.event.targetOff(this);
		}
	}

	protected onDestroy(): void {
		// 释放上个资源
		this._previousSpriteFrame?.decRef();
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置数据 */
	protected _resetData(): void {
		// 更新类型数据
		this._data = language.textureDataTab[this._typeStr];
		if (EDITOR) {
			// 更新标记枚举
			this._markEnum = mkToolEnum.objToEnum(this._data);
			// 默认标记
			this.markStr = this._markEnum[this.markStr] !== undefined ? this.markStr : this._markEnum[0];
		}

		// 更新内容
		this._updateContent();

		// 更新编辑器
		if (EDITOR) {
			if (Object.keys(MKLanguageTexture._typeEnum).length) {
				CCClass.Attr.setClassAttr(MKLanguageTexture, "type", "enumList", Enum.getList(Enum(MKLanguageTexture._typeEnum)));
			}

			if (Object.keys(this._markEnum).length) {
				CCClass.Attr.setClassAttr(MKLanguageTexture, "markEnum", "enumList", Enum.getList(Enum(this._markEnum)));
			}
		}
	}

	protected async _updateContent(): Promise<void> {
		if (!this._sprite) {
			return;
		}

		const markStr = this._markStr.slice(this._markStr[0] === "\u200B" ? 1 : 0);
		const pathStr = language.textureDataTab[this._typeStr]?.[markStr]?.[GlobalConfig.Language.types[language.typeStr]];

		if (!pathStr) {
			return;
		}

		if (EDITOR) {
			// 释放上个纹理资源
			this._previousSpriteFrame?.decRef();
			const asset = await mkAsset.get(pathStr + ".png", ImageAsset, null);

			this._previousSpriteFrame = asset;

			if (!asset?.uuid) {
				return;
			}

			if (!(await Editor.Message.request("scene", "query-node", this.node.uuid))) {
				return;
			}

			Editor.Message.request("scene", "set-property", {
				uuid: this.node.uuid,
				path: `__comps__.${this.node.components.indexOf(this._sprite)}.spriteFrame`,
				dump: {
					type: "cc.SpriteFrame",
					value: {
						uuid: asset.uuid + "@f9941",
					},
				},
			});
		} else {
			this._taskPipeline.clear(true);
			this._taskPipeline.add(async () => {
				// 释放上个纹理资源
				this._previousSpriteFrame?.decRef();
				const asset = await mkAsset.get(pathStr, SpriteFrame, null);

				this._previousSpriteFrame = this._sprite.spriteFrame = asset;

				if (!asset) {
					return;
				}
			});
		}
	}

	protected _updateMark(): void {
		this._updateContent();
	}

	protected _setType(value_: number): void {
		this._typeStr = MKLanguageTexture._typeEnum[value_];
		this._resetData();
	}

	protected _setTypeStr(valueStr_: string): void {
		if (EDITOR) {
			const typeStr = mkToolString.fuzzyMatch(MKLanguageTexture._typeStrList, valueStr_);
			const typeNum = MKLanguageTexture._typeEnum[typeStr ?? ""];

			if (typeNum !== undefined) {
				this._setType(typeNum);
			}
		} else {
			this._setType(MKLanguageTexture._typeEnum[valueStr_]);
		}
	}

	protected _initData(): void {
		this._sprite = this.node.getComponent(Sprite)!;
		if (!this._sprite) {
			error("节点不存在 Sprite 组件");

			return;
		}

		super._initData();
	}

	/** 初始化组件 */
	private _initComponent(): void {
		/** 注册类型 */
		MKLanguageTexture._typeEnum = mkToolEnum.objToEnum(language.textureDataTab);
		if (!EDITOR) {
			return;
		}

		/** 类型数组 */
		MKLanguageTexture._typeStrList = Object.keys(language.textureDataTab);
		// 更新编辑器
		this._resetData();
	}

	/* ------------------------------- get/set ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
	private _onTextureDataChange(): void {
		this.unschedule(this._initComponent);
		this.scheduleOnce(this._initComponent);
	}
}

export default MKLanguageTexture;
