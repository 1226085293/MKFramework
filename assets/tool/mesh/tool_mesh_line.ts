import * as cc from "cc";

/** 网格线段 */
class tool_mesh_line extends mk.instance_base {
	/** 临时变量表 */
	private _temp_tab = {
		value_v3: cc.v3(),
		value2_v3: cc.v3(),
	};

	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 是否为凸线段
	 * @param point_v3s_ [p0, p1, p2]
	 */
	is_convex(point_v3s_: cc.Vec3[]): boolean {
		this._temp_tab.value_v3.set(point_v3s_[0]).subtract(point_v3s_[1]);
		this._temp_tab.value2_v3.set(point_v3s_[2]).subtract(point_v3s_[1]);

		return false;
	}
}

export default tool_mesh_line.instance();
