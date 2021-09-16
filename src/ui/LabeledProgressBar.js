import React, {Component} from 'react';

import "../App.css";

import Alert from 'react-bootstrap/Alert';
import ProgressBar from 'react-bootstrap/ProgressBar';

class LabeledProgressBar extends Component {
	render() {
		let variant = ""
		if (this.props.progress >= 100) variant = "success";
		if (this.props.error) variant = "danger";

		let animated = (this.props.progress < 100 && !this.props.error);

		let alert;
		if (this.props.error) {
			alert = <Alert variant="danger">{this.props.error}</Alert>;
		}

		return (
			<div className="labeled-progress-bar">
				<ProgressBar>
					<div className="label-front" style={{clipPath: `inset(0 ${100-this.props.progress}% 0 0)`}}>{this.props.label}</div>
					<div className="label-back">{this.props.label}</div>
					<ProgressBar striped variant={variant} animated={animated} now={this.props.progress} />
				</ProgressBar>
				{alert}
			</div>
		)
	}
}

export default LabeledProgressBar;