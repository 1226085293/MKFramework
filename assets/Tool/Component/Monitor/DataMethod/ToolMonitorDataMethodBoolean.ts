import * as cc from "cc";
import { ToolMonitorTriggerEvent } from "../ToolMonitorTriggerEvent";
import mk from "mk";

const { ccclass, property } = cc._decorator;

export function checkType(data_: any): boolean {
	return true;
}

export namespace 显示隐藏 {
	@ccclass("DataMethodBoolean/显示隐藏")
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

export namespace 字符变更 {
	@ccclass("DataMethodBoolean/字符变更")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "true" })
		trueStr = "";

		@property({ displayName: "false" })
		falseStr = "";
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					mk.N(node_).label.string = value ? params_.trueStr : params_.falseStr;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 勾选框 {
	@ccclass("DataMethodBoolean/勾选框")
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

export namespace 勾选框禁用状态 {
	@ccclass("DataMethodBoolean/勾选框禁用状态")
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
					mk.N(node_).toggle.interactable = (params_.isReverse ? value : !value) as boolean;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 变更颜色 {
	@ccclass("DataMethodBoolean/变更颜色")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "true" })
		trueColor = cc.color();

		@property({ displayName: "false" })
		falseColor = cc.color();
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.getComponent(cc.UIRenderer)!.color = value ? params_.trueColor : params_.falseColor;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 启用组件 {
	@ccclass("DataMethodBoolean/启用组件")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "组件名" })
		componentStr = "";

		@property({ displayName: "反向" })
		isReverse = false;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					node_.getComponent(params_.componentStr)!.enabled = (params_.isReverse ? !value : value) as any;
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
