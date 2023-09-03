import mk_audio_base, { mk_audio_base_ } from "./mk_audio_base";
import audio_common, { mk_audio_common_ } from "./platform/mk_audio_common";
import audio_wx, { mk_audio_wx_ } from "./platform/mk_audio_wx";

// 重定义 audio_，保持类型不变
Object.assign(mk_audio_base_, self.wx ? mk_audio_wx_ : mk_audio_common_);

export { mk_audio_base_ as mk_audio_ } from "./mk_audio_base";

/**
 * 音频管理器
 * @remarks
 *
 * - (动态/静态)音频支持
 *
 * - 音频(类型/分组)双分类支持
 *
 * - (通用/微信)版本管理器
 *
 * - 统一音频事件
 */
export const mk_audio: mk_audio_base = self.wx ? audio_wx : audio_common;
