import mk from "mk";
import { _decorator, EventHandler, Label, Node } from "cc";
import ToolMonitorDataMethod from "db://assets/Tool/Component/Monitor/DataMethod/ToolMonitorDataMethod";
import GlobalConfig from "GlobalConfig";
const { ccclass, property } = _decorator;

export class ResourcesModuleMVVMModel extends mk.MVCModelBase {}

export class ResourcesModuleMVVM extends mk.MVCControlBase<ResourcesModuleMVVMModel, ResourcesModuleMVVMView> {
	/* ------------------------------- segmentation ------------------------------- */
	async open(): Promise<void> {
		this._model = await ResourcesModuleMVVMModel.new();
		this._view = (await ResourcesModuleMVVMView.new())!;
	}
}

@ccclass("ResourcesModuleMVVMView")
class ResourcesModuleMVVMView extends mk.MVCViewBase<ResourcesModuleMVVMModel> {
	static new<T extends new (...argsList_: any[]) => any>(this: T): Promise<InstanceType<T> | null> {
		mk.uiManage.regis(ResourcesModuleMVVMView, "db://assets/resources/Module/Module/MVVM/ResourcesModuleMVVM.prefab", null);

		return mk.uiManage.open(ResourcesModuleMVVMView);
	}

	layerTypeNum = GlobalConfig.View.LayerType.窗口;
	data = new (class {
		labelStr = "1";
		isToggle = false;
		dataList: string[] = [];
	})();

	protected open(): void | Promise<void> {
		this.node.getChildByName("按钮_关闭")!.once(
			"click",
			() => {
				this.close();
			},
			this
		);

		this.schedule(() => {
			this.data.labelStr = String(Number(this.data.labelStr) + 1);
			this.data.isToggle = !this.data.isToggle;
			this.data.dataList.push(this.data.dataList.length + 1 + "");
		}, 1);

		ToolMonitorDataMethod.string.Label.on(this.data, "labelStr", this.node.getChildByPath("Layout/Label/node")!, { headStr: "", tailStr: "" });
		ToolMonitorDataMethod.boolean.Toggle.on(this.data, "isToggle", this.node.getChildByPath("Layout/Toggle/node")!, {
			isSyncModify: false,
		});

		ToolMonitorDataMethod.array.Default.on(this.data, "dataList", this.node.getChildByPath("Layout/ScrollView/node")!, {
			isRecycle: true,
			eventChildUpdate: (() => {
				const event = new EventHandler();

				event.target = this.node;
				event.component = "ResourcesModuleMVVMView";
				event.handler = "onRenderListItem";

				return event;
			})(),
		});
	}

	close(config_?: Omit<mk.UIManage_.CloseConfig<any>, "type" | "isAll">): void | Promise<void> {
		mk.uiManage.unregis(ResourcesModuleMVVMView);
	}

	onRenderListItem(node_: Node, data_: string): void {
		node_.getComponent(Label)!.string = data_;
	}
}

export default ResourcesModuleMVVMView;
