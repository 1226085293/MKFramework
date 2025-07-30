import mk from "mk";
import operate from "./ResourcesGuideOperate";

abstract class ResourcesGuideStepBase extends mk.GuideStepBase<typeof operate.tab> {}

export default ResourcesGuideStepBase;
