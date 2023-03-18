"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-15 17:30:45
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-31 15:10:46
 * @Description: three
 */
import { FC, useEffect, useRef } from "react";
import styled from "styled-components";
// import { init } from "./script";
import { ThreeHelper } from "@/src/ThreeHelper";
interface IProps {
    init: (helper: ThreeHelper) => void;
    destroy?: VoidFunction;
}

const Canvas: FC<IProps> = ({ init, destroy }) => {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (ref.current) {
            const helper = new ThreeHelper({
                antialias: true,
                canvas: ref.current,
            });
            init(helper);
            helper.listenResize();

            return () => {
                destroy && destroy();
                helper.clearScene();
                helper.stopFrame();
                helper.removeResizeListen();
                helper.removeKeyBoardListen();
            };
        }
    }, [destroy, init]);

    return (
        <Container>
            <CanvasWrap>
                <canvas ref={ref}></canvas>
            </CanvasWrap>
        </Container>
    );
};

export default Canvas;

const CanvasWrap = styled.div`
    width: 100%;
    height: 100%;
`;

const Container = styled.div`
    height: 80vh;
    width: 80vw;
    margin: 0vh auto;
    border: 2px solid #fff;
    box-shadow: 4px 1px 20px 0px #4d4b4b, -4px -1px 20px 0px #4d4b4b;
    border-radius: 4px;
`;
