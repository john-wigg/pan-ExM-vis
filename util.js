function toggleFullscreen() {
    const elem = document.getElementById("canvas-container");
    if (!document.fullscreenElement && !document.mozFullScreenElement &&
        !document.webkitFullscreenElement && !document.msFullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
            elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
            elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
        }
        document.getElementById("fullscreen-toggle").getElementsByTagName("i")[0].classList.remove("bi-arrows-fullscreen");
        document.getElementById("fullscreen-toggle").getElementsByTagName("i")[0].classList.add("bi-fullscreen-exit");
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
        document.getElementById("fullscreen-toggle").getElementsByTagName("i")[0].classList.remove("bi-fullscreen-exit");
        document.getElementById("fullscreen-toggle").getElementsByTagName("i")[0].classList.add("bi-arrows-fullscreen");
    }
}