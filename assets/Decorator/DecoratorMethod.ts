import mk from "mk";

/** 方法装饰器 */
class DecoratorMethod extends mk.InstanceBase {
	/** 重载父类函数声明 */
	resetParentDeclaration(target_: any, keyStr_: string, descriptor_: PropertyDescriptor): void {
		descriptor_.value = target_.__proto__[keyStr_];
	}

	/** 不重复执行 */
	notRepeat(target_: any, keyStr_: string, descriptor_: PropertyDescriptor): void {
		/** 运行状态键 */
		const key = Symbol("decorator_method_not_repeat:" + keyStr_);
		/** 原函数 */
		const oldValueFunc = descriptor_.value;
		/** 返回值 */
		let result: any;

		descriptor_.value = function (...argsList: any[]) {
			if (this[key]) {
				return result;
			}

			this[key] = true;
			result = oldValueFunc.call(this, ...argsList);

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

export default DecoratorMethod.instance();
