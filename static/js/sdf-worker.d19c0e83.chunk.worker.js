!function(r){var t={};function n(e){if(t[e])return t[e].exports;var o=t[e]={i:e,l:!1,exports:{}};return r[e].call(o.exports,o,o.exports,n),o.l=!0,o.exports}n.m=r,n.c=t,n.d=function(r,t,e){n.o(r,t)||Object.defineProperty(r,t,{enumerable:!0,get:e})},n.r=function(r){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(r,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(r,"__esModule",{value:!0})},n.t=function(r,t){if(1&t&&(r=n(r)),8&t)return r;if(4&t&&"object"===typeof r&&r&&r.__esModule)return r;var e=Object.create(null);if(n.r(e),Object.defineProperty(e,"default",{enumerable:!0,value:r}),2&t&&"string"!=typeof r)for(var o in r)n.d(e,o,function(t){return r[t]}.bind(null,o));return e},n.n=function(r){var t=r&&r.__esModule?function(){return r.default}:function(){return r};return n.d(t,"a",t),t},n.o=function(r,t){return Object.prototype.hasOwnProperty.call(r,t)},n.p="./",n(n.s=6)}([function(r,t,n){(function(r){function n(r,t){for(var n=0,e=r.length-1;e>=0;e--){var o=r[e];"."===o?r.splice(e,1):".."===o?(r.splice(e,1),n++):n&&(r.splice(e,1),n--)}if(t)for(;n--;n)r.unshift("..");return r}function e(r,t){if(r.filter)return r.filter(t);for(var n=[],e=0;e<r.length;e++)t(r[e],e,r)&&n.push(r[e]);return n}t.resolve=function(){for(var t="",o=!1,i=arguments.length-1;i>=-1&&!o;i--){var a=i>=0?arguments[i]:r.cwd();if("string"!==typeof a)throw new TypeError("Arguments to path.resolve must be strings");a&&(t=a+"/"+t,o="/"===a.charAt(0))}return(o?"/":"")+(t=n(e(t.split("/"),(function(r){return!!r})),!o).join("/"))||"."},t.normalize=function(r){var i=t.isAbsolute(r),a="/"===o(r,-1);return(r=n(e(r.split("/"),(function(r){return!!r})),!i).join("/"))||i||(r="."),r&&a&&(r+="/"),(i?"/":"")+r},t.isAbsolute=function(r){return"/"===r.charAt(0)},t.join=function(){var r=Array.prototype.slice.call(arguments,0);return t.normalize(e(r,(function(r,t){if("string"!==typeof r)throw new TypeError("Arguments to path.join must be strings");return r})).join("/"))},t.relative=function(r,n){function e(r){for(var t=0;t<r.length&&""===r[t];t++);for(var n=r.length-1;n>=0&&""===r[n];n--);return t>n?[]:r.slice(t,n-t+1)}r=t.resolve(r).substr(1),n=t.resolve(n).substr(1);for(var o=e(r.split("/")),i=e(n.split("/")),a=Math.min(o.length,i.length),u=a,c=0;c<a;c++)if(o[c]!==i[c]){u=c;break}var f=[];for(c=u;c<o.length;c++)f.push("..");return(f=f.concat(i.slice(u))).join("/")},t.sep="/",t.delimiter=":",t.dirname=function(r){if("string"!==typeof r&&(r+=""),0===r.length)return".";for(var t=r.charCodeAt(0),n=47===t,e=-1,o=!0,i=r.length-1;i>=1;--i)if(47===(t=r.charCodeAt(i))){if(!o){e=i;break}}else o=!1;return-1===e?n?"/":".":n&&1===e?"/":r.slice(0,e)},t.basename=function(r,t){var n=function(r){"string"!==typeof r&&(r+="");var t,n=0,e=-1,o=!0;for(t=r.length-1;t>=0;--t)if(47===r.charCodeAt(t)){if(!o){n=t+1;break}}else-1===e&&(o=!1,e=t+1);return-1===e?"":r.slice(n,e)}(r);return t&&n.substr(-1*t.length)===t&&(n=n.substr(0,n.length-t.length)),n},t.extname=function(r){"string"!==typeof r&&(r+="");for(var t=-1,n=0,e=-1,o=!0,i=0,a=r.length-1;a>=0;--a){var u=r.charCodeAt(a);if(47!==u)-1===e&&(o=!1,e=a+1),46===u?-1===t?t=a:1!==i&&(i=1):-1!==t&&(i=-1);else if(!o){n=a+1;break}}return-1===t||-1===e||0===i||1===i&&t===e-1&&t===n+1?"":r.slice(t,e)};var o="b"==="ab".substr(-1)?function(r,t,n){return r.substr(t,n)}:function(r,t,n){return t<0&&(t=r.length+t),r.substr(t,n)}}).call(this,n(2))},function(r,t,n){r.exports=n(5)},function(r,t){var n,e,o=r.exports={};function i(){throw new Error("setTimeout has not been defined")}function a(){throw new Error("clearTimeout has not been defined")}function u(r){if(n===setTimeout)return setTimeout(r,0);if((n===i||!n)&&setTimeout)return n=setTimeout,setTimeout(r,0);try{return n(r,0)}catch(t){try{return n.call(null,r,0)}catch(t){return n.call(this,r,0)}}}!function(){try{n="function"===typeof setTimeout?setTimeout:i}catch(r){n=i}try{e="function"===typeof clearTimeout?clearTimeout:a}catch(r){e=a}}();var c,f=[],s=!1,l=-1;function p(){s&&c&&(s=!1,c.length?f=c.concat(f):l=-1,f.length&&h())}function h(){if(!s){var r=u(p);s=!0;for(var t=f.length;t;){for(c=f,f=[];++l<t;)c&&c[l].run();l=-1,t=f.length}c=null,s=!1,function(r){if(e===clearTimeout)return clearTimeout(r);if((e===a||!e)&&clearTimeout)return e=clearTimeout,clearTimeout(r);try{e(r)}catch(t){try{return e.call(null,r)}catch(t){return e.call(this,r)}}}(r)}}function v(r,t){this.fun=r,this.array=t}function d(){}o.nextTick=function(r){var t=new Array(arguments.length-1);if(arguments.length>1)for(var n=1;n<arguments.length;n++)t[n-1]=arguments[n];f.push(new v(r,t)),1!==f.length||s||u(h)},v.prototype.run=function(){this.fun.apply(null,this.array)},o.title="browser",o.browser=!0,o.env={},o.argv=[],o.version="",o.versions={},o.on=d,o.addListener=d,o.once=d,o.off=d,o.removeListener=d,o.removeAllListeners=d,o.emit=d,o.prependListener=d,o.prependOnceListener=d,o.listeners=function(r){return[]},o.binding=function(r){throw new Error("process.binding is not supported")},o.cwd=function(){return"/"},o.chdir=function(r){throw new Error("process.chdir is not supported")},o.umask=function(){return 0}},function(r,t){},function(r,t,n){(function(t,e,o){var i=function(){var r="undefined"!==typeof document&&document.currentScript?document.currentScript.src:void 0;return r=r||t,function(t){var i,a,u="undefined"!==typeof(t=t||{})?t:{};u.ready=new Promise((function(r,t){i=r,a=t}));var c,f={};for(c in u)u.hasOwnProperty(c)&&(f[c]=u[c]);var s,l,p,h,v,d=[],y="object"===typeof window,m="function"===typeof importScripts,g="object"===typeof e&&"object"===typeof e.versions&&"string"===typeof e.versions.node,w="";g?(w=m?n(0).dirname(w)+"/":o+"/",s=function(r,t){return h||(h=n(3)),v||(v=n(0)),r=v.normalize(r),h.readFileSync(r,t?null:"utf8")},p=function(r){var t,n=s(r,!0);return n.buffer||(n=new Uint8Array(n)),n.buffer||Z("Assertion failed: "+t),n},l=function(r,t,e){h||(h=n(3)),v||(v=n(0)),r=v.normalize(r),h.readFile(r,(function(r,n){r?e(r):t(n.buffer)}))},e.argv.length>1&&e.argv[1].replace(/\\/g,"/"),d=e.argv.slice(2),e.on("uncaughtException",(function(r){if(!(r instanceof Yr))throw r})),e.on("unhandledRejection",Z),function(r,t){if(E)throw e.exitCode=r,t;e.exit(r)},u.inspect=function(){return"[Emscripten Module object]"}):(y||m)&&(m?w=self.location.href:"undefined"!==typeof document&&document.currentScript&&(w=document.currentScript.src),r&&(w=r),w=0!==w.indexOf("blob:")?w.substr(0,w.lastIndexOf("/")+1):"",s=function(r){var t=new XMLHttpRequest;return t.open("GET",r,!1),t.send(null),t.responseText},m&&(p=function(r){var t=new XMLHttpRequest;return t.open("GET",r,!1),t.responseType="arraybuffer",t.send(null),new Uint8Array(t.response)}),l=function(r,t,n){var e=new XMLHttpRequest;e.open("GET",r,!0),e.responseType="arraybuffer",e.onload=function(){200==e.status||0==e.status&&e.response?t(e.response):n()},e.onerror=n,e.send(null)});u.print||console.log.bind(console);var b,T=u.printErr||console.warn.bind(console);for(c in f)f.hasOwnProperty(c)&&(u[c]=f[c]);f=null,u.arguments&&(d=u.arguments),u.thisProgram&&u.thisProgram,u.quit&&u.quit,u.wasmBinary&&(b=u.wasmBinary);var A,E=u.noExitRuntime||!0;"object"!==typeof WebAssembly&&Z("no native wasm support detected");var _=!1;var P="undefined"!==typeof TextDecoder?new TextDecoder("utf8"):void 0;function S(r,t){return r?function(r,t,n){for(var e=t+n,o=t;r[o]&&!(o>=e);)++o;if(o-t>16&&r.subarray&&P)return P.decode(r.subarray(t,o));for(var i="";t<o;){var a=r[t++];if(128&a){var u=63&r[t++];if(192!=(224&a)){var c=63&r[t++];if((a=224==(240&a)?(15&a)<<12|u<<6|c:(7&a)<<18|u<<12|c<<6|63&r[t++])<65536)i+=String.fromCharCode(a);else{var f=a-65536;i+=String.fromCharCode(55296|f>>10,56320|1023&f)}}else i+=String.fromCharCode((31&a)<<6|u)}else i+=String.fromCharCode(a)}return i}(k,r,t):""}var x,C,k,j,O,L,R,F,W,I="undefined"!==typeof TextDecoder?new TextDecoder("utf-16le"):void 0;function M(r,t){for(var n=r,e=n>>1,o=e+t/2;!(e>=o)&&O[e];)++e;if((n=e<<1)-r>32&&I)return I.decode(k.subarray(r,n));for(var i="",a=0;!(a>=t/2);++a){var u=j[r+2*a>>1];if(0==u)break;i+=String.fromCharCode(u)}return i}function U(r,t,n){if(void 0===n&&(n=2147483647),n<2)return 0;for(var e=t,o=(n-=2)<2*r.length?n/2:r.length,i=0;i<o;++i){var a=r.charCodeAt(i);j[t>>1]=a,t+=2}return j[t>>1]=0,t-e}function N(r){return 2*r.length}function D(r,t){for(var n=0,e="";!(n>=t/4);){var o=L[r+4*n>>2];if(0==o)break;if(++n,o>=65536){var i=o-65536;e+=String.fromCharCode(55296|i>>10,56320|1023&i)}else e+=String.fromCharCode(o)}return e}function z(r,t,n){if(void 0===n&&(n=2147483647),n<4)return 0;for(var e=t,o=e+n-4,i=0;i<r.length;++i){var a=r.charCodeAt(i);if(a>=55296&&a<=57343)a=65536+((1023&a)<<10)|1023&r.charCodeAt(++i);if(L[t>>2]=a,(t+=4)+4>o)break}return L[t>>2]=0,t-e}function H(r){for(var t=0,n=0;n<r.length;++n){var e=r.charCodeAt(n);e>=55296&&e<=57343&&++n,t+=4}return t}function G(r){x=r,u.HEAP8=C=new Int8Array(r),u.HEAP16=j=new Int16Array(r),u.HEAP32=L=new Int32Array(r),u.HEAPU8=k=new Uint8Array(r),u.HEAPU16=O=new Uint16Array(r),u.HEAPU32=R=new Uint32Array(r),u.HEAPF32=F=new Float32Array(r),u.HEAPF64=W=new Float64Array(r)}u.INITIAL_MEMORY;var B,V=[],q=[],Y=[];var X=0,$=null,J=null;function Z(r){u.onAbort&&u.onAbort(r),T(r+=""),_=!0,1,r="abort("+r+"). Build with -s ASSERTIONS=1 for more info.";var t=new WebAssembly.RuntimeError(r);throw a(t),t}u.preloadedImages={},u.preloadedAudios={};var K,Q;function rr(r){return r.startsWith("data:application/octet-stream;base64,")}function tr(r){return r.startsWith("file://")}function nr(r){try{if(r==K&&b)return new Uint8Array(b);if(p)return p(r);throw"both async and sync fetching of the wasm failed"}catch(T){Z(T)}}function er(r){for(;r.length>0;){var t=r.shift();if("function"!=typeof t){var n=t.func;"number"===typeof n?void 0===t.arg?B.get(n)():B.get(n)(t.arg):n(void 0===t.arg?null:t.arg)}else t(u)}}function or(r){switch(r){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+r)}}rr(K="sdf.wasm")||(Q=K,K=u.locateFile?u.locateFile(Q,w):w+Q);var ir=void 0;function ar(r){for(var t="",n=r;k[n];)t+=ir[k[n++]];return t}var ur={},cr={},fr={};function sr(r){if(void 0===r)return"_unknown";var t=(r=r.replace(/[^a-zA-Z0-9_]/g,"$")).charCodeAt(0);return t>=48&&t<=57?"_"+r:r}function lr(r,t){return r=sr(r),new Function("body","return function "+r+'() {\n    "use strict";    return body.apply(this, arguments);\n};\n')(t)}function pr(r,t){var n=lr(t,(function(r){this.name=t,this.message=r;var n=new Error(r).stack;void 0!==n&&(this.stack=this.toString()+"\n"+n.replace(/^Error(:[^\n]*)?\n/,""))}));return n.prototype=Object.create(r.prototype),n.prototype.constructor=n,n.prototype.toString=function(){return void 0===this.message?this.name:this.name+": "+this.message},n}var hr=void 0;function vr(r){throw new hr(r)}var dr=void 0;function yr(r){throw new dr(r)}function mr(r,t,n){if(n=n||{},!("argPackAdvance"in t))throw new TypeError("registerType registeredInstance requires argPackAdvance");var e=t.name;if(r||vr('type "'+e+'" must have a positive integer typeid pointer'),cr.hasOwnProperty(r)){if(n.ignoreDuplicateRegistrations)return;vr("Cannot register type '"+e+"' twice")}if(cr[r]=t,delete fr[r],ur.hasOwnProperty(r)){var o=ur[r];delete ur[r],o.forEach((function(r){r()}))}}var gr=[],wr=[{},{value:void 0},{value:null},{value:!0},{value:!1}];function br(r){r>4&&0===--wr[r].refcount&&(wr[r]=void 0,gr.push(r))}function Tr(){for(var r=0,t=5;t<wr.length;++t)void 0!==wr[t]&&++r;return r}function Ar(){for(var r=5;r<wr.length;++r)if(void 0!==wr[r])return wr[r];return null}function Er(r){switch(r){case void 0:return 1;case null:return 2;case!0:return 3;case!1:return 4;default:var t=gr.length?gr.pop():wr.length;return wr[t]={refcount:1,value:r},t}}function _r(r){return this.fromWireType(R[r>>2])}function Pr(r){if(null===r)return"null";var t=typeof r;return"object"===t||"array"===t||"function"===t?r.toString():""+r}function Sr(r,t){switch(t){case 2:return function(r){return this.fromWireType(F[r>>2])};case 3:return function(r){return this.fromWireType(W[r>>3])};default:throw new TypeError("Unknown float type: "+r)}}function xr(r,t){if(!(r instanceof Function))throw new TypeError("new_ called with constructor type "+typeof r+" which is not a function");var n=lr(r.name||"unknownFunctionName",(function(){}));n.prototype=r.prototype;var e=new n,o=r.apply(e,t);return o instanceof Object?o:e}function Cr(r){for(;r.length;){var t=r.pop();r.pop()(t)}}function kr(r,t,n){u.hasOwnProperty(r)?((void 0===n||void 0!==u[r].overloadTable&&void 0!==u[r].overloadTable[n])&&vr("Cannot register public name '"+r+"' twice"),function(r,t,n){if(void 0===r[t].overloadTable){var e=r[t];r[t]=function(){return r[t].overloadTable.hasOwnProperty(arguments.length)||vr("Function '"+n+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+r[t].overloadTable+")!"),r[t].overloadTable[arguments.length].apply(this,arguments)},r[t].overloadTable=[],r[t].overloadTable[e.argCount]=e}}(u,r,r),u.hasOwnProperty(n)&&vr("Cannot register multiple overloads of a function with the same number of arguments ("+n+")!"),u[r].overloadTable[n]=t):(u[r]=t,void 0!==n&&(u[r].numArguments=n))}function jr(r,t,n){return r.includes("j")?function(r,t,n){var e=u["dynCall_"+r];return n&&n.length?e.apply(null,[t].concat(n)):e.call(null,t)}(r,t,n):B.get(t).apply(null,n)}function Or(r,t){var n=(r=ar(r)).includes("j")?function(r,t){var n=[];return function(){n.length=arguments.length;for(var e=0;e<arguments.length;e++)n[e]=arguments[e];return jr(r,t,n)}}(r,t):B.get(t);return"function"!==typeof n&&vr("unknown function pointer with signature "+r+": "+t),n}var Lr=void 0;function Rr(r){var t=Br(r),n=ar(t);return qr(t),n}function Fr(r,t,n){switch(t){case 0:return n?function(r){return C[r]}:function(r){return k[r]};case 1:return n?function(r){return j[r>>1]}:function(r){return O[r>>1]};case 2:return n?function(r){return L[r>>2]}:function(r){return R[r>>2]};default:throw new TypeError("Unknown integer type: "+r)}}function Wr(r){return r||vr("Cannot use deleted val. handle = "+r),wr[r].value}function Ir(r,t){var n=cr[r];return void 0===n&&vr(t+" has unknown type "+Rr(r)),n}function Mr(r,t){for(var n=new Array(r),e=0;e<r;++e)n[e]=Ir(L[(t>>2)+e],"parameter "+e);return n}var Ur={};function Nr(r){var t=Ur[r];return void 0===t?ar(r):t}var Dr=[];function zr(r){try{return A.grow(r-x.byteLength+65535>>>16),G(A.buffer),1}catch(t){}}!function(){for(var r=new Array(256),t=0;t<256;++t)r[t]=String.fromCharCode(t);ir=r}(),hr=u.BindingError=pr(Error,"BindingError"),dr=u.InternalError=pr(Error,"InternalError"),u.count_emval_handles=Tr,u.get_first_emval=Ar,Lr=u.UnboundTypeError=pr(Error,"UnboundTypeError");var Hr,Gr={q:function(r,t,n,e,o){},u:function(r,t,n,e,o){var i=or(n);mr(r,{name:t=ar(t),fromWireType:function(r){return!!r},toWireType:function(r,t){return t?e:o},argPackAdvance:8,readValueFromPointer:function(r){var e;if(1===n)e=C;else if(2===n)e=j;else{if(4!==n)throw new TypeError("Unknown boolean type size: "+t);e=L}return this.fromWireType(e[r>>i])},destructorFunction:null})},t:function(r,t){mr(r,{name:t=ar(t),fromWireType:function(r){var t=wr[r].value;return br(r),t},toWireType:function(r,t){return Er(t)},argPackAdvance:8,readValueFromPointer:_r,destructorFunction:null})},h:function(r,t,n){var e=or(n);mr(r,{name:t=ar(t),fromWireType:function(r){return r},toWireType:function(r,t){if("number"!==typeof t&&"boolean"!==typeof t)throw new TypeError('Cannot convert "'+Pr(t)+'" to '+this.name);return t},argPackAdvance:8,readValueFromPointer:Sr(t,e),destructorFunction:null})},w:function(r,t,n,e,o,i){var a=function(r,t){for(var n=[],e=0;e<r;e++)n.push(L[(t>>2)+e]);return n}(t,n);r=ar(r),o=Or(e,o),kr(r,(function(){!function(r,t){var n=[],e={};throw t.forEach((function r(t){e[t]||cr[t]||(fr[t]?fr[t].forEach(r):(n.push(t),e[t]=!0))})),new Lr(r+": "+n.map(Rr).join([", "]))}("Cannot call "+r+" due to unbound types",a)}),t-1),function(r,t,n){function e(t){var e=n(t);e.length!==r.length&&yr("Mismatched type converter count");for(var o=0;o<r.length;++o)mr(r[o],e[o])}r.forEach((function(r){fr[r]=t}));var o=new Array(t.length),i=[],a=0;t.forEach((function(r,t){cr.hasOwnProperty(r)?o[t]=cr[r]:(i.push(r),ur.hasOwnProperty(r)||(ur[r]=[]),ur[r].push((function(){o[t]=cr[r],++a===i.length&&e(o)})))})),0===i.length&&e(o)}([],a,(function(n){var e=[n[0],null].concat(n.slice(1));return function(r,t,n){u.hasOwnProperty(r)||yr("Replacing nonexistant public symbol"),void 0!==u[r].overloadTable&&void 0!==n?u[r].overloadTable[n]=t:(u[r]=t,u[r].argCount=n)}(r,function(r,t,n,e,o){var i=t.length;i<2&&vr("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var a=null!==t[1]&&null!==n,u=!1,c=1;c<t.length;++c)if(null!==t[c]&&void 0===t[c].destructorFunction){u=!0;break}var f="void"!==t[0].name,s="",l="";for(c=0;c<i-2;++c)s+=(0!==c?", ":"")+"arg"+c,l+=(0!==c?", ":"")+"arg"+c+"Wired";var p="return function "+sr(r)+"("+s+") {\nif (arguments.length !== "+(i-2)+") {\nthrowBindingError('function "+r+" called with ' + arguments.length + ' arguments, expected "+(i-2)+" args!');\n}\n";u&&(p+="var destructors = [];\n");var h=u?"destructors":"null",v=["throwBindingError","invoker","fn","runDestructors","retType","classParam"],d=[vr,e,o,Cr,t[0],t[1]];for(a&&(p+="var thisWired = classParam.toWireType("+h+", this);\n"),c=0;c<i-2;++c)p+="var arg"+c+"Wired = argType"+c+".toWireType("+h+", arg"+c+"); // "+t[c+2].name+"\n",v.push("argType"+c),d.push(t[c+2]);if(a&&(l="thisWired"+(l.length>0?", ":"")+l),p+=(f?"var rv = ":"")+"invoker(fn"+(l.length>0?", ":"")+l+");\n",u)p+="runDestructors(destructors);\n";else for(c=a?1:2;c<t.length;++c){var y=1===c?"thisWired":"arg"+(c-2)+"Wired";null!==t[c].destructorFunction&&(p+=y+"_dtor("+y+"); // "+t[c].name+"\n",v.push(y+"_dtor"),d.push(t[c].destructorFunction))}return f&&(p+="var ret = retType.fromWireType(rv);\nreturn ret;\n"),p+="}\n",v.push(p),xr(Function,v).apply(null,d)}(r,e,null,o,i),t-1),[]}))},c:function(r,t,n,e,o){t=ar(t),-1===o&&(o=4294967295);var i=or(n),a=function(r){return r};if(0===e){var u=32-8*n;a=function(r){return r<<u>>>u}}var c=t.includes("unsigned");mr(r,{name:t,fromWireType:a,toWireType:function(r,n){if("number"!==typeof n&&"boolean"!==typeof n)throw new TypeError('Cannot convert "'+Pr(n)+'" to '+this.name);if(n<e||n>o)throw new TypeError('Passing a number "'+Pr(n)+'" from JS side to C/C++ side to an argument of type "'+t+'", which is outside the valid range ['+e+", "+o+"]!");return c?n>>>0:0|n},argPackAdvance:8,readValueFromPointer:Fr(t,i,0!==e),destructorFunction:null})},a:function(r,t,n){var e=[Int8Array,Uint8Array,Int16Array,Uint16Array,Int32Array,Uint32Array,Float32Array,Float64Array][t];function o(r){var t=R,n=t[r>>=2],o=t[r+1];return new e(x,o,n)}mr(r,{name:n=ar(n),fromWireType:o,argPackAdvance:8,readValueFromPointer:o},{ignoreDuplicateRegistrations:!0})},i:function(r,t){var n="std::string"===(t=ar(t));mr(r,{name:t,fromWireType:function(r){var t,e=R[r>>2];if(n)for(var o=r+4,i=0;i<=e;++i){var a=r+4+i;if(i==e||0==k[a]){var u=S(o,a-o);void 0===t?t=u:(t+=String.fromCharCode(0),t+=u),o=a+1}}else{var c=new Array(e);for(i=0;i<e;++i)c[i]=String.fromCharCode(k[r+4+i]);t=c.join("")}return qr(r),t},toWireType:function(r,t){var e;t instanceof ArrayBuffer&&(t=new Uint8Array(t));var o="string"===typeof t;o||t instanceof Uint8Array||t instanceof Uint8ClampedArray||t instanceof Int8Array||vr("Cannot pass non-string to std::string"),e=n&&o?function(){return function(r){for(var t=0,n=0;n<r.length;++n){var e=r.charCodeAt(n);e>=55296&&e<=57343&&(e=65536+((1023&e)<<10)|1023&r.charCodeAt(++n)),e<=127?++t:t+=e<=2047?2:e<=65535?3:4}return t}(t)}:function(){return t.length};var i=e(),a=Vr(4+i+1);if(R[a>>2]=i,n&&o)(function(r,t,n,e){if(!(e>0))return 0;for(var o=n,i=n+e-1,a=0;a<r.length;++a){var u=r.charCodeAt(a);if(u>=55296&&u<=57343&&(u=65536+((1023&u)<<10)|1023&r.charCodeAt(++a)),u<=127){if(n>=i)break;t[n++]=u}else if(u<=2047){if(n+1>=i)break;t[n++]=192|u>>6,t[n++]=128|63&u}else if(u<=65535){if(n+2>=i)break;t[n++]=224|u>>12,t[n++]=128|u>>6&63,t[n++]=128|63&u}else{if(n+3>=i)break;t[n++]=240|u>>18,t[n++]=128|u>>12&63,t[n++]=128|u>>6&63,t[n++]=128|63&u}}t[n]=0})(t,k,a+4,i+1);else if(o)for(var u=0;u<i;++u){var c=t.charCodeAt(u);c>255&&(qr(a),vr("String has UTF-16 code units that do not fit in 8 bits")),k[a+4+u]=c}else for(u=0;u<i;++u)k[a+4+u]=t[u];return null!==r&&r.push(qr,a),a},argPackAdvance:8,readValueFromPointer:_r,destructorFunction:function(r){qr(r)}})},e:function(r,t,n){var e,o,i,a,u;n=ar(n),2===t?(e=M,o=U,a=N,i=function(){return O},u=1):4===t&&(e=D,o=z,a=H,i=function(){return R},u=2),mr(r,{name:n,fromWireType:function(r){for(var n,o=R[r>>2],a=i(),c=r+4,f=0;f<=o;++f){var s=r+4+f*t;if(f==o||0==a[s>>u]){var l=e(c,s-c);void 0===n?n=l:(n+=String.fromCharCode(0),n+=l),c=s+t}}return qr(r),n},toWireType:function(r,e){"string"!==typeof e&&vr("Cannot pass non-string to C++ string type "+n);var i=a(e),c=Vr(4+i+t);return R[c>>2]=i>>u,o(e,c+4,i+t),null!==r&&r.push(qr,c),c},argPackAdvance:8,readValueFromPointer:_r,destructorFunction:function(r){qr(r)}})},v:function(r,t){mr(r,{isVoid:!0,name:t=ar(t),argPackAdvance:0,fromWireType:function(){},toWireType:function(r,t){}})},n:function(r,t,n){r=Wr(r),t=Ir(t,"emval::as");var e=[],o=Er(e);return L[n>>2]=o,t.toWireType(e,r)},j:function(r,t,n,e){r=Wr(r);for(var o=Mr(t,n),i=new Array(t),a=0;a<t;++a){var u=o[a];i[a]=u.readValueFromPointer(e),e+=u.argPackAdvance}return Er(r.apply(void 0,i))},k:function(r,t,n,e){(r=Dr[r])(t=Wr(t),n=Nr(n),null,e)},b:br,l:function(r,t){for(var n=Mr(r,t),e=n[0],o=e.name+"_$"+n.slice(1).map((function(r){return r.name})).join("_")+"$",i=["retType"],a=[e],u="",c=0;c<r-1;++c)u+=(0!==c?", ":"")+"arg"+c,i.push("argType"+c),a.push(n[1+c]);var f="return function "+sr("methodCaller_"+o)+"(handle, name, destructors, args) {\n",s=0;for(c=0;c<r-1;++c)f+="    var arg"+c+" = argType"+c+".readValueFromPointer(args"+(s?"+"+s:"")+");\n",s+=n[c+1].argPackAdvance;for(f+="    var rv = handle[name]("+u+");\n",c=0;c<r-1;++c)n[c+1].deleteObject&&(f+="    argType"+c+".deleteObject(arg"+c+");\n");return e.isVoid||(f+="    return retType.toWireType(destructors, rv);\n"),f+="};\n",i.push(f),function(r){var t=Dr.length;return Dr.push(r),t}(xr(Function,i).apply(null,a))},o:function(r,t){return Er((r=Wr(r))[t=Wr(t)])},d:function(r){r>4&&(wr[r].refcount+=1)},p:function(r){return Er(Nr(r))},m:function(r){Cr(wr[r].value),br(r)},f:function(r,t){return Er((r=Ir(r,"_emval_take_value")).readValueFromPointer(t))},g:function(){Z()},r:function(r,t,n){k.copyWithin(r,t,t+n)},s:function(r){var t,n,e=k.length,o=2147483648;if((r>>>=0)>o)return!1;for(var i=1;i<=4;i*=2){var a=e*(1+.2/i);if(a=Math.min(a,r+100663296),zr(Math.min(o,((t=Math.max(r,a))%(n=65536)>0&&(t+=n-t%n),t))))return!0}return!1}},Br=(function(){var r={a:Gr};function t(r,t){var n,e=r.exports;u.asm=e,G((A=u.asm.x).buffer),B=u.asm.z,n=u.asm.y,q.unshift(n),function(r){if(X--,u.monitorRunDependencies&&u.monitorRunDependencies(X),0==X&&(null!==$&&(clearInterval($),$=null),J)){var t=J;J=null,t()}}()}function n(r){t(r.instance)}function e(t){return function(){if(!b&&(y||m)){if("function"===typeof fetch&&!tr(K))return fetch(K,{credentials:"same-origin"}).then((function(r){if(!r.ok)throw"failed to load wasm binary file at '"+K+"'";return r.arrayBuffer()})).catch((function(){return nr(K)}));if(l)return new Promise((function(r,t){l(K,(function(t){r(new Uint8Array(t))}),t)}))}return Promise.resolve().then((function(){return nr(K)}))}().then((function(t){return WebAssembly.instantiate(t,r)})).then(t,(function(r){T("failed to asynchronously prepare wasm: "+r),Z(r)}))}if(X++,u.monitorRunDependencies&&u.monitorRunDependencies(X),u.instantiateWasm)try{return u.instantiateWasm(r,t)}catch(o){return T("Module.instantiateWasm callback failed with error: "+o),!1}(b||"function"!==typeof WebAssembly.instantiateStreaming||rr(K)||tr(K)||"function"!==typeof fetch?e(n):fetch(K,{credentials:"same-origin"}).then((function(t){return WebAssembly.instantiateStreaming(t,r).then(n,(function(r){return T("wasm streaming compile failed: "+r),T("falling back to ArrayBuffer instantiation"),e(n)}))}))).catch(a)}(),u.___wasm_call_ctors=function(){return(u.___wasm_call_ctors=u.asm.y).apply(null,arguments)},u.___getTypeName=function(){return(Br=u.___getTypeName=u.asm.A).apply(null,arguments)}),Vr=(u.___embind_register_native_and_builtin_types=function(){return(u.___embind_register_native_and_builtin_types=u.asm.B).apply(null,arguments)},u._malloc=function(){return(Vr=u._malloc=u.asm.C).apply(null,arguments)}),qr=u._free=function(){return(qr=u._free=u.asm.D).apply(null,arguments)};function Yr(r){this.name="ExitStatus",this.message="Program terminated with exit("+r+")",this.status=r}function Xr(r){function t(){Hr||(Hr=!0,u.calledRun=!0,_||(!0,er(q),i(u),u.onRuntimeInitialized&&u.onRuntimeInitialized(),function(){if(u.postRun)for("function"==typeof u.postRun&&(u.postRun=[u.postRun]);u.postRun.length;)r=u.postRun.shift(),Y.unshift(r);var r;er(Y)}()))}r=r||d,X>0||(!function(){if(u.preRun)for("function"==typeof u.preRun&&(u.preRun=[u.preRun]);u.preRun.length;)r=u.preRun.shift(),V.unshift(r);var r;er(V)}(),X>0||(u.setStatus?(u.setStatus("Running..."),setTimeout((function(){setTimeout((function(){u.setStatus("")}),1),t()}),1)):t()))}if(J=function r(){Hr||Xr(),Hr||(J=r)},u.run=Xr,u.preInit)for("function"==typeof u.preInit&&(u.preInit=[u.preInit]);u.preInit.length>0;)u.preInit.pop()();return Xr(),t.ready}}();r.exports=i}).call(this,"/index.js",n(2),"/")},function(r,t,n){var e=function(r){"use strict";var t,n=Object.prototype,e=n.hasOwnProperty,o="function"===typeof Symbol?Symbol:{},i=o.iterator||"@@iterator",a=o.asyncIterator||"@@asyncIterator",u=o.toStringTag||"@@toStringTag";function c(r,t,n){return Object.defineProperty(r,t,{value:n,enumerable:!0,configurable:!0,writable:!0}),r[t]}try{c({},"")}catch(O){c=function(r,t,n){return r[t]=n}}function f(r,t,n,e){var o=t&&t.prototype instanceof y?t:y,i=Object.create(o.prototype),a=new C(e||[]);return i._invoke=function(r,t,n){var e=l;return function(o,i){if(e===h)throw new Error("Generator is already running");if(e===v){if("throw"===o)throw i;return j()}for(n.method=o,n.arg=i;;){var a=n.delegate;if(a){var u=P(a,n);if(u){if(u===d)continue;return u}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(e===l)throw e=v,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);e=h;var c=s(r,t,n);if("normal"===c.type){if(e=n.done?v:p,c.arg===d)continue;return{value:c.arg,done:n.done}}"throw"===c.type&&(e=v,n.method="throw",n.arg=c.arg)}}}(r,n,a),i}function s(r,t,n){try{return{type:"normal",arg:r.call(t,n)}}catch(O){return{type:"throw",arg:O}}}r.wrap=f;var l="suspendedStart",p="suspendedYield",h="executing",v="completed",d={};function y(){}function m(){}function g(){}var w={};c(w,i,(function(){return this}));var b=Object.getPrototypeOf,T=b&&b(b(k([])));T&&T!==n&&e.call(T,i)&&(w=T);var A=g.prototype=y.prototype=Object.create(w);function E(r){["next","throw","return"].forEach((function(t){c(r,t,(function(r){return this._invoke(t,r)}))}))}function _(r,t){function n(o,i,a,u){var c=s(r[o],r,i);if("throw"!==c.type){var f=c.arg,l=f.value;return l&&"object"===typeof l&&e.call(l,"__await")?t.resolve(l.__await).then((function(r){n("next",r,a,u)}),(function(r){n("throw",r,a,u)})):t.resolve(l).then((function(r){f.value=r,a(f)}),(function(r){return n("throw",r,a,u)}))}u(c.arg)}var o;this._invoke=function(r,e){function i(){return new t((function(t,o){n(r,e,t,o)}))}return o=o?o.then(i,i):i()}}function P(r,n){var e=r.iterator[n.method];if(e===t){if(n.delegate=null,"throw"===n.method){if(r.iterator.return&&(n.method="return",n.arg=t,P(r,n),"throw"===n.method))return d;n.method="throw",n.arg=new TypeError("The iterator does not provide a 'throw' method")}return d}var o=s(e,r.iterator,n.arg);if("throw"===o.type)return n.method="throw",n.arg=o.arg,n.delegate=null,d;var i=o.arg;return i?i.done?(n[r.resultName]=i.value,n.next=r.nextLoc,"return"!==n.method&&(n.method="next",n.arg=t),n.delegate=null,d):i:(n.method="throw",n.arg=new TypeError("iterator result is not an object"),n.delegate=null,d)}function S(r){var t={tryLoc:r[0]};1 in r&&(t.catchLoc=r[1]),2 in r&&(t.finallyLoc=r[2],t.afterLoc=r[3]),this.tryEntries.push(t)}function x(r){var t=r.completion||{};t.type="normal",delete t.arg,r.completion=t}function C(r){this.tryEntries=[{tryLoc:"root"}],r.forEach(S,this),this.reset(!0)}function k(r){if(r){var n=r[i];if(n)return n.call(r);if("function"===typeof r.next)return r;if(!isNaN(r.length)){var o=-1,a=function n(){for(;++o<r.length;)if(e.call(r,o))return n.value=r[o],n.done=!1,n;return n.value=t,n.done=!0,n};return a.next=a}}return{next:j}}function j(){return{value:t,done:!0}}return m.prototype=g,c(A,"constructor",g),c(g,"constructor",m),m.displayName=c(g,u,"GeneratorFunction"),r.isGeneratorFunction=function(r){var t="function"===typeof r&&r.constructor;return!!t&&(t===m||"GeneratorFunction"===(t.displayName||t.name))},r.mark=function(r){return Object.setPrototypeOf?Object.setPrototypeOf(r,g):(r.__proto__=g,c(r,u,"GeneratorFunction")),r.prototype=Object.create(A),r},r.awrap=function(r){return{__await:r}},E(_.prototype),c(_.prototype,a,(function(){return this})),r.AsyncIterator=_,r.async=function(t,n,e,o,i){void 0===i&&(i=Promise);var a=new _(f(t,n,e,o),i);return r.isGeneratorFunction(n)?a:a.next().then((function(r){return r.done?r.value:a.next()}))},E(A),c(A,u,"Generator"),c(A,i,(function(){return this})),c(A,"toString",(function(){return"[object Generator]"})),r.keys=function(r){var t=[];for(var n in r)t.push(n);return t.reverse(),function n(){for(;t.length;){var e=t.pop();if(e in r)return n.value=e,n.done=!1,n}return n.done=!0,n}},r.values=k,C.prototype={constructor:C,reset:function(r){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(x),!r)for(var n in this)"t"===n.charAt(0)&&e.call(this,n)&&!isNaN(+n.slice(1))&&(this[n]=t)},stop:function(){this.done=!0;var r=this.tryEntries[0].completion;if("throw"===r.type)throw r.arg;return this.rval},dispatchException:function(r){if(this.done)throw r;var n=this;function o(e,o){return u.type="throw",u.arg=r,n.next=e,o&&(n.method="next",n.arg=t),!!o}for(var i=this.tryEntries.length-1;i>=0;--i){var a=this.tryEntries[i],u=a.completion;if("root"===a.tryLoc)return o("end");if(a.tryLoc<=this.prev){var c=e.call(a,"catchLoc"),f=e.call(a,"finallyLoc");if(c&&f){if(this.prev<a.catchLoc)return o(a.catchLoc,!0);if(this.prev<a.finallyLoc)return o(a.finallyLoc)}else if(c){if(this.prev<a.catchLoc)return o(a.catchLoc,!0)}else{if(!f)throw new Error("try statement without catch or finally");if(this.prev<a.finallyLoc)return o(a.finallyLoc)}}}},abrupt:function(r,t){for(var n=this.tryEntries.length-1;n>=0;--n){var o=this.tryEntries[n];if(o.tryLoc<=this.prev&&e.call(o,"finallyLoc")&&this.prev<o.finallyLoc){var i=o;break}}i&&("break"===r||"continue"===r)&&i.tryLoc<=t&&t<=i.finallyLoc&&(i=null);var a=i?i.completion:{};return a.type=r,a.arg=t,i?(this.method="next",this.next=i.finallyLoc,d):this.complete(a)},complete:function(r,t){if("throw"===r.type)throw r.arg;return"break"===r.type||"continue"===r.type?this.next=r.arg:"return"===r.type?(this.rval=this.arg=r.arg,this.method="return",this.next="end"):"normal"===r.type&&t&&(this.next=t),d},finish:function(r){for(var t=this.tryEntries.length-1;t>=0;--t){var n=this.tryEntries[t];if(n.finallyLoc===r)return this.complete(n.completion,n.afterLoc),x(n),d}},catch:function(r){for(var t=this.tryEntries.length-1;t>=0;--t){var n=this.tryEntries[t];if(n.tryLoc===r){var e=n.completion;if("throw"===e.type){var o=e.arg;x(n)}return o}}throw new Error("illegal catch attempt")},delegateYield:function(r,n,e){return this.delegate={iterator:k(r),resultName:n,nextLoc:e},"next"===this.method&&(this.arg=t),d}},r}(r.exports);try{regeneratorRuntime=e}catch(o){"object"===typeof globalThis?globalThis.regeneratorRuntime=e:Function("r","regeneratorRuntime = r")(e)}},function(r,t,n){"use strict";n.r(t);var e=n(1),o=n.n(e);function i(r,t,n,e,o,i,a){try{var u=r[i](a),c=u.value}catch(f){return void n(f)}u.done?t(c):Promise.resolve(c).then(e,o)}function a(r){return function(){var t=this,n=arguments;return new Promise((function(e,o){var a=r.apply(t,n);function u(r){i(a,e,o,u,c,"next",r)}function c(r){i(a,e,o,u,c,"throw",r)}u(void 0)}))}}function u(r,t){(null==t||t>r.length)&&(t=r.length);for(var n=0,e=new Array(t);n<t;n++)e[n]=r[n];return e}function c(r,t){if(r){if("string"===typeof r)return u(r,t);var n=Object.prototype.toString.call(r).slice(8,-1);return"Object"===n&&r.constructor&&(n=r.constructor.name),"Map"===n||"Set"===n?Array.from(r):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?u(r,t):void 0}}function f(r,t){return function(r){if(Array.isArray(r))return r}(r)||function(r,t){if("undefined"!==typeof Symbol&&Symbol.iterator in Object(r)){var n=[],e=!0,o=!1,i=void 0;try{for(var a,u=r[Symbol.iterator]();!(e=(a=u.next()).done)&&(n.push(a.value),!t||n.length!==t);e=!0);}catch(c){o=!0,i=c}finally{try{e||null==u.return||u.return()}finally{if(o)throw i}}return n}}(r,t)||c(r,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function s(r,t,n){return t in r?Object.defineProperty(r,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):r[t]=n,r}function l(r,t){return l=Object.setPrototypeOf||function(r,t){return r.__proto__=t,r},l(r,t)}function p(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(r){return!1}}function h(r,t,n){return h=p()?Reflect.construct:function(r,t,n){var e=[null];e.push.apply(e,t);var o=new(Function.bind.apply(r,e));return n&&l(o,n.prototype),o},h.apply(null,arguments)}function v(r){return function(r){if(Array.isArray(r))return u(r)}(r)||function(r){if("undefined"!==typeof Symbol&&Symbol.iterator in Object(r))return Array.from(r)}(r)||c(r)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}var d=Symbol("Comlink.proxy"),y=Symbol("Comlink.endpoint"),m=Symbol("Comlink.releaseProxy"),g=Symbol("Comlink.thrown"),w=function(r){return"object"===typeof r&&null!==r||"function"===typeof r},b=new Map([["proxy",{canHandle:function(r){return w(r)&&r[d]},serialize:function(r){var t=new MessageChannel,n=t.port1,e=t.port2;return T(r,n),[e,[e]]},deserialize:function(r){return r.start(),_(r,[],t);var t}}],["throw",{canHandle:function(r){return w(r)&&g in r},serialize:function(r){var t=r.value;return[t instanceof Error?{isError:!0,value:{message:t.message,name:t.name,stack:t.stack}}:{isError:!1,value:t},[]]},deserialize:function(r){if(r.isError)throw Object.assign(new Error(r.value.message),r.value);throw r.value}}]]);function T(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:self;t.addEventListener("message",(function n(e){if(e&&e.data){var o,i=Object.assign({path:[]},e.data),a=i.id,u=i.type,c=i.path,l=(e.data.argumentList||[]).map(j);try{var p=c.slice(0,-1).reduce((function(r,t){return r[t]}),r),d=c.reduce((function(r,t){return r[t]}),r);switch(u){case"GET":o=d;break;case"SET":p[c.slice(-1)[0]]=j(e.data.value),o=!0;break;case"APPLY":o=d.apply(p,l);break;case"CONSTRUCT":var y;o=C(h(d,v(l)));break;case"ENDPOINT":var m=new MessageChannel,w=m.port1,b=m.port2;T(r,b),o=x(w,[w]);break;case"RELEASE":o=void 0;break;default:return}}catch(y){o=s({value:y},g,0)}Promise.resolve(o).catch((function(r){return s({value:r},g,0)})).then((function(r){var e=f(k(r),2),o=e[0],i=e[1];t.postMessage(Object.assign(Object.assign({},o),{id:a}),i),"RELEASE"===u&&(t.removeEventListener("message",n),A(t))}))}})),t.start&&t.start()}function A(r){(function(r){return"MessagePort"===r.constructor.name})(r)&&r.close()}function E(r){if(r)throw new Error("Proxy has been released and is not useable")}function _(r){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:[],n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:function(){},e=!1,o=new Proxy(n,{get:function(n,i){if(E(e),i===m)return function(){return O(r,{type:"RELEASE",path:t.map((function(r){return r.toString()}))}).then((function(){A(r),e=!0}))};if("then"===i){if(0===t.length)return{then:function(){return o}};var a=O(r,{type:"GET",path:t.map((function(r){return r.toString()}))}).then(j);return a.then.bind(a)}return _(r,[].concat(v(t),[i]))},set:function(n,o,i){E(e);var a=f(k(i),2),u=a[0],c=a[1];return O(r,{type:"SET",path:[].concat(v(t),[o]).map((function(r){return r.toString()})),value:u},c).then(j)},apply:function(n,o,i){E(e);var a=t[t.length-1];if(a===y)return O(r,{type:"ENDPOINT"}).then(j);if("bind"===a)return _(r,t.slice(0,-1));var u=f(P(i),2),c=u[0],s=u[1];return O(r,{type:"APPLY",path:t.map((function(r){return r.toString()})),argumentList:c},s).then(j)},construct:function(n,o){E(e);var i=f(P(o),2),a=i[0],u=i[1];return O(r,{type:"CONSTRUCT",path:t.map((function(r){return r.toString()})),argumentList:a},u).then(j)}});return o}function P(r){var t,n=r.map(k);return[n.map((function(r){return r[0]})),(t=n.map((function(r){return r[1]})),Array.prototype.concat.apply([],t))]}var S=new WeakMap;function x(r,t){return S.set(r,t),r}function C(r){return Object.assign(r,s({},d,!0))}function k(r){var t,n=function(r,t){var n;if("undefined"===typeof Symbol||null==r[Symbol.iterator]){if(Array.isArray(r)||(n=c(r))||t&&r&&"number"===typeof r.length){n&&(r=n);var e=0,o=function(){};return{s:o,n:function(){return e>=r.length?{done:!0}:{done:!1,value:r[e++]}},e:function(r){throw r},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,u=!1;return{s:function(){n=r[Symbol.iterator]()},n:function(){var r=n.next();return a=r.done,r},e:function(r){u=!0,i=r},f:function(){try{a||null==n.return||n.return()}finally{if(u)throw i}}}}(b);try{for(n.s();!(t=n.n()).done;){var e=f(t.value,2),o=e[0],i=e[1];if(i.canHandle(r)){var a=f(i.serialize(r),2);return[{type:"HANDLER",name:o,value:a[0]},a[1]]}}}catch(u){n.e(u)}finally{n.f()}return[{type:"RAW",value:r},S.get(r)||[]]}function j(r){switch(r.type){case"HANDLER":return b.get(r.name).deserialize(r.value);case"RAW":return r.value}}function O(r,t,n){return new Promise((function(e){var o=new Array(4).fill(0).map((function(){return Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(16)})).join("-");r.addEventListener("message",(function t(n){n.data&&n.data.id&&n.data.id===o&&(r.removeEventListener("message",t),e(n.data))})),r.start&&r.start(),r.postMessage(Object.assign({id:o},t),n)}))}var L=n.p+"cc29060fd3120332531c078f8aa777ab.wasm",R=n(4),F=n.n(R);function W(){return(W=a(o.a.mark((function r(t,n,e,i){var a,u,c,f,s;return o.a.wrap((function(r){for(;;)switch(r.prev=r.next){case 0:return r.next=2,fetch(L);case 2:return a=r.sent,r.next=5,a.arrayBuffer();case 5:return u=r.sent,r.next=8,F()({wasmBinary:u});case 8:return c=r.sent,f=c.sdf(t.pixels,e,t.width,t.height,t.depth,parseFloat(n.x),parseFloat(n.y),parseFloat(n.z),i),s=f.slice(),r.abrupt("return",s);case 12:case"end":return r.stop()}}),r)})))).apply(this,arguments)}T((function(r,t,n,e){return W.apply(this,arguments)}))}]);
//# sourceMappingURL=sdf-worker.d19c0e83.chunk.worker.js.map