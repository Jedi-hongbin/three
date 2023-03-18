/*
 * @Author: hongbin
 * @Date: 2023-01-15 14:13:00
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-25 11:02:10
 * @Description: pages 下面为 客户端渲染组件
 */
import Layout from "@/src/components/Three/Layout";
import { init } from "@/src/components/Three/script";
import { FC } from "react";

interface IProps {}

const Index: FC<IProps> = () => {
    return <Layout title={"THREE TEMPLATE"} init={init} desc="客户端渲染" />;
};

export default Index;
