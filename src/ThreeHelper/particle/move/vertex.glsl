uniform float size;
uniform float time;
attribute float scale;
attribute vec3 coords;
varying vec3 vPosition;

void main() {

    vec3 pos;
    float radius = coords.x + tan(sin(time));
    float phi = coords.y;
    float theta = coords.z + tan(time) * scale * radius;

    float sinPhiRadius = sin(phi) * radius;
    pos.x = sinPhiRadius * sin(theta);
    pos.y = cos(phi) * radius;
    pos.z = sinPhiRadius * cos(theta);

    vec4 viewPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    vPosition = pos;

    // 点的大小 
    gl_PointSize = size * scale;
    // 近大远小效果 第一个值根据场景自己调节
    gl_PointSize *= 100. / -(modelViewMatrix * vec4(pos, 1.0)).z;
}