#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 FragColor;

uniform lowp sampler3D volume;
uniform lowp sampler3D sdf;
uniform vec2 resolution;
uniform vec2 offset;
uniform vec3 volumeDims;
uniform float isovalue;

void main()
{
	// Get clip space position
    vec2 screen_uv = (gl_FragCoord.xy - vec2(offset[0], 0.0)) / resolution;
	vec3 uv = vec3(screen_uv, 0.0);

    // Maximum projection.
    float maxDensity = 0.0;
    float maxPos = 0.0;
    for (float i = 0.0; i < volumeDims[2]; i += 1.0) {
        uv.z = i / float(volumeDims[2]);
        float sdfVal = texture(sdf, uv).r * 255.0 / 10.0 - isovalue;
        if (sdfVal <= 0.2) {
            float density = texture(volume, uv).r;
            if (density > maxDensity) {
                maxDensity = density;
                maxPos = uv.z;
            }
        }
    }

    FragColor = vec4(maxDensity, maxPos, 0.0, 1.0);
}