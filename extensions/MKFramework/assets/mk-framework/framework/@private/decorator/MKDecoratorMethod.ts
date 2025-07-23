import MKInstanceBase from "../../MKInstanceBase";

/** 方法装饰器 */
class MKDecoratorMethod extends MKInstanceBase {
	/** 重载父类函数声明 */
	resetParentDeclaration(target_: any, keyStr_: string, descriptor_: PropertyDescriptor): void {
		descriptor_.value = target_.__proto__[keyStr_];
	}
}

export default MKDecoratorMethod.instance();
