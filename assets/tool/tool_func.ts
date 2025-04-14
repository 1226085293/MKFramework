import * as cc from "cc";
import mk from "mk";

/** 函数扩展 */
class tool_func {
	private _run_parent_func_mark_map = new Map<any, Record<string, boolean>>();
	/* ------------------------------- 功能 ------------------------------- */
	/** 自动执行父类函数 */
	run_parent_func<T extends object>(target_: T, key_: string | string[]): void {
		let key_as: any[] = [];

		// 参数分类
		{
			if (Array.isArray(key_)) {
				key_as.push(...key_);
			} else {
				key_as.push(key_);
			}

			key_as = key_as.filter((v) => target_[v] && typeof target_[v] === "function");
		}

		/** 修改标记 */
		let mark: Record<string, boolean>;
		const temp = this._run_parent_func_mark_map.get(target_);

		if (!temp) {
			this._run_parent_func_mark_map.set(target_, (mark = Object.create(null)));
		} else {
			mark = temp;
		}

		key_as.forEach((v) => {
			// 跳过已修改函数
			if (mark[v]) {
				return;
			}

			/** 当前类及父类函数 */
			const func_fs = this._get_parent_func(target_.constructor, v);

			// 仅单个函数无需重载
			if (func_fs.length <= 1) {
				return;
			}

			mark[v] = true;
			// 重载当前函数
			target_[v] = async (...args_as: any): Promise<any> => {
				let result: any;

				try {
					// 同步执行父类到子类的函数
					for (let k2_n = 0; k2_n < func_fs.length - 1; k2_n++) {
						result = func_fs[k2_n].call(target_, ...args_as);
						if (result instanceof Promise) {
							await result;
						}
					}

					// 获取子类函数返回值
					if (func_fs.length) {
						result = func_fs[func_fs.length - 1].call(target_, ...args_as);
						if (result instanceof Promise) {
							result = await result;
						}
					}
				} catch (error) {
					if (error === "中断") {
						return;
					}

					mk.error(error);
				}

				return result;
			};
		});
	}

	/** 获取当前类及父类函数 */
	private _get_parent_func(target_: any, key_: any, old_target_?: any, func_fs_: Function[] = []): Function[] {
		if (!target_ || target_ === Object) {
			return func_fs_;
		}

		this._get_parent_func(cc.js.getSuper(target_), key_, target_, func_fs_);
		if (target_.prototype[key_] && (old_target_ ? target_.prototype[key_] !== old_target_.prototype[key_] : true)) {
			func_fs_.push(target_.prototype[key_]);
		}

		return func_fs_;
	}
}

export default new tool_func();
