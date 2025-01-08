export interface TreeNode {
	active: boolean;
	additional: { type: string; value: string }[];
	children: TreeNode[];
	components: {
		extends: string[];
		type: string;
		value: string;
	}[];
	depth: number;
	isScene: boolean;
	level: string;
	locked: boolean;
	name: string;
	parent: string;
	path: string;
	prefab: {
		assetUuid: string;
		isAddedChild: boolean;
		isApplicable: boolean;
		isRevertable: boolean;
		isUnwrappable: boolean;
		state: number;
	};
	readonly: boolean;
	type: string;
	uuid: string;
}
