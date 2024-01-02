import React from "react";
import {atom, useAtom} from "jotai";

const searchAtom = atom('xx');

function Header({localSearchAtom}) {
    const [localSearch, setLocalSearch] = useAtom(localSearchAtom);
    const handleChange = event => setLocalSearch(event.target.value);
    return (
        <header>
            <input type="text" value={localSearch} onChange={handleChange} />
        </header>
    );
}

function Main() {
    const [search] = useAtom(searchAtom);
    return <main>Search query: {search}</main>;
}

const About = () => {
    return <div>
        <Header localSearchAtom={searchAtom}/>
        <Main/>
    </div>;
};

export default About;
