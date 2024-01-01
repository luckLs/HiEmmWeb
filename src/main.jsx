import React from 'react'
import ReactDOM from 'react-dom/client'
import {NextUIProvider} from '@nextui-org/react'
import App from './App'
import './index.css'
import '../dist/output.css';

ReactDOM.createRoot(document.getElementById("root")).render(
    /*<React.StrictMode>*/
    <NextUIProvider className="w-screen">
        <div className="w-screen h-screen flex items-start justify-center">
            <App/>
        </div>
    </NextUIProvider>
    /*</React.StrictMode>*/
);


