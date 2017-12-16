function  Router() {}

Router.hash = {
    get (key) {
        if(key && this.value) {
            let temp = new RegExp(key + '=([^&]+)').exec(this.value);
            if(temp) {
                return temp[1];
            }
        }
        return null;
    },

    set(key, value) {
        let pattern = new RegExp(key + '=([^&]+)');
        let _hash = key + '=' + value.toString();
        pattern.exec(this.value)
            ? _hash = this.value.replace(pattern, _hash)
            : _hash = this.value + "&" + _hash;

        window.location.hash = '!/' + _hash;
    },

    change(callback) {
        window.onhashchange = callback;
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