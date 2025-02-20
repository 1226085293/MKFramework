interface plugin_event_protocol {
	/** 节点树更新 */
	node_tree_update(): void;
}

namespace _plugin_event {
	export interface event_data {
		/** 回调 */
		callback_f: (...args_as: any[]) => any;
		/** 对象 */
		target: any;
		/** 单次 */
		once_b?: boolean;
	}
}

class plugin_event<CT> {
	/* --------------- public --------------- */
	/** 事件键 */
	key: { [k in keyof CT]: k } = new Proxy(Object.create(null), {
		get: (target, key) => key,
	});
	/* --------------- private --------------- */
	/** 事件数据 */
	private _event_tab: Record<PropertyKey, _plugin_event.event_data[]> =
		new Proxy(
			{},
			{
				// @ts-ignore
				get: (target, key) => target[key] ?? (target[key] = []),
			}
		);
	/* ------------------------------- 功能 ------------------------------- */
	// @ts-ignore
	on<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T,
		callback_f_: T2,
		this_?: any,
		once_b_?: boolean
	): typeof callback_f_ | null {
		this._event_tab[type_].push({
			callback_f: callback_f_,
			target: this_,
			once_b: once_b_,
		});
		return callback_f_;
	}

	// @ts-ignore
	once<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T,
		callback_f_: T2,
		this_?: any
	): typeof callback_f_ | null {
		this._event_tab[type_].push({
			callback_f: callback_f_,
			target: this_,
			once_b: true,
		});
		return callback_f_;
	}

	// @ts-ignore
	off<T extends keyof CT, T2 extends (...event_: Parameters<CT[T]>) => void>(
		type_: T,
		callback_?: T2,
		this_?: any
	): void {
		let index_n = this._event_tab[type_].findIndex(
			(v) => v.callback_f === callback_ && (this_ ? this_ === v.target : true)
		);

		if (index_n !== -1) {
			this._event_tab[type_].splice(index_n, 1);
		}
	}

	targetOff(target_?: any): void {
		for (let k_s in this._event_tab) {
			for (let k2_n = 0, len_n = this._event_tab[k_s].length; k2_n < len_n; ) {
				if (this._event_tab[k_s][k2_n].target === target_) {
					this._event_tab[k_s].splice(k2_n, 1);
					--len_n;
					continue;
				}
				++k2_n;
			}
		}
	}

	// @ts-ignore
	emit<T extends keyof CT, T2 extends Parameters<CT[T]>>(
		type_: T,
		...args_: T2
	): void {
		let event_as = this._event_tab[type_];

		for (let k_n = 0, len_n = event_as.length; k_n < len_n; ) {
			event_as[k_n].callback_f.call(event_as[k_n].target, ...args_);

			if (event_as[k_n].once_b) {
				event_as.splice(k_n, 1);
			} else {
				k_n++;
			}
		}
	}

	hasEventListener<
		T extends keyof CT,
		// @ts-ignore
		T2 extends (...event_: Parameters<CT[T]>) => void
	>(type_: T, callback_?: T2, target_?: any): boolean {
		return (
			this._event_tab[type_].findIndex(
				(v) =>
					(callback_ ? callback_ === v.callback_f : true) &&
					(target_ ? target_ === v.target : true)
			) !== -1
		);
	}

	clear(): void {
		this._event_tab = {};
	}

	/** 请求（等待返回） */
	request<
		T extends keyof CT,
		// @ts-ignore
		T2 extends Parameters<CT[T]>,
		// @ts-ignore
		T3 extends ReturnType<CT[T]>
	>(type_: T, ...args_: T2): Promise<T3[]> {
		const result_as: Promise<any>[] = [];

		let event_as = this._event_tab[type_];

		for (let k_n = 0, len_n = event_as.length; k_n < len_n; ) {
			result_as.push(
				event_as[k_n].callback_f.call(event_as[k_n].target, ...args_)
			);

			if (event_as[k_n].once_b) {
				event_as.splice(k_n, 1);
			} else {
				k_n++;
			}
		}

		return Promise.all(result_as);
	}
}

export default new plugin_event<plugin_event_protocol>();
