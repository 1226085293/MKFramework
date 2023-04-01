import * as cc from "cc";
import mk_logger from "../../mk_logger";
import mk_instance_base from "../../mk_instance_base";

/** 函数扩展 */
class mk_tool_func extends mk_instance_base {
	private _run_parent_func_mark_map = new Map<any, Record<string, boolean>>();
	private _timeout_warning_mark_map = new Map<any, Record<string, boolean>>();
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
		let mark_tab = this._run_parent_func_mark_map.get(target_)!;

		if (!mark_tab) {
			this._run_parent_func_mark_map.set(target_, (mark_tab = Object.create(null)));
		}

		key_as.forEach((v) => {
			// 跳过已修改函数
			if (mark_tab[v]) {
				return;
			}
			/** 当前类及父类函数 */
			const func_fs = this._get_parent_func(target_.constructor, v);

			// 标记重载
			mark_tab[v] = true;

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
					mk_logger.error(error);
				}
				return result;
			};
		});
	}

	/**
	 * 超时警告
	 * @param time_ms_n_ 最大执行时间
	 */
	timeout_warning<T extends object>(time_ms_n_: number, target_: T, key_: string | string[]): void {
		if (!time_ms_n_) {
			return;
		}

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
		let mark_tab = this._timeout_warning_mark_map.get(target_)!;

		if (!mark_tab) {
			this._timeout_warning_mark_map.set(target_, (mark_tab = Object.create(null)));
		}

		key_as.forEach((key_s_) => {
			// 不存在或者已修复则退出
			if (!target_[key_s_] || mark_tab[key_s_]) {
				return;
			}
			mark_tab[key_s_] = true;
			const old_f = target_[key_s_];

			target_[key_s_] = (...args_as: any[]) => {
				/** 定时器 */
				const timer = setTimeout(() => {
					mk_logger.error(`${cc.js.getClassName(target_)}:${key_s_} 执行超时`, target_);
				}, time_ms_n_);

				const result = old_f.call(target_, ...args_as);

				// 取消定时器
				if (result instanceof Promise) {
					result.then(() => {
						clearTimeout(timer);
					});
				} else {
					clearTimeout(timer);
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

export default mk_tool_func.instance();
