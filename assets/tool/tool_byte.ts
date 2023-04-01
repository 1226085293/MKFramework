/** 位运算 */
class tool_byte {
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

	/** 获取0的包含数量 */
	zero_count(value_n_: number): number {
		let count_n = 0;

		while (value_n_ + 1) {
			count_n++;
			value_n_ |= value_n_ + 1;
		}
		return count_n;
	}

	/** 获取1的包含数量 */
	one_count(value_n_: number): number {
		let count_n = 0;

		while (value_n_) {
			count_n++;
			value_n_ &= value_n_ - 1;
		}
		return count_n;
	}

	/** 获取1的最高位 */
	one_highest_bit(value_n_: number): number {
		let count_n = 0;

		value_n_ = Math.abs(value_n_);
		while (value_n_) {
			count_n++;
			value_n_ >>= 1;
		}
		return count_n;
	}
}

export default new tool_byte();
