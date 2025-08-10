import { EDITOR } from "cc/env";
import globalEvent from "../../Config/GlobalEvent";
import GlobalConfig from "../../Config/GlobalConfig";
import { mkLog } from "../MKLogger";
/** @weak */
import mkMonitor from "../MKMonitor";
import {
	_decorator,
	PolygonCollider2D,
	Component,
	Mask,
	Vec3,
	v3,
	Graphics,
	size,
	Vec2,
	v2,
	view,
	UITransform,
	color,
	EventTouch,
	EventMouse,
	Node,
} from "cc";

const { ccclass, property, requireComponent, executeInEditMode } = _decorator;

/**
 * 多边形遮罩
 * @noInheritDoc
 * @remarks
 *
 * - 多边形图片遮罩
 *
 * - 多边形触摸屏蔽
 */
@ccclass
@executeInEditMode
@requireComponent([PolygonCollider2D])
export class MKPolygonMask extends Component {
	/* --------------- 属性 --------------- */
	/** 遮罩组件 */
	@property({ displayName: "遮罩组件", type: Mask })
	mask: Mask | null = null;

	/** 屏蔽触摸 */
	@property({ displayName: "屏蔽触摸", tooltip: "屏蔽展示区域外的触摸事件" })
	isShieldTouch = true;

	/** 跟踪节点 */
	@property({
		displayName: "跟踪节点",
		type: Node,
		tooltip: "遮罩对应的节点",
	})
	get trackNode(): Node {
		return this._trackNode;
	}

	set trackNode(value_) {
		this._setTrackNode(value_);
	}

	/* --------------- public --------------- */
	/** 偏移坐标 */
	get offsetV3(): Vec3 {
		return this._offsetV3;
	}

	set offsetV3(valueV3_) {
		this._setOffsetV3(valueV3_);
	}

	/** 调式模式 */
	get isDebug(): boolean {
		return this._isDebug;
	}

	set isDebug(value_) {
		this._setIsDebug(value_);
	}

	/* --------------- private --------------- */
	/** 跟踪节点 */
	@property(Node)
	private _trackNode: Node = null!;

	/** 跟踪节点初始坐标 */
	@property
	private _trackNodeStartPosV3 = v3();

	/** 调试模式 */
	private _isDebug = false;
	/** 调试绘图组件 */
	private _graphics?: Graphics;
	/** 初始设计尺寸 */
	private _initialDesignSize = size();
	/** 偏移坐标 */
	private _offsetV3 = v3();
	/** 多边形本地点 */
	private _polygonLocalPointV2List!: Vec2[];
	/** 当前多边形本地点 */
	private _currentPolygonLocalPointV2List!: Vec2[];
	/** 多边形世界点 */
	private _polygonWorldPointV2List!: Vec2[];
	/** 当前多边形世界点 */
	private _currentPolygonWorldPointV2List!: Vec2[];
	/** 跟踪节点世界坐标 */
	private _trackNodeWorldPosV3 = v3();
	/** 输入事件 */
	private _inputEventList = [
		Node.EventType.TOUCH_START,
		Node.EventType.TOUCH_END,
		Node.EventType.TOUCH_MOVE,
		Node.EventType.MOUSE_DOWN,
		Node.EventType.MOUSE_MOVE,
		Node.EventType.MOUSE_UP,
		Node.EventType.MOUSE_ENTER,
		Node.EventType.MOUSE_LEAVE,
		Node.EventType.MOUSE_WHEEL,
	];

	/** 临时变量 */
	private _tempTab = {
		v2: v2(),
		v3: v3(),
	};

