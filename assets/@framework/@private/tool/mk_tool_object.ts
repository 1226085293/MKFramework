import mk_instance_base from "../../mk_instance_base";
import { mk_log } from "../../mk_logger";

class mk_tool_object extends mk_instance_base {
	/** 克隆对象 */
	clone<T = any>(target_: T, record_set = new Set()): T {
		let result: any;

		switch (typeof target_) {
			case "object":
				{
					// 数组：遍历拷贝
					if (Array.isArray(target_)) {
						if (record_set.has(target_)) {
							return target_;
						}
						record_set.add(target_);
						result = [];
						for (let k_n = 0; k_n < target_.length; ++k_n) {
							// 递归克隆数组中的每一项
							result.push(this.clone(target_[k_n], record_set));
						}
					}
					// null：直接赋值
					else if (target_ === null) {
						result = null;
					}
					// RegExp：直接赋值
					else if ((target_ as any).constructor === RegExp) {
						result = target_;
					}
					// 普通对象：循环递归赋值对象的所有值
					else {
						if (record_set.has(target_)) {
							return target_;
						}
						record_set.add(target_);
						result = {};
						for (const k_s in target_) {
							result[k_s] = this.clone(target_[k_s], record_set);
						}
					}
				}

				break;
			case "function":
				{
					result = target_.bind({});
				}

				break;
			default: {
				result = target_;
			}
		}
		return result;
	}

	/** 重置数据（class 数据才会生效，注意构造内的 this 对象不是 data_） */
	reset<T extends { constructor: any }>(data_: T, assign_b_ = true): typeof assign_b_ extends true ? null : T {
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
}

export default mk_tool_object.instance();
