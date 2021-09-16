precision highp float;
precision highp sampler3D;

out vec4 FragColor;

uniform sampler3D volume;
uniform sampler3D sdf;

uniform sampler2D texDepth;

uniform sampler2D selection;
uniform sampler2D projection;

uniform mat4 modelview;
uniform mat4 proj;

uniform vec3 volumeSize;
uniform vec2 resolution;

uniform float isovalue;

uniform bool displayProtein;
uniform bool displayCompartments;

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

// https://github.com/kbinani/colormap-shaders/blob/master/shaders/glsl/MATLAB_summer.frag
vec3 colormap(float x) {
    return vec3(clamp(x, 0.0, 1.0), clamp(0.5 * x + 0.5, 0.0, 1.0), 0.4);
}

vec3 matlab_spring(float x) {
    return vec3(1.0, clamp(x, 0.0, 1.0), clamp(1.0 - x, 0.0, 1.0));
}

// Sample the protein channel, local coordinates.
float sampleProtein(vec3 p) {
    return texture(volume, p/volumeSize + 0.5).r;
}

float sampleSdf(vec3 p) {
    return texture(sdf, p/volumeSize + 0.5).r * 255.0 / 10.0 - 5.0;;
}

void calcNormalAndCurv(vec3 p, out vec3 normal, out float curv) {
    float h = 0.01; 
    vec2 k = h * vec2(1., 0.);

    float t1 = sampleSdf(p + volumeSize*k.xyy); float t2 = sampleSdf(p - volumeSize*k.xyy);
    float t3 = sampleSdf(p + volumeSize*k.yxy); float t4 = sampleSdf(p - volumeSize*k.yxy);
    float t5 = sampleSdf(p + volumeSize*k.yxx); float t6 = sampleSdf(p - volumeSize*k.yxx);

    curv = (t1+t2+t3+t4+t5+t6-6.0*sampleSdf(p))/(h*h);
    normal = normalize(k.xyy * (t1-t2) + k.yxy * (t3-t4) + k.yyx * (t5-t6));
}


void main()
{
    float normalizedDepth = texture(texDepth, gl_FragCoord.xy / resolution).r;
    vec4 ndc = vec4(gl_FragCoord.xy / resolution * 2.0 - 1.0,
                    normalizedDepth * 2.0 - 1.0, 1.0f);
    vec4 vcoords = inverse(proj) * ndc;
    vcoords /= vcoords.w;
    float depth = -vcoords.z;

    vec3 rayDir = normalize( vDirection );
    vec2 boxDst = rayBoxDst(-0.5 * volumeSize, 0.5 * volumeSize, vOrigin, rayDir);

    // Render render isosurface
    vec4 surfaceColor = vec4(0.0f);
    if (displayCompartments) {
        vec3 rayPos = vOrigin + boxDst.x * rayDir;
        float dist = 0.0;
        while (dist < boxDst.y) {
            if (dist + boxDst.x > depth) break;
            // Simple sphere tracer.            
            float sdfVal = sampleSdf(rayPos);
            
            if (sdfVal < 0.01) {
                float curv;
                vec3 normal;
                calcNormalAndCurv(rayPos, normal, curv);
                float ldn = dot(normal, vec3(1.0, 0.0, 0.0));
                surfaceColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(colormap(abs(0.00001*curv)), 1.0), 0.5 + 0.5 * ldn);
                break;
            }

            dist += sdfVal;
            rayPos += sdfVal * rayDir;
        }
        depth = min(depth, boxDst.x + dist);
    }

    // Render volume.
    vec4 proteinColor = vec4(0.0f);
    if (displayProtein) {
        bool inProximity = false;
        vec3 rayPos = vOrigin + boxDst.x * rayDir;

        float stepSize = 0.5;
        float dist = 0.0;
        while (dist < boxDst.y) {
            float sdfVal = sampleSdf(rayPos) - isovalue;
            
            if (!inProximity) {
                if (sdfVal < 0.01) {
                    inProximity = true;
                } else {
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                }
            } else {
                if (sdfVal > 0.01) {
                    inProximity = false;
                    dist += sdfVal;
                    rayPos += sdfVal * rayDir;
                } else {
                    float density = sampleProtein(rayPos);
                    vec3 color = colormap(density);

                    vec3 uvw = rayPos / volumeSize + 0.5;
                    float distanceToMaximum = clamp(1.0 - abs(uvw.z - texture(projection, uvw.xy).g) / 0.025, 0.0, 1.0);
                    float selectionMask = texture(selection, uvw.xy).r;

                    float highlight = distanceToMaximum * selectionMask;
                    color = mix(color, 3.0 * matlab_spring(density), highlight);

                    proteinColor.rgb += density * (1.0 - proteinColor.a) * color;
                    proteinColor.a += density * (1.0 - proteinColor.a);
                    dist += stepSize;
                    rayPos += stepSize * rayDir;
                }
            }
            if (dist + boxDst.x > depth) break;
        }
    }

    FragColor.rgb = mix(surfaceColor.rgb, proteinColor.rgb, proteinColor.a);
    FragColor.a = max(surfaceColor.a, proteinColor.a);
}