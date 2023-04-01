import monitor from "../../../../@framework/mk_monitor";
import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return true;
}

export namespace 显示隐藏 {
	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node): void {
		monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.active = Boolean(value);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 字符变更 {
	@ccclass("data_method_boolean/字符变更")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "true" })
		true_s = "";

		@property({ displayName: "false" })
		false_s = "";
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.label.string = value ? params_.true_s : params_.false_s;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 勾选框 {
	@ccclass("data_method_boolean/勾选框")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "同步修改" })
		sync_modify_b = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		/** 事件函数 */
		let event_f: () => void;

		if (params_.sync_modify_b) {
			node_.on(
				cc.Toggle.EventType.TOGGLE,
				(event_f = () => {
					target_[key_] = node_.toggle.isChecked as any;
				})
			);
		}

		monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.toggle.isChecked = value as boolean;
				},
				() => {
					node_.off(cc.Toggle.EventType.TOGGLE, event_f);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
