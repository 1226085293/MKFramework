import GlobalConfig from "../../../Config/GlobalConfig";
import mkLanguageManage from "../MKLanguageManage";
import mkTool from "../../@Private/Tool/MKTool";
import MKLifeCycle from "../../Module/MKLifeCycle";
// eslint-disable-next-line unused-imports/no-unused-imports
import { _decorator, Enum, Layout, Node } from "cc";
import { EDITOR } from "cc/env";

const { ccclass, property, menu, executeInEditMode } = _decorator;

namespace _MKLanguageNode {
	export const languageTypeEnum = mkTool.enum.objToEnum(GlobalConfig.Language.typeTab);

	@ccclass("MKLanguageNode/Node")
	export class LNode {
		constructor(init_?: Partial<LNode>) {
			Object.assign(this, init_);
		}

		/* --------------- 属性 --------------- */
		/** 语言 */
		@property({
			displayName: "语言",
			type: Enum(languageTypeEnum),
		})
		get language(): number {
			return languageTypeEnum[this.languageStr];
		}

		set language(valueNum_) {
			this.languageStr = GlobalConfig.Language.types[valueNum_];
		}

		/** 语言 */
		@property({ visible: false })
		languageStr: keyof typeof GlobalConfig.Language.typeTab = GlobalConfig.Language.defaultTypeStr;

		/** 节点 */
		@property({ displayName: "节点", type: Node })
		node: Node = null!;
	}
}

/**
 * 多语言节点
 * @noInheritDoc
 */
@ccclass
class MKLanguageNode extends MKLifeCycle {
	/* --------------- 属性 --------------- */
	/** 语言 */
	@property({ visible: false })
	languageStr: keyof typeof GlobalConfig.Language.typeTab = GlobalConfig.Language.defaultTypeStr;

	/** 语言 */
	@property({
		displayName: "语言",
		type: Enum(_MKLanguageNode.languageTypeEnum),
	})
	get language(): number {
		return _MKLanguageNode.languageTypeEnum[this.languageStr];
	}

	set language(valueNum_) {
		this.languageStr = _MKLanguageNode.languageTypeEnum[valueNum_];
		this._updateView();
	}

	/** 当前语言节点 */
	@property({
		displayName: "当前语言节点",
		type: Node,
		visible: true,
	})
	private get _node(): Node {
		return this.nodeList.find((v) => v instanceof _MKLanguageNode.LNode && v.languageStr === this.languageStr)?.node ?? null!;
	}

	private set _node(value_) {
		const node = this.nodeList.find((v) => v instanceof _MKLanguageNode.LNode && v.languageStr === this.languageStr);

		if (node) {
			node.node = value_;
		} else {
			this.nodeList.push(
				new _MKLanguageNode.LNode({
					languageStr: this.languageStr,
					node: value_,
				})
			);
		}
	}

	/** 语言节点列表 */
	@property({
		displayName: "语言节点列表",
		type: [_MKLanguageNode.LNode],
		visible: false,
	})
	nodeList: _MKLanguageNode.LNode[] = [];

	/** layout 适配 */
	@property({
		displayName: "layout 适配",
		tooltip: "根据语言配置从左到右或从右到左",
	})
	isLayoutAdaptation = false;

	/* --------------- public --------------- */
	/** 当前语言节点 */
	get currentNode(): Node | null {
		return this.nodeList.find((v) => v.languageStr === GlobalConfig.Language.types[mkLanguageManage.typeStr])?.node ?? null!;
	}

	/* --------------- protected --------------- */
	protected _isUseLayer = false;
	/* --------------- private --------------- */
	private _layout: Layout | null = null;
	/* ------------------------------- 生命周期 ------------------------------- */
	protected create(): void | Promise<void> {
		this._layout = this.getComponent(Layout);
	}

	protected open(): void | Promise<void> {
		mkLanguageManage.event.on(mkLanguageManage.event.key.switchLanguage, this._onSwitchLanguage, this)?.call(this);
	}

	// close(): void { }
	/* ------------------------------- 功能 ------------------------------- */
	/** 更新节点展示 */
	private _updateView(): void {
		if (EDITOR) {
			this.nodeList.forEach((v) => {
				v.node.active = v.language === this.language;
			});
		} else {
			// 节点显示隐藏
			this.nodeList.forEach((v) => {
				v.node.active = v.languageStr === mkLanguageManage.typeStr;
			});

			// layout 适配
			if (this.isLayoutAdaptation && this._layout?.alignHorizontal) {
				this._layout.horizontalDirection = mkLanguageManage.data.dire;
			}
		}
	}

	/* ------------------------------- 框架事件 ------------------------------- */
	private _onSwitchLanguage(): void {
		this._updateView();
	}
}

export default MKLanguageNode;
