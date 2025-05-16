import mk from "mk";
import * as cc from "cc";
const { ccclass, property } = cc._decorator;

class c extends mk.mvc_control_base<m, v> {
	protected async open(): Promise<void> {
		this._model = await m.new();
		this._view = (await v.new())!;
		this._view.event.once("close", () => {
			this.close();
		});

		console.log("mvc_control_base-open");
	}

	close(external_call_b?: boolean): void {
		console.log("mvc_control_base-close");
	}
}

class m extends mk.mvc_model_base {
	test = 0;

	open(): void {
		console.log("mvc_model_base-open");
	}

	close(): void {
		console.log("mvc_model_base-close");
	}
}

export class v extends mk.mvc_view_base<m> {
	static new<T extends new (...args_as: any[]) => any>(this: T, ...args_as_: ConstructorParameters<T>): Promise<InstanceType<T> | null> {
		mk.ui_manage.regis(v, "db://assets/resources/module/module/mvc/resources_module_mvc.prefab", null);

		return mk.ui_manage.open(v);
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

export default c;
