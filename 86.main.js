(()=>{"use strict";var e,r,t={3086:(e,r,t)=>{var o=t(6173);onmessage=function(e){!function(e,r){let t=o.decode(e),n=t[0].t256,a=t[0].t257,i=t[0].t258;var s;t[0].t262,t[0].t277;let c=new(s=8==i?Uint8Array:Uint16Array)(n*a*t.length);try{for(var p=0;p<t.length;++p){if(t[0].t256!=n||t[0].t257!=a)return void postMessage(["error","One or more slices of the TIFF file have an incorrect format!"]);o.decodeImage(e,t[p]);let r=t[p].data;c.set(new s(r.buffer,0,r.byteLength/s.BYTES_PER_ELEMENT),n*a*p);let i=(p+1)/t.length*100;postMessage(["progress",i])}}catch(e){return void postMessage(["error",e])}postMessage(["pixelData",c.buffer,n,a,t.length],[c.buffer])}(e.data[0],e.data[1])}}},o={};function n(e){var r=o[e];if(void 0!==r)return r.exports;var a=o[e]={exports:{}};return t[e](a,a.exports,n),a.exports}n.m=t,n.x=()=>{var e=n.O(void 0,[173],(()=>n(3086)));return n.O(e)},e=[],n.O=(r,t,o,a)=>{if(!t){var i=1/0;for(f=0;f<e.length;f++){for(var[t,o,a]=e[f],s=!0,c=0;c<t.length;c++)(!1&a||i>=a)&&Object.keys(n.O).every((e=>n.O[e](t[c])))?t.splice(c--,1):(s=!1,a<i&&(i=a));if(s){e.splice(f--,1);var p=o();void 0!==p&&(r=p)}}return r}a=a||0;for(var f=e.length;f>0&&e[f-1][2]>a;f--)e[f]=e[f-1];e[f]=[t,o,a]},n.n=e=>{var r=e&&e.__esModule?()=>e.default:()=>e;return n.d(r,{a:r}),r},n.d=(e,r)=>{for(var t in r)n.o(r,t)&&!n.o(e,t)&&Object.defineProperty(e,t,{enumerable:!0,get:r[t]})},n.f={},n.e=e=>Promise.all(Object.keys(n.f).reduce(((r,t)=>(n.f[t](e,r),r)),[])),n.u=e=>e+".main.js",n.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(e){if("object"==typeof window)return window}}(),n.o=(e,r)=>Object.prototype.hasOwnProperty.call(e,r),(()=>{var e;n.g.importScripts&&(e=n.g.location+"");var r=n.g.document;if(!e&&r&&(r.currentScript&&(e=r.currentScript.src),!e)){var t=r.getElementsByTagName("script");t.length&&(e=t[t.length-1].src)}if(!e)throw new Error("Automatic publicPath is not supported in this browser");e=e.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),n.p=e})(),(()=>{var e={86:1};n.f.i=(r,t)=>{e[r]||importScripts(n.p+n.u(r))};var r=self.webpackChunkPanVisionVis=self.webpackChunkPanVisionVis||[],t=r.push.bind(r);r.push=r=>{var[o,a,i]=r;for(var s in a)n.o(a,s)&&(n.m[s]=a[s]);for(i&&i(n);o.length;)e[o.pop()]=1;t(r)}})(),r=n.x,n.x=()=>n.e(173).then(r),n.x()})();