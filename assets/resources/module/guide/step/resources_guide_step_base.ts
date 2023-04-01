import mk from "mk";
import operate from "./resources_guide_operate";

abstract class resources_guide_step_base extends mk.guide.step_base {
	operate_ss: (keyof typeof operate.tab)[] = [];
	operate_tab!: { [k in keyof typeof operate.tab]: ReturnType<Awaited<typeof operate.tab[k]["load"]>> | undefined };
}

export default resources_guide_step_base;
