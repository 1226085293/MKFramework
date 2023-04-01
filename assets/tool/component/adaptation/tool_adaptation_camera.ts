// // import * as env from "cc/env";
// import config from "../../../config";
// import mm from "../../../mm";
// import game from "../../game";

// const { ccclass, property, requireComponent, executeInEditMode } = cc._decorator;

// /**3d摄像机适配 */
// @ccclass
// @requireComponent(cc.Camera)
// @executeInEditMode
// export default class camera_adaptation extends cc.Component {
// 	/* --------------- private --------------- */
// 	private ortho_height_n: number;
// 	/* -------------------------------segmentation------------------------------- */
// 	onLoad() {
// 		this.ortho_height_n = this.node.getComponent(cc.Camera).orthoHeight;
// 		this._update_adaptation();
// 	}
// 	onEnable(): void {
// 		mm.event.on_g(config.project.event.canvas_change, this._update_adaptation, this).call(this);
// 	}
// 	onDisable(): void {
// 		mm.event.off_g(config.project.event.canvas_change, this._update_adaptation, this);
// 	}
// 	/* -------------------------------segmentation------------------------------- */
// 	/* ------------------------------- 功能 ------------------------------- */
// 	/**更新适配 */
// 	private async _update_adaptation(): Promise<void> {
// 		if (env.EDITOR) {
// 			return;
// 		}
// 		try {
// 			if (!this.node) {
// 				return;
// 			}
// 			await config.project.project.init_task;
// 			let camera = this.node.getComponent(cc.Camera);
// 			/**初始设计尺寸 */
// 			let design_size = game.curr_design_size;
// 			/**真实尺寸 */
// 			let frame_size = cc.view.getDesignResolutionSize();
// 			if (camera.projection === cc.renderer.scene.CameraProjection.ORTHO) {
// 				camera.orthoHeight = this.ortho_height_n * (frame_size.height / design_size.height);
// 			}
// 		} catch (err_a) {
// 			if (!env.EDITOR) {
// 				console.error(err_a);
// 			}
// 		}
// 	}
// }
