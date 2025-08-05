import { js, Constructor, EventTarget } from "cc";
import GlobalConfig from "../../Config/GlobalConfig";
import GlobalEvent from "../../Config/GlobalEvent";
import MKCodecBase from "../MKCodecBase";
import MKEventTarget from "../MKEventTarget";
import MKInstanceBase from "../MKInstanceBase";
import MKLogger from "../MKLogger";
import MKStatusTask from "../Task/MKStatusTask";

namespace _MKNetworkBase {
	/** 从 T 中排除 null, undefined, void */
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
	type TypeNonVoid<T> = T extends null | undefined | void ? never : T;

	/** 消息协议 */
	export interface EventProtocol<T extends MKCodecBase = MKCodecBase> {
		/** 网络连接 */
		open(): void;
		/**
		 * 网络断开
		 * @param event socket 事件
		 */
		close(event: any): void;
		/** 重连成功 */
		reconnectSuccess(): void;
		/** 重连失败 */
		reconnectFail(): void;
		/**
		 * 心跳超时
		 * @remarks
		 * 在接收心跳超时时通知
		 */
		heartbeatTimeout(): void;
		/**
		 * 收到任意消息
		 * @param data 收到的消息
		 */
		recv(data: TypeNonVoid<ReturnType<T["decode"]>>): void;
	}

	/** 消息事件 */
	export class MessageEvent<CT extends MKCodecBase = MKCodecBase> extends EventTarget {
		constructor(network_: MKNetworkBase) {
			super();
			this._network = network_;
		}

		/* --------------- private --------------- */
		/** 网络实例 */
		private _network: MKNetworkBase;
		/** 日志 */
		private _log = new MKLogger(js.getClassName(this));
		/* ------------------------------- 功能 ------------------------------- */
		// @ts-ignore
		on<T extends Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_: T2,
			this_?: any,
			isOnce_?: boolean
		): typeof callback_ | null {
			if (typeof type_ === "function") {
				const messageId = this._network.config.parseMessageIdFunc(type_.prototype);

				if (messageId !== undefined) {
					return super.on(messageId, callback_, this_, isOnce_);
				}
			} else {
				return super.on(type_, callback_, this_, isOnce_);
			}

			return null;
		}

		// @ts-ignore
		once<T extends Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_: T2,
			this_?: any
		): typeof callback_ | null {
			return this.on(type_, callback_, this_, true);
		}

		// @ts-ignore
		off<T extends Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_?: T2,
			this_?: any
		): void {
			if (typeof type_ === "function") {
				const messageId = this._network.config.parseMessageIdFunc(type_.prototype);

				if (messageId !== undefined) {
					super.off(messageId, callback_, this_);

					return;
				}
			} else {
				super.off(type_, callback_, this_);
			}
		}

		/**
		 * 派发事件
		 * @param data_ 消息数据
		 * @remarks
		 * 接收消息后派发，可用此接口模拟数据
		 */
		emit<T extends GlobalConfig.Network.ProtoHead>(data_: T): void;
		/**
		 * 派发事件
		 * @param type_ 消息号
		 * @param data_  消息数据
		 * @remarks
		 * 接收消息后派发，可用此接口模拟数据
		 */
		emit<T extends string | number>(type_: T, data_: any): void;
		emit<T extends Constructor<GlobalConfig.Network.ProtoHead> | string | number>(args_: T, data_?: any): void {
			let type_: string | number | undefined;

			// 参数转换
			if (typeof args_ === "object") {
				data_ = args_;
			} else {
				type_ = args_ as any;
			}

			if (type_ !== undefined) {
				super.emit(type_, data_);
			} else {
				const messageId = this._network.config.parseMessageIdFunc(args_);

				if (messageId === undefined) {
					this._log.error("消息 id 解析错误");

					return;
				}

				super.emit(messageId, args_);
			}
		}

		/**
		 * 发送
		 * @param data_ 发送数据
		 * @returns
		 */
		send<T = Parameters<CT["encode"]>[0]>(data_: T): void {
			this._network._send(data_);
		}

		/**
		 * 请求
		 * @param data_ 发送数据
		 * @param timeoutMsNum_ 超时时间，-1：不设置，0-n：不填则为初始化配置中的 waitTimeoutMsNum
		 * @returns
		 * @remarks
		 * 等待事件回调返回
		 */
		request<T extends Parameters<CT["encode"]>[0]>(data_: T, timeoutMsNum_?: number): Promise<any> | null {
			this._network._send(data_);

			return this._network._wait(data_, timeoutMsNum_);
		}

		// @ts-ignore
		has<T extends Constructor<GlobalConfig.Network.ProtoHead> | string | number, T2 extends (event_: T["prototype"]) => void>(
			type_: T,
			callback_?: T2,
			target_?: any
		): boolean {
			if (typeof type_ === "function") {
				const messageId = this._network.config.parseMessageIdFunc(type_.prototype);

				if (messageId !== undefined) {
					return super.hasEventListener(messageId as any, callback_, target_);
				}
			} else {
				return super.hasEventListener(type_ as any, callback_, target_);
			}

			return false;
		}

		clear(): void {
			return super["clear"]();
		}
	}
}

