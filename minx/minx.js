/*******************************************************************
 * minx
 * - Data Bindings
 * - DOM Listeners
 *
 * - Web Components
 *******************************************************************/


class Minx {
    constructor(arg) {
        this._data = arg.data;
        this._methods = arg.methods;
        let self = this;

        Object.keys(this._data).forEach(key =>{
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


        // Data binding
        Observer.observe(this._data);

        this.$node = arg.$.nodeType ? arg.$ : document.querySelector(arg.$);

        //
        new Compile(this.$node, this);
    }
}
