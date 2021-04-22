import { caseToPolyCount, caseToEdgeList } from "./lut/lut.js";

export async function marchingCubes(volumeData) {
	if (!navigator.gpu) {
		alert("WebGPU is not supported/enabled in your browser.");
		return;
	}

	const [adapter, glslang] = await Promise.all([
		navigator.gpu.requestAdapter(),
		import("https://unpkg.com/@webgpu/glslang@0.0.7/web/glslang.js").then(m => m.default()),
	]);

	const computeHpBaseLevelcode = await requestFile("modules/mc-webgpu/shaders/hp-base-level.comp", 'text');
	const computeNextLevelCode = await requestFile("modules/mc-webgpu/shaders/hp-next-level.comp", 'text');
	const computeTrianglesCode = await requestFile("modules/mc-webgpu/shaders/gen-triangles.comp", 'text');
	const computeShaderNextLevel = glslang.compileGLSL(computeNextLevelCode, "compute");
	const computeShaderBaseLevel = glslang.compileGLSL(computeHpBaseLevelcode, "compute")
	const computeTriangles = glslang.compileGLSL(computeTrianglesCode, "compute")

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

	// HistoPyramid is saved to a single contiguous buffer.
	const gpuBufferHistoPyramid = device.createBuffer({
		mappedAtCreation: false,
		size: 4*(8*baseLevelSize*baseLevelSize*baseLevelSize - 1)/7,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC // COPY_SRC for debugging only
	})

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
		compute: {
			module: device.createShaderModule({
				code: computeShaderBaseLevel
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
					buffer: gpuBufferHistoPyramid
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
	var levelSize = baseLevelSize >> 1;
	var offset = baseLevelSize*baseLevelSize*baseLevelSize;
	for (var i = 1; i < numLevels; ++i) {
		const gpuBufferLevelSize = device.createBuffer({
			mappedAtCreation: true,
			size: 4,
			usage: GPUBufferUsage.UNIFORM
		});

		new Uint32Array(gpuBufferLevelSize.getMappedRange()).set(new Uint32Array([levelSize]));
		gpuBufferLevelSize.unmap();

		const gpuBufferOffset = device.createBuffer({
			mappedAtCreation: true,
			size: 4,
			usage: GPUBufferUsage.UNIFORM
		});

		new Uint32Array(gpuBufferOffset.getMappedRange()).set(new Uint32Array([offset]));
		gpuBufferOffset.unmap();

		const computePipeline = device.createComputePipeline({
			compute: {
				module: device.createShaderModule({
					code: computeShaderNextLevel
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
						buffer: gpuBufferOffset
					}
				},
				{
					binding: 2,
					resource: {
						buffer: gpuBufferHistoPyramid
					}
				}
			]
		});

		const passEncoder = commandEncoder.beginComputePass();
		passEncoder.setPipeline(computePipeline);
		passEncoder.setBindGroup(0, bindGroup);
		passEncoder.dispatch(levelSize, levelSize, levelSize);
		passEncoder.endPass();

		offset += levelSize*levelSize*levelSize;
		levelSize = levelSize >> 1;
	}

	// Get a GPU buffer for reading in an unmapped state.
	const gpuReadBuffer = device.createBuffer({
		size: 4,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
	});

	// Encode commands for copying buffer to buffer.
	commandEncoder.copyBufferToBuffer(
		gpuBufferHistoPyramid,
		4*(8*baseLevelSize*baseLevelSize*baseLevelSize - 1)/7 - 4,
		gpuReadBuffer,
		0,
		4
	);

	var t0 = performance.now()

	// Submit GPU commands.
	const gpuCommands = commandEncoder.finish();
	device.queue.submit([gpuCommands]);

	await gpuReadBuffer.mapAsync(GPUMapMode.READ);

	const arrayBuffer = gpuReadBuffer.getMappedRange();
	const numTris = new Uint32Array(arrayBuffer)[0];

	// Create vertex buffer from base level.

	// Stores the vertices of all triangles.
	const gpuBufferVertices = device.createBuffer({
		mappedAtCreation: false,
		size:  numTris * 3 * 4,
		usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
	});
	
	// Case to edges count table.
	const gpuBufferCaseToEdges = device.createBuffer({
		mappedAtCreation: true,
		size: caseToEdgeList.byteLength,
		usage: GPUBufferUsage.STORAGE
	});


	const gpuBufferNumLevels = device.createBuffer({
		mappedAtCreation: true,
		size: 4,
		usage: GPUBufferUsage.UNIFORM
	});

	new Uint32Array(gpuBufferNumLevels.getMappedRange()).set(new Uint32Array([numLevels]));
	gpuBufferNumLevels.unmap();

	// Transfer table to GPU.
	const arrayBufferCaseToEdges = gpuBufferCaseToEdges.getMappedRange();
	new Int32Array(arrayBufferCaseToEdges).set(caseToEdgeList);
	gpuBufferCaseToEdges.unmap();

	// TODO: Fill vertex buffer from HP.
	const computePipeline2 = device.createComputePipeline({
		compute: {
			module: device.createShaderModule({
				code: computeTriangles
			}),
			entryPoint: "main"
		}
	});

	// TODO: Bindings
	var bindGroupEntries = [
		{
			binding: 0,
			resource: {
				buffer: gpuBufferCaseToEdges
			}
		},
		{
			binding: 1,
			resource: {
				buffer: gpuBufferNumLevels
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
				buffer: gpuBufferHistoPyramid
			}
		},
		{
			binding: 4,
			resource: {
				buffer: gpuBufferVertices
			}
		}
	];

	const bindGroup2 = device.createBindGroup({
		layout: computePipeline2.getBindGroupLayout(0),
		entries: bindGroupEntries
	});


	const commandEncoder2 = device.createCommandEncoder();

	const passEncoder2 = commandEncoder2.beginComputePass();
	passEncoder2.setPipeline(computePipeline2);
	passEncoder2.setBindGroup(0, bindGroup2);
	passEncoder2.dispatch(numTris);
	passEncoder2.endPass();

	// Get a GPU buffer for reading in an unmapped state.
	const gpuReadBuffer2 = device.createBuffer({
		size: numTris * 3 * 4,
		usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
	});

	// Encode commands for copying buffer to buffer.
	commandEncoder2.copyBufferToBuffer(
		gpuBufferVertices,
		0,
		gpuReadBuffer2,
		0,
		numTris * 3 * 4
	);

	// Submit GPU commands.
	const gpuCommands2 = commandEncoder2.finish();
	device.queue.submit([gpuCommands2]);

	await gpuReadBuffer2.mapAsync(GPUMapMode.READ);

	var t1 = performance.now()
	console.log("Computation took " + (t1 - t0) + " milliseconds.")


	const arrayBuffer2 = gpuReadBuffer2.getMappedRange();
	return new Float32Array(arrayBuffer2);
};