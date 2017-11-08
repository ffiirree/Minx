const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
const hackProto = Object.create(Array.prototype);

methods.forEach(function(method){
    let _original = hackProto[method];

    Object.defineProperty(hackProto, method, {
        writable: true,
        enumerable: true,
        configurable: true,

        value: function() {
            let _arguments = arguments;
            let _len = arguments.length;
            let _args = new Array(_len);

            while (_len--) {
                _args[_len] = _arguments[_len];
            }

            let _res = _original.apply(this, _args);


            let ob = this.__ob__;

            let inserted;

            switch (method) {
                case 'push':
                    inserted = _args;
                    break;

                case 'unshift':
                    inserted = _args;
                    break;

                case 'splice':
                    // 第3个开始才是
                    inserted = _args.slice(2);
                    break;
            }

            if(inserted) {
                ob.observeArray(inserted);
            }

            ob.dep.notify();

            console.log('array changed');
            return _res;
        },
    })
});

/**
 * @class
 */
class Observer {
    constructor(data) {
        this.value = data;
        this.dep = new Depend();

        Reflect.defineProperty(data, '__ob__', {
            value: this,
            configurable: true,
            writable: true
        });

        Array.isArray(data) ? this.observeArray(data) : this.walk(data);
    }

    /**
     *
     * @param value
     * @returns {*}
     */
    static observe(value) {
        if (!value || typeof value !== 'object')  return;

        if (Object.hasOwnProperty.call(value, '__ob__') && value.__ob__ instanceof Observer) {
            return value.__ob__;
        } else {
            return new Observer(value);
        }
    }

    observeArray(arr) {
        arr.forEach(item => {
            Observer.observe(item);
        });
    }

    walk(data) {
        Object.keys(data).forEach(key => {
            let _old = data[key];

            let _childOb = Observer.observe(_old);
            let dep = new Depend();

            Reflect.defineProperty(data, key, {
                enumerable: true,
                configurable: true,

                get: function () {
                    if(Depend.currentWatcher) {
                        dep.depend();
                        if(_childOb)
                            _childOb.dep.depend();
                    }

                    return _old;
                },

                set: function (val) {
                    if(val !== _old) {
                        console.log(`${_old}--->${val}`);
                        _old = val;

                        _childOb = Observer.observe(val);
                        dep.notify();
                    }
                }
            });
        });
    }
}
