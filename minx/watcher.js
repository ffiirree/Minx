
class Watcher{

    /**
     * @param host host[key]
     * @param key  host[key]
     * @param cb callback
     */
    constructor(host, key, cb) {

        this._cb = cb;
        this._host = host;
        this._key = key;
        this.depIds = {};

        // 通过触发劫持对象的getter，将自己作为订阅者添加到依赖中
        Depend.currentWatcher = this;
        this.value = this._host[this._key];
        Depend.currentWatcher = null;
    }

    update() {
        let _val = this._host[this._key];
        let _old = this.value;

        if (_val !== _old) {
            this.value = _val;

            // Update view
            this._cb.call(this._host, _old, _val);
        }
    }

    addDep(depend) {
        if (!this.depIds.hasOwnProperty(depend.id)) {
            depend.add(this);
            this.depIds[depend.id] = depend;
        }
    }
}

/**
 * Observer劫持对象，对象更新(obj.set(val))时，通过Depend.notify通知watcher更新
 * Watcher在编译时，通过obj.getter获取Depend
 * @type {number}
 */
let uid = 0;
class Depend {
    constructor() {
        this.id = ++uid;
        this.watchers = [];
    }

    /**
     * 添加订阅者
     * @param watcher
     */
    add(watcher) {
        // 防止重复添加Watcher
        for(let i = 0; i < this.watchers.length; ++i) {
            let item = this.watchers[i];

            if(item._host === watcher._host && item._key === watcher._key) {
                return;
            }
        }
        this.watchers.push(watcher);
    }

    /**
     * 通知所有的订阅者更新视图
     */
    notify() {
        this.watchers.forEach(watcher => {
            watcher.update();
        });
    }

    depend() {
        Depend.currentWatcher.addDep(this);
    }
}

Depend.currentWatcher = null;