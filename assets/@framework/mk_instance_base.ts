/** 继承单例 */
abstract class mk_instance_base {
	/** 单例方法 */
	static instance<T extends new (...args_as: any[]) => any>(this: T, ...args_as_: ConstructorParameters<T>): InstanceType<T> {
		const self = this as any;

		if (!self._instance) {
			self._instance = new self(...args_as_);
		}

		return self._instance;
	}
}

export default mk_instance_base;
