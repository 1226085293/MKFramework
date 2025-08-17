import { _decorator } from "cc";
import mk from "mk";
import type { SetOptional } from "type-fest";
const { ccclass, property } = _decorator;

namespace _ToolLoading {
	export class ModuleData {
		constructor(init_?: SetOptional<ModuleData, "countNum">) {
			Object.assign(this, init_);
		}
		module!: mk.ViewBase;
		countNum = 0;
	}
}

/**
 * loading 模块工具
 * @remark
 * 每次只能打开一个 loading 模块，open 时计数+1，close 时计数-1，为 0 后真正关闭 loading 模块
 */
class ToolLoading {
	/** 模块表 */
	private _moduleMap = new Map<mk.UIManage_.TypeOpenKey, _ToolLoading.ModuleData>();
	/* ------------------------------- segmentation ------------------------------- */
	/**
	 * 打开一个 loading 模块
	 * @param argsList_ {@link mk.uiManage.open} 的参数
	 * @returns
	 */
	async open(...argsList_: Parameters<typeof mk.uiManage.open>): ReturnType<typeof mk.uiManage.open> {
		let data = this._moduleMap.get(argsList_[0]);

		if (!data) {
			const module = await mk.uiManage.open(...argsList_);

			if (!module) {
				return null;
			}

			data = new _ToolLoading.ModuleData({
				module: module,
			});

			this._moduleMap.set(argsList_[0], data);
		}

		++data.countNum;

		return data.module;
	}

	/**
	 * 关闭一个 loading 模块
	 * @param key_ 模块键
	 * @param config_ 关闭配置
	 * @returns
	 */
	async close(key_: mk.UIManage_.TypeOpenKey, config_?: mk.UIManage_.CloseConfig<mk.UIManage_.TypeOpenKey>): ReturnType<typeof mk.uiManage.close> {
		const data = this._moduleMap.get(key_);

		if (!data) {
			return false;
		}

		if (--data.countNum !== 0) {
			return false;
		}

		this._moduleMap.delete(key_);

		return mk.uiManage.close(data.module, config_);
	}
}

export default new ToolLoading();
