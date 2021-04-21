const computeHpBaseLevelcode =
`
#version 450

layout(std140, set = 0, binding = 0) uniform CaseToPolyCount {
    ivec4 caseToPolyCount[64];
};

layout(std140, set = 0, binding = 1) uniform VolumeInfo {
    uint size;
} volumeInfo;

layout(std430, set = 0, binding = 2) readonly buffer VolumeData {
    uint volumeData[];
};

layout(std430, set = 0, binding = 3) buffer HistoPyramid {
    uint histoPyramid[];
};

const ivec3[8] vertexPosition = {
	ivec3(0, 0, 0),
	ivec3(1, 0, 0),
	ivec3(1, 1, 0),
	ivec3(0, 1, 0),
	ivec3(0, 0, 1),
	ivec3(1, 0, 1),
	ivec3(1, 1, 1),
	ivec3(0, 1, 1)
};

uint[8] computeVertexValues(uvec3 voxelPos) {
    uint vertexValues[8];
    for (int i = 0; i < 8; ++i) {
        ivec3 off = vertexPosition[i];
        uint idx = ((voxelPos.z + off.z) * volumeInfo.size + voxelPos.y + off.y) * volumeInfo.size + voxelPos.x + off.x;
        if (idx > volumeInfo.size*volumeInfo.size*volumeInfo.size - 1) {
            // TODO: Get rid of non-uniform if clause.
            vertexValues[i] = 0;
        } else {
            vertexValues[i] = volumeData[idx];
        }
    }
    return vertexValues;
}

void main() {
    uint caseIndex = 0;
    uint vertexValues[8] = computeVertexValues(gl_GlobalInvocationID);
    for (int i = 0; i < 8; ++i) {
        if (vertexValues[i] > 127) {
            // TODO: This value is arbitrary right now.
            caseIndex |= 1 << i;
        }
    }
    // TODO: Pass HP base size to shader.
    uint globalIndex = (gl_GlobalInvocationID.z * 256 + gl_GlobalInvocationID.y) * 256 + gl_GlobalInvocationID.x;
    histoPyramid[globalIndex] = caseToPolyCount[caseIndex / 4][caseIndex % 4];
}
`

const computeNextLevelCode =
`
#version 450

const ivec3[8] indexToOffset = {
	ivec3(0, 0, 0),
	ivec3(1, 0, 0),
	ivec3(1, 1, 0),
	ivec3(0, 1, 0),
	ivec3(0, 0, 1),
	ivec3(1, 0, 1),
	ivec3(1, 1, 1),
	ivec3(0, 1, 1)
};

layout(std140, set = 0, binding = 0) uniform LevelSize {
    uint levelSize;
};

layout(std140, set = 0, binding = 1) uniform Offset {
    uint offset;
};

layout(std430, set = 0, binding = 2) buffer HistoPyramid {
    uint histoPyramid[];
};

void main() {
    uint gridSize = levelSize;
    uint globalIndex = offset + (gl_GlobalInvocationID.z * gridSize + gl_GlobalInvocationID.y) * gridSize + gl_GlobalInvocationID.x;
    histoPyramid[globalIndex] = 0;
    uint prevOffset = offset - 8*levelSize*levelSize*levelSize;
    
    for (int i = 0; i < 8; ++i) {
        uvec3 off = indexToOffset[i];
        uint idx = prevOffset + ((2 * gl_GlobalInvocationID.z + off.z) * gridSize * 2 + 2 * gl_GlobalInvocationID.y + off.y) * gridSize * 2 + 2 * gl_GlobalInvocationID.x + off.x;
        histoPyramid[globalIndex] += histoPyramid[idx];
    }
}
`

