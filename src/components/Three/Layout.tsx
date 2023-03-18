/*
 * @Author: hongbin
 * @Date: 2023-01-25 10:58:14
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-04 10:16:44
 * @Description:
 */
import { ThreeHelper } from "@/src/ThreeHelper";
import { FC } from "react";
import { Container, Title, Desc } from ".";
import { NextSEO } from "../NextSEO";
import Canvas from "./Canvas";

interface IProps {
    init: (helper: ThreeHelper) => void;
    title?: string;
    desc?: string | JSX.Element;
    seoTitle?: string;
    destroy?: VoidFunction;
}

const Layout: FC<IProps> = ({ init, title, desc, seoTitle, destroy }) => {
    return (
        <Container>
            <NextSEO title={seoTitle} />
            <Title>{title}</Title>
            <Canvas init={init} destroy={destroy} />
            <br />
            <Desc>{desc}</Desc>
        </Container>
    );
};

export default Layout;
