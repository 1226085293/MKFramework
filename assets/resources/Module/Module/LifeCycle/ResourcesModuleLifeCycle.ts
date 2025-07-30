import { _decorator } from "cc";
import mk from "mk";
const { ccclass, property } = _decorator;

@ccclass("ResourcesModuleLifeCycle")
export class ResourcesModuleLifeCycle extends mk.ViewBase {
	/* --------------- public --------------- */
	data = {
		/** 输出 */
		outputStr: "",
	};

	initData = {};

	/* ------------------------------- 生命周期 ------------------------------- */
	create(): void {
		this._addLog("create");
	}

	init(init_?: typeof this.initData): void {
		this._addLog("init");
	}

	open(): void {
		this._addLog("open");
	}

	close(): void {
		this._addLog("close");
		this._addLog("----------------------");
	}

	/* ------------------------------- 功能 ------------------------------- */
	private _addLog(valueStr_: string): void {
		this.data.outputStr += this.data.outputStr ? "\n" + valueStr_ : valueStr_;
	}
}
