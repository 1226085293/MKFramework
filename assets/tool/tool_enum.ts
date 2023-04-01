import * as cc from "cc";

/** 枚举扩展 */
class tool_enum {
	/** 处理字符串值枚举，让其可以通过cc.Enum选择 */
	string_to_cc(enum_: any, new_enum_: any): any {
		let index_n = 0;
		const new_enum = {};

		for (const k_s in enum_) {
			if (typeof enum_[k_s] === "string") {
				new_enum_[index_n] = enum_[k_s];
				new_enum_[enum_[k_s]] = index_n;
				new_enum[k_s] = index_n++;
			}
		}
		return cc.Enum(new_enum);
	}

	/** 转换数字枚举值为对应字符串 */
	number_to_string(enum_: any): any {
		const result: any = {};

		for (const k_s in enum_) {
			if (isNaN(Number(k_s))) {
				result[k_s] = k_s;
			}
		}
		return result;
	}

	/** 合并多个枚举，返回新枚举 */
	merge(enum_as_: any[]): any {
		const result: any = {};
		let index_n = 0;

		enum_as_.forEach((v) => {
			for (const k2_s in v) {
				if (isNaN(Number(k2_s))) {
					if (result[k2_s]) {
						console.warn(`[tool.enum_extend]：合并枚举 ${k2_s} 键冲突，跳过`);
						continue;
					}
					result[k2_s] = index_n;
					result[index_n++] = k2_s;
				}
			}
		});
		return result;
	}

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

	/** 数组到枚举 */
	array_to_enum(value_as_: any[]): any {
		const result: any = {};

		if (!value_as_) {
			return result;
		}
		value_as_.forEach((v_s, k_n) => {
			result[k_n] = v_s;
			result[v_s] = k_n;
		});
		return result;
	}

	/**
	 * 转换枚举到编辑器属性枚举
	 * @param value_ 枚举
	 * @returns cc.Enum
	 * - 用于 setClassAttr
	 */
	enum_to_attr_enum<T extends {}>(value_: T): ReturnType<typeof cc.Enum.getList<T>> {
		return cc.Enum.getList(cc.Enum(value_));
	}

	/** 数组到编辑器枚举 */
	array_to_cc_enum(value_as_: any[]): any {
		return this.enum_to_attr_enum(this.array_to_enum(value_as_));
	}

	/** 对象转编辑器枚举 */
	obj_to_cc_enum(value_: any): any {
		return this.enum_to_attr_enum(this.obj_to_enum(value_));
	}

	/** 重置数字枚举值 */
	reset_value(start_n_: number, enum_: any, modify_b?: boolean): any;
	reset_value(start_n_: number, enum_as_: any[], modify_b?: boolean): any[];
	reset_value(start_n_: number, args2_: any, modify_b?: boolean): any {
		if (args2_ instanceof Array) {
			if (modify_b) {
				args2_.forEach((v) => {
					for (const k_s in v) {
						if (isNaN(Number(k_s))) {
							v[v[k_s]] = undefined;
							v[k_s] = start_n_;
							v[start_n_] = k_s;
							start_n_++;
						}
					}
				});
			} else {
				const result_as: any[] = [];

				args2_.forEach((v) => {
					const new_enum = {};

					result_as.push(new_enum);
					for (const k_s in v) {
						if (isNaN(Number(k_s))) {
							new_enum[k_s] = start_n_;
							new_enum[start_n_] = k_s;
							start_n_++;
						}
					}
				});
				return result_as;
			}
		} else {
			if (modify_b) {
				for (const k_s in args2_) {
					if (isNaN(Number(k_s))) {
						args2_[args2_[k_s]] = undefined;
						args2_[k_s] = start_n_;
						args2_[start_n_] = k_s;
						start_n_++;
					}
				}
			} else {
				const result = {};

				for (const k_s in args2_) {
					if (isNaN(Number(k_s))) {
						result[k_s] = start_n_;
						result[start_n_] = k_s;
						start_n_++;
					}
				}
				return result;
			}
		}
	}
}

export default new tool_enum();
