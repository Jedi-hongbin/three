/*
 * @Author: hongbin
 * @Date: 2023-01-25 15:36:57
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-11 10:30:16
 * @Description:噪音材质
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial, Vector2 } from "three";

/**
 * 水波材质
 */
export const WaterShaderMaterial = new ShaderMaterial({
    uniforms: {
        vTime: { value: 0 },
        iResolution: {
            value: new Vector2(1, 1),
        },
    },
    defines: {
        TAU: 6.28318530718,
        MAX_ITER: 5,
    },
    // blending: AdditiveBlending,
    transparent: true,
    vertexShader,
    fragmentShader,
});

WaterShaderMaterial.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
