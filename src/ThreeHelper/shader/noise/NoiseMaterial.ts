/*
 * @Author: hongbin
 * @Date: 2023-01-25 15:36:57
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-25 16:24:12
 * @Description:噪音材质
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial } from "three";

/**
 * 噪音材质
 */
export const NoiseShaderMaterial = new ShaderMaterial({
    uniforms: {
        vTime: { value: 0 },
    },
    // blending: AdditiveBlending,
    transparent: true,
    vertexShader,
    fragmentShader,
});

NoiseShaderMaterial.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
