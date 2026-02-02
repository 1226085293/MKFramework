import { EDITOR } from "cc/env";
import { MKLifeCycle, _MKLifeCycle } from "./MKLifeCycle";
import mkDynamicModule from "../MKDynamicModule";
/** @weak */
import type { MKUIManage_ } from "../MKUIManage";
import mkGame from "../MKGame";
import mkBundle from "../Resources/MKBundle";
import { _decorator, Enum, Widget, BlockInputEvents, CCClass, Sprite, Node } from "cc";
import mkToolEnum from "../@Private/Tool/MKToolEnum";

// @weak-start-include-MKUIManage
const mkUIManage = mkDynamicModule.default(import("../MKUIManage"));
// @weak-end
const { ccclass, property } = _decorator;

namespace _MKViewBase {
	/** create 配置 */
	export interface CreateConfig extends _MKLifeCycle.CreateConfig {
		/** 模块类型 */
		typeStr: string;
	}

	/** 动画配置 */
	@ccclass("MKViewBase/AnimationConfig")
	export class AnimationConfig {
		/* --------------- static --------------- */
		/** 动画枚举表 */
		static animationEnumTab: {
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
			type: Enum({ 未初始化: 0 }),
		})
		get openAnimationNum(): number {
			return (AnimationConfig.animationEnumTab.open[this.openAnimationStr] as number) ?? 0;
		}

		/**
		 * @internal
		 */
		set openAnimationNum(valueNum_: number) {
			this.openAnimationStr = AnimationConfig.animationEnumTab.open[valueNum_] as string;
		}

		/**
		 * @internal
		 */
		@property({
			displayName: "关闭动画",
			type: Enum({ 未初始化: 0 }),
		})
		get closeAnimationNum(): number {
			return (AnimationConfig.animationEnumTab.close[this.closeAnimationStr] as number) ?? 0;
		}

		/**
		 * @internal
		 */
		set closeAnimationNum(valueNum_: number) {
			this.closeAnimationStr = AnimationConfig.animationEnumTab.close[valueNum_] as string;
		}

		/* --------------- public --------------- */
		/** 关闭动画 */
		@property({ displayName: "等待动画执行完成", tooltip: "是否等待动画执行完成再执行生命周期 open" })
		isWaitAnimationComplete = true;

		/** 打开动画 */
		@property({ visible: false })
		openAnimationStr = "";

		/** 关闭动画 */
		@property({ visible: false })
		closeAnimationStr = "";
	}
}

/**
 * 视图基类
 * @noInheritDoc
 * @remarks
 *
 * - 添加编辑器快捷操作
 *
 * - 添加弹窗动画配置
 *
 * - 独立展示配置
 */
@ccclass
export class MKViewBase extends MKLifeCycle {
	/* --------------- 属性 --------------- */
	@property({
		displayName: "单独展示",
		tooltip: "勾选后打开此视图将隐藏所有下级视图，关闭此视图则还原展示",
		group: { name: "视图配置", id: "1" },
	})
	isShowAlone = false;

	@property({
		displayName: "动画配置",
		type: _MKViewBase.AnimationConfig,
		group: { name: "视图配置", id: "1" },
	})
	animationConfig: _MKViewBase.AnimationConfig = null!;

	/** @internal */
	@property({
		displayName: "添加遮罩",
		tooltip: "添加遮罩到根节点下",
		group: { name: "快捷操作", id: "1" },
	})
	get isAutoMask(): boolean {
		return this._getIsAutoMask();
	}

	set isAutoMask(value_) {
		this._setIsAutoMask(value_);
	}

	/** @internal */
	@property({
		displayName: "0 边距 widget",
		tooltip: "在节点上添加 0 边距 widget",
		group: { name: "快捷操作", id: "1" },
	})
	get isAutoWidget(): boolean {
		return Boolean(this.getComponent(Widget));
	}

	set isAutoWidget(value_) {
		this._setIsAutoWidget(value_);
	}

	/** @internal */
	@property({
		displayName: "BlockInputEvents",
		tooltip: "在节点上添加 BlockInputEvents 组件",
		group: { name: "快捷操作", id: "1" },
	})
	get isAutoBlockInput(): boolean {
		return Boolean(this.getComponent(BlockInputEvents));
	}

	set isAutoBlockInput(value_) {
		this._setIsAutoBlockInput(value_);
	}

	/* --------------- public --------------- */

	/**
	 * 模块类型
	 * @readonly
	 */
	typeStr = "default";

	/** 模块配置 */
	set config(config_: _MKViewBase.CreateConfig) {
		if (config_.isStatic !== undefined) {
			this._isStatic = config_.isStatic;
		}

		this.typeStr = config_.typeStr ?? "default";
	}

	/* --------------- private --------------- */
	/** 打开动画任务 */
	private _openAnimationTask: Promise<any> | null = null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected create(): void {
		/** 打开动画函数 */
		const openAnimationFunc = MKViewBase._config.windowAnimationTab?.open?.[this.animationConfig?.openAnimationStr];

		// 打开动画
		this._openAnimationTask = !openAnimationFunc ? null : openAnimationFunc(this.node, this);
	}

	protected open(): void;
	protected async open(): Promise<void> {
		if (this._openAnimationTask && this.animationConfig.isWaitAnimationComplete) {
			await this._openAnimationTask;
		}
	}

