import mk from "mk";
import operate from "./resources_guide_operate";

abstract class resources_guide_step_base extends mk.guide_step_base<typeof operate.tab> {}

export default resources_guide_step_base;
