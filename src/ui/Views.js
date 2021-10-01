import React, { useState, useRef, useEffect } from 'react'

import Button from 'react-bootstrap/Button'

import Canvas from './Canvas';
import Plots from './Plots'
import MapTools from './MapTools'

const Views= props => {
    const mainRef = useRef(null);
    const mapRef = useRef(null);

    const [mainView, setMainView] = useState();
    const [mapView, setMapView] = useState();

    useEffect(() => {
        setMainView(mainRef.current);
        setMapView(mapRef.current);
    }, []);

    const handleClickImport = () => {
        props.onClickImport();
    }

    let importPrompt;
    if (!props.ready) importPrompt = (
        <div className="pointer-events text-secondary h-100 d-flex justify-content-center align-items-center">
            <Button
                variant="primary"
                size="lg"
                onClick={handleClickImport}
            >
                <i className="bi-plus-square"></i>&nbsp;&nbsp;Import Data
            </Button>
        </div>
    );
    return(
        <>

        <div className="views d-flex flex-col">
            <div className="flex-fill d-flex flex-row">
                <div className="flex-fill stack-base">
                    <div className="stack" ref={mainRef}></div>
                    <div className="stack no-pointer-events">{importPrompt}</div>
                </div>
                <div className="v-divider"></div>
                <div className="flex-fill d-flex flex-column">
                    <div className="flex-fill stack-base">
                        <div className="stack"ref={mapRef}></div>
                        <MapTools />
                    </div>
                    <div className="h-divider"></div>
                    <div className="flex-fill">
                        <Plots
                            localHistogram={props.localHistogram}
                            globalHistogram={props.globalHistogram}
                            labelsHistogram={props.labelsHistogram}
                        />
                    </div>
                </div>
            </div>
        </div>
        <Canvas
            mainView={mainView}
            mapView={mapView}
            sdf={props.sdf}
            protein={props.protein}
            volumeSize={props.volumeSize}
            displayProtein={props.displayProtein}
            displaySegmentation={props.displaySegmentation}
            compartmentIndex={props.compartmentIndex}
            ready={props.ready}
            debugSamples={props.debugSamples}
            useLod={props.useLod}
            isovalue={props.isovalue}
        />
        </>
    );
}

export default Views