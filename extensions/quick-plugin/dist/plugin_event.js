"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class plugin_event {
    constructor() {
        /* --------------- public --------------- */
        /** 事件键 */
        this.key = new Proxy(Object.create(null), {
            get: (target, key) => key,
        });
        /* --------------- private --------------- */
        /** 事件数据 */
        this._event_tab = new Proxy({}, {
            // @ts-ignore
            get: (target, key) => { var _a; return (_a = target[key]) !== null && _a !== void 0 ? _a : (target[key] = []); },
        });
    }
    /* ------------------------------- 功能 ------------------------------- */
    // @ts-ignore
    on(type_, callback_f_, this_, once_b_) {
        this._event_tab[type_].push({
            callback_f: callback_f_,
            target: this_,
            once_b: once_b_,
        });
        return callback_f_;
    }
    // @ts-ignore
    once(type_, callback_f_, this_) {
        this._event_tab[type_].push({
            callback_f: callback_f_,
            target: this_,
            once_b: true,
        });
        return callback_f_;
    }
    // @ts-ignore
    off(type_, callback_, this_) {
        let index_n = this._event_tab[type_].findIndex((v) => v.callback_f === callback_ && (this_ ? this_ === v.target : true));
        if (index_n !== -1) {
            this._event_tab[type_].splice(index_n, 1);
        }
    }
    targetOff(target_) {
        for (let k_s in this._event_tab) {
            for (let k2_n = 0, len_n = this._event_tab[k_s].length; k2_n < len_n;) {
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
    emit(type_, ...args_) {
        let event_as = this._event_tab[type_];
        for (let k_n = 0, len_n = event_as.length; k_n < len_n;) {
            event_as[k_n].callback_f.call(event_as[k_n].target, ...args_);
            if (event_as[k_n].once_b) {
                event_as.splice(k_n, 1);
            }
            else {
                k_n++;
            }
        }
    }
    hasEventListener(type_, callback_, target_) {
        return (this._event_tab[type_].findIndex((v) => (callback_ ? callback_ === v.callback_f : true) &&
            (target_ ? target_ === v.target : true)) !== -1);
    }
    clear() {
        this._event_tab = {};
    }
    /** 请求（等待返回） */
    request(type_, ...args_) {
        const result_as = [];
        let event_as = this._event_tab[type_];
        for (let k_n = 0, len_n = event_as.length; k_n < len_n;) {
            result_as.push(event_as[k_n].callback_f.call(event_as[k_n].target, ...args_));
            if (event_as[k_n].once_b) {
                event_as.splice(k_n, 1);
            }
            else {
                k_n++;
            }
        }
        return Promise.all(result_as);
    }
}
exports.default = plugin_event;
