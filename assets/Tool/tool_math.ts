import mk from "mk";

class tool_math extends mk.instance_base {
	/**
	 * 获取随机数
	 * @param min_n_ 最小值
	 * @param max_n_ 最大值
	 * @param floor_b_ 向下取整
	 * @returns
	 */
	random(min_n_: number, max_n_: number, floor_b_: boolean): number {
		return floor_b_ ? Math.floor(Math.random() * (max_n_ + 1 - min_n_) + min_n_) : Math.random() * (max_n_ - min_n_) + min_n_;
	}
}

export default tool_math.instance();
