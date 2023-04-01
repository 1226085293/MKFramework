import mk_audio_base, { mk_audio_base_ } from "./mk_audio_base";
import audio_common, { mk_audio_common_ } from "./platform/mk_audio_common";
import audio_wx, { mk_audio_wx_ } from "./platform/mk_audio_wx";

// 重定义 audio_，保持类型不变
Object.assign(mk_audio_base_, self.wx ? mk_audio_wx_ : mk_audio_common_);

export { mk_audio_base_ as audio_ } from "./mk_audio_base";
export const audio: mk_audio_base = self.wx ? audio_wx : audio_common;
