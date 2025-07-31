import mk from "mk";
import * as cc from "cc";
const { ccclass, property } = cc._decorator;

class Control extends mk.MVCControlBase<Model, View> {
	protected async open(): Promise<void> {
		this._model = await Model.new();
		this._view = (await View.new())!;
		this._view.event.once("close", () => {
			this.close();
		});

		console.log("mvc_control_base-open");
	}

	close(isExternalCall_?: boolean): void {
		console.log("mvc_control_base-close");
	}
}

class Model extends mk.MVCModelBase {
	test = 0;

	open(): void {
		console.log("mvc_model_base-open");
	}

	close(): void {
		console.log("mvc_model_base-close");
	}
}

export class View extends mk.MVCViewBase<Model> {
	static new<T extends new (...argsList: any[]) => any>(this: T, ...argsList_: ConstructorParameters<T>): Promise<InstanceType<T> | null> {
		mk.uiManage.regis(View, "db://assets/resources/Module/Module/MVC/ResourcesModuleMVC.prefab", null);

		return mk.uiManage.open(View);
	}

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
		this.event.emit("close");
	}
}

export default Control;
