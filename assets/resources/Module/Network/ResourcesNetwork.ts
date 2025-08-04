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
	@property({ displayName: "网络1", type: cc.Node })
	listNode: cc.Node = null!;

	@property({ displayName: "网络2", type: cc.Node })
	list2Node: cc.Node = null!;

	@property({ displayName: "头像", type: cc.Node })
	headNode: cc.Node = null!;
	/* --------------- private --------------- */
	private _ws!: mk.network.Websocket<tool.codec.ProtoStaticCommon>;
	private _ws2!: mk.network.Websocket<tool.codec.ProtoStatic>;

	/* ------------------------------- 生命周期 ------------------------------- */
	// create(): void {}
	// init(init_?: typeof this.init_data): void {}
	async open(): Promise<void> {
		// 网络1
		{
			const codec = new tool.codec.ProtoStaticCommon();

			this._ws = new mk.network.Websocket<tool.codec.ProtoStaticCommon>({
				codec: codec,
				parseMessageIdFunc: (data) => {
					return data.constructor.getTypeUrl("");
				},
				parseMessageSequenceFunc(data) {
					if (data["__sequenceNum"] === undefined) {
						data["__sequenceNum"] = codec.sequenceNum++;
					}

					return data["__sequenceNum"];
				},
			});

			this._ws.codec!.init(common, {
				package: common.Package,
				messageIdTab: common.MessageID,
			});

			this._addContentToList("网络 1 连接中...", this.listNode);
			// 连接网络
			this._ws.connect("ws://127.0.0.1:8848").then(() => {
				this._addContentToList("网络 1 连接成功！", this.listNode);

				// 发送并等待消息返回
				this._addContentToList("网络 1 发送消息 123", this.listNode);
				this._ws.message
					.request(
						common.TestC.create({
							data: 123,
						})
					)
					?.then((data: common.TestS) => {
						this._addContentToList("网络 1 收到回复消息" + data?.data + "", this.listNode);
					});

				// 发送并等待消息返回
				this._addContentToList("网络 1 发送消息 456", this.listNode);
				this._ws.message
					.request(
						common.TestC.create({
							data: 456,
						})
					)
					?.then((data: common.TestS) => {
						this._addContentToList("网络 1 收到回复消息" + data?.data + "", this.listNode);
					});

				// 监听推送
				this._ws.message.on(
					common.Test2B,
					(data) => {
						this._addContentToList("网络 1 收到监听消息" + data?.data + "", this.listNode);
					},
					this
				);
			});
		}

		// 网络2
		{
			this._ws2 = new mk.network.Websocket<tool.codec.ProtoStatic>({
				codec: new tool.codec.ProtoStatic(test),
				parseMessageIdFunc: (data) => {
					return data.__id;
				},
				parseMessageSequenceFunc: (data) => {
					return data.__sequence;
				},
			});

			this._addContentToList("网络 2 连接中...", this.list2Node);

			this._ws2.connect("ws://127.0.0.1:8849").then(() => {
				this._addContentToList("网络 2 连接成功！", this.list2Node);

				// 请求指定消息（等待返回）
				this._addContentToList("网络 2 发送消息 123", this.list2Node);
				this._ws2.message
					.request(
						test.test_c.create({
							data: "123",
						})
					)
					?.then((value: test.test_c) => {
						this._addContentToList("网络 2 收到回复消息" + value.data, this.list2Node);
					});

				// 发送消息
				this._addContentToList("网络 2 发送消息 456", this.list2Node);
				this._ws2.message.send(
					test.test_c.create({
						data: "456",
					})
				);

				// 监听指定消息
				this._ws2.message.on(test.test_c, (value) => {
					this._addContentToList("网络 2 收到监听消息" + value.data, this.list2Node);
				});
			});
		}

		// 头像
		{
			const asset = await mk.asset.get(
				"https://img2.baidu.com/it/u=1453157121,575455426&fm=253&fmt=auto&app=138&f=JPEG?w=500&h=500",
				cc.ImageAsset,
				this,
				{
					remoteOption: {
						ext: ".png",
					},
				}
			);

			if (!asset) {
				return;
			}

			mk.N(this.headNode).sprite.spriteFrame = cc.SpriteFrame.createWithImage(asset);
		}
	}

	close(): void {
		this._ws.close();
		this._ws2.close();
		this._ws.event.targetOff(this);
		this._ws2.event.targetOff(this);
	}
	/* ------------------------------- 业务逻辑 ------------------------------- */
	private _addContentToList(valueStr_: string, node_: cc.Node): void {
		const newNode = node_.children[0].getComponent(cc.Label)!.string === "" ? node_.children[0] : cc.instantiate(node_.children[0]);

		newNode.getComponent(cc.Label)!.string = valueStr_;
		node_.addChild(newNode);
	}

	/* ------------------------------- 按钮事件 ------------------------------- */
	clickClose(): void {
		mk.uiManage.close(this, { isDestroy: true });
	}
}
