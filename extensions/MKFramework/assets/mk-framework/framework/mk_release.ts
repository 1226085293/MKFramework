import * as cc from "cc";
import { mkLog } from "./MKLogger";

/**
 * 对象释放器
 * @remarks
 *
 * - 统一 (cc.Node/cc.Asset) 资源的释放逻辑
 *
 * - 可以通过 function 或继承添加自定义释放逻辑
 */
class mk_release {
	/** 节点集合 */
	private _node_set = new Set<cc.Node>();
	/** 资源集合 */
	private _asset_set = new Set<cc.Asset>();
	/** 对象集合 */
	private _object_set = new Set<mk_release_.type_release_object>();
	/** 回调集合 */
	private _callback_set = new Set<mk_release_.type_release_call_back>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 释放对象
	 * @param object_ 指定对象
	 */
	static async release(object_?: mk_release_.type_release_param_type): Promise<void> {
		if (object_ instanceof cc.Node) {
			if (object_.isValid) {
				object_.removeFromParent();
				object_.destroy();
			}
		} else if (object_ instanceof cc.Asset) {
			if (object_.isValid) {
				object_.decRef();
			}
		} else if (typeof object_ === "function") {
			await object_();
		} else if (object_) {
			await object_!.release();
		}
	}

	/**
	 * 添加释放对象
	 * @param object_ 要跟随模块释放的对象或列表
	 */
	add<T extends mk_release_.type_release_param_type>(object_: T): T {
		if (!object_) {
			mkLog.error("添加释放对象错误", object_);

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
			this._callback_set.add(object_);
		} else {
			this._object_set.add(object_);
		}

		return object_;
	}

	/**
	 * 删除释放对象
	 * @param object_ 删除跟随模块释放的对象或列表
	 */
	delete<T extends mk_release_.type_release_param_type>(object_: T): void {
		if (!object_) {
			mkLog.error("删除释放对象错误", object_);

			return;
		}

		// 添加引用数据
		if (object_ instanceof cc.Node) {
			this._node_set.delete(object_);
		} else if (object_ instanceof cc.Asset) {
			this._asset_set.delete(object_);
		} else if (typeof object_ === "function") {
			this._callback_set.delete(object_);
		} else {
			this._object_set.delete(object_);
		}

		return;
	}

	/**
	 * 释放对象
	 * @param object_ 指定对象
	 */
	async release(object_?: mk_release_.type_release_param_type): Promise<void> {
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
			if (this._callback_set.delete(object_)) {
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

		for (const v_f of this._callback_set) {
			await v_f();
		}

		this._asset_set.clear();
		this._node_set.clear();
		this._object_set.clear();
		this._callback_set.clear();
	}
}

export namespace mk_release_ {
	/** 释放对象类型 */
	export type type_release_object = { release(): any | Promise<any> };
	/** 释放回调类型 */
	export type type_release_call_back = () => any | Promise<any>;
	/** 释放参数类型 */
	export type type_release_param_type = cc.Node | cc.Asset | type_release_object | type_release_call_back;

	/** 跟随释放类型 */
	export type type_follow_release_object<CT = type_release_param_type> = {
		/**
		 * 跟随释放
		 * @param object_ 释放对象/释放对象数组
		 */
		followRelease<T extends CT>(object_: T): T;

		/**
		 * 取消释放
		 * @param object_ 取消释放对象/取消释放对象数组
		 */
		cancelRelease<T extends CT>(object_: T): void;
	};
}

export default mk_release;
