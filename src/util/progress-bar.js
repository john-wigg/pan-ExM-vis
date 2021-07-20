class LabeledProgressBar {
    constructor(element, label) {
        this.alert = document.createElement('div');

        this.element = element;
        element.innerHTML = `
        <div class="progress">
        <div class="progress-label-front">
        ` + label + `
        </div>
        <div class="progress-label-back">
        ` + label + `
        </div>
        <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
        </div>
        `
        this.progress = 0.0;

        this.observer = new ResizeObserver(_entries => { this.setLabel(); })
        this.observer.observe(element.getElementsByClassName("progress-bar")[0]);
    }

    setProgress(progress) {
        let bar = this.element.getElementsByClassName("progress-bar")[0]

        if (this.progress < 100.0 && progress >= 100.0) {
            bar.classList.remove("progress-bar-animated");
            bar.classList.add("bg-success");
        } else if (this.progress >= 100.0 && progress < 100.0) {
            bar.classList.add("progress-bar-animated");
            bar.classList.remove("bg-success");
        }
        this.progress = progress;
        bar.setAttribute("aria-valuenow", Math.floor(progress));
        bar.setAttribute('style','width:'+Number(progress)+'%');
    }

    setError(msg) {
        let bar = this.element.getElementsByClassName("progress-bar")[0]
        bar.classList.remove("progress-bar-animated");
        bar.classList.add("bg-danger");
        bar.setAttribute('style','width:100%');
        this.alert.innerHTML =`
        <div class="alert alert-danger" role="alert">
        ` + msg + `
        </div>
        `
        this.element.appendChild(this.alert);
    }

    unsetError() {
        let bar = this.element.getElementsByClassName("progress-bar")[0]
        bar.classList.add("progress-bar-animated");
        bar.classList.remove("bg-danger");
        bar.setAttribute('style','width:0%');
    }

    setLabel() {
        let label = this.element.getElementsByClassName("progress-label-front")[0]
        let bar = this.element.getElementsByClassName("progress-bar")[0]
        label.style.clipPath = "inset(0 " + (label.offsetWidth  - bar.offsetWidth) + "px 0 0)";
    }
}