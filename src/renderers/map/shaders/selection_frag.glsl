varying vec2 vUv;

uniform bool clear;
uniform vec2 lastPosition;
uniform vec2 position;
uniform bool depressed;
uniform float resolution;
uniform int penMode;
uniform float penSize;
uniform sampler2D restore;
uniform bool doRestore;

// https://iquilezles.org/www/articles/distfunctions2d/distfunctions2d.htm
float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

void drawPixel() {
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}

void erasePixel() {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}

void main()
{
    if (clear) {
        erasePixel();
        return;
    }

    if (doRestore) {
        gl_FragColor = texture(restore, vUv);
        return;
    }

    if (sdSegment(vUv, position, lastPosition) < penSize/resolution && depressed) {
        if (penMode == 0) {
            drawPixel();
        } else {
            erasePixel();
        }
    } else {
        discard;
    }
}