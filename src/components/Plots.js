import React, { useState } from 'react';
import { Bar } from 'react-chartjs-2';

import Dropdown from 'react-bootstrap/Dropdown';

const Plots = props => {
    const [page, setPage] = useState("distance");

    const distanceData = {
        labels: props.labelsHistogram,
        datasets: [{
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: props.globalHistogram,
            label: 'Global Histogram',
        },
        {
            backgroundColor: 'rgb(0, 255, 132)',
            borderColor: 'rgb(0, 255, 132)',
            data: props.localHistogram,
            label: 'Local Histogram',
        }]
    };

    const curvatureData = {
        labels: props.labelsCurvHistogram,
        datasets: [{
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: props.globalCurvHistogram,
            label: 'Global Histogram',
        }]
    };

    const options = {
        scales: {
            yAxes: [
                {
                    ticks: {
                        beginAtZero: true,
                    },
                },
            ],
        },
        maintainAspectRatio: false
    };

    let data;
    let dropdownToggleString = "";
    if (page === "curvature") {
        dropdownToggleString = "Curvature Histogram"
        data = curvatureData;
    } else if (page === "distance") {
        dropdownToggleString = "Distance Histogram"
        data = distanceData;
    }

    return (
        <>
            <div className="stack" style={{zIndex: 0}}>
                <Bar
                    className="plots"
                    data={data}
                    options={options}
                />
            </div>
            <div className="stack overlay">
                <Dropdown
                    className="pointer-events"
                >
                    <Dropdown.Toggle>
                        {dropdownToggleString}
                    </Dropdown.Toggle>

                    <Dropdown.Menu>
                        <Dropdown.Item
                            onClick={() => {setPage("distance")}}
                        >
                            Distance Histogram
                        </Dropdown.Item>
                        <Dropdown.Item
                            onClick={() => {setPage("curvature")}}
                        >
                            Curvature Histogram
                        </Dropdown.Item>
                    </Dropdown.Menu>
                </Dropdown>
            </div>
        </>
    );
};

export default Plots;