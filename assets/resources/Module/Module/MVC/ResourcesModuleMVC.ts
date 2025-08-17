import mk from "mk";
import * as cc from "cc";
import GlobalConfig from "GlobalConfig";
const { ccclass, property } = cc._decorator;

class ResourcesModuleMVCControl extends mk.MVCControlBase<ResourcesModuleMVCModel, ResourcesModuleMVCView> {
	protected async open(): Promise<void> {
		this._model = await ResourcesModuleMVCModel.new();
		this._view = (await ResourcesModuleMVCView.new())!;
		this._view.event.once("close", () => {
			this.close();
		});

		console.log("mvc_control_base-open");
	}

	close(isExternalCall_?: boolean): void {
		console.log("mvc_control_base-close");
	}
}

class ResourcesModuleMVCModel extends mk.MVCModelBase {
	test = 0;

	open(): void {
		console.log("mvc_model_base-open");
	}

	close(): void {
		console.log("mvc_model_base-close");
	}
}

export class ResourcesModuleMVCView extends mk.MVCViewBase<ResourcesModuleMVCModel> {
	static new<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): Promise<InstanceType<T> | null> {
		mk.uiManage.regis(ResourcesModuleMVCView, "db://assets/resources/Module/Module/MVC/ResourcesModuleMVC.prefab", null);

		return mk.uiManage.open(ResourcesModuleMVCView);
	}

	layerTypeNum = GlobalConfig.View.LayerType.窗口;

	protected open(): void {
		console.log("mvc_view_base-open");
		this.node.getChildByName("按钮_关闭")!.once(
			"click",
			() => {
				this.close();
			},
			this
		);
	}

	close(): void {
		console.log("mvc_view_base-close");
		mk.uiManage.unregis(ResourcesModuleMVCView);
	}
}

export default ResourcesModuleMVCControl;
