import React, { Component } from 'react'

import Col from 'react-bootstrap/Col';
import Collapse from 'react-bootstrap/Collapse';
import Card from 'react-bootstrap/Card';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';

class Sidebar extends Component {
    constructor(props) {
		super(props);

		this.handleSelectCompartmet = this.handleSelectCompartmet.bind(this);
        this.handleChangeDisplaySegmentation = this.handleChangeDisplaySegmentation.bind(this);
        this.handleChangeDisplayProtein = this.handleChangeDisplayProtein.bind(this);
	}

    handleSelectCompartmet(index) {
        this.props.onCompartmentSelection(index);
    }

    handleChangeDisplaySegmentation(e) {
        this.props.onDisplaySegmentation(e.target.checked);
    }

    handleChangeDisplayProtein(e) {
        this.props.onDisplayProtein(e.target.checked);
    }

	render() {
        let dropdownItems = [
        <Dropdown.Item
            onClick={() => this.handleSelectCompartmet(0)}
        >All Compartments</Dropdown.Item>]
        for (var i = 0; i < this.props.numCompartments-1; ++i) {
            let index = i;
            dropdownItems.push(
            <Dropdown.Item
                onClick={() => this.handleSelectCompartmet(index+1)}
            >Compartment {index+1}</Dropdown.Item>);
        }

        let dropdownText = "";
        if (this.props.numCompartments === 0) dropdownText = "No Compartment Data"
        else if (this.props.selection === 0) dropdownText = "All Compartments";
        else dropdownText = "Compartment " + this.props.selection;
		return (
            <Row md={3}>
                <Col>
                    <Collapse in={this.props.open}>
                        <Card>
                            <Card.Body>
                                <Form>
                                    <Form.Check className="form-switch">
                                        <Form.Check.Input
                                            checked={this.props.displayProtein}
                                            disabled={this.props.numCompartments===0}
                                            onChange={this.handleChangeDisplayProtein}
                                        />
                                        <Form.Check.Label>Display Protein</Form.Check.Label>
                                    </Form.Check>
                                    <Form.Check className="form-switch">
                                        <Form.Check.Input
                                            checked={this.props.displaySegmentation}
                                            disabled={this.props.numCompartments===0}
                                            onChange={this.handleChangeDisplaySegmentation}
                                        />
                                        <Form.Check.Label>Display Segmentation</Form.Check.Label>
                                    </Form.Check>
                                    <Form.Range
                                        disabled={this.props.numCompartments===0}
                                        
                                    />
                                    <Dropdown>
                                        <Dropdown.Toggle disabled={this.props.numCompartments===0}>
                                            {dropdownText}
                                        </Dropdown.Toggle>

                                        <Dropdown.Menu>
                                            {dropdownItems}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Collapse>
                </Col>
            </Row>
		)
	}
}

export default Sidebar;