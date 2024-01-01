import React from "react";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button } from "@nextui-org/react";
import { AcmeLogo } from "./AcmeLogo.jsx";


const currentPath = window.location.pathname;
const NavItem = ({ label, path }) => {
    return (
        <NavbarItem>
            <Link color={currentPath === path ? "primary" : "foreground"} href={path}>
                {label}
            </Link>
        </NavbarItem>
    );
};

const NavbarComponent = ({ routes }) => {
    return (
        <Navbar isBordered className="navbar">
            <NavbarContent>
                <NavbarBrand className="log">
                    <AcmeLogo />
                    <p className="text-inherit font-normal">Hi</p>
                </NavbarBrand>
                {routes.map(({ label, path,name }) =>
                    path !== '/' ? (
                        <NavItem key={label} label={name} path={path} />
                    ) : null
                )}
            </NavbarContent>

            <NavbarContent justify="end">
                <NavbarItem className="hidden lg:flex">
                    <Link href="#">Login</Link>
                </NavbarItem>
                <NavbarItem>
                    <Button as={Link} color="warning" href="#" variant="flat">
                        Sign Up
                    </Button>
                </NavbarItem>
            </NavbarContent>
        </Navbar>
    );
};


export default NavbarComponent;
