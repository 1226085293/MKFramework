import * as cc from "cc";
import mk from "mk";

/** 类装饰器 */
class DecoratorType extends mk.InstanceBase {
	/** 添加属性 */
	addProperty(extends_: any): Function {
		return function (target_: any) {
			Object.assign(target_.prototype, extends_);
		};
	}

	/** 添加描述 */
	description(args_: string): Function;
	description(args_: cc.Constructor): string;
	description(args_: string | cc.Constructor): Function | string {
		if (typeof args_ === "string") {
			return this.addProperty({
				// eslint-disable-next-line @typescript-eslint/naming-convention
				__description: args_,
			});
		}

		return args_.prototype.__description;
	}
}

export default DecoratorType.instance();
