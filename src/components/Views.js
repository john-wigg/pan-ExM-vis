import React, { useRef, useEffect } from 'react'

import Plots from './Plots'
import MapTools from './MapTools'

const Views = props => {
    const mainRef = useRef(null);
    const mapRef = useRef(null);

    const onMainView = props.onMainView;
    const onMapView = props.onMapView;

    useEffect(() => {
        onMainView(mainRef.current);
        onMapView(mapRef.current);
    }, [onMainView, onMapView]);

    return(
        <>
        <div className="views d-flex flex-col">
            <div className="flex-fill d-flex flex-row">
                <div className="flex-fill stack-base">
                    <div className="stack" ref={mapRef}></div>
                    <MapTools />
                </div>
                <div className="v-divider"></div>
                <div className="flex-fill d-flex flex-column">
                    <div className="flex-fill stack-base">
                        <div className="stack"ref={mainRef}></div>
                    </div>
                    <div className="h-divider"></div>
                    <div className="flex-fill stack-base">
                        <Plots
                            heataxes={props.heataxes}
                            heatmap={props.heatmap}
                            heatarea={props.heatarea}
                            localHeatmap={props.localHeatmap}
                            localHeatarea={props.localHeatarea}
                        />
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default Views