import * as cc from "cc";
import { ToolMonitorTriggerEvent } from "../ToolMonitorTriggerEvent";
import mk from "mk";

const { ccclass, property } = cc._decorator;

export function checkType(data_: any): boolean {
	return true;
}

export namespace Toggle {
	@ccclass("DataMethodBoolean/Toggle")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "同步修改" })
		isSyncModify = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		/** 事件函数 */
		let eventFunc: () => void;

		if (params_.isSyncModify) {
			node_.on(
				cc.Toggle.EventType.TOGGLE,
				(eventFunc = () => {
					target_[key_] = mk.N(node_).toggle.isChecked as any;
				})
			);
		}

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					mk.N(node_).toggle.isChecked = value as boolean;
				},
				() => {
					node_.off(cc.Toggle.EventType.TOGGLE, eventFunc);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace Active {
	@ccclass("DataMethodBoolean/Active")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "反向" })
		isReverse = false;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.active = params_?.isReverse ? !value : Boolean(value);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
