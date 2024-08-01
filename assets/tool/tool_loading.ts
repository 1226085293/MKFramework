import { _decorator } from "cc";
import { EDITOR } from "cc/env";
import * as cc from "cc";
import mk from "mk";
import type { SetOptional } from "type-fest";
const { ccclass, property } = _decorator;

namespace _tool_loading {
	export class module_data {
		constructor(init_?: SetOptional<module_data, "count_n">) {
			Object.assign(this, init_);
		}
		module!: mk.view_base;
		count_n = 0;
	}
}

/**
 * loading 模块工具
 * @remark
 * 每次只能打开一个 loading 模块，open 时计数+1，close 时计数-1，为 0 后真正关闭 loading 模块
 */
class tool_loading {
	/** 模块表 */
	private _module_map = new Map<mk.ui_manage_.type_open_key, _tool_loading.module_data>();
	/* ------------------------------- segmentation ------------------------------- */
	/**
	 * 打开一个 loading 模块
	 * @param args_as_ {@link mk.ui_manage.open} 的参数
	 * @returns
	 */
	async open(...args_as_: Parameters<typeof mk.ui_manage.open>): ReturnType<typeof mk.ui_manage.open> {
		let data = this._module_map.get(args_as_[0]);

		if (!data) {
			let module = await mk.ui_manage.open(...args_as_);

			if (!module) {
				return null;
			}

			data = new _tool_loading.module_data({
				module: module,
			});

			this._module_map.set(args_as_[0], data);
		}

		++data.count_n;
		return data.module;
	}

	/**
	 * 关闭一个 loading 模块
	 * @param key_ 模块键
	 * @param config_ 关闭配置
	 * @returns
	 */
	async close(
		key_: mk.ui_manage_.type_open_key,
		config_?: mk.ui_manage_.close_config<mk.ui_manage_.type_open_key>
	): ReturnType<typeof mk.ui_manage.close> {
		let data = this._module_map.get(key_);

		if (!data) {
			return false;
		}

		if (--data.count_n !== 0) {
			return false;
		}

		this._module_map.delete(key_);
		return mk.ui_manage.close(data.module, config_);
	}
}

export default new tool_loading();
