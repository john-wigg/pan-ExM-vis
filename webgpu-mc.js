// TODO: Seperate buffer allocation and actual pipeline so they can be executed
// separately later (just a matter of moving code around).

// Maps a case to a polygon count.
// (Based on NVIDIA's table)
const caseToPolyCount = new Uint32Array([ // TODO: Optimize to uint8
	0, 1, 1, 2, 1, 2, 2, 3,
	1, 2, 2, 3, 2, 3, 3, 2,
	1, 2, 2, 3, 2, 3, 3, 4,
	2, 3, 3, 4, 3, 4, 4, 3,
	1, 2, 2, 3, 2, 3, 3, 4,
	2, 3, 3, 4, 3, 4, 4, 3,
	2, 3, 3, 2, 3, 4, 4, 3,
	3, 4, 4, 3, 4, 5, 5, 2,
	1, 2, 2, 3, 2, 3, 3, 4,
	2, 3, 3, 4, 3, 4, 4, 3,
	2, 3, 3, 4, 3, 4, 4, 5,
	3, 4, 4, 5, 4, 5, 5, 4,
	2, 3, 3, 4, 3, 4, 2, 3,
	3, 4, 4, 5, 4, 5, 3, 2,
	3, 4, 4, 3, 4, 5, 3, 2,
	4, 5, 5, 4, 5, 2, 4, 1,
	1, 2, 2, 3, 2, 3, 3, 4,
	2, 3, 3, 4, 3, 4, 4, 3,
	2, 3, 3, 4, 3, 4, 4, 5,
	3, 2, 4, 3, 4, 3, 5, 2,
	2, 3, 3, 4, 3, 4, 4, 5,
	3, 4, 4, 5, 4, 5, 5, 4,
	3, 4, 4, 3, 4, 5, 5, 4,
	4, 3, 5, 2, 5, 4, 2, 1,
	2, 3, 3, 4, 3, 4, 4, 5,
	3, 4, 4, 5, 2, 3, 3, 2,
	3, 4, 4, 5, 4, 5, 5, 2,
	4, 3, 5, 4, 3, 2, 4, 1,
	3, 4, 4, 5, 4, 5, 3, 4,
	4, 5, 5, 2, 3, 4, 2, 1,
	2, 3, 3, 2, 3, 4, 2, 1,
	3, 2, 4, 1, 2, 1, 1, 0
]);

var volumeData = null;
// Shamelessly stolen
(() => {
	var url = "https://www.dl.dropboxusercontent.com/s/3ykigaiym8uiwbp/aneurism_256x256x256_uint8.raw?dl=1";

	var req = new XMLHttpRequest();

	req.open("GET", url, true);
	req.responseType = "arraybuffer";

	req.onload = () => {
		var respBuf = req.response;
		if (respBuf) {
			// TODO: We then need to copy the buffer into webasm memory space,
			// and use that buffer for the rest of the code, instead of copying it
			// in/out every call
			volumeData = new Uint32Array(new Uint8Array(respBuf)); // TOOD: Optimize to 1 byte per voxel
			marchingCubes();
		} else {
			alert("Unable to load buffer properly from volume?");
			console.log("no buffer?");
		}
	};
	req.send();
})();

