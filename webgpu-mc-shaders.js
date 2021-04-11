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

layout(std430, set = 0, binding = 3) buffer HpBase {
    uint hpBase[];
};

const ivec3[8] indexToVertex = {
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
        ivec3 off = indexToVertex[i];
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
    hpBase[globalIndex] = caseToPolyCount[caseIndex / 4][caseIndex % 4];
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

layout(std430, set = 0, binding = 1) readonly buffer PrevLevel {
    uint prevLevel[];
};

layout(std430, set = 0, binding = 2) buffer NextLevel {
    uint nextLevel[];
};

void main() {
    uint gridSize = levelSize;
    uint globalIndex = (gl_GlobalInvocationID.z * gridSize + gl_GlobalInvocationID.y) * gridSize + gl_GlobalInvocationID.x;
    nextLevel[globalIndex] = 0;
    
    for (int i = 0; i < 8; ++i) {
        uvec3 off = indexToOffset[i];
        uint idx = ((2 * gl_GlobalInvocationID.z + off.z) * gridSize * 2 + 2 * gl_GlobalInvocationID.y + off.y) * gridSize * 2 + 2 * gl_GlobalInvocationID.x + off.x;
        nextLevel[globalIndex] += prevLevel[idx];
    }
}
`