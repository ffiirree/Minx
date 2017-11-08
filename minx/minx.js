/*******************************************************************
 * minx
 * - Data Bindings
 * - DOM Listeners
 *
 * - Web Components
 *******************************************************************/


class Minx {
    constructor(options) {
        this._data = options.data;
        this._methods = options.methods;
        this.$node = options.$.nodeType ? options.$ : document.querySelector(options.$);

        let self = this;
        Object.keys(this._data).forEach(key => {
            Reflect.defineProperty(self, key, {
                configurable: true,
                enumerable: true,

                get: function () {
                    return self._data[key];
                },

                set: function (val) {
                    self._data[key] = val;
                }
            })
        });


        new Observer(this._data);
        new Compile(this.$node, this);
    }
}