/**
 * 网络系统基类
 * @noInheritDoc
 * @remarks
 *
 * - 支持多实例
 *
 * - (心跳/断线重连)支持
 *
 * - 网络消息接口事件化
 *
 * - 支持消息潮
 *
 * - 网络消息模拟
 */
abstract class MKNetworkBase<CT extends MKCodecBase = MKCodecBase> extends MKInstanceBase {
	constructor(init_?: Partial<MKNetworkBase_.InitConfig<CT>>) {
		super();
		this.config = new MKNetworkBase_.InitConfig(init_);

		// 启动心跳
		this._startHeartbeat();

		// 事件监听
		GlobalEvent.on(GlobalEvent.key.restart, this._onRestart, this);
	}

	/* --------------- public --------------- */
	/** 网络事件 */
	event = new MKEventTarget<_MKNetworkBase.EventProtocol<CT>>();
	/** 消息事件 */
	message: _MKNetworkBase.MessageEvent<CT> = new _MKNetworkBase.MessageEvent<CT>(this);
	/** 配置信息 */
	config: Readonly<MKNetworkBase_.InitConfig<CT>>;

	/** socket 状态 */
	get state(): MKNetworkBase_.Status {
		return this._state;
	}

	/** 编解码器 */
	get codec(): CT | undefined {
		return this.config.codec;
	}

	set codec(value_) {
		(this.config as MKNetworkBase_.InitConfig<CT>).codec = value_;
	}

	/* --------------- protected --------------- */
	/** socket */
	protected abstract _socket: any;
	/** 日志 */
	protected _log = new MKLogger(js.getClassName(this));
	/** socket 状态 */
	protected _state = MKNetworkBase_.Status.Closed;
	/** 地址 */
	protected _addrStr!: string;
	/**
	 * 写入睡眠状态
	 * @internal
	 */
	protected _isWriteSleep2 = true;
	/** 写入队列 */
	protected _writeList: any[] = [];
	/* --------------- private --------------- */
	/** 重连计数 */
	private _reconnectCountNum = 0;
	/** 重连定时器 */
	private _reconnectTimer: any = null;
	/** 发送定时器 */
	private _sendTimer: any = null;
	/** 等待任务表 */
	private _waitTaskMap = new Map<string | number, MKStatusTask<any>>();
	/** 写睡眠状态 */
	private get _isWriteSleep(): boolean {
		return this._isWriteSleep2;
	}

