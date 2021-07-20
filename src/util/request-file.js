function requestFile(url, responseType) {
    return new Promise(function(resolve, reject) {
        var request = new XMLHttpRequest();
        request.open('GET', url);
        request.responseType = responseType;

        request.onload = function() {
            if (request.status === 200) {
                resolve(request.response);
            } else {
                reject(Error('Could not load file "' + url + '": ' + request.statusText));
            }
        };

        request.onerror = function() {
            reject(Error("There was a network error!"));
        };

        request.send();
    });
}
