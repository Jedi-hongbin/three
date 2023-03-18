varying vec3 vPosition;
uniform vec3 color;
varying float vHidden;

void main() {

    if(vHidden == 0.0)
        discard;

    //获得以粒子中心为原点的圆形区域
    //距离中心距离
    float strength = distance(gl_PointCoord, vec2(.5));
    // strength = step(.5, strength);
    // strength *= 2.;
    strength = 1. - strength;
    strength = pow(strength, 10.0);

    //圆形以外像素 不渲染
    if(strength <= 0.04)
        discard;

    gl_FragColor = vec4(color, strength);
}
