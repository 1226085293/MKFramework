import { mk_log } from "./mk_logger";

export { default as task } from "./task/mk_task";
export { mk_audio as audio, mk_audio_ as audio_ } from "./audio/mk_audio_export";
export { default as language, mk_language_manage as language_manage, language_manage_ as language_ } from "./language/mk_language";
export { default as layer } from "./module/mk_layer";
export type { _mk_layer as layer_ } from "./module/mk_layer";
export { default as life_cycle } from "./module/mk_life_cycle";
export { default as scene_drive } from "./module/mk_scene_drive";
export { default as view_base } from "./module/mk_view_base";
export { default as static_view_base } from "./module/mk_static_view_base";
export { default as network } from "./network/mk_network";
export { default as bundle, mk_bundle_ as bundle_ } from "./resources/mk_bundle";
export { default as asset } from "./resources/mk_asset";
export type { mk_asset_ as asset_ } from "./resources/mk_asset";
export { default as codec_base, mk_codec_base_ as codec_base_ } from "./mk_codec_base";
export { default as data_sharer } from "./mk_data_sharer";
export { default as event_target } from "./mk_event_target";
export { default as instance_base } from "./mk_instance_base";
export { default as logger } from "./mk_logger";
export { default as monitor } from "./mk_monitor";
export { default as obj_pool } from "./mk_obj_pool";
export { default as storage } from "./mk_storage";
export { default as ui_manage, mk_ui_manage_ as ui_manage_ } from "./mk_ui_manage";
export { default as guide_manage } from "./guide/mk_guide_manage";
export type { mk_guide_manage_ as guide_manage_ } from "./guide/mk_guide_manage";
export { default as dynamic_module } from "./mk_dynamic_module";
export { default as guide_step_base } from "./guide/mk_guide_step_base";
export { default as game } from "./mk_game";
export { mk_polygon_mask as polygon_mask } from "./@component/mk_polygon_mask";
export { default as release } from "./mk_release";
export type { mk_release_ as release_ } from "./mk_release";
export { default as N } from "./@extends/@node/mk_nodes";

const log = mk_log.log.bind(mk_log);
const warn = mk_log.warn.bind(mk_log);
const error = mk_log.error.bind(mk_log);

export { log, warn, error };
