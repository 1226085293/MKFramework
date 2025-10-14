import { _decorator, Asset, Component, Node } from "cc";
import type MKRelease from "./MKRelease";
import type { MKRelease_ } from "./MKRelease";
import mkDynamicModule from "../MKDynamicModule";
const mkReleaseExport = mkDynamicModule.all(import("./MKRelease"));
const { ccclass, property } = _decorator;

/** 跟随节点释放 */
@ccclass
class MKFollowNodeRelease extends Component implements MKRelease_.TypeFollowReleaseObject<Asset> {
	/** 初始化状态 */
	private _isInit = false;
	/** 释放管理器 */
	private _releaseManage!: MKRelease;

	followRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): void {
		if (!this._isInit) {
			this._isInit = true;
			this._releaseManage = new mkReleaseExport.default();
			this.node.once(Node.EventType.NODE_DESTROYED, this._onDestroy, this);
		}

		if (!object_) {
			return;
		}

		// 如果节点无效则直接释放
		if (!this.isValid) {
			mkReleaseExport.default.release(object_ as any);
		} else {
			this._releaseManage.add(object_ as any);
		}
	}

	cancelRelease<T = MKRelease_.TypeReleaseParamType>(object_: T): void {
		if (!object_) {
			return;
		}

		// 删除释放对象
		this._releaseManage.delete(object_ as any);

		return;
	}

	private _onDestroy(): void {
		this._releaseManage.releaseAll();
	}
}

export default MKFollowNodeRelease;
