varying vec3 vPosition;

void main() {
    //获得以粒子中心为原点的圆形区域
    //距离中心距离
    float strength = distance(gl_PointCoord, vec2(0.5));
    float dis = length(gl_PointCoord.xy - 0.5);
    dis = smoothstep(0.5, 0.0, dis);
    strength = step(0.5, strength);
    strength = 1.0 - strength;

    //圆形以外像素 不渲染
    if(strength == 0.0)
        discard;
    if(dis == 0.0)
        discard;

    vec3 color = vec3(abs(sin(vPosition.y)), abs(cos(vPosition.x)), abs(sin(vPosition.z)));

    gl_FragColor = vec4(color, dis * strength);
}
