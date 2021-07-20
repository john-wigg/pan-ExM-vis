async function compute_jfa(volume, width, height, depth) {
    if (!navigator.gpu) {
        alert("WebGPU is not supported/enabled in your browser!");
        return;
    }

    const [adapter, glslang] = await Promise.all([
        navigator.gpu.requestAdapter(),
        import("https://unpkg.com/@webgpu/glslang@0.0.7/web/glslang.js").then(m => m.default())
    ])

    const device = await adapter.requestDevice();

    const computeJfaCode = await requestFile("src/shaders/compute-jfa.comp", 'text');
    console.log("Shader code:");
    console.log(computeJfaCode);
    const computeJfa = glslang.compileGLSL(computeJfaCode, "compute");


    const volumeInfo = new Uint32Array([width, height, depth]);

    // Stores volume data.
    const gpuBufferVolume = device.createBuffer({
        mappedAtCreation: true,
        size: volume.byteLength,
        usage: GPUBufferUsage.STORAGE
    });

    // Stores info about volume data (width, height, depth).
    const gpuBufferVolumeInfo = device.createBuffer({
        mappedAtCreation: true,
        size: volumeInfo.byteLength,
        usage: GPUBufferUsage.UNIFORM
    });

    // Stores output.
    const gpuBufferVoronoi = device.createBuffer({
        mappedAtCreation: true,
        size: volume.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    })

    const arrayBufferVolume = gpuBufferVolume.getMappedRange();
    new Uint8Array(arrayBufferVolume).set(volume);
    gpuBufferVolume.unmap();

    const arrayBufferVolumeInfo = gpuBufferVolumeInfo.getMappedRange();
    new Uint32Array(arrayBufferVolumeInfo).set(volumeInfo);
    gpuBufferVolumeInfo.unmap();

    const computePipeline = device.createComputePipeline({
        compute: {
            module: device.createShaderModule({
                code: computeJfa
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
                    buffer: gpuBufferVolumeInfo
                }
            },
            {
                binding: 1,
                resource: {
                    buffer: gpuBufferVolume
                }
            },
            {
                binding: 2,
                resource: {
                    buffer: gpuBufferVoronoi
                }
            }
        ]            
    });

    const commandEncoder = device.createCommandEncoder();
    const passEncoder = commandEncoder.beginComputePass();
    passEncoder.setPipeline(computePipeline);
    passEncoder.setBindGroup(0, bindGroup);
    passEncoder.dispatch(width, height, depth);
    passEncoder.endPass();

    // Get a GPU buffer for reading in an unmapped state.
    const gpuReadBuffer = device.createBuffer({
        size: volume.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });

    commandEncoder.copyBufferToBuffer(
        gpuBufferVoronoi,
        0,
        gpuReadBuffer,
        0,
        volume.byteLength
    );
    const gpuCommands = commandEncoder.finish();
    device.queue.submit([gpuCommands]);

    await gpuReadBuffer.mapAsync(GPUMapMode.READ);

    return new Uint8Array(gpuReadBuffer.getMappedRange());
}