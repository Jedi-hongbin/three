varying vec2 vUv;
uniform float vTime;
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {

    float num = random(vUv * vTime);
    vec3 color = vec3(num);

    gl_FragColor = vec4(color, 0.1);
}
