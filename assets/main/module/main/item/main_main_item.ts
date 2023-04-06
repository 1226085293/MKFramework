import nodes from "./main_main_item_nodes";
import { _decorator } from "cc";
import * as cc from "cc";
import mk from "mk";
import { main_main } from "../../../scene/main/main_main";
const { ccclass, property } = _decorator;

@ccclass("resources_main_item")
export class resources_main_item extends mk.module.view_base {
	/* --------------- public --------------- */
	nodes!: nodes;
	init_data!: typeof resources_main_item.prototype.data;
	data = {
		/** 列表文本 */
		label_s: "",
		/** 打开视图 */
		view: null as cc.Constructor<mk.module.view_base> | null,
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.init_data): void {
		// 不存在多语言则删除组件
		if (!mk.language_manage.label_data_tab[cc.js.getClassName(main_main)]?.[this.init_data.label_s]) {
			this.nodes.label.getComponent(mk.language.label)?.destroy();
		}

		Object.assign(this.data, this.init_data);
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 按钮-点击 */
	button_click(): void {
		if (this.data.view) {
			mk.ui_manage.open(this.data.view);
		}
	}

	onLoad() {
		this.nodes = new nodes(this.node);
	}
}
