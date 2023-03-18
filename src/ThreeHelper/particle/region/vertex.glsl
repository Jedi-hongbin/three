uniform float uSize;
uniform float uLimitZ;
uniform float uRegionZ;
attribute float scale;
attribute float random;
varying vec3 vPosition;
varying float vHidden;

void main() {
    vPosition = position;
    vec3 p = position;
    // p += random;

    float disScale = 1.0;
    vHidden = 1.0;
    if(p.z < uLimitZ + uRegionZ && p.z > uLimitZ - uRegionZ) {
        disScale = 2.0;
        p += random;
    }
    if(p.z > uLimitZ) {
        disScale = 0.0;
        vHidden = 0.0;
    }

    vec4 viewPosition = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    // 点的大小 
    gl_PointSize = uSize * scale * disScale;
    // 近大远小效果 第一个值根据场景自己调节
    gl_PointSize *= 10. / -viewPosition.z;
}