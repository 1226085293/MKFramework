/** 继承单例（类型安全） */
abstract class MKInstanceBase {
	/** 单例方法 */
	static instance<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): InstanceType<T> {
		const self = this as any;

		if (!self._instance) {
			self._instance = new self(...argsList_);
		}

		return self._instance;
	}
}

export default MKInstanceBase;
