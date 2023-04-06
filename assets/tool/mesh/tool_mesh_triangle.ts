import * as cc from "cc";

/** 网格三角形工具 */
class tool_mesh_triangle extends mk.instance_base {
	/**
	 * 切割
	 * @param plane_ 切割平面
	 * @param triangle_v3s_ 三角形点（[p0, p1, p2]）
	 * @returns 交点（[0]：p0 与 p1 交点，[1]：p1 与 p2 交点，[2]：p2 与 p0 交点）
	 */
	slice(plane_: cc.geometry.Plane, triangle_v3s_: cc.Vec3[]): cc.Vec3[] {
		const positive_b = plane_.n.dot(triangle_v3s_[0]) - plane_.d >= 0;
		const positive2_b = plane_.n.dot(triangle_v3s_[1]) - plane_.d >= 0;
		const positive3_b = plane_.n.dot(triangle_v3s_[2]) - plane_.d >= 0;

		return [];
	}
}

export default tool_mesh_triangle.instance();
