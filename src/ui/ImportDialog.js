import React, {Component} from 'react'

import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import InputVector from './InputVector'

class ImportDialog extends Component {
  constructor(props) {
		super(props);

    this.state = {
      fileProtein: "",
      fileSegmentation: "",
      voxelSize: {x: "", y: "", z: ""},
      working: false
    }

    this.handleClickImport = this.handleClickImport.bind(this);

    this.handleChangeFileProtein = this.handleChangeFileProtein.bind(this);
    this.handleChangeFileSegmentation = this.handleChangeFileSegmentation.bind(this);
    this.handleChangeVoxelSize = this.handleChangeVoxelSize.bind(this);
    this.handleClose = this.handleClose.bind(this);
	}

  handleChangeFileProtein(e) {
    this.setState({
      fileProtein: e.target.files[0]
    })
  }

  handleChangeFileSegmentation(e) {
    this.setState({
      fileSegmentation: e.target.files[0]
    })
  }

  handleChangeVoxelSize(value) {
    this.setState({
      voxelSize: value
    })
  }

  async handleClickImport(e) {
    this.setState({
      working: true
    })

    this.props.onImport(this.state.fileProtein, this.state.fileSegmentation, this.state.voxelSize);

    this.setState({
      working: false
    })
  }

  handleClose(e) {
    this.props.onClose();
  }

  render() {
    let formValid;
    if (this.state.fileProtein
        && this.state.fileSegmentation
        && this.state.voxelSize.x
        && this.state.voxelSize.y
        && this.state.voxelSize.z
        && !this.state.working) formValid = true;
    else formValid = false;

    let alert;
    if (this.props.error) {
      alert = <Alert variant="danger">{this.props.error}</Alert>
    }

    return (
        <Modal show={this.props.show} onHide={this.handleClose}>
          <Modal.Header closeButton>
            <Modal.Title>Import Data</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form>
                <Form.Group className="mb-3">
                    <Form.Label>Protein Data</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={this.handleChangeFileProtein}
                    />
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Segmentation Data</Form.Label>
                    <Form.Control
                      type="file"
                      onChange={this.handleChangeFileSegmentation}
                    />
                </Form.Group>
                <InputVector
                  value={this.state.voxelSize}
                  onChange={this.handleChangeVoxelSize}
                />
            </Form>
            {alert}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="primary"
              disabled={!formValid}
              onClick={this.handleClickImport}
            >
              Import
            </Button>
          </Modal.Footer>
        </Modal>
    )
  }
}

export default ImportDialog