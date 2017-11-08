
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

    TemplateEngine(text, context, node) {
        let re = /{{ *([^}{]+)? *}}/g,
            reVar = /([a-zA-Z_$][\w\.\$]*)/g,
            reStr = /('.*')|(".*")/g,
            _reExp = /[^\?\:]*?[^\?\:]*:[^\?\:]*/g,
            code = 'var r=[];\n',
            cursor = 0,
            match = {};

        let _text = text;
        let _this = this;

        let add = function(line, isCode) {
            if(isCode) {

                if(/['"]/g.test(line)) {
                    let _m,  _c = 0, _res = '';

                    while (_m = reStr.exec(line)) {
                        let _1 = line.slice(_c, _m.index);
                        let _2 = _m[1];
                        _c = _m.index + _m[0].length;

                        _res += _1.replace(reVar, (match, $1) => {

                            let _value = Compile.parse(context, $1);
                            new Watcher(_value.parent, _value.key, (old, val)=>{
                                node.textContent = _this.TemplateEngine(_text, context, node);
                            });
                            return 'this.' + $1;
                        });
                        _res += _2;
                    }
                    _res += line.substr(_c, line.length - _c).replace(reVar, (match, $1) => {
                        let _value = Compile.parse(context, $1);
                        new Watcher(_value.parent, _value.key, (old, val)=>{
                            node.textContent = _this.TemplateEngine(_text, context, node);
                        });

                        return 'this.' + $1;
                    });

                    code += 'r.push(' + _res + ');\n';
                }
                else {
                    line = line.replace(reVar, (match, $1) => {

                        let _value = Compile.parse(context, $1);
                        new Watcher(_value.parent, _value.key, (old, val)=>{
                            node.textContent = _this.TemplateEngine(_text, context, node);
                        });

                        return 'this.' + $1;
                    });
                    code += 'r.push(' + line + ');\n';
                }

            }
            else {
                code += line != '' ? 'r.push("' + line.replace(/"/g, '\\"') + '");\n' : ''
            }

            return add;
        };
        while(match = re.exec(text)) {
            add(text.slice(cursor, match.index))(match[1], true);
            cursor = match.index + match[0].length;
        }
        add(text.substr(cursor, text.length - cursor));
        code += 'return r.join("");';
        return new Function(code.replace(/[\r\t\n]/g, '')).apply(context);
    }

    /**
     * 文本替换
     * @param node
     */
    tmpl(node) {
        let _text = node.textContent;
        node.textContent = this.TemplateEngine(_text, this.$vm, node);
    }



    list(node) {
        let _list = node.getAttribute('x-for');
        node.removeAttribute('x-for');

        let _itemDataName = _list.split(':')[0];
        _list = _list.split(':')[1];

        let _data = Compile.parse(this.$vm, _list);

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
                const _value = Compile.parse(this.$vm, attr.value);
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
                        let _value = Compile.parse(this.$vm, item.replace(' ', ''));
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
                const _value = Compile.parse(this.$vm, attr.value);
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
                        _args.push(Compile.parse(this.$vm, _matchArg[1]).value);
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

        let _data = Compile.parse(this.$vm, _model);
        node.tagName === 'INPUT' ? node.value = _data.value : node.innerText = _data.value;

        node.addEventListener('input', function (event) {
            _data.parent[_data.key] = node.value;
        });
        new Watcher(_data.parent, _data.key, (old, val)=>{
            node.tagName === 'INPUT' ? node.value = val : node.innerText = val;
        });
    }

    /**
     *
     * @param data {{ object }}: { name: 'ffiirree', details: { age: 10 } }
     * @param path {{ string }}: details.age
     * @returns {*}
     */
    static parse(data, path) {
        const _list = path.split('.');

        let _data = data;
        let _parent;
        let _key;

        _list.forEach((item) => {
            !_data ? console.log('#parse:', _parent, item) : '';

            _parent = _data;
            _key = item;
            _data = _data[item];
        });

        return _data === data ? null : { value: _data, parent: _parent, key: _key };
    }
}