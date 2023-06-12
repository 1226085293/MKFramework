import mk_codec_base from "../../mk_codec_base";
import mk_network_base, { mk_network_base_ } from "../mk_network_base";

/** websocket */
class mk_websocket<CT extends mk_codec_base = mk_codec_base> extends mk_network_base<CT> {
	constructor(config_?: Partial<mk_websocket_.init_config<CT>>) {
		super(config_);
		this.config = new mk_websocket_.init_config(config_);
	}

	/* --------------- public --------------- */
	config: Readonly<mk_websocket_.init_config<CT>>;
	/* --------------- private --------------- */
	protected _socket!: WebSocket;
	/* ------------------------------- 功能 ------------------------------- */
	/** 重置socket */
	protected _reset_socket(): void {
		if (this._socket) {
			["onopen", "onmessage", "onerror", "onclose"].forEach((v_s, k_n) => {
				this._socket![v_s] = null;
			});

			this._socket.close();
		}

		this._socket = new WebSocket(this._addr_s!, this.config.protocol_ss);
		this._socket.binaryType = this.config.binary_type;
		const func_name_ss = ["_open", "_message", "_error", "_close"];

		["onopen", "onmessage", "onerror", "onclose"].forEach((v_s, k_n) => {
			this._socket![v_s] = this[func_name_ss[k_n]].bind(this);
		});
	}
}

export namespace mk_websocket_ {
	export class init_config<CT extends mk_codec_base = mk_codec_base> extends mk_network_base_.init_config<CT> {
		constructor(init_?: Partial<init_config<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 通信类型 */
		binary_type: "blob" | "arraybuffer" = "arraybuffer";
		/** 协议 */
		protocol_ss: string[] = [];
	}
}

export default mk_websocket;
