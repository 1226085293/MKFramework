import mk from "mk";

class ToolMath extends mk.InstanceBase {
	/**
	 * 获取随机数
	 * @param minNum_ 最小值
	 * @param maxNum_ 最大值
	 * @param isFloor_ 向下取整
	 * @returns
	 */
	random(minNum_: number, maxNum_: number, isFloor_: boolean): number {
		return isFloor_ ? Math.floor(Math.random() * (maxNum_ + 1 - minNum_) + minNum_) : Math.random() * (maxNum_ - minNum_) + minNum_;
	}
}

export default ToolMath.instance();
