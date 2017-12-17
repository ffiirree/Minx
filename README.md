# Minx

## Minx是一个简单的MVVM框架.

## 功能
 - [x] {{ xxx }}
 - [ ] x-html
 - [x] x-model
 - [x] x-if
 - [x] x-for
 - [x] :/x-attr:[attr]
 - [x] x-on:[event]
 
 ### 插值
 #### 文本 
 ```html
 <h3> {{ title }} </h3>
```
#### 表达式
```javascript
{{ age + 1 }}
{{ age ? 'YES' : 'NO' }}
{{ fns['method']('hello') }}
```

### 指令
#### x-model:双向绑定
```html
<input x-model="message">
```

#### x-for: 列表
```html
<li x-for="todo:list">
    <div>{{ todo.creator }}</div>
</li>
```
或者使用索引
```html
<li x-for="(todo:index):list">
    <div>{{ todo.creator }}</div>
</li>
```

#### x-attr:[attr]: 为节点添加属性
可以使用字符串进行拼接
```html
<ul :id="title">
<div><a x-attr:href="url">{{ user }}的BLOG</a></div>
<div x-attr:class="user"></div>
<p x-attr:href="url+'/'+todo.id"></p>
```

#### x-on:[event]:绑定事件
可以使用参数，实际参数使用数组传入，按照索引使用参数
```html
<button x-on:click="click('Hello')">CLICK TO SAY: Hello</button>
``` 

#### x-if: 是否渲染该节点
```html
<div x-if="value">是否显示</div>
```

### Router.hash
```javascript
// 获取hash值
let _hash = Router.hash.value;

// 设置hash值
Router.hash.value = { scope: 0, page: 2 }; // url#!/scope=0&page=2

// 获取hash参数值
Router.hash.get('scope'); // 0
Router.hash.get('page');  // 2

// 设置参数值
Router.hash.set('scope', 2); // url#!/scope=2&page=2
Router.hash.set('page', 5);  // url#!/scope=2&page=5

// 绑定事件
Router.hash.change(()=>{alter('change!')});

```