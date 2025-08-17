import * as cc from "cc";
import { ToolMonitorTriggerEvent } from "../ToolMonitorTriggerEvent";
import mk from "mk";
import tool_node from "../../../ToolNode";

const { ccclass, property } = cc._decorator;

export function checkType(data_: any): boolean {
	return typeof data_ === "string" || typeof data_ === "number";
}

export namespace Label {
	@ccclass("DataMethodString/Label")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "前缀" })
		headStr = "";

		@property({ displayName: "后缀" })
		tailStr = "";
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		const languageComp = node_.getComponent(mk.language.Label);

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					if (languageComp?.isValid) {
						languageComp.markStr = params_.headStr + String(value) + params_.tailStr;
					} else {
						mk.N(node_).label.string = params_.headStr + String(value) + params_.tailStr;
					}
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace 远程图片 {
	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node): void {
		mk.monitor
			.on(
				target_,
				key_,
				async (value) => {
					const valueStr = String(value);

					if (!valueStr) {
						return;
					}

					const assets = await mk.asset.get(valueStr, cc.ImageAsset, null, {
						remoteOption: {
							ext: ".png",
						},
					});

					if (!assets) {
						return;
					}

					mk.N(node_).sprite.spriteFrame = cc.SpriteFrame.createWithImage(assets);

					// 找到视图基类添加自动释放
					const viewComp = tool_node.traverseParent(node_, (node) => Boolean(node.getComponent(mk.ViewBase)))?.getComponent(mk.ViewBase);

					if (!viewComp) {
						mk.error("未找到父模块，不能自动释放动态资源");

						return;
					}

					viewComp.followRelease(assets);
				},
				target_
			)
			?.call(target_, target_[key_]);
	}
}

export namespace EditBox {
	@ccclass("DataMethodString/EditBox")
	export class CCClassParams extends ToolMonitorTriggerEvent {
		@property({ displayName: "同步修改" })
		isSyncModify = true;
	}

	export function on<T, T2 extends keyof T>(target_: T, key_: T2, node_: cc.Node, params_: CCClassParams): void {
		const typeStr = typeof target_[key_];

		mk.monitor
			.on(
				target_,
				key_,
				(value) => {
					const valueStr = String(value);

					mk.N(node_).editBox.string = valueStr;
				},
				() => {
					mk.N(node_).editBox.node.off(cc.EditBox.EventType.EDITING_DID_ENDED);
				},
				target_
			)
			?.call(target_, target_[key_]);

		// 同步修改
		if (params_.isSyncModify) {
			mk.N(node_).editBox.node.on(cc.EditBox.EventType.EDITING_DID_ENDED, () => {
				target_[key_] = (typeStr === "string" ? mk.N(node_).editBox.string : Number(mk.N(node_).editBox.string)) as any;
			});
		}
	}
}
