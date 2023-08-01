import * as cc from "cc";
import { mk_log } from "./mk_logger";

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
	 * @param object_ 要跟随模块释放的对象或列表
	 */
	add<T extends mk_release_.release_param_type>(object_: T): T {
		if (!object_) {
			mk_log.error("添加释放对象错误", object_);

			return object_;
		}

		// 添加引用数据
		if (object_ instanceof cc.Node) {
			if (object_.isValid) {
				this._node_set.add(object_);
			}
		} else if (object_ instanceof cc.Asset) {
			if (object_.isValid) {
				this._asset_set.add(object_);
			}
		} else if (typeof object_ === "function") {
			this._call_back_set.add(object_);
		} else {
			this._object_set.add(object_);
		}

		return object_;
	}

	/**
	 * 释放对象
	 * @param object_ 指定对象
	 */
	async release(object_?: mk_release_.release_param_type): Promise<void> {
		if (object_ instanceof cc.Node) {
			if (this._node_set.delete(object_) && object_.isValid) {
				object_.removeFromParent();
				object_.destroy();
			}
		} else if (object_ instanceof cc.Asset) {
			if (this._asset_set.delete(object_) && object_.isValid) {
				object_.decRef();
			}
		} else if (typeof object_ === "function") {
			if (this._call_back_set.delete(object_)) {
				await object_();
			}
		} else if (this._object_set.delete(object_ as any)) {
			await object_!.release();
		}
	}

	/** 释放所有对象 */
	async release_all(): Promise<void> {
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
	export type follow_release_object<CT = release_param_type> = {
		/**
		 * 跟随释放
		 * @param object_ 释放对象/释放对象数组
		 */
		follow_release<T extends CT>(object_: T): T;

		/**
		 * 取消释放
		 * @param object_ 取消释放对象/取消释放对象数组
		 */
		cancel_release<T extends CT>(object_: T): T;
	};
}

export default mk_release;
