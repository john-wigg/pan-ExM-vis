if(!self.define){const i=i=>{"require"!==i&&(i+=".js");let r=Promise.resolve();return s[i]||(r=new Promise(async r=>{if("document"in self){const s=document.createElement("script");s.src=i,document.head.appendChild(s),s.onload=r}else importScripts(i),r()})),r.then(()=>{if(!s[i])throw new Error(`Module ${i} didn’t register its module`);return s[i]})},r=(r,s)=>{Promise.all(r.map(i)).then(i=>s(1===i.length?i[0]:i))},s={require:Promise.resolve(r)};self.define=(r,e,l)=>{s[r]||(s[r]=Promise.resolve().then(()=>{let s={};const a={uri:location.origin+r.slice(1)};return Promise.all(e.map(r=>{switch(r){case"exports":return s;case"module":return a;default:return i(r)}})).then(i=>{const r=l(...i);return s.default||(s.default=r),s})}))}}define("./service-worker.js",["./workbox-d9851aed"],(function(i){"use strict";i.skipWaiting(),i.clientsClaim(),i.precacheAndRoute([{url:"./index.html",revision:"0a1e132525e4d98c1d7051c17f5b7f54"},{url:"./static/css/2.ad974a9d.chunk.css",revision:null},{url:"./static/css/main.992b0185.chunk.css",revision:null},{url:"./static/js/2.3a18a88c.chunk.js",revision:null},{url:"./static/js/3.4708ed17.chunk.js",revision:null},{url:"./static/js/curv-worker.e7456c99.chunk.worker.js",revision:null},{url:"./static/js/local-heatmap-worker.03975bfe.chunk.worker.js",revision:null},{url:"./static/js/main.f5c8c8d5.chunk.js",revision:null},{url:"./static/js/runtime-main.222ccba8.js",revision:null},{url:"./static/js/sdf-worker.09bb8ea9.chunk.worker.js",revision:null},{url:"./static/js/tiff-worker.a6adfe81.chunk.worker.js",revision:null},{url:"./static/media/bootstrap-icons.94eeade1.woff",revision:null},{url:"./static/media/bootstrap-icons.dfd0ea12.woff2",revision:null},{url:"./static/media/fa-brands-400.2285773e.woff",revision:null},{url:"./static/media/fa-brands-400.23f19bb0.eot",revision:null},{url:"./static/media/fa-brands-400.2f517e09.svg",revision:null},{url:"./static/media/fa-brands-400.527940b1.ttf",revision:null},{url:"./static/media/fa-brands-400.d878b0a6.woff2",revision:null},{url:"./static/media/fa-regular-400.4689f52c.svg",revision:null},{url:"./static/media/fa-regular-400.491974d1.ttf",revision:null},{url:"./static/media/fa-regular-400.77206a6b.eot",revision:null},{url:"./static/media/fa-regular-400.7a333762.woff2",revision:null},{url:"./static/media/fa-regular-400.bb58e57c.woff",revision:null},{url:"./static/media/fa-solid-900.1551f4f6.woff2",revision:null},{url:"./static/media/fa-solid-900.7a8b4f13.svg",revision:null},{url:"./static/media/fa-solid-900.9bbb245e.eot",revision:null},{url:"./static/media/fa-solid-900.be9ee23c.ttf",revision:null},{url:"./static/media/fa-solid-900.eeccf4f6.woff",revision:null},{url:"./static/wasm/curv.610939d7.wasm",revision:null},{url:"./static/wasm/local_heatmap.bc2a0eb7.wasm",revision:null},{url:"./static/wasm/sdf.7b452668.wasm",revision:null}],{})}));
//# sourceMappingURL=service-worker.js.map
