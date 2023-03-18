/*
 * @Author: hongbin
 * @Date: 2023-03-12 08:37:29
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-12 18:49:59
 * @Description:near camera hide
 */
import Layout from "@/src/components/Three/Layout";
import { ThreeHelper } from "@/src/ThreeHelper";
import { CloudsShader } from "@/src/ThreeHelper/shader/clouds/CloudsShader";
import { FireShader } from "@/src/ThreeHelper/shader/fire/FireShader";
import { NightCityShader } from "@/src/ThreeHelper/shader/nightCity/NightCityShader";
import { WaterShaderMaterial } from "@/src/ThreeHelper/shader/water/WaterMaterial";
import { FC } from "react";
import * as THREE from "three";

interface IProps {}

const Physics: FC<IProps> = () => {
    return (
        <Layout
            title={"为材质添加shader - 物体离相机越近越接近透明材质"}
            init={init}
            desc={""}
        />
    );
};

export default Physics;

function init(helper: ThreeHelper) {
    helper.addAxis();
    helper.addStats();
    helper.camera.position.set(0, 0, 1);
    helper.frameByFrame();
    helper.addGUI();
    helper.initLights();
    helper.useRoomEnvironment();

    const material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.5,
        roughness: 0,
    });

    // material.onBeforeCompile = (shader) => {
    //     // uniforms: { [uniform: string]: IUniform };
    //     // vertexShader: string;
    //     // fragmentShader: string;
    // };

    // const plane = new THREE.Mesh(
    //     // new THREE.PlaneGeometry(1, 1, 200, 200),
    //     new THREE.BoxGeometry(1, 1, 1, 10, 10, 10),
    //     stripeShader
    //     // material
    // );
    // helper.add(plane);

    helper.loadGltf("/models/test.glb").then((gltf) => {
        // gltf.scene.traverse((obj) => {
        //     if (obj.type === "Mesh") {
        //         const mesh = obj as Mesh;
        //         mesh.material = stripeShader;
        //     }
        // });

        helper.add(gltf.scene);
    });
}

/**
 * 离相机进的点 条纹展示
 */
const stripeShader = new THREE.ShaderMaterial({
    uniforms: {},
    defines: { nearDis: 1.01 },
    side: THREE.DoubleSide,
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float opacity;

    void main() {
        vUv = uv;
        vPos = position;
        float dis = distance(position,cameraPosition);
        opacity = 1.0;
        if(dis < nearDis){
            opacity = 0.;
        }

        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float opacity;

    void main() {

        vec3 color = vec3(vUv.y,vUv.y,1.);

        if(opacity != 1.){
            if(mod(floor(vPos.y /  0.01),2.0) == 0.0){
                discard;
            }
        }

        

        gl_FragColor = vec4(color, 1.);
    }

    `,
});

/**
 * 离相机进的点 以粒子效果展现
 */
const pointShader = new THREE.ShaderMaterial({
    uniforms: {},
    defines: { nearDis: 1.01 },
    side: THREE.DoubleSide,
    vertexShader: `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float opacity;

    void main() {
        vUv = uv;
        vPos = position;
        float dis = distance(position,cameraPosition);
        opacity = 1.0;
        if(dis < nearDis){
            opacity = 0.0;
        }
       
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    varying vec3 vPos;
    varying float opacity;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {

        vec3 color = vec3(vUv.y,vUv.y,1.);

        if(opacity != 1.){
            float ran = random(vUv);
            if(ran > 100. ) discard;
            else color *=ran;
        }


        gl_FragColor = vec4(color, 1.);
    }

    `,
});

const normalCustomShader = new THREE.ShaderMaterial({
    uniforms: {},
    defines: { nearDis: 0.3 },
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: `
    varying vec2 vUv;
    varying float opacity;

    void main() {
        vUv = uv;
        float dis = distance(position,cameraPosition);
        opacity = 1.0;
        if(dis < nearDis){
            opacity = dis / nearDis;
        }
       
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    varying float opacity;

    void main() {

        vec3 color = vec3(vUv.y,vUv.y,1.);

        gl_FragColor = vec4(color, opacity);
    }

    `,
});
