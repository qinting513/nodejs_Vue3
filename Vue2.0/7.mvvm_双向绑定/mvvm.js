function VueDemo(options = {}) {
    this.$options = options; //将所有属性挂载到$options
    var data = this._data = this.$options.data;
    observer(data);

    for (let key in data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key]
            },
            set(newVal) {
                this._data[key] = newVal
            }
        })
    }
    //  call函数 https://www.jianshu.com/p/aa2eeecd8b4f
    initComputed.call(this);
    new Compile(options.el, this);
}

// 观察对象给对象增加Object.defineProperty
function observer(data) {
    if (typeof data !== 'object') return;
    return new Observer(data)
}

// Observer构造,这里我们写主要逻辑
function Observer(data) {
    let dep = new Dep();
    // 通过Object.defineProperty给data定义属性
    for (let key in data) {
        let val = data[key];
        observer(val);
        Object.defineProperty(data, key, {
            enumerable: true, //可枚举
            get() {
                Dep.target && dep.addSub(Dep.target); //放进去的就是watcher
                return val;
            },
            set(newVal) { //更改值的时候
                if (newVal === val) { //如果设置的值跟以前一样，我们就忽视它
                    return;
                }
                val = newVal; //如果以后再获取值的时候，将设置的新值再丢回去
                observer(newVal)
                dep.notify(); //当改变数据的时候，执行update（）方法，更新视图
            }

        })
    }
}

// 编译
function Compile(el, vm) { //el：替换的范围
    vm.$el = document.querySelector(el); //获取el
    let reg = /\{\{(.*)\}\}/; //用于后面检测{{}}
    //文档碎片，在内存，不占dom
    let fragment = document.createDocumentFragment();
    //然后将每一个dom节点塞到文档碎片中(内存中),fragment.append具有移动节点的作用
    var child;
    while (child = vm.$el.firstChild) {
        fragment.append(child);
    }
    replace(fragment)

    function replace(fragment) {

        // 需要遍历fragment中的子节点，注意：childNodes是类数组，需要Array.from转换一下
        Array.from(fragment.childNodes).forEach(node => {
            // 获取里面的内容
            var text = node.textContent;

            // 如果是元素节点而且有{{}}
            if (node.nodeType == 3 && reg.test(text)) {
                //console.log(RegExp.$1) //取到了vm.a.a vm.b
                let arr = RegExp.$1.split('.');
                let val = vm;
                arr.forEach(k => {
                        val = val[k];
                    })
                    // watcher
                new Watcher(vm, RegExp.$1, function(newVal) { //数据一变，我们需要接受一个新值
                    node.textContent = text.replace(/\{\{(.*)\}\}/, newVal);
                })
                node.textContent = text.replace(/\{\{(.*)\}\}/, val);
            }

            // v-model
            if (node.nodeType == 1) {
                let nodeAttrs = node.attributes; //获取dom节点中的属性
                Array.from(nodeAttrs).forEach(attr => {
                    let name = attr.name;
                    let value = attr.value;
                    if (name.indexOf('v-model') !== -1) {
                        node.value = vm[value]; //将值显然在input中
                    }
                    // 订阅一下
                    new Watcher(vm, value, function(newVal) {
                        node.value = newVal; //当watcher触发时会自动将内容放到输入框中
                    })
                    node.addEventListener('input', e => {
                        let newVal = e.target.value;
                        vm[value] = newVal;
                    })
                })
            }


            if (node.childNodes) {
                replace(node)
            }

        })
    }
    vm.$el.appendChild(fragment);


}


//---------------- 发布--订阅模式--------------------------------------------
function Dep() {
    this.subs = [];
}

Dep.prototype.addSub = function(sub) { //订阅,sub是个函数（事件）
    this.subs.push(sub)
}

// 调用的时候，事件依次执行,notify:通知
Dep.prototype.notify = function() {
    this.subs.forEach(sub => sub.update());
}

// 订阅,通过这个类Watcher ，通过这个类创建的实例都拥有update方法
function Watcher(vm, exp, fn) {
    this.vm = vm;
    this.exp = exp;
    this.fn = fn; //我们要把watcher添加到订阅中
    Dep.target = this;
    let val = vm;
    let arr = exp.split('.');
    arr.forEach(k => { //这个操作就是取值：this.a.a,会调用get方法
        val = val[k]
    })
    Dep.target = null;
}
Watcher.prototype.update = function() {
    // 我们在这获取值
    let val = this.vm;
    let arr = this.exp.split('.');
    arr.forEach(k => { //这个操作就是取值：this.a.a,会调用get方法
        val = val[k]
    })
    this.fn(val);
}

// computed
function initComputed() {
    console.log("initComputed call调用", this);
    let vm = this;
    let computed = this.$options.computed;
    // console.log(Object.keys(computed))
    Object.keys(computed).forEach(key => {
        Object.defineProperty(vm, key, {
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set() {}
        })
    })
}