async function marchingCubes() {
	if (!navigator.gpu) {
		alert("WebGPU is not supported/enabled in your browser.");
		return;
	}

	const [adapter, glslang] = await Promise.all([
		navigator.gpu.requestAdapter(),
		import("https://unpkg.com/@webgpu/glslang@0.0.7/web/glslang.js").then(m => m.default()),
	]);

	const size = 256;

	const volumeInfo = new Uint32Array([size]);

	const device = await adapter.requestDevice();

	const numLevels = Math.ceil(Math.log(size) / Math.log(2)) + 1;
	const baseLevelSize = 1 << (numLevels - 1);

	console.log("START");

	// Step 1: Transfer data to GPU and calculate HP base level.

	// Case to poly count table.
	const gpuBufferCaseToPolyCount = device.createBuffer({
		mappedAtCreation: true,
		size: caseToPolyCount.byteLength,
		usage: GPUBufferUsage.UNIFORM
	});

	// Volume information
	const gpuBufferVolumeInfo = device.createBuffer({
		mappedAtCreation: true,
		size: volumeInfo.byteLength,
		usage: GPUBufferUsage.UNIFORM
	});

	// Volume data
	const gpuBufferVolumeData = device.createBuffer({
		mappedAtCreation: true,
		size: volumeData.byteLength,
		usage: GPUBufferUsage.STORAGE
	});

	// HistoPyramid: An array of GPUBuffers.
	var gpuBuffersHistoPyramid = new Array(numLevels);
	var levelSize = baseLevelSize;
	for (var i = 0; i < numLevels; ++i) {
		gpuBuffersHistoPyramid[i] = device.createBuffer({
			mappedAtCreation: false,
			size: levelSize * levelSize * levelSize * 4,
			usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC // TODO: Only top level buffer needs COPY_SRC
		});

		levelSize = levelSize >> 1;
	}

	// Transfer table to GPU.
	const arrayBufferCaseToPolyCount = gpuBufferCaseToPolyCount.getMappedRange();
	new Uint32Array(arrayBufferCaseToPolyCount).set(caseToPolyCount);
	gpuBufferCaseToPolyCount.unmap();

	// Transfer volume information to GPU.
	const arrayBufferVolumeInfo = gpuBufferVolumeInfo.getMappedRange();
	new Uint32Array(arrayBufferVolumeInfo).set(volumeInfo);
	gpuBufferVolumeInfo.unmap();

	// Transfer volume data to the GPU.
	const arrayBufferVolumeData = gpuBufferVolumeData.getMappedRange();
	new Uint32Array(arrayBufferVolumeData).set(volumeData);
	gpuBufferVolumeData.unmap();

	// Compute the HP base level.
	// This part *seems* to work fine, but might need some further testing.
	const computePipeline = device.createComputePipeline({
		computeStage: {
			module: device.createShaderModule({
				code: glslang.compileGLSL(computeHpBaseLevelcode, "compute")
			}),
			entryPoint: "main"
		}
	});

	const bindGroup = device.createBindGroup({
		layout: computePipeline.getBindGroupLayout(0),
		entries: [
			{
				binding: 0,
				resource: {
					buffer: gpuBufferCaseToPolyCount
				}
			},
			{
				binding: 1,
				resource: {
					buffer: gpuBufferVolumeInfo
				}
			},
			{
				binding: 2,
				resource: {
					buffer: gpuBufferVolumeData
				}
			},
			{
				binding: 3,
				resource: {
					buffer: gpuBuffersHistoPyramid[0]
				}
			}
		]
	});

	const commandEncoder = device.createCommandEncoder();

	const passEncoder = commandEncoder.beginComputePass();
	passEncoder.setPipeline(computePipeline);
	passEncoder.setBindGroup(0, bindGroup);
	passEncoder.dispatch(baseLevelSize, baseLevelSize, baseLevelSize);
	passEncoder.endPass();

	// Create pipelines for HP population.
	levelSize = baseLevelSize >> 1;
	for (var i = 1; i < numLevels; ++i) {
		const gpuBufferLevelSize = device.createBuffer({
			mappedAtCreation: true,
			size: 4,
			usage: GPUBufferUsage.UNIFORM
		});

		new Uint32Array(gpuBufferLevelSize.getMappedRange()).set(new Uint32Array([levelSize]));
		gpuBufferLevelSize.unmap();

		const computePipeline = device.createComputePipeline({
			computeStage: {
				module: device.createShaderModule({
					code: glslang.compileGLSL(computeNextLevelCode, "compute")
				}),
				entryPoint: "main"
			}
		});

		const bindGroup = device.createBindGroup({
			layout: computePipeline.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: {
						buffer: gpuBufferLevelSize
					}
				},
				{
					binding: 1,
					resource: {
						buffer: gpuBuffersHistoPyramid[i - 1]
					}
				},
				{
					binding: 2,
					resource: {
						buffer: gpuBuffersHistoPyramid[i]
					}
				}
			]
		});

		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(computePipeline);
		passEncoder.setBindGroup(0, bindGroup);
		passEncoder.dispatch(levelSize, levelSize, levelSize);
		passEncoder.endPass();

		levelSize = levelSize >> 1;
	}

	// Get a GPU buffer for reading in an unmapped state.
	const gpuReadBuffer = device.createBuffer({
		size: 4,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
	});

	// Encode commands for copying buffer to buffer.
	commandEncoder.copyBufferToBuffer(
		gpuBuffersHistoPyramid[gpuBuffersHistoPyramid.length - 1],
		0,
		gpuReadBuffer,
		0,
		4
	);

	// Submit GPU commands.
	const gpuCommands = commandEncoder.finish();
	device.queue.submit([gpuCommands]);

	await gpuReadBuffer.mapAsync(GPUMapMode.READ);
	const arrayBuffer = gpuReadBuffer.getMappedRange();
	const numVerts = new Uint32Array(arrayBuffer)[0];

	console.log("END");
	console.log(numVerts);

	// TODO: Create vertex buffer from base level.


	// TODO: Fill vertex buffer from HP.

};