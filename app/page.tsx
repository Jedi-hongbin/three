import { Container, Title, Desc } from "@/src/components/Three";
import Canvas from "@/src/components/Three/Canvas";
import { init } from "@/src/components/Three/script";

export default function Home() {
    return (
        <Container>
            <Title>THREE &nbsp; TEMPLATE</Title>
            <Canvas init={init} />
            <br />
            <Desc>服务端渲染</Desc>
        </Container>
    );
}
