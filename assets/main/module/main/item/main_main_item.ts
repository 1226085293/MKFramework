import main_main_item_nodes from "./main_main_item_nodes";
import { _decorator } from "cc";
import * as cc from "cc";
import mk from "mk";
import { main_main } from "../../../scene/main/main_main";
const { ccclass, property } = _decorator;

@ccclass("main_main_item")
export class main_main_item extends mk.view_base {
	/* --------------- 属性 --------------- */
	@property(main_main_item_nodes)
	nodes = new main_main_item_nodes();

	/* --------------- public --------------- */
	init_data!: typeof main_main_item.prototype.data;
	data = new (class {
		/** 列表文本 */
		label_s = "";
		/** 打开视图 */
		view: cc.Constructor<mk.view_base> | (() => any) | null = null;
	})();

	/* ------------------------------- 生命周期 ------------------------------- */
	init(init_?: typeof this.init_data): void {
		// 不存在多语言则删除组件
		if (!mk.language_manage.label_data_tab[cc.js.getClassName(main_main)]?.[this.init_data.label_s]) {
			this.nodes.label.getComponent(mk.language.label)!.destroy();
		}

		Object.assign(this.data, this.init_data);
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/** 按钮-点击 */
	async button_click(): Promise<void> {
		if (!this.data.view) {
			return;
		}

		if (cc.js.getSuper(this.data.view) === mk.view_base) {
			mk.ui_manage.open(this.data.view as any);
		} else {
			(this.data.view as any)();
		}
	}
}
