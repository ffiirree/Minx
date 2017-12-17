//　支持表达式
function template(text, context) {
    let re = /{{ *([^}{]+)? *}}/g, code = 'var $$out=[];\nwith(this){', cursor = 0, match;
    let add = function(line, js) {
        js? (code += '$$out.push(' + line + ');\n') :
            (code += line != '' ? '$$out.push("' + line.replace(/"/g, '\\"') + '");\n' : '');
        return add;
    };
    while(match = re.exec(text)) {
        add(text.slice(cursor, match.index))(match[1], true);
        cursor = match.index + match[0].length;
    }
    add(text.substr(cursor, text.length - cursor));
    code += '};\nreturn $$out.join("");';
    return new Function(code.replace(/[\r\t\n]/g, '')).apply(context);
}


class Compile{
    constructor(node, vm) {
        this.$vm = vm;
        this._fns = this.$vm._methods;
        this.$node = node;

        this.compile(node);
    }

    compile(node) {
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


    /**
     * 文本替换
     * @param node
     */
    tmpl(node) {
        let _text = node.textContent;

        node.textContent = template(_text, this.$vm);

        let _this = this;
        !function (node_, text_) {
            let res = _this.parse(_text, _this.$vm);
            res.forEach(item=>{
                new Watcher(item.parent, item.key, (old, val) => {
                    node_.textContent = template(text_, _this.$vm);
                })
            })
        }(node, _text);
    }

    parse(text, data) {
        let re = /{{ *([^}{]+)? *}}/g,  match;
        let _res = [];
        let path = {
                var_: /^[a-zA-Z\$_][\w\$]*/,
                str_: /^\'.*?\'|^\".*?\"/,
                dot_: /^\./,
                var2_: /^\['([a-zA-Z\$_][\w\$]*)'\]/,
                var3_: /^\["([a-zA-Z\$_][\w\$]*)"\]/,
                spa_: /^ /,
                pal_: /^\(/,
                par_: /^\)/,
                op_: /^(\+|-|\*|\/|\|\&|\%|\^|\!|>|<|\?|:|!==|===|>=|<=)/,
                num_: /^\d+/,
                com_: /^,/
            };



        let walk = function (str) {
            let cap;
            while(str){
                // 空格
                if(cap = path.spa_.exec(str)){
                    str = str.substring(cap[0].length);
                    // console.log('##space:', cap, str);
                    continue;
                }

                // 逗号
                if(cap = path.com_.exec(str)){
                    str = str.substring(cap[0].length);
                    // console.log('##com:', cap, str);
                    continue;
                }

                // 括号()
                if(cap = path.pal_.exec(str) || path.par_.exec(str)){
                    str = str.substring(cap[0].length);
                    // console.log('##sp:', cap, str);
                    continue;
                }

                // 字符串
                if(cap = path.str_.exec(str)) {
                    str = str.substring(cap[0].length);
                    // console.log('##string:', cap, str);
                    continue;
                }

                // 操作符
                if(cap = path.op_.exec(str)) {
                    str = str.substring(cap[0].length);
                    // console.log('##operator:', cap, str);
                    continue;
                }

                // 操作符
                if(cap = path.dot_.exec(str)) {
                    str = str.substring(cap[0].length);
                    // console.log('##dot:', cap, str);

                    if(cap = path.var_.exec(str)) {
                        str = str.substring(cap[0].length);
                        // console.log('##var:', cap, str);
                        continue;
                    }

                    console.log('!!!error!!!');
                }

                //　数字
                if(cap = path.num_.exec(str)) {
                    str = str.substring(cap[0].length);
                    // console.log('##number:', cap, str);
                    continue;
                }

                // 变量
                if(cap = path.var_.exec(str)) {
                    let _path = '';

                    str = str.substring(cap[0].length);
                    _path += cap[0];
                    // console.log('##var:', cap, str);

                    while (str) {

                        if(cap = path.var2_.exec(str) || path.var3_.exec(str)) {
                            str = str.substring(cap[0].length);
                            _path += '.' + cap[1];
                            // console.log('##var:', cap, str);
                            continue;
                        }

                        if(cap = path.dot_.exec(str)) {
                            str = str.substring(cap[0].length);
                            _path += '.';
                            // console.log('##dot:', cap, str);

                            if(cap = path.var_.exec(str)) {
                                str = str.substring(cap[0].length);
                                _path += cap[0];
                                // console.log('##var:', cap, str);
                                continue;
                            }

                            console.log('!!!error!!!');
                            return _res;
                        }

                        break;
                    }

                    // console.log(data, _path);
                    let value = Compile.getValue(data, _path);
                    value && _res.push(value);

                    continue;
                }

                console.log('error');
                return _res;
            }
        };

        while(match = re.exec(text)) {
            walk(match[1]);
        }

        return _res;
    }

    xif(node) {
        const _cond = node.getAttribute('x-if');
        node.removeAttribute('x-if');
        node.$aindex -= 1;

        const _value = Compile.getValue(this.$vm, _cond);

        node.style.visibility = _value.value ? 'visible' : 'hidden';

        new Watcher(_value.parent, _value.key, (old, val)=>{
            node.style.visibility = val ? 'visible' : 'hidden';
        });
    }


    list(node) {
        let _attr = node.getAttribute('x-for');
        node.removeAttribute('x-for');

        let _item = _attr.split(':')[0];
        let _itemName = _item;
        let _indexName = null;
        if(/\(/.exec(_item)) {
            let match = /\( *([a-zA-Z\$]+[\w]*), *([a-zA-Z\$]+[\w]*) *\)/g.exec(_item);
            _itemName = match[1];
            _indexName = match[2];
        }


        let _listName = _attr.split(':')[1];

        let _data = Compile.getValue(this.$vm, _listName);

        // 保存
        let _parent = node.parentNode;
        let _subs = [];

        _data.value.forEach((item, index) =>{
            const _clone = node.cloneNode(true);
            _clone.removeAttribute('x-for');

            let item_data = {};
            item_data[_itemName] = item;
            if(_indexName) item_data[_indexName] = index;
            item_data.__proto__ = this.$vm;

            new Observer(item_data);
            new Compile(_clone, item_data);

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
                val.forEach((item, index) =>{
                    const _clone = node_.cloneNode(true);

                    let item_data = {};
                    item_data[_itemName] = item;
                    if(_indexName) item_data[_indexName] = index;
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
                    let _value = Compile.getValue(this.$vm, item.replace(' ', ''));
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
                        ? _args.push(Compile.getValue(this.$vm, _matchArg[1]).value)
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

        let _data = Compile.getValue(this.$vm, _model);
        node.tagName === 'INPUT' ? node.value = _data.value : node.innerText = _data.value;

        node.addEventListener('input', function (event) {
            _data.parent[_data.key] = node.value;
        });
        new Watcher(_data.parent, _data.key, (old, val)=>{
            node.tagName === 'INPUT' ? node.value = val : node.innerText = val;
        });
    }

    /**
     * 根据path从data中取出数据
     * @param data {object}: { name: 'ffiirree', details: { age: 10 } }
     * @param path {string}: details.age，dot作为分割
     * @returns {*}
     */
    static getValue(data, path) {
        const _list = path.split('.');

        let _data = data;
        let _parent = data;
        let _key;

        _list.forEach((item) => {
            !_data ? console.log('#getValue[null]:', _parent, item) : '';

            if((['Function', 'Array', 'Object', 'Reflect',
                    'String', 'Number', 'RegExp'].indexOf(item) !== -1)
                // 阻止遍历字符串的方法
                || (typeof _data === 'string' && (typeof _data[item] === 'function' || item === 'length'))
                // 阻止遍历数组的方法
                || (Array.isArray(_data) && (['concat', 'separator', 'pop', 'push',
                    'reverse', 'shift', 'slice', 'sort', 'splice', 'unshift'].indexOf(item) !== -1 || item === 'length'))){

                console.log('#getValue[build-in]:', item);
                return _data === data ? null : { value: _data, parent: _parent, key: _key };
            }

            // 没有检查item的类别，不能放到该函数开头检查
            if(!_data || !(item in _data)){
                console.log('#getValue[null]:', _parent, item);
                return null;
            }

            _parent = _data;
            _key = item;
            _data = _data[item];
        });

        return _data === data ? null : { value: _data, parent: _parent, key: _key };
    }
}
