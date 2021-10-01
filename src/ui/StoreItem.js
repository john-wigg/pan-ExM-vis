import React, { useEffect, useRef, useState } from 'react'

import Button from 'react-bootstrap/Button';
import InputGroup from 'react-bootstrap/InputGroup';
import FormControl from 'react-bootstrap/FormControl';

const MapTools = props => {
    const labelRef = useRef();

    const [edit, setEdit] = useState(false);
    const [editText, setEditText] = useState("");

    useEffect(() => {
        if (labelRef.current && edit) {
            labelRef.current.focus();
            labelRef.current.value = editText;
        }
    }, [edit, editText, labelRef])

    const handleEdit = () => {
        setEditText(props.label);
        setEdit(!edit);
    }

    const handleChange = (e) => {
        props.onLabel(e.target.value);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleEdit();
        }
    }

    let buttonOrForm;
    if (edit === true) {
        buttonOrForm = <FormControl
            style={{marginLeft: "auto"}}
            onKeyPress={handleKeyPress}
            onChange={handleChange}
            onBlur={handleEdit}
            ref={labelRef}
        />
    } else {
        buttonOrForm = <Button
                            style={{marginLeft: "auto"}}
                            onClick={props.onClick}
                        >{props.label}</Button>
    }

    return(
        <InputGroup>
        {buttonOrForm}
        <Button
            onClick={handleEdit}
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