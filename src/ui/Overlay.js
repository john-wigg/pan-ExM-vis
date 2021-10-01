const Overlay = (props) => {
    return <div className="overlay fill-screen d-grid gap-3">
        {props.children}
    </div>
}

export default Overlay