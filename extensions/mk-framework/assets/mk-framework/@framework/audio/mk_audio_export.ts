import mk_audio_base, { mk_audio_base_ } from "./mk_audio_base";
import audio_common, { mk_audio_common_ } from "./platform/mk_audio_common";
import audio_wx, { mk_audio_wx_ } from "./platform/mk_audio_wx";
export { default as audio } from "./mk_audio_base";
export { mk_audio_base_ as mk_audio_ } from "./mk_audio_base";

// 重定义 audio_，保持类型不变
Object.assign(mk_audio_base_, self.wx ? mk_audio_wx_ : mk_audio_common_);

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
export const mk_audio: mk_audio_base = self.wx ? audio_wx : audio_common;
