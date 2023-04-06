/** 位运算 */
class lib_byte {
	/** 指定位设1 */
	set_bit(v_n_: number, index_n_: number): number {
		return (v_n_ |= index_n_);
	}

	/** 指定位清0 */
	clr_bit(v_n_: number, index_n_: number): number {
		return (v_n_ &= ~index_n_);
	}

	/** 返回指定位 */
	get_bit(v_n_: number, index_n_: number): number {
		return v_n_ & index_n_;
	}

	/** 获取0的包含数量 */
	zero_count(v_n_: number): number {
		let count_n = 0;

		while (v_n_ + 1) {
			count_n++;
			v_n_ |= v_n_ + 1;
		}
		return count_n;
	}

	/** 获取1的包含数量 */
	one_count(v_n_: number): number {
		let count_n = 0;

		while (v_n_) {
			count_n++;
			v_n_ &= v_n_ - 1;
		}
		return count_n;
	}
}

export default new lib_byte();
