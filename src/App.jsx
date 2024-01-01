import React from "react";
import {BrowserRouter, Route, Routes} from "react-router-dom";
import {Divider, NextUIProvider} from "@nextui-org/react";
import NavbarComponent from "./component/Navbar.jsx";


const routeComponents = {
    home: React.lazy(() => import("./page/Home.jsx")),
    about: React.lazy(() => import("./page/About.jsx")),
    dbEr: React.lazy(() => import("./page/db/DB-ER.jsx")),
};

// 路由信息
export const routeUrl = [
    {name: "home", label: "home", path: "/"},
    {name: "home", label: "home", path: "/home"},
    {name: "about", label: "about", path: "/about"},
    {name: "数据库ER图", label: "dbEr", path: "/dbEr"},
];

const App = () => {
    return (
        <React.Suspense>
            <NextUIProvider className="w-screen">
                <NavbarComponent routes={routeUrl}/>
                <BrowserRouter>
                    <Routes>
                        {routeUrl.map(({path, label}) => (
                            <Route key={path} path={path} element={<RouteComponent label={label}/>}/>
                        ))}
                    </Routes>
                </BrowserRouter>
            </NextUIProvider>
        </React.Suspense>
    );
};

const RouteComponent = ({label}) => {
    const Component = routeComponents[label];
    return <Component/>;
};

export default App;
