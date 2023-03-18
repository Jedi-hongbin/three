/*
 * @Author: hongbin
 * @Date: 2023-03-05 11:05:09
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-05 16:56:21
 * @Description: 按键提示
 */
import { flexCenter } from "@/src/styled";
import { createRef, useState, FC, useImperativeHandle } from "react";
import styled from "styled-components";

export const usePrompt = createRef<{
    show: (msg?: string) => void;
    hide: VoidFunction;
}>();

interface IProps {}

const Prompt: FC<IProps> = () => {
    const [isShow, setIsShow] = useState(false);
    const [msg, setMsg] = useState("按下");

    useImperativeHandle(
        usePrompt,
        () => ({
            show: (msg?: string) => {
                setIsShow(true);
                msg && setMsg(msg);
            },
            hide: () => {
                setIsShow(false);
            },
        }),
        []
    );

    if (!isShow) return <></>;

    return (
        <Container>
            <strong>F</strong>
            <span>{msg}</span>
        </Container>
    );
};

export default Prompt;

const Container = styled.div`
    position: fixed;
    top: 50%;
    right: 40%;
    background-color: #00000044;
    color: #fffae5;
    border-radius: 0.3vmax;
    padding: 0.5vmax;
    ${flexCenter};

    strong {
        width: 2vmax;
        height: 2vmax;
        font-size: 1.6vmax;
        text-align: center;
        line-height: 2vmax;
        margin-right: 0.3vmax;
        border: 1px solid #fffae5;
    }
`;
