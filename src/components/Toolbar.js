import React, { Component } from 'react'

import Button from 'react-bootstrap/Button';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ButtonToolbar from 'react-bootstrap/ButtonToolbar';

class Toolbar extends Component {
	render() {
		let fullscreenIcon;
		if (this.props.fullscreen) fullscreenIcon = "bi-fullscreen-exit";
		else fullscreenIcon = "bi-arrows-fullscreen";
		return (
			<ButtonToolbar className="justify-content-between">
			<ButtonGroup>
				<Button
					onClick={this.props.onToggleSidebar}
				><i className="bi-tools"></i></Button>
				<Button
					onClick={this.props.onImportData}
				>Import Data</Button>
			</ButtonGroup>
			<ButtonGroup>
				<Button
					onClick={this.props.onToggleFullscreen}
				><i className={fullscreenIcon}></i></Button>
			</ButtonGroup>
			</ButtonToolbar>
		)
	}
}

export default Toolbar