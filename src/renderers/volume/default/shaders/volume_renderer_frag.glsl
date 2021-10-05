precision highp float;
precision highp sampler3D;

out vec4 FragColor;

uniform sampler3D volume0;
uniform sampler3D volume1;
uniform sampler3D volume2;
uniform sampler3D volume3;
uniform sampler3D volume4;
uniform sampler3D volume5;
uniform sampler3D volume6;
uniform sampler3D volume7;
uniform sampler3D volume8;
uniform sampler3D volume9;

uniform sampler3D sdf;

uniform sampler3D curvature;

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
uniform bool useLod;

uniform bool debugSamples;

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
vec2 sampleProtein(vec3 p, int lod) {
    if (lod == 0) {
        return texture(volume0, p/volumeSize + 0.5).rg;
    } else if (lod == 1) {
        return texture(volume1, p/volumeSize + 0.5).rg;
    } else if (lod == 2) {
        return texture(volume2, p/volumeSize + 0.5).rg;
    } else if (lod == 3) {
        return texture(volume3, p/volumeSize + 0.5).rg;
    } else if (lod == 4) {
        return texture(volume4, p/volumeSize + 0.5).rg;
    } else if (lod == 5) {
        return texture(volume5, p/volumeSize + 0.5).rg;
    } else if (lod == 6) {
        return texture(volume6, p/volumeSize + 0.5).rg;
    } else if (lod == 7) {
        return texture(volume7, p/volumeSize + 0.5).rg;
    } else if (lod == 8) {
        return texture(volume8, p/volumeSize + 0.5).rg;
    } else {
        return texture(volume9, p/volumeSize + 0.5).rg;
    }
}

float sampleSdf(vec3 p) {
    return texture(sdf, p/volumeSize + 0.5).r * 255.0 / 10.0 - 5.0;;
}

float sampleCurvature(vec3 p) {
    return 0.010*texture(curvature, p/volumeSize + 0.5).r;
}

float sampleProjection(vec3 p) {
    vec2 uv = (p/volumeSize + 0.5).xy;
    float r = texture(projection, uv, 2.0).g;
    return r;
}

void calcNormalAndCurv(vec3 p, out vec3 normal, out float curv) {
    // Calculates the normal as well as the *mean* curvature at point p.
    float h = 0.01; 
    vec2 k = h * vec2(1., 0.);

    float t1 = sampleSdf(p + volumeSize*k.xyy); float t2 = sampleSdf(p - volumeSize*k.xyy);
    float t3 = sampleSdf(p + volumeSize*k.yxy); float t4 = sampleSdf(p - volumeSize*k.yxy);
    float t5 = sampleSdf(p + volumeSize*k.yxx); float t6 = sampleSdf(p - volumeSize*k.yxx);
    float t = sampleSdf(p);

    curv = (t1+t2+t3+t4+t5+t6-6.0*t)/(h*h); // mean curvature is just the Jacobian of the SDF
    //curv = (abs(t1+t2-t)+abs(t3+t4-t)+abs(t5+t6-t))/(h*h);
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
    vec4 proteinColor = vec4(0.0f);
    vec4 selectionColor = vec4(0.0f);
    
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
                curv = sampleCurvature(rayPos) * 100.0;
                float ldn = dot(normal, vec3(1.0, 0.0, 0.0));
                surfaceColor = mix(vec4(0.5*colormap(abs(curv)), 1.0), vec4(colormap(abs(curv)), 1.0), 0.5 + 0.5 * ldn);
                break;
            }

            dist += sdfVal;
            rayPos += sdfVal * rayDir;
        }
        depth = min(depth, boxDst.x + dist);
    }

    // Render volume.
    float steps = 0.0;
    vec3 rayPos = vOrigin + boxDst.x * rayDir;

    float baseStepSize = 0.25;
    float dist = 0.0;

    // This works better than an if statement for some reason (at least on Intel GPUs)
    float dstToMarch = float(displayProtein)*boxDst.y;

    while (dist < dstToMarch) {
        float sdfVal = sampleSdf(rayPos);

        float stepSize = baseStepSize;
        if (sdfVal < isovalue) {
            int lod = 0;
            
            if (useLod) {
                if (dist + boxDst.x < 40.0) {
                    lod = 0;
                    stepSize = baseStepSize;
                } else if (dist + boxDst.x < 80.0) {
                    lod = 1;
                    stepSize = baseStepSize * 2.0;
                } else if (dist + boxDst.x < 160.0) {
                    lod = 2;
                    stepSize = baseStepSize * 4.0;
                } else {
                    lod = 3;
                    stepSize = baseStepSize * 8.0;
                }
            }

            float density = 0.75 * sampleProtein(rayPos, lod).r;
            vec3 color = colormap(density);

            vec3 uvw = rayPos / volumeSize + 0.5;
            float distanceToMaximum = clamp(1.0 - abs(uvw.z - sampleProjection(rayPos)) / 0.025, 0.0, 1.0);
            float selectionMask = texture(selection, uvw.xy).r;

            float highlight = distanceToMaximum * selectionMask;

            if (highlight > 0.5) {
                vec3 normal;
                float curv;
                calcNormalAndCurv(rayPos, normal, curv);
                float ldn = dot(normal, vec3(1.0, 0.0, 0.0));
                selectionColor = mix(vec4(0.0, 0.0, 0.0, 1.0), vec4(1.0, 0.0, 0.0, 1.0), 0.5 + 0.5 * ldn);
                break;
            }
            color = mix(color, 3.0 * matlab_spring(density), highlight);

            proteinColor.rgb += density * (1.0 - proteinColor.a) * color;
            proteinColor.a += density * (1.0 - proteinColor.a);
        }

        dist += stepSize;
        rayPos += stepSize * rayDir;

        steps += 1.0;

        //if (proteinColor.a > 0.99f) break;
        if (dist + boxDst.x > depth) break;
    }

    if (debugSamples) {
        FragColor.rgb = matlab_spring(steps / 500.0);
        FragColor.a = 1.0;
    } else {
        FragColor.rgb = mix(surfaceColor.rgb, proteinColor.rgb, proteinColor.a);
        FragColor.a = max(surfaceColor.a, proteinColor.a);

        FragColor.rgb = mix(FragColor.rgb, selectionColor.rgb, selectionColor.a);
        FragColor.a = max(FragColor.a, selectionColor.a);
    }
}