import React, { useEffect, useRef, useState } from 'react'

import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const MapTools = props => {
    const labelRef = useRef();

    const [edit, setEdit] = useState(false);
    const [editText, setEditText] = useState("");
    const [blockBlur, setBlockBlur] = useState(false); // Block onBlur when mouse is over the label button.

    useEffect(() => {
        if (labelRef.current && edit) {
            labelRef.current.focus();
            labelRef.current.value = editText;
        }
    }, [edit, editText, labelRef])

    const handleBlur = () => {
        if (!blockBlur) {
            handleEdit(false);
        }
    }

    const handleClickEdit = () => {
        handleEdit(!edit);
    }

    const handleEdit = (doEdit) => {;
        setEdit(doEdit);
        setEditText(props.label);
    }

    const handleChange = (e) => {
        props.onLabel(e.target.value);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEdit(false);
        }
    }

    let buttonOrForm;
    if (edit === true) {
        buttonOrForm = <FormControl
            style={{marginLeft: "auto"}}
            onKeyPress={handleKeyPress}
            onChange={handleChange}
            onBlur={handleBlur}
            ref={labelRef}
        />
    } else {
        buttonOrForm = <Button
                            style={{marginLeft: "auto"}}
                            onClick={props.onClick}
                        >{props.label}</Button>
    }

    return(
        <InputGroup
            className="pointer-events"
        >
        {buttonOrForm}
        <Button
            onClick={handleClickEdit}
            onMouseEnter={() => setBlockBlur(true)} // This is needed to re-enable the button
            onMouseLeave={() => setBlockBlur(false)}
        ><i className="bi-tag-fill"></i></Button>
        <Button
            onClick={props.onExport}
        ><i className="bi-download"></i></Button>
        <Button
            onClick={props.onDelete}
        ><i className="bi-trash-fill"></i></Button>
        </InputGroup>
    );
}

export default MapTools