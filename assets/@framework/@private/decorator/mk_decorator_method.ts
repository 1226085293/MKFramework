import mk_instance_base from "../../mk_instance_base";

/** 方法装饰器 */
class mk_decorator_method extends mk_instance_base {
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

		descriptor_.value = async function (...args_as: any[]) {
			if (this[key]) {
				return;
			}
			this[key] = true;
			await old_value_f.call(this, ...args_as);
			this[key] = false;
		};
	}
}

export default mk_decorator_method.instance();
