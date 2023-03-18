/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:54:32
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-04 10:45:12
 * @Description:
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial, Vector2 } from "three";

export const CloudsShader = new ShaderMaterial({
    uniforms: {
        iTime: { value: 0 },
        iResolution: {
            value: new Vector2(1, 1),
        },
    },
    transparent: true,
    vertexShader,
    fragmentShader,
});

CloudsShader.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
