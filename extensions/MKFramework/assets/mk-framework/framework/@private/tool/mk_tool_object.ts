import mk_instance_base from "../../mk_instance_base";
import { mk_log } from "../../mk_logger";

class mk_tool_object extends mk_instance_base {
	/**
	 * 重置数据
	 * @param data_ class 类型数据
	 * @param assign_b_ 使用新对象覆盖属性
	 * @returns
	 * @remarks
	 * 注意构造内的 this 对象不是 data_
	 */
	reset<T extends { constructor: any }, T2 extends boolean>(data_: T, assign_b_: T2): T2 extends true ? null : T {
		if (!data_?.constructor) {
			mk_log.error("数据类型错误");

			return null!;
		}

		if (assign_b_) {
			Object.assign(data_, new data_.constructor());

			return null!;
		} else {
			return new data_.constructor();
		}
	}

	/**
	 * 遍历对象
	 * @param target_ 对象
	 * @param callback_f_ 回调函数
	 * @returns
	 */
	traverse(
		target_: any,
		callback_f_: (
			/** 当前值 */
			value: any,
			/** 当前键 */
			key_s: string,
			/** 当前路径：a/b/c */
			path_s: string
		) => void
	): void {
		return this._traverse(target_, callback_f_);
	}

	/** 遍历对象 */
	private _traverse(target_: any, callback_f_: (value: any, key_s: string, path_s: string) => void, path_s_ = "", record_set = new Set()): void {
		switch (typeof target_) {
			case "object": {
				// 数组：遍历
				if (Array.isArray(target_)) {
					if (record_set.has(target_)) {
						return;
					}

					record_set.add(target_);

					target_.forEach((v, k_n) => {
						// 递归数组中的每一项
						callback_f_(target_[k_n], k_n + "", path_s_);
						this._traverse(target_[k_n], callback_f_, path_s_ ? `${path_s_}/${k_n}` : k_n + "", record_set);
					});
				}
				// 普通对象：循环递归赋值对象的所有值
				else {
					if (record_set.has(target_)) {
						return;
					}

					record_set.add(target_);
					for (const k_s in target_) {
						callback_f_(target_[k_s], k_s, path_s_);
						this._traverse(target_[k_s], callback_f_, path_s_ ? `${path_s_}/${k_s}` : k_s, record_set);
					}
				}

				break;
			}
		}
	}
}

export default mk_tool_object.instance();
