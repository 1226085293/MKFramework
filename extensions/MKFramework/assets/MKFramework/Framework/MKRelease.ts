import { Asset, Node } from "cc";
import { mkLog } from "./MKLogger";

/**
 * 对象释放器
 * @remarks
 *
 * - 统一 (Node/Asset) 资源的释放逻辑
 *
 * - 可以通过 function 或继承添加自定义释放逻辑
 */
class MKRelease {
	/** 节点集合 */
	private _nodeSet = new Set<Node>();
	/** 资源集合 */
	private _assetSet = new Set<Asset>();
	/** 对象集合 */
	private _objectSet = new Set<MKRelease_.TypeReleaseObject>();
	/** 回调集合 */
	private _callbackSet = new Set<MKRelease_.TypeReleaseCallBack>();
	/* ------------------------------- 功能 ------------------------------- */
	/**
	 * 释放对象
	 * @param object_ 指定对象
	 */
	static async release(object_?: MKRelease_.TypeReleaseParamType): Promise<void> {
		if (object_ instanceof Node) {
			if (object_.isValid) {
				object_.removeFromParent();
				object_.destroy();
			}
		} else if (object_ instanceof Asset) {
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
	add<T extends MKRelease_.TypeReleaseParamType>(object_: T): T {
		if (!object_) {
			mkLog.error("添加释放对象错误", object_);

			return object_;
		}

		// 添加引用数据
		if (object_ instanceof Node) {
			if (object_.isValid) {
				this._nodeSet.add(object_);
			}
		} else if (object_ instanceof Asset) {
			if (object_.isValid) {
				this._assetSet.add(object_);
			}
		} else if (typeof object_ === "function") {
			this._callbackSet.add(object_);
		} else {
			this._objectSet.add(object_);
		}

		return object_;
	}

	/**
	 * 删除释放对象
	 * @param object_ 删除跟随模块释放的对象或列表
	 */
	delete<T extends MKRelease_.TypeReleaseParamType>(object_: T): void {
		if (!object_) {
			mkLog.error("删除释放对象错误", object_);

			return;
		}

		// 添加引用数据
		if (object_ instanceof Node) {
			this._nodeSet.delete(object_);
		} else if (object_ instanceof Asset) {
			this._assetSet.delete(object_);
		} else if (typeof object_ === "function") {
			this._callbackSet.delete(object_);
		} else {
			this._objectSet.delete(object_);
		}

		return;
	}

	/**
	 * 释放对象
	 * @param object_ 指定对象
	 */
	async release(object_?: MKRelease_.TypeReleaseParamType): Promise<void> {
		if (object_ instanceof Node) {
			if (this._nodeSet.delete(object_) && object_.isValid) {
				object_.removeFromParent();
				object_.destroy();
			}
		} else if (object_ instanceof Asset) {
			if (this._assetSet.delete(object_) && object_.isValid) {
				object_.decRef();
			}
		} else if (typeof object_ === "function") {
			if (this._callbackSet.delete(object_)) {
				await object_();
			}
		} else if (this._objectSet.delete(object_ as any)) {
			await object_!.release();
		}
	}

	/** 释放所有对象 */
	async releaseAll(): Promise<void> {
		this._assetSet.forEach((v) => {
			if (v.isValid) {
				v.decRef();
			}
		});

		this._nodeSet.forEach((v) => {
			if (v.isValid) {
				v.removeFromParent();
				v.destroy();
			}
		});

		for (const v of this._objectSet) {
			await v.release();
		}

		for (const vFunc of this._callbackSet) {
			await vFunc();
		}

		this._assetSet.clear();
		this._nodeSet.clear();
		this._objectSet.clear();
		this._callbackSet.clear();
	}
}

export namespace MKRelease_ {
	/** 释放对象类型 */
	export type TypeReleaseObject = { release(): any | Promise<any> };
	/** 释放回调类型 */
	export type TypeReleaseCallBack = () => any | Promise<any>;
	/** 释放参数类型 */
	export type TypeReleaseParamType = Node | Asset | TypeReleaseObject | TypeReleaseCallBack;

	/** 跟随释放类型 */
	export type TypeFollowReleaseObject<CT = TypeReleaseParamType> = {
		/**
		 * 跟随释放
		 * @param object_ 释放对象/释放对象数组
		 */
		followRelease<T extends CT>(object_: T): void;

		/**
		 * 取消释放
		 * @param object_ 取消释放对象/取消释放对象数组
		 */
		cancelRelease<T extends CT>(object_: T): void;
	};
}

export default MKRelease;
