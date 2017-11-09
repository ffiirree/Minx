
window.onload = function () {
    let root = document.querySelector('#root');

    let minx_data = {
        title: 'Minx Test',
        user: 'ffiirree',
        message: "Minx is a MVVM framework.",
        url: 'https://firstsnow.me',

        list: [
            {
                id: 1,
                creator: 'ffiirree',
                content: 'write Minx',
                status: 'undone',
                date: '2017-11-8',
                members: [
                    { name: '张三' },
                    { name: '李四' }
                ]
            },
            {
                id: 2,
                creator: 'ice',
                content: 'Test Minx',
                status: 'done',
                date: '2017-11-8',
                members: [
                    { name: '王二' },
                    { name: 'SB'}
                ]
            }
        ]
    };

    let minx = new Minx({
        $: '#root',
        data: minx_data,
        methods: {
            click: function (arg) {

                alert(arg);
            },
            print: function (event) {
                console.log(event)
            },
            push: function () {
                minx_data.list.push({
                    id: 3,
                    creator: 'zlq',
                    content: 'write Observer',
                    status: 'undone',
                    date: '2017-11-9',
                    members: [
                        { name: 'zz' },
                        { name: '2333' }
                    ]
                });

            },
            pop: function () {
                minx_data.list.pop();
            },
            reverse: function () {
                minx_data.list.reverse();
            },
            shift: function () {
                minx_data.list.shift();
            },
            unshift: function () {
                minx_data.list.unshift({
                    id: 0,
                    creator: 'zhang',
                    content: 'write Observer',
                    status: 'undone',
                    date: '2017-11-9',
                    members: [
                        { name: '45345345' },
                        { name: '4543532' }
                    ]
                });
            },
            splice: function () {
                minx_data.list.splice(1, 2);
            },
            sort: function () {
                minx_data.list.sort();
            }
        }
    });

    console.log(minx);
};