#version 300 es

#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 FragColor;

uniform lowp sampler2D source;
uniform lowp sampler2D draw;
uniform vec2 offset;
uniform vec2 resolution;

// https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_summer.frag
vec4 colormap(float x) {
    return vec4(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4, 1.0);
}

void main()
{
	// Get clip space position
    vec2 uv = (gl_FragCoord.xy - offset) / resolution;

    vec4 c = colormap(texture(source, uv).r);
    vec4 d = colormap(texture(draw, uv).r);

    FragColor = mix(0.5*c, c, d);
}