	/**
	 * 关闭
	 * @param config_ 关闭配置
	 */
	// @weak-start-content-MKUIManage
	// @position:/(?<=close\()/g
	// @import:config_?: Omit<MKUIManage_.CloseConfig<any>, "type" | "isAll">
	close(config_?: Omit<MKUIManage_.CloseConfig<any>, "type" | "isAll">): void;
	async close(config_?: Omit<MKUIManage_.CloseConfig<any>, "type" | "isAll">): Promise<void> {
		// @weak-end
		// 不在关闭中或者已经关闭代表外部调用
		if (!(this._state & (_MKLifeCycle.RunState.Closing | _MKLifeCycle.RunState.Close))) {
			// @weak-start-include-MKUIManage
			await mkUIManage.close(this, config_);
			// @weak-end
			throw "中断";
		}
	}

	protected lateClose?(): void;
	protected async lateClose?(): Promise<void> {
		/** 关闭动画函数 */
		const closeAnimationFunc = MKViewBase._config.windowAnimationTab?.close?.[this.animationConfig?.closeAnimationStr];

		// 关闭动画
		if (
			// 非重启中
			!mkGame.isRestarting &&
			// 非切换场景
			!mkBundle.isSwitchScene &&
			closeAnimationFunc
		) {
			await closeAnimationFunc(this.node, this);
		}
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化编辑器 */
	protected _initEditor(): void {
		super._initEditor();

		// 窗口动画枚举
		{
			// 打开
			{
				_MKViewBase.AnimationConfig.animationEnumTab.open = Enum(mkToolEnum.objToEnum(MKViewBase._config.windowAnimationTab.open));

				if (this.animationConfig && !this.animationConfig.openAnimationStr) {
					this.animationConfig.openAnimationStr = Object.keys(_MKViewBase.AnimationConfig.animationEnumTab.open)[0];
				}

				// 更新编辑器
				if (EDITOR) {
					CCClass.Attr.setClassAttr(
						_MKViewBase.AnimationConfig,
						"openAnimationNum",
						"enumList",
						Enum.getList(_MKViewBase.AnimationConfig.animationEnumTab.open)
					);
				}
			}

			// 关闭
			{
				_MKViewBase.AnimationConfig.animationEnumTab.close = Enum(mkToolEnum.objToEnum(MKViewBase._config.windowAnimationTab.close));

				if (this.animationConfig && !this.animationConfig.closeAnimationStr) {
					this.animationConfig.closeAnimationStr = Object.keys(_MKViewBase.AnimationConfig.animationEnumTab.close)[0];
				}

				// 更新编辑器
				if (EDITOR) {
					CCClass.Attr.setClassAttr(
						_MKViewBase.AnimationConfig,
						"closeAnimationNum",
						"enumList",
						Enum.getList(_MKViewBase.AnimationConfig.animationEnumTab.close)
					);
				}
			}
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	private _getIsAutoMask(): boolean {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			return this.node.children[0]?.name === MKViewBase._config.maskInfo.nodeNameStr;
		}

		return false;
	}

	private async _setIsAutoMask(value_: boolean): Promise<void> {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			// 添加遮罩
			if (value_) {
				const node = new Node(MKViewBase._config.maskInfo.nodeNameStr);
				const sprite = node.addComponent(Sprite);
				const widget = node.addComponent(Widget);

				this.node.addChild(node);
				node.layer = this.node.layer;
				node.setSiblingIndex(0);
				widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;

				// 设置图片
				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(sprite)}.spriteFrame`,
					dump: {
						type: "cc.SpriteFrame",
						value: {
							uuid: "7d8f9b89-4fd1-4c9f-a3ab-38ec7cded7ca@f9941",
						},
					},
				});

				// 设置颜色
				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(sprite)}.color`,
					dump: {
						type: "cc.Color",
						value: MKViewBase._config.maskInfo.color,
					},
				});

				// 设置边距
				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(widget)}.editorLeft`,
					dump: {
						type: "Number",
						value: 0,
					},
				});

				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(widget)}.editorRight`,
					dump: {
						type: "Number",
						value: 0,
					},
				});

				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(widget)}.editorTop`,
					dump: {
						type: "Number",
						value: 0,
					},
				});

				Editor.Message.send("scene", "set-property", {
					uuid: node.uuid,
					path: `__comps__.${node.components.indexOf(widget)}.editorBottom`,
					dump: {
						type: "Number",
						value: 0,
					},
				});

				return;
			}
			// 销毁遮罩
			else if (this._getIsAutoMask()) {
				this.node.children[0].destroy();
			}
		}
	}

	private _setIsAutoWidget(value_: boolean): void {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			if (value_) {
				const widget = this.addComponent(Widget)!;

				widget.isAlignTop = widget.isAlignBottom = widget.isAlignLeft = widget.isAlignRight = true;
				widget.top = widget.bottom = widget.left = widget.right = 0;
			} else {
				this.getComponent(Widget)?.destroy();
			}
		}
	}

	private _setIsAutoBlockInput(value_: boolean): void {
		if (EDITOR && !window["cc"].GAME_VIEW) {
			if (value_) {
				this.addComponent(BlockInputEvents);
			} else {
				this.getComponent(BlockInputEvents)?.destroy();
			}
		}
	}
}

export default MKViewBase;
