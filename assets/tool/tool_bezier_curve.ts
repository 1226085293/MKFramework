import * as cc from "cc";

/** 贝塞尔曲线 */
class tool_bezier_curve {
	constructor(point_as_: cc.Vec3[]) {
		this.point_v3s = point_as_;
		if (this.point_v3s.length < 2) {
			console.error("控制点不能少于2");

			return;
		}

		/** 首尾相等 */
		const equals_b = point_as_[0].strictEquals(point_as_[point_as_.length - 1]);
		/** 总距离 */
		let sum_distance_n = 0;
		/** 临时变量 */
		let temp_v3: cc.Vec3, temp2_v3: cc.Vec3, temp3_v3: cc.Vec3, temp4_v3: cc.Vec3;

		for (let k_n = 0, len_n = point_as_.length - 1; k_n < len_n; k_n++) {
			if (k_n === 0) {
				temp_v3 = equals_b ? point_as_[point_as_.length - 2] : point_as_[0];
			} else {
				temp_v3 = point_as_[k_n - 1];
			}

			temp2_v3 = point_as_[k_n];
			temp3_v3 = point_as_[k_n + 1];

			if (k_n + 1 === point_as_.length - 1) {
				temp4_v3 = equals_b ? point_as_[1] : point_as_[point_as_.length - 1];
			} else {
				temp4_v3 = point_as_[k_n + 2];
			}

			this._func_fss[k_n] = [];
			[this._func_fss[k_n][0], this._func_fss[k_n][1]] = this._curve(temp_v3, temp2_v3, temp3_v3, temp4_v3);

			sum_distance_n += this._gauss_legendre(this._func_fss[k_n][1] as any, 0, 1);
			this._distance_ns[k_n] = sum_distance_n;
		}
	}

	/* --------------- public --------------- */
	/** 控制点 */
	point_v3s!: cc.Vec3[];
	/* --------------- private --------------- */
	private _distance_ns: number[] = [];
	private _func_fss: Function[][] = [];
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 获取曲线上某点的位置
	 * @param pos_n_ min: 0, max: 1
	 */
	point(pos_n_: number): cc.Vec3 | null {
		if (this.point_v3s.length < 2) {
			console.error("控制点不能少于2");

			return null;
		}

		if (pos_n_ < 0 || pos_n_ > 1) {
			pos_n_ = pos_n_ < 0 ? 0 : 1;
		}

		// 首个和最后点直接返回
		if (pos_n_ === 0) {
			return this.point_v3s[0];
		} else if (pos_n_ === 1) {
			return this.point_v3s[this.point_v3s.length - 1];
		}

		const result_v3 = cc.v3();
		const index_n = this.point_v3s.length - 1;

		this.point_v3s.forEach((v, k_s) => {
			if (!k_s) {
				result_v3.x += v.x * Math.pow(1 - pos_n_, index_n - k_s) * Math.pow(pos_n_, k_s);
				result_v3.y += v.y * Math.pow(1 - pos_n_, index_n - k_s) * Math.pow(pos_n_, k_s);
				result_v3.z += v.z * Math.pow(1 - pos_n_, index_n - k_s) * Math.pow(pos_n_, k_s);
			} else {
				result_v3.x +=
					(this._factorial(index_n) / this._factorial(k_s) / this._factorial(index_n - k_s)) *
					v.x *
					Math.pow(1 - pos_n_, index_n - k_s) *
					Math.pow(pos_n_, k_s);

				result_v3.y +=
					(this._factorial(index_n) / this._factorial(k_s) / this._factorial(index_n - k_s)) *
					v.y *
					Math.pow(1 - pos_n_, index_n - k_s) *
					Math.pow(pos_n_, k_s);

				result_v3.z +=
					(this._factorial(index_n) / this._factorial(k_s) / this._factorial(index_n - k_s)) *
					v.z *
					Math.pow(1 - pos_n_, index_n - k_s) *
					Math.pow(pos_n_, k_s);
			}
		});

		return result_v3;
	}