	/* ------------------------------- 生命周期 ------------------------------- */
	protected onLoad(): void {
		if (this.getComponent(Mask)) {
			mkLog.error("不能在 mask 组件的节点上添加组件");
			this.destroy();

			return;
		}

		/** 多边形组件 */
		const polygonComp = this.getComponent(PolygonCollider2D)!;

		// 更新初始设计尺寸
		this._initialDesignSize = view.getDesignResolutionSize();
		// 初始化跟踪节点世界坐标
		this._trackNode?.getWorldPosition(this._trackNodeWorldPosV3);

		// 更新数据
		this.isDebug = this._isDebug;
		this._currentPolygonLocalPointV2List = this._polygonLocalPointV2List = polygonComp.points.map((vV2) => vV2.clone().add(polygonComp.offset));

		this._currentPolygonWorldPointV2List = this._polygonWorldPointV2List = polygonComp.worldPoints.map((vV2) =>
			vV2.clone().add(polygonComp.offset)
		);

		// 更新视图
		{
			if (EDITOR) {
				// 初始化遮罩
				if (this.mask) {
					this.mask.type = Mask.Type.GRAPHICS_STENCIL;
				}

				// @weak-start-include-MKMonitor
				// 监听多边形坐标变更
				{
					const eventPolygonPositionChangeFunc = (): void => {
						this._currentPolygonLocalPointV2List = this._polygonLocalPointV2List = polygonComp.points.map((v) =>
							v.clone().add(polygonComp.offset)
						);

						this._updateMask();
					};

					mkMonitor.on(polygonComp as any, "_points", eventPolygonPositionChangeFunc, this);
					mkMonitor.on(polygonComp.offset, "x", eventPolygonPositionChangeFunc, this);
					mkMonitor.on(polygonComp.offset, "y", eventPolygonPositionChangeFunc, this);
				}
				// @weak-end

				this.updateMask();

				return;
			}

			this.updateMask();
			polygonComp.destroy();
		}

		// 全局事件
		globalEvent.on(globalEvent.key.resize, this._onGlobalResize, this);
	}

	protected start(): void {
		this.updateMask();
	}

	protected onEnable(): void {
		if (EDITOR) {
			return;
		}

		// 跟踪节点失效
		if (this._trackNode && !this._trackNode.isValid) {
			this._trackNode = null!;
		}

		// 屏蔽触摸
		if (this.isShieldTouch) {
			for (const v of this._inputEventList) {
				this.node.on(v, this._onNodeInput, this);
			}
		}

		this.updateMask();
	}

	protected onDisable(): void {
		// 取消屏蔽触摸
		if (this.isShieldTouch) {
			for (const v of this._inputEventList) {
				this.node.off(v, this._onNodeInput, this);
			}
		}
	}

	protected update(dtNum_: number): void {
		// 跟踪节点失效
		if (this._trackNode && !this._trackNode.isValid) {
			this._trackNode = null!;
		}

		// 原生上的 worldPosition 数据已经转到 C++ 内，所以不能监听数据
		if (!this._trackNode?.worldPosition.equals(this._trackNodeWorldPosV3)) {
			this._trackNode.getWorldPosition(this._trackNodeWorldPosV3);
			this.updateMask();
		}
	}

	protected onDestroy(): void {
		mkMonitor.clear(this);
		globalEvent.targetOff(this);
	}

	/* ------------------------------- 功能 ------------------------------- */
	/** 更新遮罩 */
	updateMask(): void {
		// 依赖数据不存在
		if (!this._polygonLocalPointV2List || !this._polygonWorldPointV2List) {
			return;
		}

		// 编辑器更新初始坐标
		if (EDITOR) {
			this._trackNodeStartPosV3 = !this._trackNode ? v3() : this._trackNode.worldPosition.clone();
		}
		// 更新遮罩坐标
		else {
			/** 当前显示尺寸 */
			const currentVisibleSize = view.getVisibleSize();
			/** 当前设计尺寸 */
			const currentDesignSize = view.getDesignResolutionSize();
			/** 节点偏移坐标 */
			const nodeOffsetV3 = !this._trackNode ? v3() : this._trackNode.worldPosition.clone().subtract(this._trackNodeStartPosV3);

			/** 显示偏移坐标 */
			const visibleOffsetV3 = v3(
				(currentVisibleSize.width - GlobalConfig.View.originalDesignSize.width) * -0.5,
				(currentVisibleSize.height - GlobalConfig.View.originalDesignSize.height) * -0.5
			);

			/** 设计偏移坐标 */
			const designOffset2V3 = v3(
				(this._initialDesignSize.width - currentDesignSize.width) * -0.5,
				(this._initialDesignSize.height - currentDesignSize.height) * -0.5
			);

			this._currentPolygonLocalPointV2List = this._polygonLocalPointV2List.map((vV2) =>
				vV2
					.clone()
					.add2f(nodeOffsetV3.x, nodeOffsetV3.y)
					.add2f(visibleOffsetV3.x, visibleOffsetV3.y)
					.add2f(this._offsetV3.x, this._offsetV3.y)
			);

			this._currentPolygonWorldPointV2List = this._polygonWorldPointV2List.map((vV2) =>
				vV2
					.clone()
					.add2f(nodeOffsetV3.x, nodeOffsetV3.y)
					.add2f(visibleOffsetV3.x, visibleOffsetV3.y)
					.add2f(designOffset2V3.x, designOffset2V3.y)
					.add2f(this._offsetV3.x, this._offsetV3.y)
			);

			this._updateGraphics();
		}

		this._updateMask();
	}

