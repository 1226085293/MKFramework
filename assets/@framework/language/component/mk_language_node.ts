import * as cc from "cc";
import { EDITOR } from "cc/env";
import global_config from "../../../@config/global_config";
import language_manage from "../mk_language_manage";
import mk_tool from "../../@private/tool/mk_tool";

// eslint-disable-next-line @typescript-eslint/naming-convention
const { ccclass, property, menu, executeInEditMode } = cc._decorator;

namespace _mk_language_node {
	export const language_type_enum = mk_tool.enum.obj_to_enum(global_config.language.type);

	@ccclass("mk_language_node/node")
	export class node {
		constructor(init_?: Partial<node>) {
			Object.assign(this, init_);
		}

		/* --------------- 属性 --------------- */
		/** 语言 */
		@property({
			displayName: "语言",
			type: cc.Enum(language_type_enum),
		})
		get language(): number {
			return language_type_enum[this.language_s];
		}

		set language(value_n_) {
			this.language_s = global_config.language.type[value_n_];
		}

		/** 语言 */
		@property({ visible: false })
		language_s = global_config.language.default_type;

		/** 节点 */
		@property({ displayName: "节点", type: cc.Node })
		node: cc.Node = null!;
	}
}

/** 多语言节点 */
@ccclass("mk_language_node")
class mk_language_node {
	/* --------------- 属性 --------------- */
	/** 语言 */
	@property({ visible: false })
	language_s = global_config.language.default_type;

	/** 语言 */
	@property({
		displayName: "语言",
		type: cc.Enum(_mk_language_node.language_type_enum),
	})
	get language(): number {
		return _mk_language_node.language_type_enum[this.language_s];
	}

	set language(value_n_) {
		this.language_s = _mk_language_node.language_type_enum[value_n_];
		this._update_view();
	}

	/** 当前语言节点 */
	@property({
		displayName: "当前语言节点",
		type: cc.Node,
		visible: true,
	})
	private get _node(): cc.Node {
		return this.node_as.find((v) => v instanceof _mk_language_node.node && v.language_s === this.language_s)?.node ?? null!;
	}

	private set _node(value_) {
		const node = this.node_as.find((v) => v instanceof _mk_language_node.node && v.language_s === this.language_s);

		if (node) {
			node.node = value_;
		} else {
			this.node_as.push(
				new _mk_language_node.node({
					language_s: this.language_s,
					node: value_,
				})
			);
		}
	}

	/** 语言节点列表 */
	@property({
		displayName: "语言节点列表",
		type: [_mk_language_node.node],
		visible: false,
	})
	node_as: _mk_language_node.node[] = [];

	/* --------------- public --------------- */
	/** 当前语言节点 */
	get node(): cc.Node {
		return this.node_as.find((v) => v.language_s === global_config.language.type[language_manage.type])?.node ?? null!;
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 初始化 */
	init(): void {
		language_manage.event.on(language_manage.event.key.switch_language, this._event_switch_language, this)?.call(this);
	}

	/** 清理 */
	clear(): void {
		language_manage.event.targetOff(this);
	}

	/** 更新节点展示 */
	private _update_view(): void {
		if (EDITOR) {
			this.node_as.forEach((v) => {
				v.node.active = v.language === this.language;
			});
		} else {
			this.node_as.forEach((v) => {
				v.node.active = this.language_s === language_manage.type;
			});
		}
	}

	/* ------------------------------- 框架事件 ------------------------------- */
	private _event_switch_language(): void {
		this._update_view();
	}
}

export default mk_language_node;
