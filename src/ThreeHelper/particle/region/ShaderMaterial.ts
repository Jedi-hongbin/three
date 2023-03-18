/*
 * @Author: hongbin
 * @Date: 2023-01-15 21:06:07
 * @LastEditors: hongbin
 * @LastEditTime: 2023-01-25 18:54:41
 * @Description:自定义shader
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial as THREEShaderMaterial } from "three";

export const ShaderMaterial = new THREEShaderMaterial({
    uniforms: {
        time: { value: 0 },
        //弥补自定义shader没有PointsMaterial材质的size属性
        size: { value: 8 },
    },
    // blending: AdditiveBlending,
    transparent: true,
    vertexShader,
    fragmentShader,
    // 很重要 黑色边框不可见靠这个
    // depthTest: false,
    // depthWrite: false,
});

ShaderMaterial.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
