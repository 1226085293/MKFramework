import * as cc from "cc";
import { _decorator } from "cc";
import mk from "mk";
import tool from "../../../Tool/Tool";
import { test } from "../../Bundle/Proto/test.js";
import { common } from "../../Bundle/Proto/common.js";
const { ccclass, property } = _decorator;

@ccclass("ResourcesNetwork")
export class ResourcesNetwork extends mk.ViewBase {
	/* --------------- static --------------- */
	/* --------------- 属性 --------------- */
	/* --------------- public --------------- */
	data = {
		/** 聊天列表 */
		chatStrList: [] as string[],
		/** 聊天2列表 */
		chat2StrList: [] as string[],
		/** 头像 */
		headStr: "https://img2.baidu.com/it/u=1453157121,575455426&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
	};

	/* --------------- protected --------------- */
	/* --------------- private --------------- */
	private _ws!: mk.Network.Websocket<tool.codec.proto_static_common>;
	private _ws2!: mk.Network.Websocket<tool.codec.proto_static>;

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	open(): void {
		{
			const codec = new tool.codec.proto_static_common();

			this._ws = new mk.Network.Websocket<tool.codec.proto_static_common>({
				codec: codec,
				parseMessageIdFunc: (data) => {
					return data.constructor.getTypeUrl("");
				},
				parseMessageSequenceFunc(data) {
					if (data["__sequenceNum"] === undefined) {
						data["__sequenceNum"] = codec.sequence_n++;
					}

					return data["__sequenceNum"];
				},
			});

			this._ws.codec!.init(common, {
				package: common.Package,
				messageIdTab: common.MessageID,
			});

			this.data.chatStrList.push("网络 1 连接中...");
			// 连接网络
			this._ws.connect("ws://127.0.0.1:8848").then(() => {
				this.data.chatStrList.push("网络 1 连接成功！");

				// 发送并等待消息返回
				this.data.chatStrList.push("网络 1 发送消息 123");
				this._ws.message
					.request(
						common.TestC.create({
							data: 123,
						})
					)
					?.then((data: common.TestS) => {
						this.data.chatStrList.push("网络 1 收到回复消息", data?.data + "");
					});

				// 发送并等待消息返回
				this.data.chatStrList.push("网络 1 发送消息 456");
				this._ws.message
					.request(
						common.TestC.create({
							data: 456,
						})
					)
					?.then((data: common.TestS) => {
						this.data.chatStrList.push("网络 1 收到回复消息", data?.data + "");
					});

				// 监听推送
				this._ws.message.on(
					common.Test2B,
					(data) => {
						this.data.chatStrList.push("网络 1 收到监听消息", data?.data + "");
					},
					this
				);
			});
		}

		{
			this._ws2 = new mk.Network.Websocket<tool.codec.proto_static>({
				codec: new tool.codec.proto_static(test),
				parseMessageIdFunc: (data) => {
					return data.__id;
				},
				parseMessageSequenceFunc: (data) => {
					return data.__sequence;
				},
			});

			this.data.chat2StrList.push("网络 2 连接中...");

			this._ws2.connect("ws://127.0.0.1:8849").then(() => {
				this.data.chat2StrList.push("网络 2 连接成功！");

				// 请求指定消息（等待返回）
				this.data.chat2StrList.push("网络 2 发送消息 123");
				this._ws2.message
					.request(
						test.test_c.create({
							data: "123",
						})
					)
					?.then((value: test.test_c) => {
						this.data.chat2StrList.push("网络 2 收到回复消息", value.data);
					});

				// 发送消息
				this.data.chat2StrList.push("网络 2 发送消息 456");
				this._ws2.message.send(
					test.test_c.create({
						data: "456",
					})
				);

				// 监听指定消息
				this._ws2.message.on(test.test_c, (value) => {
					this.data.chat2StrList.push("网络 2 收到监听消息" + value.data);
				});
			});
		}
	}

	close(): void {
		this._ws.close();
		this._ws2.close();
		this._ws.event.targetOff(this);
		this._ws2.event.targetOff(this);
	}

	/* ------------------------------- 自定义事件 ------------------------------- */
	/** item 更新函数 */
	eventItemUpdate(node_: cc.Node, dataStr_: string): void {
		mk.N(node_).label.string = dataStr_ + "";
	}
}
