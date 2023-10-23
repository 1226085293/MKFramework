import * as cc from "cc";
import { tool_monitor_trigger_event } from "../tool_monitor_trigger_event";
import mk from "mk";
import N from "../../../../extends/@node/nodes";

const { ccclass, property } = cc._decorator;

export function check_type(data_: any): boolean {
	return true;
}

export namespace 显示隐藏 {
	@ccclass("data_method_boolean/显示隐藏")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "反向" })
		reverse_b = false;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.active = params_?.reverse_b ? !value : Boolean(value);
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
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					N(node_).label.string = value ? params_.true_s : params_.false_s;
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
					target_[key_] = N(node_).toggle.isChecked as any;
				})
			);
		}

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					N(node_).toggle.isChecked = value as boolean;
				},
				() => {
					node_.off(cc.Toggle.EventType.TOGGLE, event_f);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 勾选框禁用状态 {
	@ccclass("data_method_boolean/勾选框禁用状态")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "反向" })
		reverse_b = false;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					N(node_).toggle.interactable = (params_.reverse_b ? value : !value) as boolean;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 变更颜色 {
	@ccclass("data_method_boolean/变更颜色")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "true" })
		true_color = cc.color();

		@property({ displayName: "false" })
		false_color = cc.color();
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.getComponent(cc.UIRenderer)!.color = value ? params_.true_color : params_.false_color;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 启用组件 {
	@ccclass("data_method_boolean/启用组件")
	export class ccclass_params extends tool_monitor_trigger_event {
		@property({ displayName: "组件名" })
		component_s = "";

		@property({ displayName: "反向" })
		reverse_b = false;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: ccclass_params): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.getComponent(params_.component_s)!.enabled = (params_.reverse_b ? !value : value) as any;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
