import mk from "mk";

/** 方法装饰器 */
class decorator_method extends mk.instance_base {
	/** 重载父类函数声明 */
	reset_parent_declaration(target_: any, key_s_: string, descriptor_: PropertyDescriptor): void {
		descriptor_.value = target_.__proto__[key_s_];
	}

	/** 不重复执行 */
	not_repeat(target_: any, key_s_: string, descriptor_: PropertyDescriptor): void {
		/** 运行状态键 */
		const key = Symbol("decorator_method_not_repeat:" + key_s_);
		/** 原函数 */
		const old_value_f = descriptor_.value;
		/** 返回值 */
		let result: any;

		descriptor_.value = function (...args_as: any[]) {
			if (this[key]) {
				return result;
			}

			this[key] = true;
			result = old_value_f.call(this, ...args_as);

			if (result instanceof Promise) {
				result.then(() => {
					this[key] = false;
				});
			} else {
				this[key] = false;
			}

			return result;
		};
	}
}

export default decorator_method.instance();
