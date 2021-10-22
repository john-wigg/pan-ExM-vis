import React from 'react'

import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

const Sidebar = props => {

    const handleSelectCompartmet = (index) => {
        props.onCompartmentSelection(index);
    }

    const handleChangeDisplaySegmentation = (e) => {
        props.onDisplaySegmentation(e.target.checked);
    }

    const handleChangeDisplayProtein = (e) => {
        props.onDisplayProtein(e.target.checked);
    }

    const handleChangeDebugSamples = (e) => {
        props.onDebugSamples(e.target.checked);
    }

    const handleChangeUseLod = (e) => {
        props.onUseLod(e.target.checked);
    }

    const handleChangeIsovalue = (e) => {
        props.onIsovalue(e.target.value);
    }

    let dropdownItems = [
    <Dropdown.Item
        onClick={() => handleSelectCompartmet(0)}
    >All Compartments</Dropdown.Item>]
    for (var i = 0; i < props.numCompartments-1; ++i) {
        let index = i;
        dropdownItems.push(
        <Dropdown.Item
            onClick={() => handleSelectCompartmet(index+1)}
        >Compartment {index+1}</Dropdown.Item>);
    }

    let dropdownText = "";
    if (props.numCompartments === 0) dropdownText = "No Compartment Data"
    else if (props.selection === 0) dropdownText = "All Compartments";
    else dropdownText = "Compartment " + props.selection;
    return (
        <Row
            md={3}
            className="justify-content-end"
        >
            <Col>
                <Collapse in={props.open}>
                    <Card>
                        <Card.Body>
                            <Form>
                                <Form.Check className="form-switch">
                                    <Form.Check.Input
                                        checked={props.displayProtein}
                                        disabled={props.numCompartments===0}
                                        onChange={handleChangeDisplayProtein}
                                    />
                                    <Form.Check.Label>Display Protein</Form.Check.Label>
                                </Form.Check>
                                <Form.Check className="form-switch">
                                    <Form.Check.Input
                                        checked={props.displaySegmentation}
                                        disabled={props.numCompartments===0}
                                        onChange={handleChangeDisplaySegmentation}
                                    />
                                    <Form.Check.Label>Display Segmentation</Form.Check.Label>
                                </Form.Check>
                                <Form.Range
                                    disabled={props.numCompartments===0}
                                    onChange={handleChangeIsovalue}
                                />
                                <Dropdown>
                                    <Dropdown.Toggle disabled={props.numCompartments===0}>
                                        {dropdownText}
                                    </Dropdown.Toggle>

                                    <Dropdown.Menu>
                                        {dropdownItems}
                                    </Dropdown.Menu>
                                </Dropdown>
                                Performance Options
                                <Form.Check className="form-switch">
                                    <Form.Check.Input
                                        checked={props.useLod}
                                        onChange={handleChangeUseLod}
                                    />
                                    <Form.Check.Label>Use LoD</Form.Check.Label>
                                </Form.Check>
                                Debug Options
                                <Form.Check className="form-switch">
                                    <Form.Check.Input
                                        checked={props.debugSamples}
                                        onChange={handleChangeDebugSamples}
                                    />
                                    <Form.Check.Label>Display Texture Samples</Form.Check.Label>
                                </Form.Check>
                            </Form>
                        </Card.Body>
                    </Card>
                </Collapse>
            </Col>
        </Row>
    );
}

export default Sidebar;