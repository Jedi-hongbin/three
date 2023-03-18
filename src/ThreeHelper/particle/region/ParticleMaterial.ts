/*
 * @Author: hongbin
 * @Date: 2023-01-15 21:11:04
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-26 12:25:38
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
    color?: string;
}

/**
 * 导出类构造函数的参数类型
 */
type IRegionParticle = ConstructorParameters<typeof RegionParticle>;

export class RegionParticle {
    material = ShaderMaterial.clone();
    particle: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
    limitZ: number = 0;

    constructor(mesh: Mesh | THREE.Points, params: IProps) {
        this.material.updateUniforms = ShaderMaterial.updateUniforms;
        this.setMaterial(params);
        this.setRegionParams(mesh);
        this.setAttr(mesh);

        this.particle = new THREE.Points(mesh.geometry, this.material);
        this.particle.name = mesh.name;
        this.particle.position.copy(mesh.position);
        this.particle.rotation.copy(mesh.rotation);
    }

    setMaterial(params: IRegionParticle[1]) {
        this.material.uniforms.uSize = { value: params.size };

        if (params.color) {
            this.material.uniforms.color = {
                value: new THREE.Color(params.color),
            };
        }

        if (params?.additiveBlending) {
            this.material.blending = THREE.AdditiveBlending;
        }
    }

    setRegionParams(mesh: IRegionParticle[0]) {
        mesh.geometry.computeBoundingSphere();
        const { radius } = mesh.geometry.boundingSphere!;

        const vRegionZ = 0.1;

        this.material.uniforms = {
            ...this.material.uniforms,
            uLimitZ: { value: radius + vRegionZ * 2 },
            uRegionZ: { value: vRegionZ },
        };
        this.limitZ = radius + vRegionZ * 2;
    }

    setAttr(mesh: IRegionParticle["0"]) {
        const count = mesh.geometry.attributes.position.count;

        //每个粒子缩放大小不一
        const scales = new Float32Array(count);
        //点的位移
        const randoms = new Float32Array(count);

        //遍历每个点
        for (let i = 0; i < count; i++) {
            //为改点设置缩放大小
            scales[i] = 1;
            randoms[i] = Math.random() / 50;
        }

        //将缩放数据传递给 vertexShader
        mesh.geometry.setAttribute(
            "scale",
            new THREE.BufferAttribute(scales, 1)
        );
        mesh.geometry.setAttribute(
            "random",
            new THREE.BufferAttribute(randoms, 1)
        );
    }
}
