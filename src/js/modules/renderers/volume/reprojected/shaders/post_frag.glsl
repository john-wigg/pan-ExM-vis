
varying vec2 vUv;

uniform sampler2D tex;

void main() {
    gl_FragColor = texture(tex, vUv);
}