	/** 更新遮罩 */
	private _updateMask(): void {
		if (
			// 编辑器且节点隐藏
			(EDITOR && !this.node.active) ||
			// 遮罩类型不一致
			this.mask?.type !== Mask.Type.GRAPHICS_STENCIL ||
			// 依赖数据不存在
			!this._currentPolygonLocalPointV2List
		) {
			return;
		}

		/** 绘图组件 */
		const graphicsComp = this.mask.node.getComponent(Graphics)!;
		/** 多边形坐标 */
		const pointV2List = this._currentPolygonLocalPointV2List;

		// 绘制遮罩
		if (pointV2List?.length > 1) {
			graphicsComp.clear();
			graphicsComp.moveTo(pointV2List[0].x, pointV2List[0].y);

			for (const vV2 of pointV2List) {
				graphicsComp.lineTo(vV2.x, vV2.y);
			}

			graphicsComp.close();
			graphicsComp.stroke();
			graphicsComp.fill();
		}
	}

	/** 更新调试绘制 */
	private _updateGraphics(): void {
		if (EDITOR || !this._isDebug || !this._graphics || !this._currentPolygonLocalPointV2List) {
			return;
		}

		const uiTransform = this._graphics.getComponent(UITransform);

		this._graphics.clear();
		this._currentPolygonLocalPointV2List.forEach((vV2) => {
			uiTransform!.convertToNodeSpaceAR(this._tempTab.v3.set(vV2.x, vV2.y), this._tempTab.v3);

			this._graphics!.circle(this._tempTab.v3.x, this._tempTab.v3.y, 5);
			this._graphics!.stroke();
		});
	}

	/**
	 * @en Test whether the point is in the polygon
	 * @zh 测试一个点是否在一个多边形中
	 */
	private _pointInPolygon(pointV2List_: Readonly<Vec2>, polygonV2List_: readonly Vec2[]): boolean {
		let isInside = false;
		const x = pointV2List_.x;
		const y = pointV2List_.y;
		// use some raycasting to test hits
		// https://github.com/substack/point-in-polygon/blob/master/index.js
		const length = polygonV2List_.length;

		for (let kNum = 0, k2Num = length - 1; kNum < length; k2Num = kNum++) {
			const xNum = polygonV2List_[kNum].x;
			const yNum = polygonV2List_[kNum].y;
			const x2Num = polygonV2List_[k2Num].x;
			const y2Num = polygonV2List_[k2Num].y;
			const isIntersect = yNum > y !== y2Num > y && x < ((x2Num - xNum) * (y - yNum)) / (y2Num - yNum) + xNum;

			if (isIntersect) {
				isInside = !isInside;
			}
		}

		return isInside;
	}
	/* ------------------------------- get/set ------------------------------- */
	private _setIsDebug(value_: boolean): void {
		this._isDebug = value_;

		if (EDITOR) {
			return;
		}

		if (this._isDebug && !this._graphics) {
			this._graphics = this.node.addComponent(Graphics);
			this._graphics.lineWidth = 6;
			this._graphics.strokeColor = color(0, 0, 255, 255);
			this._updateGraphics();
		} else {
			this._graphics?.clear();
		}
	}

	private _setOffsetV3(valueV3_: Vec3): void {
		this._offsetV3.set(valueV3_);
		this.updateMask();
	}

	private _setTrackNode(value_: Node): void {
		this._trackNode = value_;
		this._trackNode?.getWorldPosition(this._trackNodeWorldPosV3);
		this.updateMask();
	}
	/* ------------------------------- 节点事件 ------------------------------- */
	private _onNodeInput(event_: EventTouch | EventMouse): void {
		/** 碰撞状态 */
		let isCollision = this._pointInPolygon(event_.getUILocation(this._tempTab.v2), this._currentPolygonWorldPointV2List);

		// 更新碰撞状态
		isCollision = !this.mask || this.mask.inverted ? isCollision : !isCollision;
		// 触摸穿透
		event_.preventSwallow = isCollision;
		// 拦截事件
		event_.propagationStopped = !isCollision;
	}

	/* ------------------------------- 全局事件 ------------------------------- */
	private _onGlobalResize(): void {
		this.unschedule(this.updateMask);
		this.scheduleOnce(this.updateMask);
	}
}
