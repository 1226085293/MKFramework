import mk_instance_base from "../../mk_instance_base";

/** 位运算 */
class mk_tool_byte extends mk_instance_base {
	/** 指定位设1 */
	set_bit(value_n_: number, index_n_: number): number {
		return (value_n_ |= index_n_);
	}

	/** 指定位清0 */
	clr_bit(value_n_: number, index_n_: number): number {
		return (value_n_ &= ~index_n_);
	}

	/** 返回指定位 */
	get_bit(value_n_: number, index_n_: number): number {
		return value_n_ & index_n_;
	}
}

export default mk_tool_byte.instance();
