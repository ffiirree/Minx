
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
            }
        }
    });
};