declare module "cc/editor/animation-clip-migration" {
    export import AnimationClipLegacyData = AnimationClip._legacy.AnimationClipLegacyData;
    import { AnimationClip } from "cc";
    export {};
}
declare module "cc/editor/color-utils" {
    export function linearToSrgb8Bit(x: number): number;
    export function srgbToLinear(x: number): number;
    export {};
}
declare module "cc/editor/distributed" {
    export function isClientLoad(obj: CCObject): boolean;
    export function setClientLoad(obj: CCObject, value: boolean): void;
    import { CCObject } from "cc";
    export {};
}
declare module "cc/editor/embedded-player" {
    export const embeddedPlayerCountTag: unique symbol;
    export const getEmbeddedPlayersTag: unique symbol;
    export const addEmbeddedPlayerTag: unique symbol;
    export const removeEmbeddedPlayerTag: unique symbol;
    export const clearEmbeddedPlayersTag: unique symbol;
    export class EmbeddedPlayer extends ___private._cocos_core_data_editor_extendable__EditorExtendable {
        /**
         * @en
         * Begin time, in seconds.
         * @zh
         * 开始时间，以秒为单位。
         */
        begin: number;
        /**
         * @en
         * End time, in seconds.
         * @zh
         * 结束时间，以秒为单位。
         */
        end: number;
        /**
         * @en
         * Whether the speed of this embedded player should be reconciled with the host animation clip.
         * @zh
         * 子区域的播放速度是否应和宿主动画剪辑保持一致。
         */
        reconciledSpeed: boolean;
        /**
         * @en
         * Player of the embedded player.
         * @zh
         * 子区域的播放器。
         */
        playable: EmbeddedPlayable | null;
    }
    export abstract class EmbeddedPlayable {
        /**
         * @en
         * Instantiates this sub region.
         * @zh
         * 实例化此子区域。
         * @param root The root node of animation context.
         * @internal
         */
        abstract instantiate(root: Node): ___private._cocos_core_animation_embedded_player_embedded_player__EmbeddedPlayableState | null;
    }
    /**
     * @en
     * The embedded particle system playable. The players play particle system on a embedded player.
     * @zh
     * 粒子系统子区域播放器。此播放器在子区域上播放粒子系统。
     */
    export class EmbeddedParticleSystemPlayable extends EmbeddedPlayable {
        /**
         * @en
         * Path to the node where particle system inhabits, relative from animation context root.
         * @zh
         * 粒子系统所在的结点路径，相对于动画上下文的根节点。
         */
        path: string;
        instantiate(root: Node): ___private._cocos_core_animation_embedded_player_embedded_particle_system_player__EmbeddedParticleSystemPlayableState | null;
    }
    /**
     * @en
     * The embedded animation clip playable. The playable play animation clip on a embedded player.
     * @zh
     * 动画剪辑子区域播放器。此播放器在子区域上播放动画剪辑。
     */
    export class EmbeddedAnimationClipPlayable extends EmbeddedPlayable {
        /**
         * @en
         * Path to the node onto which the animation clip would be played, relative from animation context root.
         * @zh
         * 要播放动画剪辑的节点的路径，相对于动画上下文的根节点。
         */
        path: string;
        /**
         * @en
         * The animation clip to play.
         * @zh
         * 要播放的动画剪辑。
         */
        clip: AnimationClip | null;
        instantiate(root: Node): ___private._cocos_core_animation_embedded_player_embedded_animation_clip_player__EmbeddedAnimationClipPlayableState | null;
    }
    import { __private as ___private, Node, AnimationClip } from "cc";
    export {};
}
declare module "cc/editor/exotic-animation" {
    export const exoticAnimationTag: unique symbol;
    /**
     * Animation that:
     * - does not exposed by users;
     * - does not compatible with regular animation;
     * - non-editable;
     * - currently only generated imported from model file.
     */
    export class ExoticAnimation {
        createEvaluator(binder: ___private._cocos_core_animation_tracks_track__Binder): ___private._cocos_core_animation_exotic_animation_exotic_animation__ExoticTrsAnimationEvaluator;
        addNodeAnimation(path: string): ___private._cocos_core_animation_exotic_animation_exotic_animation__ExoticNodeAnimation;
        collectAnimatedJoints(): string[];
        split(from: number, to: number): ExoticAnimation;
        /**
         * @internal
         */
        toHashString(): string;
    }
    /**
     * @en
     * A real array track animates a real array attribute of target(such as morph weights of mesh renderer).
     * Every element in the array is corresponding to a real channel.
     * @zh
     * 实数数组轨道描述目标上某个实数数组属性（例如网格渲染器的形变权重）的动画。
     * 数组中的每个元素都对应一条实数通道。
     */
    export class RealArrayTrack extends animation.Track {
        /**
         * @en The number of elements in the array which this track produces.
         * If you increased the count, there will be new empty real channels appended.
         * Otherwise if you decreased the count, the last specified number channels would be removed.
         * @zh 此轨道产生的数组元素的数量。
         * 当你增加数量时，会增加新的空实数通道；当你减少数量时，最后几个指定数量的通道会被移除。
         */
        get elementCount(): number;
        set elementCount(value: number);
        /**
         * @en The channels of the track.
         * @zh 返回此轨道的所有通道的数组。
         */
        channels(): ___private._cocos_core_animation_tracks_track__RealChannel[];
        /**
         * @internal
         */
        [___private._cocos_core_animation_define__createEvalSymbol](): ___private._cocos_core_animation_tracks_array_track__RealArrayTrackEval;
    }
    import { AnimationMask } from "cc/editor/new-gen-anim";
    import { __private as ___private, animation } from "cc";
    export {};
}
declare module "cc/editor/macro" {
    export { macro, Macro } from "cc";
    export {};
}
declare module "cc/editor/new-gen-anim" {
    export function blend1D(weights: number[], thresholds: readonly number[], value: number): void;
    /**
     * Blends given samples using simple directional algorithm.
     * @param weights Result weights of each sample.
     * @param samples Every samples' parameter.
     * @param input Input parameter.
     */
    export const blendSimpleDirectional: (weights: number[], samples: readonly math.Vec2[], input: Readonly<math.Vec2>) => void;
    /**
     * Validates the samples if they satisfied the requirements of simple directional algorithm.
     * @param samples Samples to validate.
     * @returns Issues the samples containing.
     */
    export function validateSimpleDirectionalSamples(samples: ReadonlyArray<math.Vec2>): SimpleDirectionalSampleIssue[];
    /**
     * Simple directional issue representing some samples have same(or very similar) direction.
     */
    export class SimpleDirectionalIssueSameDirection {
        samples: readonly number[];
        constructor(samples: readonly number[]);
    }
    export type SimpleDirectionalSampleIssue = SimpleDirectionalIssueSameDirection;
    export function viewVariableBindings(animationGraph: AnimationGraph): Generator<VariableBindingView>;
    export interface VariableBindingView {
        /**
         * The current bounded variable name.
         */
        readonly name: string;
        /**
         * The acceptable types of this binding.
         */
        readonly acceptableTypes: animation.VariableType[];
        /**
         * Rebinds this binding to new variable.
         * @param _newVariableName
         */
        rebind(_newVariableName: string): void;
        /**
         * Unbinds the variable.
         */
        unbind(): void;
    }
    export class MotionPreviewer extends ___private._editor_src_marionette_preview__AnimationGraphPartialPreviewer {
        get timelineStats(): Readonly<MotionPreviewerTimelineStats>;
        /**
         * Gets an iterable to the weights of each motion(that has runtime ID).
         */
        queryWeights(): Iterable<[
            __private._cocos_core_animation_marionette_graph_debug__RuntimeID,
            number
        ]>;
        setMotion(motion: __private._cocos_core_animation_marionette_motion__Motion): void;
        setTime(time: number): void;
        updateVariable(id: string, value: animation.Value): void;
        evaluate(): void;
    }
    export class TransitionPreviewer extends ___private._editor_src_marionette_preview__AnimationGraphPartialPreviewer {
        constructor(root: Node);
        destroy(): void;
        get timelineStats(): Readonly<TransitionPreviewerTimelineStats>;
        setSourceMotion(motion: __private._cocos_core_animation_marionette_motion__Motion): void;
        setTargetMotion(motion: __private._cocos_core_animation_marionette_motion__Motion): void;
        setTransitionDuration(value: number): void;
        setRelativeTransitionDuration(value: boolean): void;
        calculateTransitionDurationFromTimelineLength(value: number): number;
        setExitTimes(value: number): void;
        setExitTimeEnabled(value: boolean): void;
        setDestinationStart(value: number): void;
        setRelativeDestinationStart(value: boolean): void;
        calculateExitTimesFromTimelineLength(value: number): number;
        updateVariable(id: string, value: animation.Value): void;
        /**
         *
         * @param time Player time, in seconds.
         */
        setTime(time: number): void;
        evaluate(): void;
    }
    export interface MotionPreviewerTimelineStats {
        timeLineLength: number;
    }
    export interface TransitionPreviewerTimelineStats {
        timeLineLength: number;
        sourceMotionStart: number;
        sourceMotionRepeatCount: number;
        sourceMotionDuration: number;
        targetMotionStart: number;
        targetMotionRepeatCount: number;
        targetMotionDuration: number;
        exitTimesStart: number;
        exitTimesLength: number;
        transitionDurationStart: number;
        transitionDurationLength: number;
    }
    export class InvalidTransitionError extends Error {
        constructor(type: "to-entry" | "to-any" | "from-exit");
    }
    export class VariableNotDefinedError extends Error {
        constructor(name: string);
    }
    export class AnimationGraph extends Asset implements animation.AnimationGraphRunTime {
        readonly __brand: "AnimationGraph";
        constructor();
        onLoaded(): void;
        get layers(): readonly Layer[];
        get variables(): Iterable<[
            string,
            VariableDescription
        ]>;
        /**
         * Adds a layer.
         * @returns The new layer.
         */
        addLayer(): Layer;
        /**
         * Removes a layer.
         * @param index Index to the layer to remove.
         */
        removeLayer(index: number): void;
        /**
         * Adjusts the layer's order.
         * @param index
         * @param newIndex
         */
        moveLayer(index: number, newIndex: number): void;
        /**
         * Adds a boolean variable.
         * @param name The variable's name.
         * @param value The variable's default value.
         */
        addBoolean(name: string, value?: boolean): void;
        /**
         * Adds a floating variable.
         * @param name The variable's name.
         * @param value The variable's default value.
         */
        addFloat(name: string, value?: number): void;
        /**
         * Adds an integer variable.
         * @param name The variable's name.
         * @param value The variable's default value.
         */
        addInteger(name: string, value?: number): void;
        /**
         * Adds a trigger variable.
         * @param name The variable's name.
         * @param value The variable's default value.
         * @param resetMode The trigger's reset mode.
         */
        addTrigger(name: string, value?: boolean, resetMode?: TriggerResetMode): void;
        removeVariable(name: string): void;
        getVariable(name: string): VariableDescription | undefined;
        /**
         * @zh 重命名一个变量。注意，所有对该变量的引用都不会修改。
         * 如果变量的原始名称不存在或者新的名称已存在，此方法不会做任何事。
         * 变量在图中的顺序会保持不变。
         * @en Renames an variable. Note, this won't changes any reference to the variable.
         * If the original name of the variable doesn't exists or
         * the new name has already existed, this method won't do anything.
         * The variable's order in the graph is also retained.
         * @param name @zh 要重命名的变量的名字。 @en The name of the variable to be renamed.
         * @param newName @zh 新的名字。 @en New name.
         */
        renameVariable(name: string, newName: string): void;
    }
    export function isAnimationTransition(transition: Transition): transition is AnimationTransition;
    export class StateMachine extends ___private._cocos_core_data_editor_extendable__EditorExtendable {
        /**
         * // TODO: HACK
         * @internal
         */
        __callOnAfterDeserializeRecursive(): void;
        constructor();
        [___private._cocos_core_data_deserialize_symbols__onAfterDeserializedTag](): void;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): __private._cocos_core_animation_marionette_motion__MotionEval | null;
        /**
         * The entry state.
         */
        get entryState(): State;
        /**
         * The exit state.
         */
        get exitState(): State;
        /**
         * The any state.
         */
        get anyState(): State;
        /**
         * Gets an iterator to all states within this graph.
         * @returns The iterator.
         */
        states(): Iterable<State>;
        /**
         * Gets an iterator to all transitions within this graph.
         * @returns The iterator.
         */
        transitions(): Iterable<__private._cocos_core_animation_marionette_animation_graph__Transition>;
        /**
         * Gets the transitions between specified states.
         * @param from Transition source.
         * @param to Transition target.
         * @returns Iterator to the transitions
         */
        getTransitionsBetween(from: State, to: State): Iterable<__private._cocos_core_animation_marionette_animation_graph__Transition>;
        /**
         * @en
         * Gets all transitions outgoing from specified state.
         * @zh
         * 获取从指定状态引出的所有过渡。
         * @param from @en The state. @zh 指定状态。
         * @returns @en Iterable to result transitions, in priority order. @zh 到结果过渡的迭代器，按优先级顺序。
         */
        getOutgoings(from: State): Iterable<__private._cocos_core_animation_marionette_animation_graph__Transition>;
        /**
         * Gets all incoming transitions of specified state.
         * @param to The state.
         * @returns Result transitions.
         */
        getIncomings(to: State): Iterable<__private._cocos_core_animation_marionette_animation_graph__Transition>;
        /**
         * Adds a motion state into this state machine.
         * @returns The newly created motion.
         */
        addMotion(): MotionState;
        /**
         * Adds a sub state machine into this state machine.
         * @returns The newly created state machine.
         */
        addSubStateMachine(): SubStateMachine;
        /**
         * Adds an empty state into this state machine.
         * @returns The newly created empty state.
         */
        addEmpty(): EmptyState;
        /**
         * Removes specified state from this state machine.
         * @param state The state to remove.
         */
        remove(state: State): void;
        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         */
        connect(from: MotionState, to: State, conditions?: Condition[]): AnimationTransition;
        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         */
        connect(from: EmptyState, to: State, conditions?: Condition[]): EmptyStateTransition;
        /**
         * Connect two states.
         * @param from Source state.
         * @param to Target state.
         * @param condition The transition condition.
         * @throws `InvalidTransitionError` if:
         * - the target state is entry or any, or
         * - the source state is exit.
         */
        connect(from: State, to: State, conditions?: Condition[]): Transition;
        disconnect(from: State, to: State): void;
        removeTransition(removal: __private._cocos_core_animation_marionette_animation_graph__Transition): void;
        eraseOutgoings(from: State): void;
        eraseIncomings(to: State): void;
        eraseTransitionsIncludes(state: State): void;
        /**
         * @en
         * Adjusts the priority of a transition.
         *
         * To demonstrate, one can imagine a transition array sorted by their priority.
         * - If `diff` is zero, nothing's gonna happen.
         * - Negative `diff` raises the priority:
         *   `diff` number of transitions originally having higher priority than `adjusting`
         *   will then have lower priority than `adjusting`.
         * - Positive `diff` reduce the priority:
         *   `|diff|` number of transitions originally having lower priority than `adjusting`
         *   will then have higher priority than `adjusting`.
         *
         * If the number of transitions indicated by `diff`
         * is more than the actual one, the actual number would be taken.
         * @zh
         * 调整过渡的优先级。
         *
         * 为了说明，可以想象一个由优先级排序的过渡数组。
         * - 如果 `diff` 是 0，无事发生。
         * - 负的 `diff` 会提升该过渡的优先级：原本优先于 `adjusting` 的 `diff` 条过渡的优先级会设置为低于 `adjusting`。
         * - 正的 `diff` 会降低该过渡的优先级：原本优先级低于 `adjusting` 的 `|diff|` 条过渡会设置为优先于 `adjusting`。
         *
         * 如果 `diff` 指示的过渡数量比实际多，则会使用实际数量。
         *
         * @param adjusting @en The transition to adjust the priority. @zh 需要调整优先级的过渡。
         * @param diff @en Indicates how to adjust the priority. @zh 指示如何调整优先级。
         */
        adjustTransitionPriority(adjusting: __private._cocos_core_animation_marionette_animation_graph__Transition, diff: number): void;
        clone(): StateMachine;
    }
    export class SubStateMachine extends __private._cocos_core_animation_marionette_state__InteractiveState {
        get stateMachine(): StateMachine;
        clone(): SubStateMachine;
    }
    export class EmptyStateTransition extends __private._cocos_core_animation_marionette_animation_graph__Transition {
        /**
         * The transition duration, in seconds.
         */
        duration: number;
        /**
         * @en The start time of (final) destination motion state when this transition starts.
         * Its unit is seconds if `relativeDestinationStart` is `false`,
         * Otherwise, its unit is the duration of destination motion state.
         * @zh 此过渡开始时，（最终）目标动作状态的起始时间。
         * 如果 `relativeDestinationStart`为 `false`，其单位是秒，否则其单位是目标动作状态的周期。
         */
        destinationStart: number;
        /**
         * @en Determines the unit of destination start time. See `destinationStart`.
         * @zh 决定了目标起始时间的单位。见 `destinationStart`。
         */
        relativeDestinationStart: boolean;
    }
    export class EmptyState extends State {
        __brand: "EmptyState";
    }
    export type Transition = Omit<__private._cocos_core_animation_marionette_animation_graph__Transition, "from" | "to"> & {
        readonly from: __private._cocos_core_animation_marionette_animation_graph__Transition["from"];
        readonly to: __private._cocos_core_animation_marionette_animation_graph__Transition["to"];
    };
    export type AnimationTransition = Omit<__private._cocos_core_animation_marionette_animation_graph__AnimationTransition, "from" | "to"> & {
        readonly from: __private._cocos_core_animation_marionette_animation_graph__AnimationTransition["from"];
        readonly to: __private._cocos_core_animation_marionette_animation_graph__AnimationTransition["to"];
    };
    export class Layer implements __private._cocos_core_animation_marionette_ownership__OwnedBy<AnimationGraph> {
        [__private._cocos_core_animation_marionette_ownership__ownerSymbol]: AnimationGraph | undefined;
        name: string;
        weight: number;
        mask: AnimationMask | null;
        /**
         * @marked_as_engine_private
         */
        constructor();
        get stateMachine(): StateMachine;
    }
    export class State extends ___private._cocos_core_data_editor_extendable__EditorExtendable implements __private._cocos_core_animation_marionette_ownership__OwnedBy<Layer | StateMachine> {
        [__private._cocos_core_animation_marionette_ownership__ownerSymbol]: StateMachine | undefined;
        name: string;
        [__private._cocos_core_animation_marionette_state__outgoingsSymbol]: __private._cocos_core_animation_marionette_animation_graph__TransitionInternal[];
        [__private._cocos_core_animation_marionette_state__incomingsSymbol]: __private._cocos_core_animation_marionette_animation_graph__TransitionInternal[];
        constructor();
    }
    export type VariableDescription = __private._cocos_core_animation_marionette_animation_graph__BasicVariableDescription<animation.VariableType.FLOAT> | __private._cocos_core_animation_marionette_animation_graph__BasicVariableDescription<animation.VariableType.INTEGER> | __private._cocos_core_animation_marionette_animation_graph__BasicVariableDescription<animation.VariableType.BOOLEAN> | __private._cocos_core_animation_marionette_animation_graph__TriggerVariable;
    export class BinaryCondition implements Condition {
        static readonly Operator: typeof __private._cocos_core_animation_marionette_condition__BinaryOperator;
        operator: __private._cocos_core_animation_marionette_condition__BinaryOperator;
        lhs: BindableNumber;
        rhs: BindableNumber;
        clone(): BinaryCondition;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_parametric__BindContext): __private._cocos_core_animation_marionette_condition__BinaryConditionEval;
    }
    export namespace BinaryCondition {
        export type Operator = __private._cocos_core_animation_marionette_condition__BinaryOperator;
    }
    export class UnaryCondition implements Condition {
        static readonly Operator: typeof __private._cocos_core_animation_marionette_condition__UnaryOperator;
        operator: __private._cocos_core_animation_marionette_condition__UnaryOperator;
        operand: BindableBoolean;
        clone(): UnaryCondition;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_condition__ConditionEvalContext): __private._cocos_core_animation_marionette_condition__UnaryConditionEval;
    }
    export namespace UnaryCondition {
        export type Operator = __private._cocos_core_animation_marionette_condition__UnaryOperator;
    }
    export class TriggerCondition implements Condition {
        trigger: string;
        clone(): TriggerCondition;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_parametric__BindContext): __private._cocos_core_animation_marionette_condition__ConditionEval;
    }
    export interface Condition {
        clone(): Condition;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_parametric__BindContext): __private._cocos_core_animation_marionette_condition__ConditionEval;
    }
    /**
     * @en The reset mode of boolean variables. It indicates when to reset the variable as `false`.
     * @zh 布尔类型变量的重置模式，指示在哪些情况下将变量重置为 `false`。
     */
    export enum TriggerResetMode {
        /**
         * @en The variable is reset when it's consumed by animation transition.
         * @zh 在该变量被动画过渡消耗后自动重置。
         */
        AFTER_CONSUMED = 0,
        /**
         * @en The variable is reset in next frame or when it's consumed by animation transition.
         * @zh 下一帧自动重置；在该变量被动画过渡消耗后也会自动重置。
         */
        NEXT_FRAME_OR_AFTER_CONSUMED = 1
    }
    export class MotionState extends __private._cocos_core_animation_marionette_state__InteractiveState {
        motion: __private._cocos_core_animation_marionette_motion__Motion | null;
        speed: number;
        /**
         * Should be float.
         */
        speedMultiplier: string;
        speedMultiplierEnabled: boolean;
        clone(): MotionState;
    }
    export class ClipMotion extends ___private._cocos_core_data_editor_extendable__EditorExtendable implements __private._cocos_core_animation_marionette_motion__Motion {
        clip: AnimationClip | null;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): __private._cocos_core_animation_marionette_clip_motion__ClipMotionEval | null;
        clone(): ClipMotion;
    }
    export interface AnimationBlend extends __private._cocos_core_animation_marionette_motion__Motion, ___private._cocos_core_data_editor_extendable__EditorExtendable {
        [__private._cocos_core_animation_marionette_create_eval__createEval](_context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): __private._cocos_core_animation_marionette_motion__MotionEval | null;
    }
    export class AnimationBlend extends ___private._cocos_core_data_editor_extendable__EditorExtendable implements __private._cocos_core_animation_marionette_motion__Motion {
        name: string;
    }
    export class AnimationBlendDirect extends AnimationBlend {
        static Item: typeof __private._cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem;
        get items(): __private._cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem[];
        set items(value: __private._cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem[]);
        clone(): AnimationBlendDirect;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): any;
    }
    export namespace AnimationBlendDirect {
        export type Item = __private._cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem;
    }
    export class AnimationBlend1D extends AnimationBlend {
        static Item: typeof __private._cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem;
        param: BindableNumber;
        get items(): Iterable<__private._cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem>;
        set items(value: Iterable<__private._cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem>);
        clone(): AnimationBlend1D;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): any;
    }
    export namespace AnimationBlend1D {
        export type Item = __private._cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem;
    }
    export class AnimationBlend2D extends AnimationBlend {
        static Algorithm: typeof __private._cocos_core_animation_marionette_animation_blend_2d__Algorithm;
        static Item: typeof __private._cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem;
        algorithm: __private._cocos_core_animation_marionette_animation_blend_2d__Algorithm;
        paramX: BindableNumber;
        paramY: BindableNumber;
        get items(): Iterable<__private._cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem>;
        set items(items: Iterable<__private._cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem>);
        clone(): AnimationBlend2D;
        [__private._cocos_core_animation_marionette_create_eval__createEval](context: __private._cocos_core_animation_marionette_motion__MotionEvalContext): any;
    }
    export namespace AnimationBlend2D {
        export type Algorithm = typeof __private._cocos_core_animation_marionette_animation_blend_2d__Algorithm;
        export type Item = __private._cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem;
    }
    export class BindableNumber implements __private._cocos_core_animation_marionette_parametric__Bindable<number> {
        variable: string;
        value: number;
        constructor(value?: number);
        clone(): __private._cocos_core_animation_marionette_parametric__Bindable<number>;
    }
    export class BindableBoolean implements __private._cocos_core_animation_marionette_parametric__Bindable<boolean> {
        variable: string;
        value: boolean;
        constructor(value?: boolean);
        clone(): __private._cocos_core_animation_marionette_parametric__Bindable<boolean>;
    }
    export class AnimationMask extends Asset {
        get joints(): Iterable<__private._cocos_core_animation_marionette_animation_mask__JointMaskInfo>;
        set joints(value: Iterable<__private._cocos_core_animation_marionette_animation_mask__JointMaskInfo>);
        /**
         * @zh 添加一个关节遮罩项。
         * 已存在的相同路径的关节遮罩项会被替换为新的。
         * @en Add a joint mask item.
         * Already existing joint mask with same path item will be replaced.
         * @param path @zh 关节的路径。 @en The joint's path.
         * @param enabled @zh 是否启用该关节。 @en Whether to enable the joint.
         */
        addJoint(path: string, enabled: boolean): void;
        removeJoint(removal: string): void;
        clear(): void;
        filterDisabledNodes(root: Node): Set<Node>;
    }
    export namespace AnimationMask {
        export type JointMaskInfo = __private._cocos_core_animation_marionette_animation_mask__JointMaskInfo_;
    }
    export import Value = animation.Value;
    export import VariableType = animation.VariableType;
    export namespace __private {
        export type _cocos_core_animation_marionette_graph_debug__RuntimeID = number;
        export const _cocos_core_animation_marionette_create_eval__createEval: unique symbol;
        export class _cocos_core_animation_marionette_variable__VarInstance {
            type: animation.VariableType;
            resetMode: TriggerResetMode;
            constructor(type: animation.VariableType, value: animation.Value);
            get value(): animation.Value;
            set value(value: animation.Value);
            bind<T, TThis, ExtraArgs extends any[]>(fn: (this: TThis, value: T, ...args: ExtraArgs) => void, thisArg: TThis, ...args: ExtraArgs): animation.Value;
        }
        export interface _cocos_core_animation_marionette_parametric__BindContext {
            getVar(id: string): _cocos_core_animation_marionette_variable__VarInstance | undefined;
        }
        export interface _cocos_core_animation_marionette_motion__MotionEvalContext extends _cocos_core_animation_marionette_parametric__BindContext {
            node: Node;
            blendBuffer: ___private._cocos_3d_skeletal_animation_skeletal_animation_blending__BlendStateBuffer;
            mask?: AnimationMask;
        }
        export interface _cocos_core_animation_marionette_motion__MotionEval {
            /**
             * The runtime ID. Maybe invalid.
             */
            readonly runtimeId?: _cocos_core_animation_marionette_graph_debug__RuntimeID;
            readonly duration: number;
            sample(progress: number, baseWeight: number): void;
            getClipStatuses(baseWeight: number): Iterator<animation.ClipStatus>;
        }
        export interface _cocos_core_animation_marionette_motion__Motion {
            [_cocos_core_animation_marionette_create_eval__createEval](context: _cocos_core_animation_marionette_motion__MotionEvalContext): _cocos_core_animation_marionette_motion__MotionEval | null;
            clone(): _cocos_core_animation_marionette_motion__Motion;
        }
        export const _cocos_core_animation_marionette_ownership__ownerSymbol: unique symbol;
        export interface _cocos_core_animation_marionette_ownership__OwnedBy<T> {
            [_cocos_core_animation_marionette_ownership__ownerSymbol]: T | undefined;
        }
        export class _cocos_core_animation_marionette_animation_graph__Transition extends ___private._cocos_core_data_editor_extendable__EditorExtendable implements _cocos_core_animation_marionette_ownership__OwnedBy<StateMachine>, _cocos_core_animation_marionette_animation_graph__Transition {
            [_cocos_core_animation_marionette_ownership__ownerSymbol]: StateMachine | undefined;
            /**
             * The transition source.
             */
            from: State;
            /**
             * The transition target.
             */
            to: State;
            /**
             * The transition condition.
             */
            conditions: Condition[];
            constructor(from: State, to: State, conditions?: Condition[]);
            [_cocos_core_animation_marionette_ownership__ownerSymbol]: StateMachine | undefined;
        }
        export type _cocos_core_animation_marionette_state__StateMachineComponentConstructor<T extends animation.StateMachineComponent> = ___private._types_globals__Constructor<T>;
        export class _cocos_core_animation_marionette_state__InteractiveState extends State {
            get components(): Iterable<animation.StateMachineComponent>;
            addComponent<T extends animation.StateMachineComponent>(constructor: _cocos_core_animation_marionette_state__StateMachineComponentConstructor<T>): T;
            removeComponent(component: animation.StateMachineComponent): void;
            instantiateComponents(): animation.StateMachineComponent[];
        }
        export enum _cocos_core_animation_marionette_animation_graph__TransitionInterruptionSource {
            NONE = 0,
            CURRENT_STATE = 1,
            NEXT_STATE = 2,
            CURRENT_STATE_THEN_NEXT_STATE = 3,
            NEXT_STATE_THEN_CURRENT_STATE = 4
        }
        export class _cocos_core_animation_marionette_animation_graph__AnimationTransition extends _cocos_core_animation_marionette_animation_graph__Transition {
            /**
             * The transition duration.
             * The unit of the duration is the real duration of transition source
             * if `relativeDuration` is `true` or seconds otherwise.
             */
            duration: number;
            /**
             * Determines the unit of transition duration. See `duration`.
             */
            relativeDuration: boolean;
            exitConditionEnabled: boolean;
            /**
             * @en The start time of (final) destination motion state when this transition starts.
             * Its unit is seconds if `relativeDestinationStart` is `false`,
             * Otherwise, its unit is the duration of destination motion state.
             * @zh 此过渡开始时，（最终）目标动作状态的起始时间。
             * 如果 `relativeDestinationStart`为 `false`，其单位是秒，否则其单位是目标动作状态的周期。
             */
            destinationStart: number;
            /**
             * @en Determines the unit of destination start time. See `destinationStart`.
             * @zh 决定了目标起始时间的单位。见 `destinationStart`。
             */
            relativeDestinationStart: boolean;
            get exitCondition(): number;
            set exitCondition(value: number);
            /**
             * @internal This field is exposed for **experimental editor only** usage.
             */
            get interruptible(): boolean;
            set interruptible(value: boolean);
            /**
             * @internal This field is exposed for **internal** usage.
             */
            interruptionSource: _cocos_core_animation_marionette_animation_graph__TransitionInterruptionSource;
        }
        export const _cocos_core_animation_marionette_state__outgoingsSymbol: unique symbol;
        export type _cocos_core_animation_marionette_animation_graph__TransitionInternal = _cocos_core_animation_marionette_animation_graph__Transition;
        export const _cocos_core_animation_marionette_state__incomingsSymbol: unique symbol;
        export interface _cocos_core_animation_marionette_animation_graph__BasicVariableDescription<TType> {
            readonly type: TType;
            value: TType extends animation.VariableType.FLOAT ? number : TType extends animation.VariableType.INTEGER ? number : TType extends animation.VariableType.BOOLEAN ? boolean : TType extends animation.VariableType.TRIGGER ? boolean : never;
        }
        export class _cocos_core_animation_marionette_animation_graph__TriggerVariable implements _cocos_core_animation_marionette_animation_graph__BasicVariableDescription<animation.VariableType.TRIGGER> {
            get type(): animation.VariableType.TRIGGER;
            get value(): boolean;
            set value(value: boolean);
            get resetMode(): TriggerResetMode;
            set resetMode(value: TriggerResetMode);
        }
        export enum _cocos_core_animation_marionette_condition__BinaryOperator {
            EQUAL_TO = 0,
            NOT_EQUAL_TO = 1,
            LESS_THAN = 2,
            LESS_THAN_OR_EQUAL_TO = 3,
            GREATER_THAN = 4,
            GREATER_THAN_OR_EQUAL_TO = 5
        }
        export interface _cocos_core_animation_marionette_condition__ConditionEval {
            /**
             * Evaluates this condition.
             */
            eval(): boolean;
        }
        export class _cocos_core_animation_marionette_condition__BinaryConditionEval implements _cocos_core_animation_marionette_condition__ConditionEval {
            constructor(operator: _cocos_core_animation_marionette_condition__BinaryOperator, lhs: number, rhs: number);
            reset(lhs: number, rhs: number): void;
            setLhs(value: number): void;
            setRhs(value: number): void;
            /**
             * Evaluates this condition.
             */
            eval(): boolean;
        }
        export enum _cocos_core_animation_marionette_condition__UnaryOperator {
            TRUTHY = 0,
            FALSY = 1
        }
        export type _cocos_core_animation_marionette_condition__ConditionEvalContext = _cocos_core_animation_marionette_parametric__BindContext;
        export class _cocos_core_animation_marionette_condition__UnaryConditionEval implements _cocos_core_animation_marionette_condition__ConditionEval {
            constructor(operator: _cocos_core_animation_marionette_condition__UnaryOperator, operand: boolean);
            reset(value: boolean): void;
            setOperand(value: boolean): void;
            /**
             * Evaluates this condition.
             */
            eval(): boolean;
        }
        export class _cocos_core_animation_marionette_clip_motion__ClipMotionEval implements _cocos_core_animation_marionette_motion__MotionEval {
            /**
             * @internal
             */
            __DEBUG__ID__?: string;
            runtimeId?: number;
            readonly duration: number;
            constructor(context: _cocos_core_animation_marionette_motion__MotionEvalContext, clip: AnimationClip);
            getClipStatuses(baseWeight: number): Iterator<animation.ClipStatus, any, undefined>;
            get progress(): number;
            sample(progress: number, weight: number): void;
        }
        export class _cocos_core_animation_marionette_animation_blend__AnimationBlendItem {
            motion: _cocos_core_animation_marionette_motion__Motion | null;
            clone(): _cocos_core_animation_marionette_animation_blend__AnimationBlendItem;
            protected _assign(that: _cocos_core_animation_marionette_animation_blend__AnimationBlendItem): _cocos_core_animation_marionette_animation_blend__AnimationBlendItem;
        }
        export class _cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem extends _cocos_core_animation_marionette_animation_blend__AnimationBlendItem {
            weight: number;
            clone(): _cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem;
            protected _assign(that: _cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem): _cocos_core_animation_marionette_animation_blend_direct__AnimationBlendDirectItem;
        }
        export class _cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem extends _cocos_core_animation_marionette_animation_blend__AnimationBlendItem {
            threshold: number;
            clone(): _cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem;
            protected _assign(that: _cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem): _cocos_core_animation_marionette_animation_blend_1d__AnimationBlend1DItem;
        }
        export enum _cocos_core_animation_marionette_animation_blend_2d__Algorithm {
            SIMPLE_DIRECTIONAL = 0,
            FREEFORM_CARTESIAN = 1,
            FREEFORM_DIRECTIONAL = 2
        }
        export class _cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem extends _cocos_core_animation_marionette_animation_blend__AnimationBlendItem {
            threshold: math.Vec2;
            clone(): _cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem;
            protected _assign(that: _cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem): _cocos_core_animation_marionette_animation_blend_2d__AnimationBlend2DItem;
        }
        export interface _cocos_core_animation_marionette_parametric__Bindable<TValue> {
            value: TValue;
            variable: string;
            clone(): _cocos_core_animation_marionette_parametric__Bindable<TValue>;
        }
        export interface _cocos_core_animation_marionette_animation_mask__JointMaskInfo {
            readonly path: string;
            enabled: boolean;
        }
        export type _cocos_core_animation_marionette_animation_mask__JointMaskInfo_ = _cocos_core_animation_marionette_animation_mask__JointMaskInfo;
    }
    import { math, animation, Node, __private as ___private, Asset, AnimationClip } from "cc";
    import { __private as ____private } from "cc/editor/new-gen-anim";
    export {};
}
declare module "cc/editor/offline-mappings" {
    export const effectStructure: {
        $techniques: {
            $passes: {
                depthStencilState: {};
                rasterizerState: {};
                blendState: {
                    targets: {}[];
                };
                properties: {
                    any: {
                        sampler: {};
                        editor: {};
                    };
                };
                migrations: {
                    properties: {
                        any: {};
                    };
                    macros: {
                        any: {};
                    };
                };
                embeddedMacros: {};
            }[];
        }[];
    };
    export const isSampler: (type: any) => boolean;
    export const typeMap: Record<string, gfx.Type | string>;
    export const formatMap: {
        bool: gfx.Format;
        bvec2: gfx.Format;
        bvec3: gfx.Format;
        bvec4: gfx.Format;
        int: gfx.Format;
        ivec2: gfx.Format;
        ivec3: gfx.Format;
        ivec4: gfx.Format;
        uint: gfx.Format;
        uvec2: gfx.Format;
        uvec3: gfx.Format;
        uvec4: gfx.Format;
        float: gfx.Format;
        vec2: gfx.Format;
        vec3: gfx.Format;
        vec4: gfx.Format;
        int8_t: gfx.Format;
        i8vec2: gfx.Format;
        i8vec3: gfx.Format;
        i8vec4: gfx.Format;
        uint8_t: gfx.Format;
        u8vec2: gfx.Format;
        u8vec3: gfx.Format;
        u8vec4: gfx.Format;
        int16_t: gfx.Format;
        i16vec2: gfx.Format;
        i16vec3: gfx.Format;
        i16vec4: gfx.Format;
        uint16_t: gfx.Format;
        u16vec2: gfx.Format;
        u16vec3: gfx.Format;
        u16vec4: gfx.Format;
        float16_t: gfx.Format;
        f16vec2: gfx.Format;
        f16vec3: gfx.Format;
        f16vec4: gfx.Format;
        mat2: gfx.Format;
        mat3: gfx.Format;
        mat4: gfx.Format;
        mat2x2: gfx.Format;
        mat3x3: gfx.Format;
        mat4x4: gfx.Format;
        mat2x3: gfx.Format;
        mat2x4: gfx.Format;
        mat3x2: gfx.Format;
        mat3x4: gfx.Format;
        mat4x2: gfx.Format;
        mat4x3: gfx.Format;
    };
    export const getFormat: (name: string) => any;
    export const getShaderStage: (name: string) => any;
    export const getDescriptorType: (name: string) => any;
    export const isNormalized: (format: string) => boolean;
    export const isPaddedMatrix: (type: any) => boolean;
    export const getMemoryAccessFlag: (access: string) => gfx.MemoryAccessBit;
    export const passParams: {
        NONE: gfx.ColorMask;
        R: gfx.ColorMask;
        G: gfx.ColorMask;
        B: gfx.ColorMask;
        A: gfx.ColorMask;
        RG: number;
        RB: number;
        RA: number;
        GB: number;
        GA: number;
        BA: number;
        RGB: number;
        RGA: number;
        RBA: number;
        GBA: number;
        ALL: gfx.ColorMask;
        ADD: gfx.BlendOp;
        SUB: gfx.BlendOp;
        REV_SUB: gfx.BlendOp;
        MIN: gfx.BlendOp;
        MAX: gfx.BlendOp;
        ZERO: gfx.BlendFactor;
        ONE: gfx.BlendFactor;
        SRC_ALPHA: gfx.BlendFactor;
        DST_ALPHA: gfx.BlendFactor;
        ONE_MINUS_SRC_ALPHA: gfx.BlendFactor;
        ONE_MINUS_DST_ALPHA: gfx.BlendFactor;
        SRC_COLOR: gfx.BlendFactor;
        DST_COLOR: gfx.BlendFactor;
        ONE_MINUS_SRC_COLOR: gfx.BlendFactor;
        ONE_MINUS_DST_COLOR: gfx.BlendFactor;
        SRC_ALPHA_SATURATE: gfx.BlendFactor;
        CONSTANT_COLOR: gfx.BlendFactor;
        ONE_MINUS_CONSTANT_COLOR: gfx.BlendFactor;
        CONSTANT_ALPHA: gfx.BlendFactor;
        ONE_MINUS_CONSTANT_ALPHA: gfx.BlendFactor;
        KEEP: gfx.StencilOp;
        REPLACE: gfx.StencilOp;
        INCR: gfx.StencilOp;
        DECR: gfx.StencilOp;
        INVERT: gfx.StencilOp;
        INCR_WRAP: gfx.StencilOp;
        DECR_WRAP: gfx.StencilOp;
        NEVER: gfx.ComparisonFunc;
        LESS: gfx.ComparisonFunc;
        EQUAL: gfx.ComparisonFunc;
        LESS_EQUAL: gfx.ComparisonFunc;
        GREATER: gfx.ComparisonFunc;
        NOT_EQUAL: gfx.ComparisonFunc;
        GREATER_EQUAL: gfx.ComparisonFunc;
        ALWAYS: gfx.ComparisonFunc;
        FRONT: gfx.CullMode;
        BACK: gfx.CullMode;
        GOURAND: gfx.ShadeModel;
        FLAT: gfx.ShadeModel;
        FILL: gfx.PolygonMode;
        LINE: gfx.PolygonMode;
        POINT: gfx.PolygonMode;
        POINT_LIST: gfx.PrimitiveMode;
        LINE_LIST: gfx.PrimitiveMode;
        LINE_STRIP: gfx.PrimitiveMode;
        LINE_LOOP: gfx.PrimitiveMode;
        TRIANGLE_LIST: gfx.PrimitiveMode;
        TRIANGLE_STRIP: gfx.PrimitiveMode;
        TRIANGLE_FAN: gfx.PrimitiveMode;
        LINE_LIST_ADJACENCY: gfx.PrimitiveMode;
        LINE_STRIP_ADJACENCY: gfx.PrimitiveMode;
        TRIANGLE_LIST_ADJACENCY: gfx.PrimitiveMode;
        TRIANGLE_STRIP_ADJACENCY: gfx.PrimitiveMode;
        TRIANGLE_PATCH_ADJACENCY: gfx.PrimitiveMode;
        QUAD_PATCH_LIST: gfx.PrimitiveMode;
        ISO_LINE_LIST: gfx.PrimitiveMode;
        LINEAR: gfx.Filter;
        ANISOTROPIC: gfx.Filter;
        WRAP: gfx.Address;
        MIRROR: gfx.Address;
        CLAMP: gfx.Address;
        BORDER: gfx.Address;
        LINE_WIDTH: gfx.DynamicStateFlagBit;
        DEPTH_BIAS: gfx.DynamicStateFlagBit;
        BLEND_CONSTANTS: gfx.DynamicStateFlagBit;
        DEPTH_BOUNDS: gfx.DynamicStateFlagBit;
        STENCIL_WRITE_MASK: gfx.DynamicStateFlagBit;
        STENCIL_COMPARE_MASK: gfx.DynamicStateFlagBit;
        TRUE: boolean;
        FALSE: boolean;
    };
    export import Sampler = gfx.Sampler;
    export import SamplerInfo = gfx.SamplerInfo;
    export import SetIndex = pipeline.SetIndex;
    export import RenderPriority = pipeline.RenderPriority;
    export import GetTypeSize = gfx.GetTypeSize;
    export { murmurhash2_32_gc } from "cc";
    import { gfx, pipeline } from "cc";
    export {};
}
declare module "cc/editor/particle-system-2d-utils" {
    /**
     * A png file reader
     * @name PNGReader
     */
    export class PNGReader {
        constructor(data: any);
        read(bytes: any): any[];
        readUInt32(): number;
        readUInt16(): number;
        decodePixels(data: any): Uint8Array;
        copyToImageData(imageData: any, pixels: any): void;
        decodePalette(): Uint8Array;
        render(canvas: any): any;
    }
    /**
     * cc.tiffReader is a singleton object, it's a tiff file reader, it can parse byte array to draw into a canvas
     * @class
     * @name tiffReader
     */
    export class TiffReader {
        constructor();
        getUint8(offset: any): never;
        getUint16(offset: any): number;
        getUint32(offset: any): number;
        checkLittleEndian(): boolean;
        hasTowel(): boolean;
        getFieldTypeName(fieldType: any): any;
        getFieldTagName(fieldTag: any): any;
        getFieldTypeLength(fieldTypeName: any): 0 | 1 | 4 | 2 | 8;
        getFieldValues(fieldTagName: any, fieldTypeName: any, typeCount: any, valueOffset: any): any[];
        getBytes(numBytes: any, offset: any): number;
        getBits(numBits: any, byteOffset: any, bitOffset: any): {
            bits: number;
            byteOffset: any;
            bitOffset: number;
        };
        parseFileDirectory(offset: any): void;
        clampColorSample(colorSample: any, bitsPerSample: any): number;
        /**
         * @function
         * @param {Array} tiffData
         * @param {HTMLCanvasElement} canvas
         * @returns {*}
         */
        parseTIFF(tiffData: any, canvas: any): any;
    }
    export function getImageFormatByData(imgData: any): ImageFormat.PNG | ImageFormat.TIFF | ImageFormat.UNKNOWN;
    /**
     * Image formats
     * @enum macro.ImageFormat
     */
    export enum ImageFormat {
        /**
         * @en Image Format:JPG
         * @zh 图片格式:JPG
         */
        JPG = 0,
        /**
         * @en Image Format:PNG
         * @zh 图片格式:PNG
         */
        PNG = 1,
        /**
         * @en Image Format:TIFF
         * @zh 图片格式:TIFF
         */
        TIFF = 2,
        /**
         * @en Image Format:WEBP
         * @zh 图片格式:WEBP
         */
        WEBP = 3,
        /**
         * @en Image Format:PVR
         * @zh 图片格式:PVR
         */
        PVR = 4,
        /**
         * @en Image Format:ETC
         * @zh 图片格式:ETC
         */
        ETC = 5,
        /**
         * @en Image Format:S3TC
         * @zh 图片格式:S3TC
         */
        S3TC = 6,
        /**
         * @en Image Format:ATITC
         * @zh 图片格式:ATITC
         */
        ATITC = 7,
        /**
         * @en Image Format:TGA
         * @zh 图片格式:TGA
         */
        TGA = 8,
        /**
         * @en Image Format:RAWDATA
         * @zh 图片格式:RAWDATA
         */
        RAWDATA = 9,
        /**
         * @en Image Format:UNKNOWN
         * @zh 图片格式:UNKNOWN
         */
        UNKNOWN = 10
    }
    export {};
}
declare module "cc/editor/populate-internal-constants" {
    /**
     * Running in Web platform
     */
    export const HTML5: boolean;
    /**
     * Running in native platform (mobile app, desktop app, or simulator).
     */
    export const NATIVE: boolean;
    /**
     * Running in the Wechat's mini game.
     */
    export const WECHAT: boolean;
    /**
     * Running in the baidu's mini game.
     */
    export const BAIDU: boolean;
    /**
     * Running in the xiaomi's quick game.
     */
    export const XIAOMI: boolean;
    /**
     * Running in the alipay's mini game.
     */
    export const ALIPAY: boolean;
    /**
     * Running in the taobao creative app.
     */
    export const TAOBAO: boolean;
    /**
     * Running in the ByteDance's mini game.
     */
    export const BYTEDANCE: boolean;
    /**
     * Running in the oppo's quick game.
     */
    export const OPPO: boolean;
    /**
     * Running in the vivo's quick game.
     */
    export const VIVO: boolean;
    /**
     * Running in the huawei's quick game.
     */
    export const HUAWEI: boolean;
    /**
     * Running in the cocosplay.
     */
    export const COCOSPLAY: boolean;
    /**
     * Running in the qtt's quick game.
     */
    export const QTT: boolean;
    /**
     * Running in the linksure's quick game.
     */
    export const LINKSURE: boolean;
    /**
     * Running in the editor.
     */
    export const EDITOR: boolean;
    /**
     * Preview in browser or simulator.
     */
    export const PREVIEW: boolean;
    /**
     * Running in published project.
     */
    export const BUILD: boolean;
    /**
     * Running in the engine's unit test.
     */
    export const TEST: boolean;
    /**
     * Running debug mode.
     */
    export const DEBUG: boolean;
    /**
     * Running in the server mode.
     */
    export const SERVER_MODE: boolean;
    /**
     * Running in the editor or preview.
     */
    export const DEV: boolean;
    /**
     * Running in mini game.
     */
    export const MINIGAME: boolean;
    /**
     * Running in runtime based environment.
     */
    export const RUNTIME_BASED: boolean;
    /**
     * Support JIT.
     */
    export const SUPPORT_JIT: boolean;
    /**
     * Running in environment where using JSB as the JavaScript interface binding scheme.
     */
    export const JSB: boolean;
    /**
     * This is an internal constant to determine whether pack physx libs.
     */
    export const NOT_PACK_PHYSX_LIBS: boolean;
    /**
     * The network access mode.
     * - 0 Client
     * - 1 ListenServer
     * - 2 HostServer
     */
    export const NET_MODE: number;
    /**
     * Running with webgpu rendering backend.
     */
    export const WEBGPU: boolean;
    export {};
}
declare module "cc/editor/serialization" {
    export class CCON {
        constructor(document: unknown, chunks: Uint8Array[]);
        get document(): unknown;
        get chunks(): Uint8Array[];
    }
    export function encodeCCONJson(ccon: CCON, chunkURLs: string[]): unknown;
    export function encodeCCONBinary(ccon: CCON): Uint8Array;
    export class BufferBuilder {
        get byteLength(): number;
        alignAs(align: number): number;
        append(view: ArrayBufferView): number;
        get(): Uint8Array;
    }
    export function decodeCCONBinary(bytes: Uint8Array): CCON;
    export function parseCCONJson(json: unknown): {
        chunks: string[];
        document: unknown;
    };
    export {};
}
