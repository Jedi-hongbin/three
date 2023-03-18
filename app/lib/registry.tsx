"use client";
/*
 * @Author: hongbin
 * @Date: 2023-01-15 14:52:27
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-15 15:01:47
 * @Description:创建一个全局注册表组件来收集渲染期间生成的所有 CSS 样式规则，
 * 以及一个返回这些规则的函数。然后使用useServerInsertedHTML钩子将注册表中收集的样式注入到<head>根布局中的 HTML 标记中。
 * 不这样做的话 styled-components会在水合之后执行 页面样式后加载 效果不堪入目
 * @link: https://beta.nextjs.org/docs/styling/css-in-js#styled-components
 */

import React, { useState } from "react";
import { useServerInsertedHTML } from "next/navigation";
import { ServerStyleSheet, StyleSheetManager } from "styled-components";

export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    //@ts-ignore
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  if (typeof window !== "undefined") return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance}>
      {children}
    </StyleSheetManager>
  );
}
