function requestFile(url, responseType) {
	// Create new promise with the Promise() constructor;
	// This has as its argument a function
	// with two parameters, resolve and reject
	return new Promise(function(resolve, reject) {
		// Standard XHR to load text
		var request = new XMLHttpRequest();
		request.open('GET', url);
		request.responseType = responseType;
		// When the request loads, check whether it was successful
		request.onload = function() {
			if (request.status === 200) {
			// If successful, resolve the promise by passing back the request response
				resolve(request.response);
			} else {
			// If it fails, reject the promise with a error message
				reject(Error('Could not load file "' + url + '": ' + request.statusText));
			}
		};
		request.onerror = function() {
		// Also deal with the case when the entire request fails to begin with
		// This is probably a network error, so reject the promise with an appropriate message
				reject(Error('There was a network error.'));
		};
		// Send the request
		request.send();
	});
}

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