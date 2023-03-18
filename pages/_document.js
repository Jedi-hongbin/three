/*
 * @Author: hongbin
 * @Date: 2022-09-04 15:23:15
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-15 21:39:55
 * @Description: 自定义 document结构 不能使用window对象
 */
import Document, { Html, Head, Main, NextScript } from 'next/document'
import { ServerStyleSheet } from 'styled-components'

const resetStyles = `
   
`;

class MyDocument extends Document {
    static async getInitialProps(ctx) {
        const sheet = new ServerStyleSheet()
        const originalRenderPage = ctx.renderPage

        try {
            ctx.renderPage = () =>
                originalRenderPage({
                    enhanceApp: (App) => (props) =>
                        sheet.collectStyles(<App {...props} />),
                })

            const initialProps = await Document.getInitialProps(ctx)
            return {
                ...initialProps,
                styles: [initialProps.styles, sheet.getStyleElement()],
            }
        } finally {
            sheet.seal()
        }
    }

    render() {
        const { styleElements } = this.props;

        return (
            <Html>
                <Head>
                    <link rel="icon" href="logo.svg"></link>
                    <style dangerouslySetInnerHTML={{ __html: resetStyles }} />
                    {styleElements}
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument
