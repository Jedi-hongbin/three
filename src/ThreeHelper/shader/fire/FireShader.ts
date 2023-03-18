/*
 * @Author: hongbin
 * @Date: 2023-01-25 15:36:57
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-04 10:10:16
 * @Description:噪音材质
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial, Vector2 } from "three";

/**
 * 噪音材质
 */
export const FireShader = new ShaderMaterial({
    uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Vector2(1, 1) },
    },
    // blending: AdditiveBlending,
    transparent: true,
    vertexShader,
    fragmentShader,
});

FireShader.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
