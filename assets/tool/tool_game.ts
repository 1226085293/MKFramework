import * as cc from "cc";
import global_event from "../@config/global_event";
import mk from "mk";

class tool_game extends mk.instance_base {
	async restart(): Promise<void> {
		await Promise.all(global_event.request(global_event.key.restart));
		cc.game.restart();
	}
}

export default tool_game.instance();
