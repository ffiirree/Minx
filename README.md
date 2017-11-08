# Minx

## Minx是一个简单的MVVM框架.

## 功能
 - [y] {{ xxx }}
 - [n] x-html
 - [y] x-model
 - [n] x-if
 - [y] x-for
 - [y] :/x-attr:[attr]
 - [y] x-on:[event]
 
 ### 插值
 #### 文本 
 ```html
 <h3> {{ title }} </h3>
```
#### 表达式
```html
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

#### x-attr:[attr]: 为节点添加属性
除了`x-attr:href`之外[attr]暂时只为一个变量值，<br>
`x-attr:href`可以使用字符串进行拼接
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