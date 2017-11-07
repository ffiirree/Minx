
class Compile{
    constructor(node, vm) {
        this.$vm = vm;
        this._fns = this.$vm._methods;
        this.$node = node;
        this.scan(node);
    }


    scan(node){
        if(!node.getAttribute('x-for')) {
            let _nodes = node.childNodes;
            for(let i= 0; i < _nodes.length; ++i) {

                let _this = _nodes[i];
                switch(_this.nodeType) {

                    //Element
                    case 1:

                        if(_this.hasAttributes()){
                            const _attr = _this.attributes;
                            _this._aindex = 0;
                            for(; _this._aindex < _attr.length; _this._aindex++) {

                                if(_attr[_this._aindex].name === 'x-model') {
                                    this.model(_this);
                                }
                                else {
                                    this.attr(_this, _attr[_this._aindex]);
                                }
                            }
                        }

                        if(_this.childNodes.length) {
                            this.scan(_this);
                        }
                        break;

                    // Text
                    case 3:
                        this.tmpl(_this);
                        break;
                }
            }
        }
        else {
            this.list(node);
        }
    }

    /**
     * 文本替换
     * @param node
     */
    tmpl(node) {
        let _text = node.textContent;
        let _re = /{{ *([\w\.]+) *}}/g;
        if(!_re.test(_text)) return null;

        node.textContent = _text.replace(_re, (match, $1)=>{
            new Watcher(this.$vm, $1, (old, val)=>{
                console.log(`${old}>${val}`);
                node.textContent = _text.replace(_re, (match, $1)=>{

                    return this.parse(this.$vm, $1).value;
                });
            });
            return this.parse(this.$vm, $1).value;
        });

        // console.log(data)
    }



    list(node) {
        let _list = node.getAttribute('x-for');
        node.removeAttribute('x-for');

        let _itemDataName = _list.split(':')[0];
        _list = _list.split(':')[1];

        let _data = this.parse(this.$vm, _list);

        let parent = node.parentElement;

        _data.value.forEach(item =>{
            const _clone = node.cloneNode(true);

            let item_data = {};
            item_data[_itemDataName] = item;
            item_data.__proto__ = this.$vm;
            let _c = new Compile(_clone, item_data);

            parent.appendChild(_clone);
        });

        parent.removeChild(node);
    }


    attr(node, attr) {
        let _meta = attr.name.split(':');

        if(_meta[0] === 'x-attr' || _meta[0] === "") {

            if(_meta[1] === 'class') {
                const _value = this.parse(this.$vm, attr.value);
                if(!node.classList.contains(_value.value)){
                    node.classList.add(_value.value);
                }

                new Watcher(this.$vm, attr.value, (old, val)=>{
                    node.classList.remove(old);
                    node.classList.add(val);
                });
            }
            else if(_meta[1] === 'href') {
                let _res = '';
                attr.value.split('+').forEach((item)=>{
                    if(!/'/g.test(item)) {
                        let _value = this.parse(this.$vm, item.replace(' ', ''));
                        _res += _value.value;

                        new Watcher(_value.parent, _value.key, (old, val)=>{
                            node.setAttribute(attr.name.split(':')[1], val);
                        });
                    }
                    else {
                        _res += item.replace(/'/g, '');
                    }
                });
                node.setAttribute(_meta[1], _res);
            }
            else {
                const _value = this.parse(this.$vm, attr.value);
                node.setAttribute(_meta[1], _value.value);

                new Watcher(_value.parent, _value.key, (old, val)=>{
                    node.setAttribute(attr.name.split(':')[1], val);
                });
            }

            node.removeAttribute(attr.name);
            node._aindex -= 1;
        }
        else if(_meta[0] === 'x-on') {
            let _reName = /([\w\$]+)/,
                _reArgs = /\(([^\(\)]+)\)/,
                _reArg = /([\w\.\$\']+)/g;
            let _args = [];

            let _fn = node.getAttribute(attr.name);
            let _matchName = _reName.exec(_fn);
            let _fnName = _matchName[1];


            if(_reArgs.test(_fn)) {
                let _argsText = _reArgs.exec(_fn)[1];

                let _matchArg;
                while(_matchArg = _reArg.exec(_argsText)) {

                    if(/'/g.test(_matchArg[1])) {
                        _args.push(_matchArg[1].replace(/'/g, ''))
                    }
                    else {
                        _args.push(this.parse(this.$vm, _matchArg[1]).value);
                    }
                }
            }

            node.removeAttribute(attr.name);
            node._aindex -= 1;
            node.addEventListener(_meta[1], this._fns[_fnName].bind(node, _args));
        }
    }


    model(node) {
        const _model = node.getAttribute('x-model');
        node.removeAttribute('x-model');
        node._aindex -= 1;

        let _data = this.parse(this.$vm, _model);
        node.tagName === 'INPUT' ? node.value = _data.value : node.innerText = _data.value;

        node.addEventListener('input', function (event) {
            _data.parent[_data.key] = node.value;
        });
        new Watcher(_data.parent, _data.key, (old, val)=>{
            node.tagName === 'INPUT' ? node.value = val : node.innerText = val;
        });
    }

    parse(data, key) {
        const _list = key.split('.');

        let _data = data;
        let _parent;
        let _key;

        _list.forEach((item) => {
            _parent = _data;
            _key = item;
            _data = _data[item];
        });

        return _data === data ? null : { value: _data, parent: _parent, key: _key };
    }
}