import mk_event_target from "../../mk_event_target";
import mk_view_base from "../mk_view_base";
import mvc_model_base from "./mvc_model_base";

namespace _mvc_view_base {
	/** 递归只读 */
	type recursive_readonly<T> = {
		readonly [P in keyof T]: T[P] extends Function ? T[P] : recursive_readonly<T[P]>;
	};

	/** 排除函数属性的对象键 */
	type non_function_keys<T> = {
		// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
		[P in keyof T]: T[P] extends Function | void ? never : P;
	}[keyof T];

	export type recursive_readonly_and_non_function_keys<T> = recursive_readonly<Pick<T, non_function_keys<T>>>;
}

abstract class mvc_view_base<CT extends mvc_model_base = mvc_model_base> extends mk_view_base {
	protected _event = new mk_event_target();
	protected _model!: _mvc_view_base.recursive_readonly_and_non_function_keys<CT>;
}

export default mvc_view_base;
