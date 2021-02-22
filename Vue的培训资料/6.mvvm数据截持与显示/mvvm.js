/*


let obj = {}
Object.defineProperty(obj, 'name', {
    value: 'zhangsan'
})

let obj = {}
Object.defineProperty(obj, 'name', {
    configurable: true, //默认false,是否可删除
    writable: true, //默认false,是否可修改
    enumerable: true, //默认false,是否可枚举（是否可遍历）
    value: 'zhangsan',
})

//  在实际中，value一般会被分成两个部分：get、set，这也就是我们常说的getter和setter。
// 注意：有了get和set，就不能用writable和value，否则会报错。
let obj = {}
Object.defineProperty(obj, 'name', {
    configurable: true, //默认false,是否可删除
    enumerable: true, //默认false,是否可枚举（是否可遍历）
    get() {
        return 'zhangsan'
    },
    set(val) {
        console.log(val)
    }
});

// 从结果中，我们可知，当获取obj中的name属性值的时候，调用get方法；当改变name属性值的时候，调用set方法。

*/










function VueDemo(options = {}) {
    // console.log(options);
    this.$options = options; //将所有属性挂载到$options（仿vue）
    var data = this._data = this.$options.data;

    _observer(data);
    /*
     在实际vue操作中，我们获取data的属性，只需要 this.属性名 即可，实现这个功能，
     同样，我们只要在this中用Object.defineProperty定义data中所有的属性即可, 
     下面的for循环就是为了实现这个功能的
     */
    for (let key in data) {
        Object.defineProperty(this, key, {
            enumerable: true,
            get() {
                return this._data[key];
            },
            set(newVal) {
                this._data[key] = newVal
            }
        })
    }
    new Compile(options.el, this);
}

// 观察对象给对象增加Object.defineProperty
function _observer(data) {
    if (typeof data !== 'object') return;
    return new Observer(data)
}

// Observer构造,这里我们写主要逻辑
function Observer(data) {
    // 通过Object.defineProperty给data定义属性
    for (let key in data) { //遍历
        let val = data[key];
        // 我们需要在赋值的时候再执行observe方法，让里面的属性再次用Object.defineProperty定义，同样，获取的时候也需要调用
        _observer(val);
        Object.defineProperty(data, key, {
            enumerable: true, //可枚举
            get() {
                return val
            },
            set(newVal) { //更改值的时候
                if (newVal === val) { //如果设置的值跟以前一样，我们就忽视它
                    return;
                }
                val = newVal; //如果以后再获取值的时候，将设置的新值再丢回去
                _observer(newVal);
            }
        })
    }
}

/*
1.先获取div#app下的所有子节点，比如<p/>、<div/>
2.然后，获取<p/>、<div/>的子节点，如果子节点是文本节点而且里面有{{}}，
那么，通过textContent获取里面的内容，然后通过正则将{{}}替换成响应的数据；
如果不是元素节点，就判断是否有子节点，如果有，再获取其内的子节点进行遍历（递归），直到是文本节点为止
*/
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
            // console.log("node===> :", node);
            // 获取里面的内容
            var text = node.textContent;
            // 如果是元素节点而且有{{}}
            if (node.nodeType == 3 && reg.test(text)) {
                // console.log(RegExp.$1) //取到了vm.a.a / vm.b
                let arr = RegExp.$1.split('.');
                let val = vm;
                arr.forEach(k => {
                    val = val[k];
                })
                node.textContent = text.replace(/\{\{(.*)\}\}/, val);
            }
            if (node.childNodes) {
                replace(node)
            }
        })
    }
    vm.$el.appendChild(fragment);
}