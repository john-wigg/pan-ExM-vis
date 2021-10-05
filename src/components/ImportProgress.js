import React, {Component} from 'react'

import Modal from 'react-bootstrap/Modal';

import LabeledProgressBar from './LabeledProgressBar';

class ImportProgress extends Component {
	componentDidMount() {

	}
  
	componentWillUnmount() {
	}

	render() {
		return (
			<Modal backdrop="static" show={this.props.show}>
			<Modal.Header>
				<Modal.Title>Importing Data...</Modal.Title>
			</Modal.Header>
			<Modal.Body>
				<div className="d-grid gap-3">
					<LabeledProgressBar 
						progress={this.props.proteinProgress}
						error={this.props.proteinError}
						label="Decode Protein TIFF..."
					/>
					<LabeledProgressBar 
						progress={this.props.segmentationProgress}
						error={this.props.segmentationError}
						label="Decode Segmentation TIFF..."
					/>
					<LabeledProgressBar 
						progress={this.props.sdfProgress}
						error={this.props.sdfError}
						label="Compute Distance Fields..."
					/>
					<LabeledProgressBar 
						progress={this.props.curvProgress}
						error={this.props.curvError}
						label="Compute Mean Curvature..."
					/>
				</div>
			</Modal.Body>
			</Modal>
		)
	}
}

export default ImportProgress