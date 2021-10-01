import React, { useState, useEffect } from 'react'

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';

import StoreItem from './StoreItem';

import * as Renderer from '../renderers/renderer.js'
import localforage from 'localforage';

import * as UPNG from 'upng-js';

import { v4 as uuid } from 'uuid';

const dbName = 'selectionStore';

// Create table 2 in databaseName
var storeData = localforage.createInstance({
    name        : dbName,
    storeName   : 'storeData',
    description : '...'
});

const MapTools = props => {

    const [penSize, setPenSize] = useState(20);
    const [penMode, setPenMode] = useState("draw");
    const [uuids, setUuids] = useState([]);

    useEffect(() => {
        reloadStore();
    }, []);

    const handleDelete = () => {
        Renderer.deleteSelection();
    };

    const handlePenMode = (mode) => {
        setPenMode(mode);
        Renderer.setPenMode(mode);
    }

    const handlePenSize = (pt) => {
        setPenSize(pt);
        Renderer.setPenSize(pt);
    };

    const reloadStore = () => {
        let list = {};
        storeData.iterate(function(value, key, iterationNumber) {
            console.log(key)
            list[key] = value.name;
        }).then(() => {setUuids(list)})
    }

    const handleLoad = (uuid) => {
        storeData.getItem(uuid).then((value) => {
            Renderer.setMapSelectionPixels(value.data, value.width, value.height);
        })
    }

    const handleDeleteStore = (uuid) => {
        storeData.removeItem(uuid).then(reloadStore);
    }

    const handleSave = () => {
        const selectionPixels = Renderer.getMapSelectionPixels();
        storeData.setItem(uuid(), {name: "New Selection", 
                                   width: selectionPixels.width,
                                   height: selectionPixels.height,
                                   data: selectionPixels.buffer}).then(reloadStore);
    }

    const handleImport = () => {
        let input = document.createElement('input');
        input.type = 'file';

        input.onchange = e => { 
            var file = e.target.files[0]; 
            new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.readAsArrayBuffer(file)
            
                reader.onload = readerEvent => {
                    resolve([readerEvent.target.result, file.name.replace('.png','')]);
                }
        
                reader.onerror = _readerEvent => {
                    reject(reader.error);
                }
        
                reader.onabort = _readerEvent => {
                    reject("FileReader was aborted!");
                }
            }).then(([buffer, filename]) => {
                let img = UPNG.decode(buffer);
                let pixels = new Uint8Array(UPNG.toRGBA8(img)[0]);
                storeData.setItem(uuid(), {name: filename, 
                    width: img.width,
                    height: img.height,
                    data: pixels}).then(reloadStore);
            })
        }

        input.click();
    }

    const handleLabelStore = (uuid, label) => {
        storeData.getItem(uuid).then((item) => {
            item.name = label;
            storeData.setItem(uuid, item).then(reloadStore);
        })
    }

    const handleExportStore = (uuid) => {
        storeData.getItem(uuid).then((item) => {
            console.log(item.data);
            let png = UPNG.encode([item.data.buffer], item.width, item.height, 0)
            let blob = new Blob([png], {type: "image/png"});
            let url = URL.createObjectURL(blob); 
            let fileLink = document.createElement('a');
            fileLink.href = url;
            fileLink.download = item.name;
            fileLink.click();
        })
    }
    
    let storeList = []
    for (const [key, value] of Object.entries(uuids)) {
        storeList.push(
            <StoreItem
                label={value}
                onClick={() => handleLoad(key)}
                onDelete={()=> handleDeleteStore(key)}
                onLabel={(label) => handleLabelStore(key, label)}
                onExport={() => handleExportStore(key)}
            />
        )
    }

    return(
        <div className="stack no-pointer-events" style={{position: "relative"}}>
            <div className="overlay d-flex flex-column-reverse pointer-events" style={{overflowY: "overlay", height: "80%", right: 0, bottom: 0}}>
                <div className="align-self-end d-grid gap-2">
                {storeList}
                </div>
            </div>
            <div  className="overlay">
            <ButtonToolbar style={{flexDirection: "column", width: "20pt"}}>
            <ButtonGroup vertical>
                <Button
                    onClick={handleDelete}
                ><i className="bi-trash-fill"></i></Button>
            </ButtonGroup>
            <br />
            <ButtonGroup vertical>
                <Button
                    disabled={penMode==="draw"}
                    onClick={() => {handlePenMode("draw")}}
                ><i className="bi-pencil-fill"></i></Button>
                <Button
                    disabled={penMode==="erase"}
                    onClick={() => {handlePenMode("erase")}}
                ><i className="bi-eraser-fill"></i></Button>
            </ButtonGroup>
            <br />
            <ButtonGroup vertical>
                <Button
                    disabled={penSize===40}
                    onClick={() => {handlePenSize(40)}}
                ><i style={{"fontSize": "8pt"}} className="bi-circle-fill"></i></Button>
                <Button
                    disabled={penSize===20}
                    onClick={() => {handlePenSize(20)}}
                ><i style={{"fontSize": "6pt"}} className="bi-circle-fill"></i></Button>
                <Button
                    disabled={penSize===10}
                    onClick={() => {handlePenSize(10)}}
                ><i style={{"fontSize": "4pt"}} className="bi-circle-fill"></i></Button>
            </ButtonGroup>
            <br />
            <ButtonGroup vertical>
                    <Button
                        onClick={handleSave}
                    ><i className="fas fa-save"></i></Button>
                    <Button
                        onClick={handleImport}
                    ><i className="bi-upload"></i></Button>
            </ButtonGroup>
            </ButtonToolbar>
            </div>
        </div>
    );
}

export default MapTools