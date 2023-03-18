void main() {
    //获得以粒子中心为原点的圆形区域
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = step(0.5, strength);
    strength = 1.0 - strength;

    //圆形以外像素 不渲染
    if(strength == 0.0)
        discard;

    gl_FragColor = vec4(vec3(0.9), strength);
}