import MKCodecBase from "../../MKCodecBase";
import MKNetworkBase, { MKNetworkBase_ } from "../MKNetworkBase";

/**
 * 微信 websocket
 * @noInheritDoc
 */
class MKWebsocketWX<CT extends MKCodecBase = MKCodecBase> extends MKNetworkBase<CT> {
	constructor(config_?: Partial<MKWebsocketWX_.InitConfig<CT>>) {
		super(config_);
		this.config = new MKWebsocketWX_.InitConfig(config_);
	}

	/* --------------- public --------------- */
	config!: Readonly<MKWebsocketWX_.InitConfig<CT>>;
	/* --------------- public --------------- */
	protected _socket!: wx.SocketTask;
	/* ------------------------------- 功能 ------------------------------- */
	/** 重置socket */
	protected _resetSocket(): void {
		if (this._socket) {
			["onOpen", "onMessage", "onError", "onClose"].forEach((vStr, kNum) => {
				this._socket[vStr] = null;
			});

			this._socket.close({});
		}

		this._socket = wx.connectSocket({
			url: this._addrStr!,
			protocols: this.config.protocolStrList,
		});

		const funcNameStrList = ["_open", "_message", "_error", "_close"];

		["onOpen", "onMessage", "onError", "onClose"].forEach((vStr, kNum) => {
			this._socket[vStr] = this[funcNameStrList[kNum]].bind(this);
		});
	}
}

export namespace MKWebsocketWX_ {
	export class InitConfig<CT extends MKCodecBase = MKCodecBase> extends MKNetworkBase_.InitConfig<CT> {
		constructor(init_?: Partial<InitConfig<CT>>) {
			super(init_);
			Object.assign(this, init_);
		}

		/** 协议 */
		protocolStrList: string[] = [];
	}
}

export default MKWebsocketWX;
