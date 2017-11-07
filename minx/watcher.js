
class Watcher{

    constructor(vm, expOrFn, cb) {
        this.cb = cb;
        this.$vm = vm;
        this.expOrFn = expOrFn;
        this.depIds = {};

        this.value = this.get();
    }

    update() {
        this.run();	// 属性值变化收到通知
    }

    run() {
        let value = this.get(); // 取到最新值
        let oldVal = this.value;
        if (value !== oldVal) {
            this.value = value;
            this.cb.call(this.$vm, oldVal, value); // 执行Compile中绑定的回调，更新视图
        }
    }

    get() {
        Dep.target = this;	// 将当前订阅者指向自己
        let value = this.$vm[this.expOrFn];	// 触发getter，添加自己到属性订阅器中
        Dep.target = null;	// 添加完毕，重置
        return value;
    }

    addDep(dep) {
        if (!this.depIds.hasOwnProperty(dep.id)) {
            dep.addSub(this);
            this.depIds[dep.id] = dep;
        }
    }
}

let uid = 0;
class Dep{
    constructor(){
        this.id = ++uid;
        this.subs = [];
    }

    addSub(sub) {
        this.subs.push(sub);
    }

    notify() {
        this.subs.forEach(function(sub) {
            sub.update();
        });
    }

    depend(){
        Dep.target.addDep(this);
    }
}

Dep.target = null;