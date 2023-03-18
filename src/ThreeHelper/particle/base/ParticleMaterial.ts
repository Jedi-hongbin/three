/*
 * @Author: hongbin
 * @Date: 2023-01-15 21:11:04
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-16 21:41:01
 * @Description: 将物体转换成粒子
 */
import * as THREE from "three";
import { ShaderMaterial } from "./ShaderMaterial";

interface IProps {
    /**
     * 是否启用增量混合 启用重叠的粒子颜色会加深
     */
    additiveBlending?: boolean;
    /**
     * 粒子大小
     */
    size: number;
}

export class BaseParticle {
    material = ShaderMaterial.clone();
    scales: Float32Array;
    particle: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;

    constructor(mesh: Mesh, params: IProps) {
        const count = mesh.geometry.attributes.position.count;

        this.material.uniforms.size = { value: params.size };

        //每个粒子缩放大小不一
        this.scales = new Float32Array(count);

        //遍历每个点
        for (let i = 0; i < count; i++) {
            //为改点设置缩放大小
            this.scales[i] = Math.random() + 0.3;
        }

        //将缩放数据传递给 vertexShader
        mesh.geometry.setAttribute(
            "scale",
            new THREE.BufferAttribute(this.scales, 1)
        );

        if (params?.additiveBlending) {
            this.material.blending = THREE.AdditiveBlending;
        }
        this.particle = new THREE.Points(mesh.geometry, this.material);
        this.particle.name = mesh.name;
        this.particle.position.copy(mesh.position);
        this.particle.rotation.copy(mesh.rotation);
    }
}
