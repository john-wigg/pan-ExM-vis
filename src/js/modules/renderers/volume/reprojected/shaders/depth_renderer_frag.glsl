precision highp float;
precision highp sampler3D;

out vec4 FragColor;

uniform sampler3D volume;

uniform mat4 modelview;
uniform mat4 proj;

uniform vec3 volumeSize;

in vec3 vOrigin;
in vec3 vDirection;

vec2 rayBoxDst(vec3 bmin, vec3 bmax, vec3 p, vec3 d) {
    vec3 t0 = (bmin - p) / d;
    vec3 t1 = (bmax - p) / d;
    vec3 tmin = min(t0, t1);
    vec3 tmax = max(t0, t1);

    float dstA = max(max(tmin.x, tmin.y), tmin.z);
    float dstB = min(tmax.x, min(tmax.y, tmax.z));

    float dstToBox = max(0.0, dstA);
    float dstInsideBox = max(0.0, dstB - dstToBox);
    return vec2(dstToBox, dstInsideBox);
}

// Sample the protein channel, local coordinates.
float sampleProtein(vec3 p) {
    return texture(volume, p/volumeSize + 0.5).r;
}

void main()
{
    vec3 rayDir = normalize( vDirection );
    vec2 boxDst = rayBoxDst(-0.5 * volumeSize, 0.5 * volumeSize, vOrigin, rayDir);

    // Render volume.
    vec3 rayPos = vOrigin + boxDst.x * rayDir;

    float stepSize = 0.5;

    float totalDensity;
    float depth = 0.0f;
    for (float dist = 0.0; dist < boxDst.y; dist += stepSize) {
        float density = sampleProtein(rayPos);
        totalDensity += density * (1.0 - totalDensity);
        if (totalDensity > 0.5) {
            break;
        }
        rayPos += stepSize * rayDir;
        depth = dist + boxDst.x;
    }

    vec4 ndc = proj * modelview * vec4(vOrigin + depth * rayDir, 1.0f);
    ndc /= ndc.w;
    //FragColor = vec4(vec3((ndc.z + 1.0) / 2.0), 1.0);
    FragColor = vec4(vec3(depth / 1000.0), 1.0);
}