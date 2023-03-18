uniform float size;

void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    // 点的大小 
    gl_PointSize = size;
    // 近大远小效果 第一个值根据场景自己调节
    gl_PointSize *= 100. / -(modelViewMatrix * vec4(position, 1.0)).z;
}