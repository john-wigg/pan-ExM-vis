import React from 'react';
import { Bar } from 'react-chartjs-2';

const Plots = props => {
    const data = {
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

    return (
        <>
            <Bar
                className="plots"
                data={data}
                options={options}
            />
        </>
    );
};

export default Plots;