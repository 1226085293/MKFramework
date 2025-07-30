import MKAudioBase, { MKAudioBase_ } from "./MKAudioBase";
import MKAudioCommon, { MKAudioCommon_ } from "./Platform/MKAudioCommon";
import MKAudioWX, { MKAudioWX_ } from "./Platform/MKAudioWX";
export { default as audio } from "./MKAudioBase";
export { MKAudioBase_ as MKAudio_ } from "./MKAudioBase";

// 重定义 audio_，保持类型不变
Object.assign(MKAudioBase_, window.wx ? MKAudioWX_ : MKAudioCommon_);

/**
 * 音频管理器
 * @remarks
 *
 * - 音频分组，支持对不同类型的音频批量控制
 *
 * - 支持(动态/静态)音频
 *
 * - (通用/微信)版本
 *
 * - 增加对 playOnShot 接口的事件支持
 *
 * - 通用版本超出播放数量限制后停止当前音频而不是之前的
 */
export const mkAudio: MKAudioBase = window.wx ? new MKAudioWX() : new MKAudioCommon();
