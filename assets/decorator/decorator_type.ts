import * as cc from "cc";
import mk from "mk";

/** 类装饰器 */
class decorator_type extends mk.instance_base {
	/** 添加属性 */
	add_property(extends_: any): Function {
		return function (target_: any) {
			Object.assign(target_.prototype, extends_);
		};
	}

	/** 添加描述 */
	description(args_: string): Function;
	description(args_: cc.Constructor): string;
	description(args_: string | cc.Constructor): Function | string {
		if (typeof args_ === "string") {
			return this.add_property({
				__description: args_,
			});
		}

		return args_.prototype.__description;
	}
}

export default decorator_type.instance();
