import React, {Component} from 'react'

import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';

class InputVector extends Component {
	constructor(props) {
		super(props);
		
        this.handleChangeX = this.handleChangeX.bind(this);
        this.handleChangeY = this.handleChangeY.bind(this);
        this.handleChangeZ = this.handleChangeZ.bind(this);
	}

    handleChangeX(e) {
        this.props.onChange({
            x: e.target.value,
            y: this.props.value.y,
            z: this.props.value.z
        });
    }

    handleChangeY(e) {
        this.props.onChange({
            x: this.props.value.x,
            y: e.target.value,
            z: this.props.value.z
        });
    }

    handleChangeZ(e) {
        this.props.onChange({
            x: this.props.value.x,
            y: this.props.value.y,
            z: e.target.value,
        });
    }

    render() {
        return (
            <InputGroup className="mb-3">
                <InputGroup.Text>Voxel Size</InputGroup.Text>
                <Form.Control
                    type="number"
                    placeholder="x"
                    value={this.props.value.x}
                    onChange={this.handleChangeX}
                />
                <Form.Control
                    type="number"
                    placeholder="y"
                    value={this.props.value.y}
                    onChange={this.handleChangeY}
                />
                <Form.Control
                    type="number"
                    placeholder="z"
                    value={this.props.value.z}
                    onChange={this.handleChangeZ}
                />
            </InputGroup>
        )
    }
}

export default InputVector