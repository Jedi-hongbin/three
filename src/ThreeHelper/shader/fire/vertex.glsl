varying vec2 vUv;

void main() {
    vUv = uv;
    vec3 pos = position;

    vec4 viewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;
}