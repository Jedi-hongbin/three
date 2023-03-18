/*
 * @Author: hongbin
 * @Date: 2023-03-02 13:54:32
 * @LastEditors: hongbin
 * @LastEditTime: 2023-03-04 10:19:20
 * @Description:
 */
import vertexShader from "./vertex.glsl";
import fragmentShader from "./fragment.glsl";
import { ShaderMaterial, Vector2 } from "three";

export const NightCityShader = new ShaderMaterial({
    uniforms: {
        iTime: { value: 0 },
        // 分辨率就是THREE元素的大小
        iResolution: {
            value: new Vector2(1, 1),
        },
    },
    defines: {
        // 快速
        // FAST_DESCENT: true,
        // 黑白滤镜
        // BLACK_AND_WHITE: true,
    },
    // transparent: true,
    vertexShader,
    fragmentShader,
});

NightCityShader.updateUniforms = function (key: string, val: any) {
    this.uniforms[key] = { value: val };
};
