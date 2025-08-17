import * as cc from "cc";
import { ToolMonitorTriggerEvent } from "../ToolMonitorTriggerEvent";
import mk from "mk";
// eslint-disable-next-line unused-imports/no-unused-imports
import { CCInteger } from "cc";

const { ccclass, property } = cc._decorator;

export function checkType(data_: any): boolean {
	return typeof data_ === "number";
}

export namespace ProgressBar {
	@ccclass("DataMethodNumber/ProgressBar")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "同步修改" })
		isSyncModify = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		const progress = node_.getComponent(cc.ProgressBar);
		const slider = node_.getComponent(cc.Slider);

		if (!(progress ?? slider)) {
			mk.error("不存在组件");

			return;
		}

		if (params_.isSyncModify && slider) {
			slider.node.on("slide", () => {
				target_[key_] = slider.progress as any;
			});
		}

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					(progress ?? slider)!.progress = value as any;
				},
				() => {
					slider?.node.off("slide");
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 字符变更 {
	@ccclass("DataMethodNumber/字符变更/值")
	export class CCClassParamsValue extends ToolMonitorTriggerEvent {
		@property({ displayName: "键" })
		keyNum = 0;

		@property({ displayName: "值" })
		valueStr = "";
	}

	@ccclass("DataMethodNumber/字符变更")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "对应字符", type: [CCClassParamsValue] })
		valueList: CCClassParamsValue[] = [];
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					mk.N(node_).label.string = params_.valueList.find((v) => v.keyNum === value)?.valueStr ?? "";
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}
