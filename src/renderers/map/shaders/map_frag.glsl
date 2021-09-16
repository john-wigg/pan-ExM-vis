varying vec2 vUv;

uniform highp sampler2D projection;
uniform highp sampler2D selection;

// https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_summer.frag
vec4 colormap(float x) {
    return vec4(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4, 1.0);
}

void main() {
    vec4 c1 = colormap(texture(projection, vUv).r);
    vec4 c2 = texture(selection, vUv);

    gl_FragColor = mix(0.5*c1, c1, c2.r);
}