// Warn if overriding existing method
if(Array.prototype.equals)
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length !== array.length)
        return false;

    for (let i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] !== array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
};

// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});


const methods = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'];
const MinxArray = Object.create(Array.prototype);

methods.forEach(method => {
    let _array = MinxArray[method];

    Object.defineProperty(MinxArray, method, {
        writable: true,
        enumerable: true,
        configurable: true,

        value: function() {
            let _arguments = arguments;
            let _len = arguments.length; // 插入的item的个数
            let _args = new Array(_len);

            // Deep copy
            while (_len--) {
                _args[_len] = _arguments[_len];
            }

            let _res = _array.apply(this, _args);

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

            return _res;
        },
    });
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
        arr.__proto__ = MinxArray;

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
                        // console.log(`${_old}--->${val}`);
                        _old = val;

                        _childOb = Observer.observe(val);
                        dep.notify();
                    }
                }
            });
        });
    }
}
