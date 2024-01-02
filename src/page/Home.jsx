import React, { useEffect } from "react";

const Home = () => {
    console.log(1)
    // 构造函数 (constructor) 在类组件中用于初始化 state 等，但我们已经转向函数组件，因此不需要它
    // 在函数组件中，我们使用 useEffect Hook 来模拟类似的生命周期行为

    useEffect(() => {
        console.log('useEffect called'); // 对应于 componentDidMount 和 componentDidUpdate 的行为
        // 在这里你可以执行一些在组件挂载后和更新后需要执行的逻辑
        return () => {
            console.log('useEffect cleanup'); // 对应于 componentWillUnmount 的行为
            // 在这里你可以执行一些在组件卸载时需要执行的逻辑
        };
    }, []);

    return <div className="px-6 flex gap-4 flex-col pb-16 flex-grow">Hello World</div>;
};

export default Home;
