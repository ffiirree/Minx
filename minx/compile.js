
class Compile{
    constructor(node, vm) {
        this.$vm = vm;
        this._fns = this.$vm._methods;
        this.$node = node;

        this.compile(node);
    }

    compile(node) {
        if(!node.getAttribute('x-for')) {
            let _nodes = node.childNodes;
            for(let i= 0; i < _nodes.length; ++i) {

                let _subNode = _nodes[i];
                switch(_subNode.nodeType) {

                    //Element
                    case 1:

                        if(_subNode.hasAttributes()) {
                            const _attr = _subNode.attributes;
                            _subNode._aindex = 0;
                            for(; _subNode._aindex < _attr.length; _subNode._aindex++) {

                                if(_attr[_subNode._aindex].name === 'x-model') {
                                    this.model(_subNode);
                                }
                                else if(_attr[_subNode._aindex].name === 'x-if') {
                                    this.xif(_subNode);
                                }
                                else {
                                    _attr[_subNode._aindex].name.split(':')[0] === 'x-on'
                                        ? this.event(_subNode, _attr[_subNode._aindex])
                                        : this.attr(_subNode, _attr[_subNode._aindex]);
                                }
                            }
                        }

                        if(_subNode.childNodes.length) {
                            this.compile(_subNode);
                        }
                        break;

                    // Text
                    case 3:
                        this.tmpl(_subNode);
                        break;
                }
            }
        }
        else {
            this.list(node, node.parentElement);
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

    xif(node) {
        const _cond = node.getAttribute('x-if');
        node.removeAttribute('x-if');
        node._aindex -= 1;

        const _value = Compile.parse(this.$vm, _cond);

        node.style.visibility = _value.value ? 'visible' : 'hidden';

        new Watcher(_value.parent, _value.key, (old, val)=>{
            node.style.visibility = val ? 'visible' : 'hidden';
        });
    }


    list(node, parent) {
        let _node = node.cloneNode(true);
        parent.innerHTML = '';

        let _list = _node.getAttribute('x-for');


        let _itemDataName = _list.split(':')[0];
        _list = _list.split(':')[1];

        let _data = Compile.parse(this.$vm, _list);

        new Watcher(_data.parent, _data.key, (old, val) => {
            this.list(node.cloneNode(true), parent);
        });

        _node.removeAttribute('x-for');
        _data.value.forEach(item =>{
            const _clone = _node.cloneNode(true);

            let item_data = {};
            item_data[_itemDataName] = item;
            item_data.__proto__ = this.$vm;
            let _c = new Compile(_clone, item_data);

            parent.appendChild(_clone);
        });
    }


    attr(node, attr) {
        let _meta = attr.name.split(':');

        if(_meta[0] === 'x-attr' || _meta[0] === "") {

            // callback
            let _callback = _meta[1] === 'class'
                ? (old, val) => {  node.classList.remove(old);  node.classList.add(val); } // class
                : (old, val) => node.setAttribute(attr.name.split(':')[1], val);           // others

            let _res = '';
            attr.value.split('+').forEach((item)=>{
                if(!/'/g.test(item)) {
                    let _value = Compile.parse(this.$vm, item.replace(' ', ''));
                    _res += _value.value;

                    new Watcher(_value.parent, _value.key, _callback);
                }
                else {
                    _res += item.replace(/'/g, '');
                }
            });

            // add attribute
            _meta[1] === 'class'
                ? !node.classList.contains(_res) ? node.classList.add(_res) : ''    // class
                : node.setAttribute(_meta[1], _res);                                // others

            node.removeAttribute(attr.name);
            node._aindex -= 1;
        }
    }

    event(node, attr) {
        let _meta = attr.name.split(':');

        if(_meta[0] === 'x-on') {
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

                    !/'/g.test(_matchArg[1])
                        ? _args.push(Compile.parse(this.$vm, _matchArg[1]).value)
                        : _args.push(_matchArg[1].replace(/'/g, '')) ;

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
     * @param data {object}: { name: 'ffiirree', details: { age: 10 } }
     * @param path {string}: details.age
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
