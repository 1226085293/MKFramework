import mk_instance_base from "../../mk_instance_base";

/** 方法装饰器 */
class mk_decorator_method extends mk_instance_base {
	/** 重载父类函数声明 */
	reset_parent_declaration(target_: any, key_s_: string, descriptor_: PropertyDescriptor): void {
		descriptor_.value = target_.__proto__[key_s_];
	}
}

export default mk_decorator_method.instance();
