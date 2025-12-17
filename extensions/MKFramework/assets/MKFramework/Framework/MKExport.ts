import { mkLog } from "./MKLogger";

/* ------------------------------- 模块 ------------------------------- */
// UI 管理器
export { default as uiManage, MKUIManage_ as UIManage_ } from "./MKUIManage";
// 生命周期
export { default as Layer } from "./Module/MKLayer";
export { default as LifeCycle } from "./Module/MKLifeCycle";
export { default as SceneDrive } from "./Module/MKSceneDrive";
// 视图模块
export { default as ViewBase } from "./Module/MKViewBase";
export { default as StaticViewBase } from "./Module/MKStaticViewBase";
// MVC 架构
export { default as MVCModelBase } from "./Module/MVC/MVCModelBase";
export { default as MVCViewBase } from "./Module/MVC/MVCViewBase";
export { default as MVCControlBase } from "./Module/MVC/MVCControlBase";
/* ------------------------------- 新手引导 ------------------------------- */
// 引导管理器
export { default as GuideManage } from "./Guide/MKGuideManage";
export type { MKGuideManage_ as GuideManage_ } from "./Guide/MKGuideManage";
// 引导步骤基类
export { default as GuideStepBase } from "./Guide/MKGuideStepBase";
// 多边形遮罩
export { MKPolygonMask as PolygonMask } from "./@Component/MKPolygonMask";
/* ------------------------------- 屏幕/UI适配 ------------------------------- */
// Canvas 适配
export { default as AdaptationCanvas } from "./@Component/Adaptation/MKAdaptationCanvas";
// 节点适配
export { default as AdaptationNode } from "./@Component/Adaptation/MKAdaptationNode";
/* ------------------------------- 日志 ------------------------------- */
export { default as Logger } from "./MKLogger";

const log = mkLog.log.bind(mkLog);
const warn = mkLog.warn.bind(mkLog);
const error = mkLog.error.bind(mkLog);

export { log, warn, error };
/* ------------------------------- 资源管理 ------------------------------- */
// Bundle 管理器
export { default as bundle, MKBundle_ as Bundle_ } from "./Resources/MKBundle";
// 资源管理器
export { default as asset } from "./Resources/MKAsset";
export type { MKAsset_ as Asset_ } from "./Resources/MKAsset";
// 对象释放器
export { default as Release } from "./Resources/MKRelease";
export type { MKRelease_ as Release_ } from "./Resources/MKRelease";
/* ------------------------------- 数据 ------------------------------- */
// 数据共享
export { default as dataSharer } from "./MKDataSharer";
// 数据监听
export { default as monitor } from "./MKMonitor";
// 编解码器
export { default as CodecBase, MKCodecBase_ as CodecBase_ } from "./MKCodecBase";
/* ------------------------------- 其他 ------------------------------- */
// 音频
export { default as audio, MKAudio_ as Audio_ } from "./Audio/MKAudio";
// 多语言
export { default as language, languageManage, LanguageManage_ as Language_ } from "./Language/MKLanguage";
// 网络
export { default as network } from "./Network/MKNetwork";
// 任务
export { default as task } from "./Task/MKTask";
// 事件
export { default as EventTarget } from "./MKEventTarget";
// 单例
export { default as InstanceBase } from "./MKInstanceBase";
// 对象池
export { default as ObjectPool } from "./MKObjectPool";
// 存储
export { default as Storage } from "./MKStorage";
// 动态模块加载器
export { default as dynamicModule } from "./MKDynamicModule";
// 游戏通用方法
export { default as game } from "./MKGame";
// 节点扩展
export { default as N } from "./@Extends/@Node/MKNodes";
