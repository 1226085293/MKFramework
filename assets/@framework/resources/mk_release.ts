import * as cc from "cc";
import { mk_log } from "../mk_logger";

/**
 * 资源/对象释放器
 */
class mk_release {
	/** 节点集合 */
	private _node_set = new Set<cc.Node>();
	/** 资源集合 */
	private _asset_set = new Set<cc.Asset>();
	/** 对象集合 */
	private _object_set = new Set<mk_release_.release_object_type>();
	/** 回调集合 */
	private _call_back_set = new Set<mk_release_.release_call_back_type>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 添加释放对象
	 * @param args_ 要跟随模块释放的对象或列表
	 */
	add<T extends mk_release_.release_param_type, T2 = T | T[]>(args_: T2): T2 {
		if (!args_) {
			mk_log.error("添加释放对象错误", args_);

			return args_;
		}

		let node_as: cc.Node[] | undefined;
		let asset_as: cc.Asset[] | undefined;
		let object_as: mk_release_.release_object_type[] | undefined;
		let call_back_as: mk_release_.release_call_back_type[] | undefined;

		// 参数转换
		{
			if (Array.isArray(args_)) {
				if (!args_.length) {
					return args_;
				}

				if (args_[0] instanceof cc.Node) {
					node_as = args_ as any;
				} else if (args_[0] instanceof cc.Asset) {
					asset_as = args_ as any;
				} else if (typeof args_[0] === "function") {
					call_back_as = args_;
				} else {
					object_as = args_ as any;
				}
			} else {
				if (args_ instanceof cc.Node) {
					node_as = [args_];
				} else if (args_ instanceof cc.Asset) {
					asset_as = [args_];
				} else if (typeof args_ === "function") {
					call_back_as = [args_ as any];
				} else {
					object_as = [args_ as any];
				}
			}
		}

		// 添加引用数据
		{
			node_as?.forEach((v) => {
				if (v.isValid) {
					this._node_set.add(v);
				}
			});

			asset_as?.forEach((v) => {
				if (v.isValid) {
					this._asset_set.add(v);
				}
			});

			object_as?.forEach((v) => {
				this._object_set.add(v);
			});

			call_back_as?.forEach((v) => {
				this._call_back_set.add(v);
			});
		}

		return args_;
	}

	/** 释放所有已添加对象 */
	async release(): Promise<void> {
		this._asset_set.forEach((v) => {
			if (v.isValid) {
				v.decRef();
			}
		});

		this._node_set.forEach((v) => {
			if (v.isValid) {
				v.removeFromParent();
				v.destroy();
			}
		});

		for (const v of this._object_set) {
			await v.release();
		}

		for (const v_f of this._call_back_set) {
			await v_f();
		}

		this._asset_set.clear();
		this._node_set.clear();
		this._object_set.clear();
		this._call_back_set.clear();
	}
}

export namespace mk_release_ {
	/** 释放对象类型 */
	export type release_object_type = { release(): any | Promise<any> };
	/** 释放回调类型 */
	export type release_call_back_type = () => any | Promise<any>;
	/** 释放参数类型 */
	export type release_param_type = cc.Node | cc.Asset | release_object_type | release_call_back_type;

	/** 跟随释放类型 */
	export type follow_release_object<T = release_param_type> = {
		/**
		 * 跟随释放
		 * @param object_ 释放对象/释放对象数组
		 */
		follow_release(object_: T | T[]): any;
	};
}

export default mk_release;
