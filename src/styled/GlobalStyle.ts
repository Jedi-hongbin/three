import { createGlobalStyle } from "styled-components";
// import PSFont from "../assets/font/metaVo.ttf";

/* background: ${window.MACOS ? "#345438" : "#025528"}; */
/* src:${() => `url(${PSFont}) format('TrueType')`} */
const GlobalStyle = createGlobalStyle`

  html,
  body {
    max-width: 100vw;
    overflow-x: hidden;
    color: var(--text-color)
  }

  body{
    background-color: #111;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  body,head,div,section,p,h1,h2,h3,h4,h5,h6,code,span,head,footer,nav,main {
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    user-select: none;
  }

  :root {
    --primary-color: #a69176;
    --scrollbar-color:#fff;
    --scrollbar-bg-color:#32005f;
    --nav-height:15vh;
    --text-color: #000;
  }

  ::-webkit-scrollbar-thumb {
    background: var(--scrollbar-color);
    border-radius: 4px;
  }
  ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
      background-color: var(--scrollbar-bg-color);
  }

  .dg.ac {
    z-index: 10000 !important;
  }

  @media (prefers-color-scheme: dark) {
    html {
      color-scheme: dark;
    }
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --text-color: #fff;
    }
  }
`;

export default GlobalStyle;