	/** 匀速点 */
	uniform_point(pos_n_: number): cc.Vec3 | null {
		if (this.point_v3s.length < 2) {
			console.error("控制点不能少于2");

			return null;
		}

		if (pos_n_ < 0 || pos_n_ > 1) {
			pos_n_ = pos_n_ < 0 ? 0 : 1;
		}

		// 首个和最后点直接返回
		if (pos_n_ === 0) {
			return this.point_v3s[0];
		} else if (pos_n_ === 1) {
			return this.point_v3s[this.point_v3s.length - 1];
		}

		// 平均距离
		const aver_dist_n = pos_n_ * this._distance_ns[this.point_v3s.length - 2];
		let index_n = 0,
			beyond_n = 0,
			percent_n = 0;

		for (let k_n = 0; k_n < this.point_v3s.length - 1; k_n++) {
			if (aver_dist_n < this._distance_ns[k_n]) {
				const pre_dis_n = k_n == 0 ? 0 : this._distance_ns[k_n - 1];

				index_n = k_n;
				beyond_n = aver_dist_n - pre_dis_n;
				percent_n = beyond_n / (this._distance_ns[k_n] - pre_dis_n);
				break;
			}
		}

		// 牛顿切线法求根
		let a_n = percent_n,
			b_n!: number;

		// 最多迭代6次
		for (let i = 0; i < 6; i++) {
			const actual_len_n = this._gauss_legendre(this._func_fss[index_n][1] as any, 0, a_n);

			b_n = a_n - (actual_len_n - beyond_n) / this._func_fss[index_n][1](a_n);
			if (Math.abs(a_n - b_n) < 0.0001) {
				break;
			}

			a_n = b_n;
		}

		percent_n = b_n;

		return this._func_fss[index_n][0](percent_n);
	}

	/**
	 * 递归阶乘
	 * @param value_n_
	 * @returns
	 */
	private _factorial(value_n_: number): number {
		let result_n = 1;

		for (let k_n = 2; k_n <= value_n_; ++k_n) {
			result_n *= k_n;
		}

		return result_n;
	}

	/**
	 * 高斯—勒让德积分公式可以用较少节点数得到高精度的计算结果
	 * @param value_f_ 曲线长度变化率,用于匀速曲线运动
	 * @param value_n_ 左区间
	 * @param value2_n_ 右区间
	 * @returns
	 */
	private _gauss_legendre(value_f_: (v: number) => number, value_n_: number, value2_n_: number): number {
		// 3次系数
		const gau_factor = {
			0.7745966692: 0.555555556,
			0: 0.8888888889,
		};

		// 5次系数
		// let GauFactor = {0.9061798459:0.2369268851,0.5384693101:0.4786286705,0:0.5688888889}
		// 积分
		let gau_sum_n = 0;
		let key_n: number;

		for (const key in gau_factor) {
			key_n = Number(key);
			const v = gau_factor[key];
			let t = ((value2_n_ - value_n_) * key_n + value_n_ + value2_n_) / 2;
			let der = value_f_(t);

			gau_sum_n = gau_sum_n + der * v;
			if (key_n > 0) {
				t = ((value2_n_ - value_n_) * -key + value_n_ + value2_n_) / 2;
				der = value_f_(t);
				gau_sum_n = gau_sum_n + der * v;
			}
		}

		return (gau_sum_n * (value2_n_ - value_n_)) / 2;
	}

	private _curve(
		point_v3_: cc.Vec3,
		point2_v3_: cc.Vec3,
		point3_v3_: cc.Vec3,
		point4_v3_: cc.Vec3
	): (((x_n: number) => cc.Vec3) | ((x_n: number) => number))[] {
		// 基本样条线插值算法
		// 弹性
		const s_n = 0.5;
		// 计算三次样条线函数系数
		const b_v3 = point_v3_
			.clone()
			.multiplyScalar(-s_n)
			.add(point2_v3_.clone().multiplyScalar(2 - s_n))
			.add(point3_v3_.clone().multiplyScalar(s_n - 2))
			.add(point4_v3_.clone().multiplyScalar(s_n));

		const b2_v3 = point_v3_
			.clone()
			.multiplyScalar(2 * s_n)
			.add(point2_v3_.clone().multiplyScalar(s_n - 3))
			.add(point3_v3_.clone().multiplyScalar(3 - 2 * s_n))
			.add(point4_v3_.clone().multiplyScalar(-s_n));

		const b3_v3 = point_v3_.clone().multiplyScalar(-s_n).add(point3_v3_.clone().multiplyScalar(s_n));
		const b4_v3 = point2_v3_;
		// 函数曲线
		const fx = (x_n: number): cc.Vec3 => {
			return b_v3
				.clone()
				.multiplyScalar(Math.pow(x_n, 3))
				.add(b2_v3.clone().multiplyScalar(Math.pow(x_n, 2)))
				.add(b3_v3.clone().multiplyScalar(x_n))
				.add(b4_v3.clone());
		};

		// 曲线长度变化率,用于匀速曲线运动
		const ds = (x_n: number): number => {
			const der_v3 = b_v3
				.clone()
				.multiplyScalar(3 * Math.pow(x_n, 2))
				.add(b2_v3.clone().multiplyScalar(2 * x_n))
				.add(b3_v3.clone());

			return Math.sqrt(Math.pow(der_v3.x, 2) + Math.pow(der_v3.y, 2) + Math.pow(der_v3.z, 2));
		};

		return [fx, ds];
	}
}

export default tool_bezier_curve;
