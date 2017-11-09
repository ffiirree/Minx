function  Router() {}

Router.hash = {
    get (key) {
        return key ? new RegExp(key + '=([^&]+)').exec(this.value)[1] : this.value;
    }
};

Reflect.defineProperty(Router.hash, 'value', {
    get () {
        return window.location.hash.slice(3);
    },

    set(value) {
        let _hash = '';
        Object.keys(value).forEach(key => {
            _hash += '&' + key + '=' + value[key].toString();
        });
        window.location.hash = '!/' +  _hash.slice(1);
    },
});