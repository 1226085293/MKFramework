import { _decorator, Component } from "cc";
import { MKAudio_ } from "../Audio/MKAudioExport";
import { MKAsset_ } from "./MKAsset";
import MKRelease, { MKRelease_ } from "./MKRelease";
const { ccclass, property } = _decorator;

/** 跟随节点释放 */
@ccclass
export default class MKNodeRelease extends Component implements MKAsset_.TypeFollowReleaseObject {
	/**
	 * 释放管理器
	 * @internal
	 */
	protected _releaseManage = new MKRelease();

	// @weak-start-content-MKAudioExport
	// @position:/(?<=TypeReleaseParamType)/
	// @import: & MKAudio_.PrivateUnit
	followRelease<T = MKRelease_.TypeReleaseParamType & MKAudio_.PrivateUnit>(object_: T): void {
		// @weak-end
		if (!object_) {
			return;
		}

		// @weak-start-include-MKAudioExport
		// 添加释放对象
		if (MKAudio_ && object_ instanceof MKAudio_.PrivateUnit) {
			if (object_.clip) {
				// 如果模块已经关闭则直接释放
				if (!this.isValid) {
					MKRelease.release(object_.clip);
				} else {
					this._releaseManage.add(object_.clip);
				}
			}
		} else {
			// @weak-end
			// 如果模块已经关闭则直接释放
			if (!this.isValid) {
				MKRelease.release(object_ as any);
			} else {
				this._releaseManage.add(object_ as any);
			}
			// @weak-start-include-MKAudioExport
		}
		// @weak-end
	}

	// @weak-start-content-MKAudioExport
	// @import: & MKAudio_.PrivateUnit
	// @position:/(?<=TypeReleaseParamType)/
	cancelRelease<T = MKRelease_.TypeReleaseParamType & MKAudio_.PrivateUnit>(object_: T): void {
		// @weak-end
		if (!object_) {
			return;
		}

		// @weak-start-include-MKAudioExport
		// 删除释放对象
		if (object_ instanceof MKAudio_.PrivateUnit) {
			if (object_.clip) {
				this._releaseManage.delete(object_.clip);
			}
		} else {
			// @weak-end
			this._releaseManage.delete(object_ as any);
			// @weak-start-include-MKAudioExport
		}
		// @weak-end

		return;
	}

	protected onDestroy(): void {
		this._releaseManage.releaseAll();
	}
}
