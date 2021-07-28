#version 300 es

precision highp float;

out vec4 FragColor;

uniform mediump sampler3D volume;
uniform mediump sampler3D sdf;
uniform vec2 resolution;
uniform vec2 offset;
uniform vec3 volumeDims;
uniform float isovalue;

// https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_summer.frag
vec4 colormap(float x) {
    return vec4(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4, 1.0);
}

void main()
{
	// Get clip space position
    vec2 screen_uv = (gl_FragCoord.xy - vec2(offset[0], 0.0)) / resolution;
	vec3 uv = vec3(screen_uv, 0.0);

    // Maximum projection.
    float maxDensity = 0.0;
    for (float i = 0.0; i < volumeDims[2]; i += 1.0) {
        uv.z = i / float(volumeDims[2]);
        float sdfVal = texture(sdf, uv).r * 255.0 / 10.0 - isovalue;
        if (sdfVal <= 0.2) {
            float density = texture(volume, uv).r;
            maxDensity = max(maxDensity, density);
        }
    }

    FragColor = colormap(maxDensity);
}