	private set _isWriteSleep(value_) {
		this._setIsWriteSleep(value_);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 重置 socket */
	protected abstract _resetSocket(): void;

	/** 连接 */
	connect(addrStr_: string): Promise<void> {
		this._state = MKNetworkBase_.Status.Connecting;
		this._addrStr = addrStr_;
		this._resetSocket();

		return new Promise<void>((resolveFunc) => {
			this.event.once(this.event.key.open, resolveFunc);
		});
	}

	/** 断开 */
	close(): void {
		this._state = MKNetworkBase_.Status.Closing;
		this._socket?.close();
	}

	/**
	 * 发送
	 * @param data_ 发送数据
	 * @returns
	 * @internal
	 */
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_send(data_: Parameters<CT["encode"]>[0]): void {
		this._writeList.push(data_);

		// 更新状态
		if (this._isWriteSleep) {
			this._isWriteSleep = false;
		}
	}

	/**
	 * 等待消息
	 * @param key_ 消息键
	 * @param timeoutMsNum_ 超时时间
	 * @returns
	 * @internal
	 */
	// @ts-ignore
	// eslint-disable-next-line @typescript-eslint/naming-convention
	_wait<T, T2 = T["prototype"] extends Object ? T["prototype"] : any>(
		key_: T,
		timeoutMsNum_ = this.config.waitTimeoutMsNum
		// @ts-ignore
	): Promise<T2 | null> | null {
		/** 消息序列号 */
		const messageSequence = this.config.parseMessageSequenceFunc(key_);

		if (messageSequence === undefined) {
			this._log.error("消息序列号解析错误");

			return null;
		}

		/** 指定标记的等待数据 */
		let waitTask = this._waitTaskMap.get(messageSequence);

		if (waitTask) {
			return waitTask.task;
		} else {
			this._waitTaskMap.set(
				messageSequence,
				(waitTask = new MKStatusTask(false, {
					timeoutMsNum: timeoutMsNum_,
				}))
			);
		}

		return waitTask.task;
	}

	/** socket 准备完成 */
	protected _open(event_: any): void {
		this._state = MKNetworkBase_.Status.Open;
		this._log.debug("socket 准备完成", event_);
		if (this._writeList.length) {
			this._isWriteSleep = false;
		}

		// 取消重连
		this._cancelReconnect(true);

		// 事件通知
		this.event.emit(this.event.key.open);
	}

	/** socket 消息 */
	protected async _message(event_: any): Promise<void> {
		const data = this.config.codec ? await this.config.codec.decode(event_.data) : event_.data;

		if (data === undefined) {
			return;
		}

		this._log.debug("收到消息", data);

		// 事件通知
		this.event.emit(this.event.key.recv, data);

		/** 消息 id */
		const messageId = this.config.parseMessageIdFunc(data);

		if (messageId !== undefined) {
			// 指定事件通知
			this.message.emit(messageId, data);

			// 触发等待消息
			this._triggerWaitTask(data);
		}
	}

	/** socket 错误 */
	protected _error(event_: any): void {
		if (this._state === MKNetworkBase_.Status.Open) {
			this._log.error("socket 错误", event_);
		}
	}

	/** socket 关闭 */
	protected _close(event_: any): void {
		const lastStatus = this._state;

		this._state = MKNetworkBase_.Status.Closed;

		if (lastStatus !== MKNetworkBase_.Status.Closed) {
			this._log.warn("socket 关闭", event_);
			this.event.emit(this.event.key.close, event_);
		}

		// 超出最大重连次数
		if (this._reconnectTimer !== null) {
			if (++this._reconnectCountNum > this.config.maxReconnectNum) {
				this._cancelReconnect(false);

				return;
			}

			this._log.warn("socket 重连计数", this._reconnectCountNum);
		}

		// 准备重连
		if (lastStatus === MKNetworkBase_.Status.Open && this._reconnectTimer === null) {
			this._log.warn("socket 开始重连");
			this._isWriteSleep = true;
			this._reconnectTimer = setInterval(this._timerReconnect.bind(this), this.config.reconnectIntervalMsNum);
		}
	}

	/** 定时发送 */
	protected async _timerSend(): Promise<void> {
		// 保证网络正常
		if (this._socket?.readyState !== WebSocket.OPEN) {
			return;
		}

		// 发送完成进入睡眠
		if (this._writeList.length === 0) {
			this._isWriteSleep = true;

			return;
		}

		let dataList = this._writeList.splice(0, this._writeList.length);

		if (this.config.codec) {
			dataList = await Promise.all(dataList.map((v) => this.config.codec!.encode(v)));
		}

		for (const v of dataList) {
			if ((v ?? null) !== null) {
				this._socket.send(v);
			}
		}
	}

	/** 定时重连 */
	protected _timerReconnect(): void {
		if (this._socket.readyState !== WebSocket.OPEN) {
			this._resetSocket();
		}
		// 重连成功
		else if (this._reconnectTimer !== null) {
			this._cancelReconnect(true);
		}
	}

	/**
	 * 取消重连
	 * @param isStatus_ 成功 | 失败
	 * @returns
	 */
	protected _cancelReconnect(isStatus_: boolean): void {
		if (this._reconnectTimer === null) {
			return;
		}

		this._log.warn("socket 重连" + (isStatus_ ? "成功" : "失败"));

		// 事件通知
		this.event.emit(isStatus_ ? this.event.key.reconnectSuccess : this.event.key.reconnectFail);

		// 清理重连数据
		{
			clearInterval(this._reconnectTimer);
			this._reconnectTimer = null;
			this._reconnectCountNum = 0;
		}
	}

	/**
	 * 触发等待任务
	 * @param data_ 收到的消息
	 * @returns
	 */
	protected _triggerWaitTask(data_: any): void {
		/** 消息 id */
		const messageId = this.config.parseMessageIdFunc(data_);
		/** 消息序列号 */
		const messageSequence = this.config.parseMessageSequenceFunc(data_);

		if (messageId === undefined) {
			this._log.error("消息 id 解析错误");

			return;
		}

		// 触发等待任务
		if (messageSequence !== undefined) {
			const waitTask = this._waitTaskMap.get(messageSequence);

			if (!waitTask) {
				return;
			}

			this._waitTaskMap.delete(messageSequence);
			waitTask.finish(true, data_);
		}
	}

	/** 初始化心跳 */
	protected _startHeartbeat(): void {
		if (!this.config.heartbeatConfig) {
			return;
		}

		/** 心跳超时定时器 */
		let timeoutTimer: any;

		/** 接收心跳回调 */
		const recvFunc = (): void => {
			if (timeoutTimer) {
				clearTimeout(timeoutTimer);
			}

			// 超时检测
			timeoutTimer = setTimeout(() => {
				// 心跳超时
				if (this.state !== MKNetworkBase_.Status.Open) {
					this.event.emit(this.event.key.heartbeatTimeout);
				}
			}, this.config.heartbeatConfig!.timeoutMsN);
		};

		/** 心跳数据获取函数 */
		const getSendDataFunc = this.config.heartbeatConfig.initFunc(recvFunc);

		// 服务端到客户端，清理心跳超时定时器，防止心跳期间重连导致误超时
		this.event.on(
			this.event.key.close,
			() => {
				clearTimeout(timeoutTimer);
				timeoutTimer = null;
			},
			this
		);

		// 客户端到服务端
		if (getSendDataFunc) {
			/** 心跳定时器 */
			let timer: any;

			// 启动心跳
			this.event.on(
				this.event.key.open,
				() => {
					timer = setInterval(() => {
						this._socket.send(getSendDataFunc());
					}, this.config.heartbeatConfig!.intervalMsN);
				},
				this
			);

			// 关闭心跳
			this.event.on(
				this.event.key.close,
				() => {
					clearInterval(timer);
					timer = null;
				},
				this
			);
		}
	}

	/* ------------------------------- get/set ------------------------------- */
	protected _setIsWriteSleep(value_: boolean): void {
		if (this._isWriteSleep2 === value_) {
			return;
		}

		if (value_) {
			if (this._sendTimer !== null) {
				clearInterval(this._sendTimer);
				this._sendTimer = null;
			}
		} else {
			this._sendTimer = setInterval(this._timerSend.bind(this), this.config.sendIntervalMsNum);
		}

		this._isWriteSleep2 = value_;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	protected _onRestart(): void {
		// 写睡眠
		this._isWriteSleep = true;
		// 关闭网络事件
		this.event.emit(this.event.key.close, null);
		// 清理事件
		this.event.clear();
		this.message.clear();
		// 清理发送消息
		this._writeList.splice(0, this._writeList.length);

		// 清理等待消息
		{
			this._waitTaskMap.forEach((v) => {
				v.finish(true, null);
			});

			this._waitTaskMap.clear();
		}

		// 取消重连
		this._cancelReconnect(false);
		// 关闭网络
		this.close();
	}
}

export namespace MKNetworkBase_ {
	/** 状态类型 */
	export enum Status {
		/** 连接中 */
		Connecting,
		/** 已连接 */
		Open,
		/** 关闭中 */
		Closing,
		/** 已关闭 */
		Closed,
	}

	/** 初始化配置 */
	export class InitConfig<CT extends MKCodecBase = MKCodecBase> {
		constructor(init_?: Partial<InitConfig<CT>>) {
			Object.assign(this, init_);
		}

		/** 编解码器 */
		codec?: CT;
		/**
		 * 发送间隔
		 * @remarks
		 * 单位：毫秒
		 */
		sendIntervalMsNum = 0;
		/**
		 * 重连间隔
		 * @remarks
		 * 单位：毫秒
		 */
		reconnectIntervalMsNum = 1000;
		/** 最大重连次数 */
		maxReconnectNum = 5;
		/**
		 * 等待消息超时时间
		 * @remarks
		 * 单位：毫秒
		 */
		waitTimeoutMsNum = 5000;
		/** 心跳配置 */
		heartbeatConfig?: {
			/**
			 * 发送间隔
			 * @remarks
			 * 单位：毫秒
			 */
			intervalMsN?: number;
			/**
			 * 超时时间
			 * @remarks
			 * 单位：毫秒
			 */
			timeoutMsN: number;
			/**
			 * 初始化
			 * @param doneFunc 接收到心跳后手动调用，server -> client，用于心跳超时检测
			 * @returns 返回心跳数据的函数，client -> server，不为空则向服务器定时发送
			 */
			initFunc(doneFunc: () => void): null | (() => any);
		};

		/**
		 * 解析消息 id
		 * @param data 接收的消息
		 * @returns 消息号
		 */
		parseMessageIdFunc(data: any): string | number {
			return undefined!;
		}

		/**
		 * 解析消息序列号
		 * @param data 接收的消息
		 * @returns 消息序列号
		 */
		parseMessageSequenceFunc(data: any): string | number | undefined {
			return;
		}
	}

	/** 发送潮 */
	export class SendTide<CT extends MKCodecBase = MKCodecBase> {
		/**
		 * @param network_ 网络实例
		 * @param intervalMsN_ 发送间隔
		 *
		 * - -1：手动触发
		 *
		 * - 0-n：自动发送间隔毫秒
		 */
		constructor(network_: MKNetworkBase, intervalMsN_: number) {
			this._network = network_;
			this._sendIntervalMsNum = intervalMsN_;

			// 事件监听
			GlobalEvent.on(GlobalEvent.key.restart, this._onRestart, this);
		}

		/** 网络节点 */
		private _network!: MKNetworkBase;
		/**
		 * 发送间隔
		 * @remarks
		 *
		 * - -1：手动触发
		 *
		 * - \>0：自动发送间隔毫秒
		 */
		private _sendIntervalMsNum: number;
		/** 消息列表 */
		private _messList: any[] = [];
		/** 发送倒计时 */
		private _sendTimer: any = null;
		/* ------------------------------- 功能 ------------------------------- */
		/** 发送 */
		send(data_: Parameters<CT["encode"]>[0]): void {
			if (this._sendIntervalMsNum === 0) {
				this._network._send(data_);

				return;
			} else {
				this._messList.push(data_);
			}

			// 发送定时器
			if (this._sendIntervalMsNum > 0 && !this._sendTimer) {
				this._sendTimer = setInterval(() => {
					// 没有消息取消定时任务
					if (!this._messList.length) {
						clearInterval(this._sendTimer);
						this._sendTimer = null;

						return;
					}

					while (this._messList.length) {
						this._network._send(this._messList.shift());
					}
				}, this._sendIntervalMsNum);
			}
		}

		/** 触发发送 */
		trigger(): void {
			if (this._sendIntervalMsNum !== -1) {
				return;
			}

			while (this._messList.length) {
				this._network._send(this._messList.shift());
			}
		}

		/** 清理所有未发送消息 */
		clear(): void {
			this._messList.splice(0, this._messList.length);
		}

		/* ------------------------------- 全局事件 ------------------------------- */
		private _onRestart(): void {
			clearInterval(this._sendTimer);
			this._sendTimer = null;
		}
	}
}

export default MKNetworkBase;
