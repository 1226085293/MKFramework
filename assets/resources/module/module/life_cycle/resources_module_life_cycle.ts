import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("resources_module_life_cycle")
export class resources_module_life_cycle extends mk.module.view_base {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		/** 输出 */
		output_s: "",
	};

	init_data = {};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	/* ------------------------------- 生命周期 ------------------------------- */
	create(): void {
		this._add_log("create");
	}

	init(init_?: typeof this.init_data): void {
		this._add_log("init");
	}

	open(): void {
		this._add_log("open");
	}

	close(): void {
		this._add_log("close");
		this._add_log("----------------------");
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	/* ------------------------------- 功能 ------------------------------- */
	private _add_log(value_s_: string): void {
		this.data.output_s += this.data.output_s ? "\n" + value_s_ : value_s_;
	}
	/* ------------------------------- 网络事件 ------------------------------- */
	/* ------------------------------- 自定义事件 ------------------------------- */
}
