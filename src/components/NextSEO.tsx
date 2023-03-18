/*
 * @Author: hongbin
 * @Date: 2023-01-17 13:57:36
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-25 11:01:46
 * @Description:Next的head
 */

import { NextSeo } from "next-seo";
import Head from "next/head";

export const NextSEO = ({ title, desc }: Partial<Record<string, string>>) => {
    return (
        <>
            <NextSeo
                title={title || "Three模版"}
                description={
                    desc ||
                    "技术选型:Next.js(React) + TypeScript + Three + CSS-In-JS"
                }
            ></NextSeo>
            <Head>
                <link
                    rel="icon"
                    type="image.svg+sml"
                    href="/3ds-pen.svg"
                ></link>
            </Head>
        </>
    );
};
