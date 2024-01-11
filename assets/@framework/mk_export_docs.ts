import { mk_log } from "./mk_logger";

export { default as task } from "./task/mk_task";
export { audio, mk_audio_ as audio_ } from "./audio/mk_audio_export";
export { default as language, language_manage, language_manage_ as language_ } from "./language/mk_language";
export { default as layer } from "./module/mk_layer";
export type { _mk_layer as layer_ } from "./module/mk_layer";
export { default as life_cycle } from "./module/mk_life_cycle";
export { default as scene_drive } from "./module/mk_scene_drive";
export { default as view_base, mk_view_base_ as view_base_ } from "./module/mk_view_base";
export { default as network } from "./network/mk_network_docs";
export { mk_bundle as bundle, mk_bundle_ as bundle_ } from "./resources/mk_bundle";
export { mk_asset as asset } from "./resources/mk_asset";
export type { mk_asset_ as asset_ } from "./resources/mk_asset";
export { default as codec_base, mk_codec_base_ as codec_base_ } from "./mk_codec_base";
export { default as data_sharer } from "./mk_data_sharer";
export { default as event_target } from "./mk_event_target";
export { default as instance_base } from "./mk_instance_base";
export { default as logger, mk_logger_ as logger_ } from "./mk_logger";
export { mk_monitor as monitor } from "./mk_monitor";
export { default as obj_pool } from "./mk_obj_pool";
export { default as storage } from "./mk_storage";
export { mk_ui_manage as ui_manage, mk_ui_manage_ as ui_manage_ } from "./mk_ui_manage";
export { default as guide_manage } from "./guide/mk_guide_manage";
export type { mk_guide_manage_ as guide_manage_ } from "./guide/mk_guide_manage";
export { mk_dynamic_module as dynamic_module } from "./mk_dynamic_module";
export { default as guide_step_base } from "./guide/mk_guide_step_base";
export { mk_game as game } from "./mk_game";
export { mk_polygon_mask as polygon_mask } from "./@component/mk_polygon_mask";
export { default as release } from "./mk_release";
export type { mk_release_ as release_ } from "./mk_release";

const log = mk_log.log.bind(mk_log);
const warn = mk_log.warn.bind(mk_log);
const error = mk_log.error.bind(mk_log);

export { log, warn, error };
