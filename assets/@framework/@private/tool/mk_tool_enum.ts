import mk_instance_base from "../../mk_instance_base";

/** 枚举扩展 */
class mk_tool_enum extends mk_instance_base {
	/** 转换对象为枚举 */
	obj_to_enum(value_: any): any {
		const result: any = {};

		if (!value_) {
			return result;
		}

		if (typeof value_ === "object") {
			Object.keys(value_).forEach((v_s, k_n) => {
				result[k_n] = v_s;
				result[v_s] = k_n;
			});
		}

		return result;
	}
}

export default mk_tool_enum.instance();
