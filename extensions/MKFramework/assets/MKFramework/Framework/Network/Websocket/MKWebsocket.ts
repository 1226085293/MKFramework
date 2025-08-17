import MKCodecBase from "../../MKCodecBase";
import MKNetworkBase, { MKNetworkBase_ } from "../MKNetworkBase";

/**
 * 通用 websocket
 * @noInheritDoc
 */
class MKWebsocket<CT extends MKCodecBase = MKCodecBase> extends MKNetworkBase<CT> {
	constructor(config_?: Partial<MKWebsocket_.InitConfig<CT>>) {
		super(config_);
		this.config = new MKWebsocket_.InitConfig(config_);
	}

	/* --------------- public --------------- */
	config: Readonly<MKWebsocket_.InitConfig<CT>>;
	/* --------------- private --------------- */
	protected _socket!: WebSocket;
	/* ------------------------------- 功能 ------------------------------- */
	/** 重置socket */
	protected _resetSocket(): void {
		if (this._socket) {
			["onopen", "onmessage", "onerror", "onclose"].forEach((vStr, kNum) => {
				this._socket![vStr] = null;
			});

			this._socket.close();
		}

		this._socket = new WebSocket(this._addrStr!, this.config.protocolStrList);
		this._socket.binaryType = this.config.binaryType;
		const funcNameStrList = ["_open", "_message", "_error", "_close"];

		["onopen", "onmessage", "onerror", "onclose"].forEach((vStr, kNum) => {
			this._socket![vStr] = this[funcNameStrList[kNum]].bind(this);
		});
	}
}

export namespace MKWebsocket_ {
	export class InitConfig<CT extends MKCodecBase = MKCodecBase> extends MKNetworkBase_.InitConfig<CT> {
		constructor(init_?: Partial<InitConfig<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 通信类型 */
		binaryType: "blob" | "arraybuffer" = "arraybuffer";
		/** 协议 */
		protocolStrList: string[] = [];
	}
}

export default MKWebsocket;
