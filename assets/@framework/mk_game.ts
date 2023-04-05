import * as cc from "cc";
import global_event from "../@config/global_event";
import mk_instance_base from "./mk_instance_base";

class mk_game extends mk_instance_base {
	/** 重启中 */
	private _restarting_b = false;

	/** 重启中 */
	get restarting_b(): boolean {
		return this._restarting_b;
	}

	/* ------------------------------- 功能 ------------------------------- */
	async restart(): Promise<void> {
		this._restarting_b = true;
		await Promise.all(global_event.request(global_event.key.restart));
		await Promise.all(global_event.request(global_event.key.wait_close_scene));
		cc.game.restart();
		this._restarting_b = false;
	}
}

export default mk_game.instance();
