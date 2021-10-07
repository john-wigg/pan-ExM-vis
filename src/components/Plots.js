import React, { useState } from 'react';
import Plot from 'react-plotly.js';

import Dropdown from 'react-bootstrap/Dropdown';

const Plots = props => {
    const [page, setPage] = useState("heatmap");

    let data = {};
    let layout = {};

    let dropdownToggleString = "";
    if (page === "heatmap") {
        dropdownToggleString = "Heatmap"

        const heat = Array.from(Array(props.heatmap.length).fill(0), () => new Array(props.heatmap.length).fill(0));
        const x = new Array(props.heatmap.length);
        const y = new Array(props.heatmap[0].length);
        for (let i = 0; i < heat.length; ++i) {
            x[i] = i / 10.0 - 5.0;
            y[i] = 5.0 * (i / 255.0 - 0.5);
            for (let j = 0; j < heat.length; ++j) {
                if (props.heatarea[i][j] === 0) heat[i][j] = 0.0;
                else heat[i][j] = props.heatmap[i][j] / props.heatarea[i][j];
            }
        }

        const localHeat = Array.from(Array(props.localHeatmap.length).fill(0), () => new Array(props.localHeatmap.length).fill(0));

        let localData;
        let totalArea = 0.0;
        for (let i = 0; i < localHeat.length; ++i) {
            for (let j = 0; j < localHeat.length; ++j) {
                totalArea += props.localHeatarea[i][j];
                if (props.localHeatarea[i][j] === 0) localHeat[i][j] = 0.0;
                else localHeat[i][j] = props.localHeatmap[i][j] / props.localHeatarea[i][j];
            }
        }

        if (totalArea > 0) {
            localData = {
                x: x,
                y: y,
                z: localHeat,
                type: 'heatmap',
                colorscale: [ // Modified magma from https://github.com/plotly/plotly.py/blob/master/packages/python/plotly/_plotly_utils/colors/sequential.py
                    [0.0, "#26828e00"],
                    [0.0001, "#26828eff"],
                    [0.2, "#1f9e89ff"],
                    [0.4, "#35b779ff"],
                    [0.6, "#6ece58ff"],
                    [0.8, "#b5de2bff"],
                    [1.0, "#fde725ff"]
                ],
                colorbar: {
                    title: "Local Protein count/voxel",
                    titleside: 'right',
                    x: "1.2"
                }
            }
        } else {
            localData = {}
        }

        data = [
            {
                x: x,
                y: y,
                z: heat,
                type: 'heatmap',
                colorscale: 'Hot',
                colorbar: {
                    title: "Protein count/voxel",
                    titleside: 'right'
                }
            },
            localData
        ];

        layout = {
            title: 'Protein Heatmap',
            xaxis: {
                title: {
                    text: 'Distance',
                },
            },
            yaxis: {
                title: {
                    text: 'Mean Curvature'
                }
            }
        };
        
    } else if (page === "distance") {
        dropdownToggleString = "Distance Histogram"

        const global = new Array(256);
        
        for (let i = 0; i < 256; ++i) {
            let area = 0.0;
            let count = 0.0;
            for (let j = 0; j < 256; ++j) {
                count += props.heatmap[j][i];
                area += props.heatarea[j][i];
            }
            global[i] = count/area;
        }
        
        const local = new Array(256);
        for (let i = 0; i < 256; ++i) {
            let area = 0.0;
            let count = 0.0;
            for (let j = 0; j < 256; ++j) {
                count += props.localHeatmap[j][i];
                area += props.localHeatarea[j][i];
            }
            local[i] = count/area;
        }

        const x = new Array(props.heatmap.length);
        for (let i = 0; i < props.heatmap.length; ++i) {
            x[i] = i / 10.0 - 5.0;
        }

        data = [
            {
                x: x,
                y: global,
                type: 'bar',
                name: 'Global'
            },
            {
                x: x,
                y: local,
                type: 'bar',
                name: 'Selection'
            }
        ];

        layout = {
            title: 'Distance Histogram',
            xaxis: {
                title: {
                    text: 'Distance',
                },
            },
            yaxis: {
                title: {
                    text: 'Protein count/voxel'
                }
            }
        };
    } else if (page === "curvature") {
        dropdownToggleString = "Curvature Histogram"

        const global = new Array(256);
        
        for (let i = 0; i < 256; ++i) {
            let area = 0.0;
            let count = 0.0;
            for (let j = 0; j < 256; ++j) {
                count += props.heatmap[i][j];
                area += props.heatarea[i][j];
            }
            global[i] = count/area;
        }
        
        const local = new Array(256);
        for (let i = 0; i < 256; ++i) {
            let area = 0.0;
            let count = 0.0;
            for (let j = 0; j < 256; ++j) {
                count += props.localHeatmap[i][j];
                area += props.localHeatarea[i][j];
            }
            local[i] = count/area;
        }

        const x = new Array(props.heatmap.length);
        for (let i = 0; i < props.heatmap.length; ++i) {
            x[i] = 5.0 * (i / 255.0 - 0.5);
        }

        data = [
            {
                x: x,
                y: global,
                type: 'bar',
                name: 'Global'
            },
            {
                x: x,
                y: local,
                type: 'bar',
                name: 'Selection'
            }
        ];

        layout = {
            title: 'Mean Curvature Histogram',
            xaxis: {
                title: {
                    text: 'Mean Curvature',
                },
            },
            yaxis: {
                title: {
                    text: 'Protein count/voxel'
                }
            }
        };
    }

    return (
        <>
            <Plot
                data={data}
                layout={layout}
                config={{ responsive: true }}
            />
            <div className="stack overlay">
                <Dropdown
                    className="pointer-events"
                >
                    <Dropdown.Toggle>
                        {dropdownToggleString}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item
                            onClick={() => { setPage("heatmap") }}
                        >
                            Distance/Curvature Heatmap
                        </Dropdown.Item>
                        <Dropdown.Item
                            onClick={() => { setPage("distance") }}
                        >
                            Distance Histogram
                        </Dropdown.Item>
                        <Dropdown.Item
                            onClick={() => { setPage("curvature") }}
                        >
                            Curvature Histogram
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </>
    )
};

export default Plots;