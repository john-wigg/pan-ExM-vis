
varying vec2 vUv;

uniform sampler2D texGrid;
uniform sampler2D texVolume;

void main() {
    gl_FragColor = vec4(mix(texture(texGrid, vUv).rgb, texture(texVolume, vUv).rgb, texture(texVolume, vUv).a), 1.0);
}