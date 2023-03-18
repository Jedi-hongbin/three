/*
 * @Author: hongbin
 * @Date: 2023-01-28 14:13:00
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-30 10:15:19
 * @Description: pages 下面为 客户端渲染组件
 */
import { NextSEO } from "@/src/components/NextSEO";
import { Container } from "@/src/components/Three";
import { Canvas, ThreeElements, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { Grid, OrbitControls, useGLTF } from "@react-three/drei";
import {
    FC,
    Suspense,
    useCallback,
    startTransition,
    useRef,
    useState,
} from "react";
import { DotScreen } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useLoader } from "@react-three/fiber";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import styled from "styled-components";

interface IProps {}

const Mesh = (props: ThreeElements["mesh"]) => {
    const mesh = useRef<Mesh>(null!);

    const [hovered, setHover] = useState(false);
    const [active, setActive] = useState(false);

    useFrame((state, delta) => {
        mesh.current.rotation.x += delta;
    });

    return (
        <mesh
            {...props}
            ref={mesh}
            scale={active ? 1.5 : 1}
            onClick={(event) => setActive(!active)}
            onPointerOver={(event) => setHover(true)}
            onPointerOut={(event) => setHover(false)}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={hovered ? "hotpink" : "orange"} />
        </mesh>
    );
};

function Model({ onProgress }: { onProgress: (p: number) => void }) {
    const group = useRef<THREE.Group>(null!);

    const gltf = useLoader(
        GLTFLoader,
        "https://api.hongbin.xyz:3002/kmyc/aboutme.glb",
        (loader) => {
            loader.manager.onProgress = (u, load, total) => {
                onProgress((load / total) * 100);
            };
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderConfig({ type: "js" });
            dracoLoader.setDecoderPath("https://api.hongbin.xyz:3002/kmyc/");
            loader.setDRACOLoader(dracoLoader);
        }
    );

    useFrame((s) => {
        group.current.rotation.x = s.pointer.x / 15;
        group.current.rotation.y = s.pointer.y / 15;
    });

    return (
        <Suspense fallback={null}>
            <group ref={group}>
                <primitive position={[0, -1.9, 0]} object={gltf.scene} />
            </group>
        </Suspense>
    );
}

const Index: FC<IProps> = () => {
    const [percent, setPercent] = useState(0);

    const onProgress = useCallback((p: number) => {
        startTransition(() => {
            setPercent(p);
        });
    }, []);

    return (
        <Container>
            <NextSEO title="react-three-fiber" />
            <Progress percent={percent} />

            <Canvas camera={{ position: [0, 4, 12] }}>
                <hemisphereLight intensity={0.8} />
                <directionalLight intensity={0.8} position={[0, -1, 0]} />
                <directionalLight intensity={0.8} position={[0, 1, 0]} />
                <directionalLight intensity={0.3} position={[1, 0, 0]} />
                <directionalLight intensity={0.3} position={[-1, 0, 0]} />
                <Model onProgress={onProgress} />
                {/* <Grid
                    renderOrder={-1}
                    position={[0, -1.85, 0]}
                    infiniteGrid
                    cellSize={0.2}
                    cellThickness={0.6}
                    sectionSize={2.3}
                    sectionThickness={1}
                    sectionColor={new THREE.Color("#51f")}
                    fadeDistance={20}
                /> */}
                {/* <OrbitControls
                    autoRotateSpeed={0.05}
                    // enableZoom={false}
                    makeDefault
                    // minPolarAngle={Math.PI / 2}
                    // maxPolarAngle={Math.PI / 2}
                    position={[1, 1, 1]}
                /> */}
                <group scale={0.3} position={[0, -1, 3]}>
                    <Mesh position={[-1.2, 0, 0]} />
                    <Mesh position={[1.2, 0, 0]} />
                </group>
                {/* 灯 */}
                <pointLight
                    position={[-5, 4, 3]}
                    intensity={10}
                    color={new THREE.Color("#f00")}
                    distance={5}
                />
                {/* 电脑 */}
                <pointLight
                    position={[0, 1, 1]}
                    intensity={0.3}
                    color={[10, 2, 5]}
                    distance={5}
                />
                {/* 面板 */}
                <pointLight
                    position={[-2, 1, 8]}
                    intensity={1}
                    color={[10, 2, 5]}
                    distance={3}
                />

                <EffectComposer disableNormalPass>
                    <Bloom luminanceThreshold={0.7} />
                </EffectComposer>
            </Canvas>
        </Container>
    );
};

export default Index;

const Progress = styled.div<{ percent: number }>`
    position: fixed;
    height: 1vh;
    width: ${(props) => props.percent + "vw"};
    background: #fff;
    transition: all 0.2s ease-out;
    top: 49vh;
    z-index: 10;
    opacity: ${(props) => Number(props.percent != 100)};
`;
