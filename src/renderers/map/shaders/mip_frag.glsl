varying vec2 vUv;

uniform highp sampler3D volume;
uniform highp sampler3D sdf;
uniform float isovalue;

void main() {
    vec3 uv = vec3(vUv, 0.0);
    int col = textureSize(volume, 0).z;

    // Maximum projection.
    float maxDensity = 0.0;
    float maxPos = 0.0;
    for (float i = 0.0; i < float(col); i += 1.0) {
        uv.z = i / float(col);
        float sdfVal = texture(sdf, uv).r * 255.0 / 10.0 - 5.0 - isovalue;
        if (sdfVal <= 0.01) {
            float density = texture(volume, uv).r;
            if (density > maxDensity) {
                maxDensity = density;
                maxPos = uv.z;
            }
        }
    }

    gl_FragColor = vec4(maxDensity, maxPos, 0.0, 1.0);
}