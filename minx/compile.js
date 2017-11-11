
class Compile{
    constructor(node, vm) {
        this.$vm = vm;
        this._fns = this.$vm._methods;
        this.$node = node;

        this.compile(node);
    }

    compile(node) {
        // 非，列表，编译本节点
        switch (node.nodeType) {
            // DOM节点
            case 1:
                // x-for优先级最高，因为其他的属性可能会用到列表中的数据
                // <div x-for="item:lost" :id="list.id"></div>, :id用到了数组项数据
                // x-for中添加的新节点都会再次被编译
                // 根节点不能是x-for，这样会生成多个根节点。。。
                if(node.getAttribute('x-for')) {
                    this.list(node);
                    return ;
                }

                if(node.hasAttributes()) {
                    node.$aindex = 0;
                    for(; node.$aindex < node.attributes.length; ++node.$aindex) {
                        let _attr = node.attributes[node.$aindex];

                        switch (_attr.name) {
                            case 'x-model':
                                this.model(node);
                                break;

                            case 'x-if':
                                this.xif(node);
                                break;

                            default:
                                _attr.name.split(':')[0] === 'x-on'
                                    ? this.event(node, _attr) : this.attr(node, _attr);
                                break;
                        }
                    }
                }

                node.$index = 0;
                for(; node.$index < node.childNodes.length; ++node.$index) {
                    this.compile(node.childNodes[node.$index]);
                }

                break;

            // 文本节点
            case 3:
                this.tmpl(node);
                break;
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
        node.$aindex -= 1;

        const _value = Compile.parse(this.$vm, _cond);

        node.style.visibility = _value.value ? 'visible' : 'hidden';

        new Watcher(_value.parent, _value.key, (old, val)=>{
            node.style.visibility = val ? 'visible' : 'hidden';
        });
    }


    // 完全编译父节点会造成问题
    // 一个父节点下有两个，更新时，由于第二个会保存第一个第一次渲染的效果，所以，会覆盖掉第一个的更新结果
    list(node) {
        let _attr = node.getAttribute('x-for');
        node.removeAttribute('x-for');

        let _itemName = _attr.split(':')[0];
        let _listName = _attr.split(':')[1];

        let _data = Compile.parse(this.$vm, _listName);

        // 保存
        let _parent = node.parentNode;
        let _subs = [];

        _data.value.forEach(item =>{
            const _clone = node.cloneNode(true);
            _clone.removeAttribute('x-for');

            let item_data = {};
            item_data[_itemName] = item;
            item_data.__proto__ = this.$vm;
            let _c = new Compile(_clone, item_data);

            _subs.push(_clone);
            node.parentNode.insertBefore(_clone, node);
            node.parentNode.$index += 1;
        });


        let _this = this;
        // anchor
        let anchor = document.createTextNode('');
        !function (node_, anchor_, subs) {

            // 方法：
            // 创建一个空文本节点作为插入锚点
            // 更新时将之前的删除
            // 根据新的数据添加
            new Watcher(_data.parent, _data.key, (old, val) => {

                // 删掉之前渲染的节点
                subs.forEach(_sub=>{
                    _sub.remove();
                });

                subs = [];
                // 重新渲染
                val.forEach(item =>{
                    const _clone = node_.cloneNode(true);

                    let item_data = {};
                    item_data[_itemName] = item;
                    item_data.__proto__ = _this.$vm;
                    let _c = new Compile(_clone, item_data);

                    subs.push(_clone);
                    anchor_.parentNode.insertBefore(_clone, anchor_);
                });
            });
        }(node.cloneNode(true), anchor, _subs);

        node.parentNode.insertBefore(anchor, node);
        node.parentNode.removeChild(node);
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
            node.$aindex -= 1;
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
            node.$aindex -= 1;
            node.addEventListener(_meta[1], this._fns[_fnName].bind(node, _args));
        }
    }


    model(node) {
        const _model = node.getAttribute('x-model');
        node.removeAttribute('x-model');
        node.$aindex -= 1;

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