const computeTrianglesCode =
`
#version 450

const uvec3[8] vertexPosition = {
	uvec3(0, 0, 0),
	uvec3(1, 0, 0),
	uvec3(1, 1, 0),
	uvec3(0, 1, 0),
	uvec3(0, 0, 1),
	uvec3(1, 0, 1),
	uvec3(1, 1, 1),
	uvec3(0, 1, 1)
};

const uvec2[12] edgeVertices = {
    uvec2(0, 1),
    uvec2(1, 2),
    uvec2(2, 3),
    uvec2(3, 0),
    uvec2(4, 5),
    uvec2(6, 5),
    uvec2(6, 7),
    uvec2(7, 4),
    uvec2(0, 4),
    uvec2(1, 5),
    uvec2(2, 6),
    uvec2(3, 7),
};

layout(std430, set = 0, binding = 0) readonly buffer CaseToEdges {
    // For some reason multidimensional arrays don't work due to "minimum buffer size"?!
    int caseToEdges[4096]; // TODO: Optimize memory layout probably.
};

layout(std140, set = 0, binding = 1) uniform NumLevels {
    uint numLevels;
};

layout(std430, set = 0, binding = 2) readonly buffer VolumeData {
    uint volumeData[];
};

layout(std430, set = 0, binding = 3) readonly buffer HistoPyramid {
    uint histoPyramid[];
};

layout(std430, set = 0, binding = 4) buffer Triangles {
    vec4 triangles[];
};

// Returns voxel position and index of triangle in the voxel.
uvec4 hpTraversal(uint triIndex) {
    triIndex += 1;
    uint searchIndex = 0;
    uvec3 voxelPos = uvec3(0);
    uint n = 1 << (numLevels - 1);
    uint bufferSize = (8*n*n*n - 1)/7;
    uint bufferOffset = bufferSize - 1;

    // Sanity check on pyramid "top".
    if (histoPyramid[bufferOffset] < triIndex) return uvec4(0, 0, 0, 0);
    for (uint level = 1; level < numLevels; ++level) {
        uint levelSize = 1 << level;
        bufferOffset -= levelSize*levelSize*levelSize;
        for (uint i = 0; i < 8; ++i) {
            uvec3 searchVoxelPos = 2 * voxelPos + vertexPosition[i];
            uint searchVoxelIndex = (searchVoxelPos.z * levelSize + searchVoxelPos.y) * levelSize + searchVoxelPos.x;
            uint trisInVoxel = histoPyramid[bufferOffset + searchVoxelIndex];
            if (searchIndex + trisInVoxel >= triIndex) {
                voxelPos = searchVoxelPos;
                if (level == numLevels - 1) {
                    return uvec4(voxelPos, triIndex - searchIndex - 1);
                }
                break; // goto next level
            } else {
                searchIndex += trisInVoxel;
            }
        }
    }

    return uvec4(0, 0, 0, 0);
}

uint[8] computeVertexValues(uvec3 voxelPos) {
    uint size = 1 << (numLevels - 1);
    uint vertexValues[8];
    for (int i = 0; i < 8; ++i) {
        uvec3 off = vertexPosition[i];
        uint idx = ((voxelPos.z + off.z) * size + voxelPos.y + off.y) * size + voxelPos.x + off.x;
        if (idx > size*size*size - 1) {
            // TODO: Get rid of non-uniform if clause.
            vertexValues[i] = 0;
        } else {
            vertexValues[i] = volumeData[idx];
        }
    }
    return vertexValues;
}

void main() {
    uvec4 voxel = hpTraversal(gl_GlobalInvocationID.x);
    uint vertexValues[8] = computeVertexValues(voxel.xyz);
    uint caseIndex = 0;
    for (int i = 0; i < 8; ++i) {
        if (vertexValues[i] > 127) {
            // TODO: This value is arbitrary right now.
            caseIndex |= 1 << i;
        }
    }

    int[16] tris = {caseToEdges[16*caseIndex], caseToEdges[16*caseIndex+1], caseToEdges[16*caseIndex+2], caseToEdges[16*caseIndex+3],
                    caseToEdges[16*caseIndex+4], caseToEdges[16*caseIndex+5], caseToEdges[16*caseIndex+6], caseToEdges[16*caseIndex+7],
                    caseToEdges[16*caseIndex+8], caseToEdges[16*caseIndex+9], caseToEdges[16*caseIndex+10], caseToEdges[16*caseIndex+11],
                    caseToEdges[16*caseIndex+12], caseToEdges[16*caseIndex+13], caseToEdges[16*caseIndex+14], caseToEdges[16*caseIndex+15]};

    ivec3 edges = ivec3(tris[3*voxel[3]], tris[3*voxel[3] + 1], tris[3*voxel[3] + 2]);
    for (int i = 0; i < 3; ++i) {
        uvec2 verts = edgeVertices[edges[i]];
        vec4 vertPos = vec4(voxel.xyz, caseToEdges[16*192]) + 0.5 * (vec4(vec3(vertexPosition[verts.x]), 0.0) + vec4(vec3(vertexPosition[verts.y]), 0.0));
        triangles[3 * gl_GlobalInvocationID.x + i] = vertPos;
    }

    // TODO: Interpolate.
}
`