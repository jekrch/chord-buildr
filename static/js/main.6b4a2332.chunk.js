(this["webpackJsonpchord-builder"]=this["webpackJsonpchord-builder"]||[]).push([[0],{45:function(e,t,o){},53:function(e,t,o){},67:function(e,t,o){},68:function(e,t,o){},91:function(e,t,o){"use strict";o.r(t);var n=o(3),c=o(0),r=o.n(c),a=o(18),i=o.n(a),s=(o(66),o(67),o(68),o(11)),l=o(49),d=o(7),u=o(1),h=o(10),b=[{note:"C",color:"white"},{note:"C#",color:"black"},{note:"D",color:"white"},{note:"D#",color:"black"},{note:"E",color:"white"},{note:"F",color:"white"},{note:"F#",color:"black"},{note:"G",color:"white"},{note:"G#",color:"black"},{note:"A",color:"white"},{note:"A#",color:"black"},{note:"B",color:"white"}],j=function(){for(var e=[],t=0;t<3;t++){for(var o=[],n=0;n<b.length;n++){var c={},r=b[n];c.note=r.note,c.color=r.color,c.selected=!1,c.noteNumber=n+1,c.octave=t,o.push(c)}e.push(o)}return e};var p={1:"C",2:"C#",3:"D",4:"D#",5:"E",6:"F",7:"F#",8:"G",9:"G#",10:"A",11:"A#",12:"B"},v={1:"C",2:"Db",3:"D",4:"Eb",5:"E",6:"F",7:"Gb",8:"G",9:"Ab",10:"A",11:"Bb",12:"B"},f={C:1,"C#":2,Db:2,D:3,"D#":4,Eb:4,E:5,F:6,"F#":7,Gb:7,G:8,"G#":9,Ab:9,A:10,"A#":11,Bb:11,B:12};function O(e){return e.charAt(0).toUpperCase()+e.charAt(1).toLowerCase()}function m(e){if(e)return e=O(e),f[e]}function y(e,t){var o=function(e){for(;e>12;)e-=12;for(;e<1;)e+=12;return e}(t),n=function(e){switch(e=O(e)){case"C":case"C#":case"D":case"E":case"F#":case"G":case"A":case"B":return p;case"G#":case"Ab":case"A#":case"Bb":case"Cb":case"Db":case"D#":case"Eb":case"F":case"Gb":default:return v}}(e);return O(n[o])}function C(e,t){for(;e>12;)e-=12,t<2&&t++;for(;e<1;)e+=12,0!==t&&t--;return{noteNumber:e,octave:t}}var x={"":[0,4,7],m:[0,3,7],m6:[0,3,7,9],m7:[0,3,6,10],m9:[0,3,7,10,14],maj7:[0,4,7,11],6:[0,4,7,9],5:[0,7],7:[0,4,7,10],9:[0,4,7,10,14],11:[0,4,7,10,14,17],13:[0,4,7,10,14,17,21],"6/9":[0,4,7,9,14],maj9:[0,4,7,11,14],dim:[0,3,6],dim7:[0,3,6,9],sus4:[0,5,7],sus2:[0,2,7],aug:[0,4,8],add9:[0,4,7,14],add2:[0,2,4,7],m7b5:[0,2,6,10],mM7:[0,3,7,11],m11:[0,3,7,10,14,17],"7sus4":[0,5,7,10],"7-9":[0,4,7,10,13],"7#5":[0,4,8,10],maj13:[0,4,7,11,14,21],"+":[0,4,8],x:[0]};function g(e){var t,o,n={};try{e=e.split("#piano-")[0],n.octave=function(e,t){var o=e.substring(0,1);return!o||isNaN(o)||Number(o)<0?o=0:Number(o)>2&&(o=2),o}(e),e=e.replace(")",""),n.isKey=e.includes("*");var c="#"===(e=function(e,t){if(e.includes(":")){var o=e.split(":").pop();t.slashNote=o,t.slash=!0,e=e.replace(":"+o,"")}return e}(e=e.replace("*",""),n)).substring(2,3)?3:2;n.noteLetter=e.substring(1,c).toUpperCase(),n.type=e.substring(c),console.log(n)}catch(r){return void console.log("Exception - invalid chord code: "+e)}if(o=n.type,void 0!==x[o]&&(t=n.noteLetter,Object.values(p).includes(t)))return n;console.log("Invalid chord code: "+e)}function N(e){for(var t="",o=0;o<e.chordPianoSet.length;o++){var n=e.chordPianoSet[o],c=n.selectedChord;if(c){var r=c.octave+c.noteLetter+c.type;n.isProgKey&&(r+="*"),P(c)&&(r+=":"+c.slashNote),t+="(".concat(r,")")}}return t}function P(e){return e.slash&&e.slashNote&&""!==e.slashNote}function S(e,t){var o=e.selectedChord.noteLetter,n=t.noteLetter,c=m(o);return m(n)-c}function A(e,t){var o,n={},c=e.selectedChord.noteLetter,r=null!==(o=e.selectedChord.octave)&&void 0!==o?o:0,a=C(m(c)+t,r);return n.noteLetter=y("C",a.noteNumber),n.octave=a.octave,n}function E(e,t){if(void 0===e||""===e)return e;var o=m(e)+t;return 0===o&&(o=12),y("C",o)}function D(e){return k(e,e.selectedChord,!0)}function I(e){return k(e,e.selectedChord,!1)}function k(e,t,o){(function(e){return T(e.piano)&&!0===e.rendered})(e)||function(e,t){(function(e){for(var t=0;t<e.length;t++)for(var o=e[t],n=0;n<o.length;n++)o[n].selected=!1})(t.piano),e.notes.forEach((function(o){var n=C(o,e.octave);!function(e,t,o){var n=e.piano;if(function(e,t,o){if(!e||!e[t])return!0}(n,t))return void console.log("skipped invalid note: "+t+" : "+o);var c=n[t][o-1];if(!c||c.selected)return void console.log("SKIPPED INVALID NOTE: "+t+" : "+o);c.selected=!0,c.isStopping=null}(t,n.octave,n.noteNumber)})),t.rendered=!0}(M(t,o),e)}function M(e,t){var o=e.noteLetter,n=e.type,c=e.octave,r=e.slashNote;c&&null!==c||(c=0);var a=m(o),i=m(r);return function(e,t,o,n,c){var r={rooteNoteNumber:t,notes:[],octave:e,octaveAllowance:2-e};if(n){var a=function(e){var t=0;return e.notes.forEach((function(o){var n=Math.ceil(o/12)-1;if(n>=e.octaveAllowance){var c=n-e.octaveAllowance;c>t&&(t=c)}})),t}(r=function(e,t,o,n){if(t=function(e,t){return e.filter((function(e){return!((e-t)%12===0)}))}(t,o),e.notes.push(o),t.every((function(e){return e>o})))t.forEach((function(t){t-12>o&&(t-=12),e.notes.push(t)}));else{(function(e,t,o){var n=!1;return t.forEach((function(t){e>t&&(o.rooteNoteNumber===t&&(n=!0),t+=12),o.notes.push(t)})),n})(o,t,e)&&e.octave>0&&n&&(e.octave-=1,e.octaveAllowance+=1)}return e}(r,o,n,c));r.octave-=a}else r.notes=o;return r}(c,a,function(e,t){for(var o=x[t],n=[],c=0;c<o.length;c++){var r=e+o[c];n.push(r)}return n}(a,n),i,t)}function T(e){for(var t=0;t<e.length;t++)for(var o=e[t],n=0;n<o.length;n++)if(o[n].selected)return!0;return!1}function B(e,t){var o=g(t);return void 0!==o?{id:e,piano:j(),selectedKey:{noteLetter:o.noteLetter,octave:o.octave},isProgKey:o.isKey,selectedChord:{noteLetter:o.noteLetter,type:o.type,octave:o.octave,slash:o.slash,slashNote:o.slashNote}}:{id:e,piano:j(),selectedKey:{noteLetter:"C",octave:0},isProgKey:!1,selectedChord:{noteLetter:"C",type:"x",octave:0,invalidCode:t,slash:!1}}}function w(e,t,o,n){var c=S(o,n),r=function(e,t){return S(e,t)+12*(t.octave-e.selectedChord.octave)}(o,n);if(0!==r)for(var a=0;a<t.length;a++){var i=t[a],s=L(i.selectedChord,!1);if(i.selectedChord.slashNote=E(i.selectedChord.slashNote,c),i.id!==e)G(i,A(i,c)),I(i=K(L(i.selectedChord,!0),s,r,i))}}function G(e,t){e.selectedKey=t,e.selectedChord.noteLetter=t.noteLetter,e.selectedChord.octave=t.octave,e.rendered=!1}function K(e,t,o,n){var c=e-t-o;return Math.abs(c)>6&&(c>0?n.selectedKey.octave>0&&(n.selectedKey.octave--,n.selectedChord.octave--,n.rendered=!1):n.selectedKey.octave<2&&(n.selectedKey.octave++,n.selectedChord.octave++,n.rendered=!1)),n}function L(e,t){var o=M(e,!t);return o.notes[0]+12*o.octave}var R="PIANO_STATE",Y={history:null,previousProgCodes:[],currentProgCode:null,building:!1,chordPianoSet:[U(0)]};function F(e,t){var o=e.chordPianoSet.filter((function(e){return e.id===t}));return o.length>0?o[0]:null}function V(e,t){if(!e.building){var o=t.replace(")","").split("("),n=[];e.building=!0;for(var c=!1,r=0;r<o.length;r++){var a=o[r];if(""!==a){console.log(a);var i=B(r,a);c=H(i,c),n.push(i)}}return e.chordPianoSet=n,e.building=!1,z(e),e}}function H(e,t){return e.isProgKey&&(t?e.isProgKey=!1:t=!0),t}function z(e){if(!e.building){var t=N(e),o="?prog="+t;e.currentProgCode&&e.previousProgCodes.push(e.currentProgCode),e.currentProgCode=t,e.history.push({search:o})}}function U(e){return{id:e,piano:j(),selectedKey:{noteLetter:"C",octave:0},selectedChord:{noteLetter:"C",type:"",octave:1}}}var Z=JSON.parse(sessionStorage.getItem(R)),J=Object(u.a)(Object(u.a)({},Y),Z),X=function(e,t){var o=t.id;switch(console.log(t.type),console.log("piano id: "+o),o||(o=0),t.type){case"UPDATE_PIANO":return e.chordPianoSet=e.chordPianoSet.map((function(e){return e.id===o?Object(u.a)(Object(u.a)({},e),{},{piano:t.payload}):e})),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history,building:e.building});case"UPDATE_KEY":if(c=F(e,o)){if(c.isProgKey){var n=t.payload;w(o,e.chordPianoSet,c,n)}c.selectedKey=t.payload,c.selectedChord.noteLetter=t.payload.noteLetter,c.selectedChord.octave=t.payload.octave,c.rendered=!1,D(c)}else console.log("Piano not found: "+o);return z(e),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history});case"UPDATE_CHORD_TYPE":var c;return(c=F(e,o))&&(c.selectedChord.type=t.chordType,c.rendered=!1,D(c)),z(e),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history});case"UPDATE_SLASH_CHORD":return(a=F(e,o))&&(a.selectedChord.slash=t.isSlashChord,a.selectedChord.slashNote=t.slashNote),a.rendered=!1,D(a),z(e),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history});case"ADD_CHORD_PIANO":if(null!==t.payload){t.payload=null;var r=function(e){var t=Math.max.apply(Math,Object(h.a)(e.chordPianoSet.map((function(e){return e.id}))));return null===t||t===-1/0?0:t+1}(e);e.chordPianoSet=e.chordPianoSet.concat(U(r)),z(e)}return Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history});case"REMOVE_PIANO":return e.chordPianoSet=e.chordPianoSet.filter((function(e){return e.id!==t.id})),z(e),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history});case"SET_PROG_KEY":var a;if(t.keyChecked)!function(e,t){!function(e){for(var t=0;t<e.chordPianoSet.length;t++)e.chordPianoSet[t].isProgKey=!1}(e),F(e,t).isProgKey=!0}(e,t.id);else(a=F(e,t.id)).isProgKey=!1;return z(e),Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet});case"BUILD_PROG_FROM_CODE":if(null!==t.payload){var i=t.payload;t.payload=null,V(e,i)}return Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history,building:e.building});case"LOAD_PREVIOUS_PROG_CODE":if(e.previousProgCodes.length>0){var s=e.previousProgCodes.length-1;(e=V(e,e.previousProgCodes[s])).changed=s,e.previousProgCodes.splice(s,2)}return Object(u.a)(Object(u.a)({},e),{},{chordPianoSet:e.chordPianoSet,history:e.history,previousProgCodes:e.previousProgCodes,currentProgCode:e.currentProgCode});default:return e}},Q=Object(c.createContext)(),W=function(e){var t=Object(c.useReducer)(X,J),o=Object(d.a)(t,2),r=o[0],a=o[1];return Object(c.useEffect)((function(){sessionStorage.setItem(R,JSON.stringify(r))}),[r]),Object(n.jsx)(Q.Provider,{value:{state:r,dispatch:a},children:e.children})},q=o(32),_=o(38),$=(o(53),o(60)),ee=o(26),te=null;function oe(e,t,o){var n=F(t,o),c=(null!==te||(te=(new $.a).toDestination(),ee.isMobile&&te.set({latencyHint:"balanced"})),te);c.toDestination();var r=function(e){for(var t=[],o=0;o<e.length;o++)for(var n=e[o],c=0;c<n.length;c++){var r=n[c];if(r.selected){var a="".concat(r.note.toUpperCase()).concat(o+3);t.push(a),ee.isMobile||(r.isStopping=null,r.isPlaying=!0)}}return t}(n.piano);ee.isMobile||e({type:"UPDATE_PIANO",id:n.id,payload:n.piano}),c.releaseAll(),c.triggerAttackRelease(r,"1.1",ee.isMobile?"+0.15":"+0.03","0.7"),ee.isMobile||function(e,t){setTimeout((function(){for(var o=t.piano,n=0;n<o.length;n++)for(var c=o[n],r=0;r<c.length;r++){var a=c[r];a.isPlaying&&(a.isPlaying=!1,a.isStopping=!0)}e({type:"UPDATE_PIANO",id:t.id,payload:t.piano})}),1500)}(e,n)}var ne=o(50),ce=function(){var e=Object(c.useContext)(Q),t=e.state,o=e.dispatch,r=Object(c.useState)(!1),a=Object(d.a)(r,2),i=a[0],s=a[1];Object(c.useEffect)((function(){if(t.chordPianoSet&&!(t.chordPianoSet.length<1)&&i){var e="piano-"+t.chordPianoSet[t.chordPianoSet.length-1].id;ne.scroller.scrollTo(e,{duration:500,smooth:!0,offset:-130,spy:!0,hashSpy:!0,to:e}),s(!1)}}),[t.chordPianoSet]);return Object(n.jsx)(n.Fragment,{children:Object(n.jsx)(q.a,{fixed:"top",className:"flex-column mainHeader",children:Object(n.jsxs)("div",{className:"headerContainer",children:[Object(n.jsxs)("div",{className:"buttonContainer row",children:[Object(n.jsx)(_.a,{variant:"primary",size:"sm",className:"btn-main chord-btn ",onClick:function(){return o({type:"ADD_CHORD_PIANO",payload:"selectedKey"}),void s(!0)},children:"Add"}),Object(n.jsx)(_.a,{variant:"primary",size:"sm",className:"btn-main chord-btn",onClick:function(){o({type:"LOAD_PREVIOUS_PROG_CODE",payload:""})},children:"Undo"}),Object(n.jsx)(_.a,{variant:"primary",size:"sm",className:"btn-main chord-btn",onClick:function(){o({type:"BUILD_PROG_FROM_CODE",payload:""})},children:"Clear"})]}),Object(n.jsx)("ul",{className:"progression row",style:{listStyle:"none"},children:t.chordPianoSet.map((function(e,c){return Object(n.jsxs)(n.Fragment,{children:[Object(n.jsx)(ne.Link,{className:"chordListItem",to:"piano-"+e.id,spy:!0,offset:-130,isDynamic:!0,duration:500,smooth:!0,onClick:function(n){return function(e){console.log("clicked "+e),oe(o,t,e)}(e.id)},children:Object(n.jsxs)("div",{className:"chordItem",children:["\xa0",e.selectedChord.noteLetter,e.selectedChord.type,P(e.selectedChord)?"/"+e.selectedChord.slashNote:""]})},e.id),"\xa0",c!==t.chordPianoSet.length-1?"|":""]})}))})]})})})},re=(o(45),function(e){var t=e.pianoKey,o=e.handleClick;return Object(n.jsx)(n.Fragment,{children:Object(n.jsx)("li",{"key-selected":"".concat(t.selected),"key-playing":"".concat(t.isPlaying),"key-stopping":"".concat(null!==t.isStopping?t.isStopping:null),className:"".concat(t.color," ").concat(t.note," ").concat(t.note,"-").concat(t.octave),onClick:function(){return o(t.note,t.noteNumber,t.octave)}})})}),ae=function(e){var t=e.pianoComponentId,o=Object(c.useContext)(Q),r=o.state,a=o.dispatch,i=t;return Object(n.jsx)(n.Fragment,{children:Object(n.jsxs)("div",{className:"pianoContainer",children:[Object(n.jsx)("button",{type:"button",className:"piano-play-button",onClick:function(){oe(a,r,i)}}),Object(n.jsxs)("div",{className:"pianoBox",children:[Object(n.jsx)("button",{type:"button",className:"close pianoCloseButton","aria-label":"Close",onClick:function(){a({type:"REMOVE_PIANO",id:i})},children:Object(n.jsx)("span",{"aria-hidden":"true",children:"\xd7"})}),Object(n.jsx)("ul",{className:"set",children:F(r,i).piano.map((function(e,t){return e.map((function(e){return e.octave=t,Object(n.jsx)(re,{pianoKey:e,handleClick:function(){return function(e,t,o){var n=y("C",t);console.log("You've clicked note: ".concat(i," - ").concat(o," - ").concat(n));var c={};c.noteLetter=n,c.octave=o,a({type:"UPDATE_KEY",id:i,payload:c})}(e.note,e.noteNumber,e.octave)}},"".concat(e.note,"-").concat(t))}))}))})]})]})})},ie=o(25),se=function(e){var t,o,r,a,i=e.pianoComponentId,s=Object(c.useContext)(Q),l=s.state,d=s.dispatch,u=Object(c.useRef)({}),h=F(l,i);u.current.isProgKey=null!==(t=h.isProgKey)&&void 0!==t&&t,u.current.selectedChordKey=null!==(o=h.selectedKey.noteLetter)&&void 0!==o?o:"C",u.current.type=h.selectedChord.type,u.current.id=h.id,u.current.slashChord=null!==(r=h.selectedChord.slash)&&void 0!==r&&r,u.current.slashNote=null!==(a=h.selectedChord.slashNote)&&void 0!==a?a:"",Object(c.useEffect)((function(){T(h.piano)||I(h),l.building||D(h)}));var b=Object.keys(x),j=Object.values(p);return Object(n.jsx)(ie.a,{className:"chordInputForm",children:Object(n.jsxs)(ie.a.Group,{controlId:"chordSelection",children:[Object(n.jsx)("div",{className:"chordInputSelection keySelection",children:Object(n.jsx)(ie.a.Control,{as:"select",value:u.current.selectedChordKey,custom:!0,className:"selectorBox",onChange:function(e){return function(e){null!==e.target.value&&(h.selectedKey.noteLetter=e.target.value,d({type:"UPDATE_KEY",id:h.id,payload:{noteLetter:e.target.value,octave:0}}))}(e)},children:j.map((function(e,t){return Object(n.jsx)("option",{value:e,children:e},t)}))})}),Object(n.jsx)("div",{className:"chordInputSelection typeSelection",children:Object(n.jsx)(ie.a.Control,{className:"selectorBox",as:"select",value:u.current.type,custom:!0,onChange:function(e){return function(e){u.current.type=e.target.value,d({type:"UPDATE_CHORD_TYPE",id:h.id,chordType:u.current.type})}(e)},children:b.map((function(e,t){return Object(n.jsx)("option",{value:e,children:e},t)}))})}),Object(n.jsx)(ie.a.Check,{type:"checkbox",label:"key",checked:u.current.isProgKey,className:"keyCheckBox chordCheckBox",onChange:function(e){return function(e){d({type:"SET_PROG_KEY",keyChecked:e.target.checked,id:h.id})}(e)}},Number(u.current.id)),Object(n.jsx)(ie.a.Check,{type:"checkbox",label:"slash",checked:u.current.slashChord,className:"slashCheckBox chordCheckBox",onChange:function(e){return function(e){u.current.slashChord=e.target.checked,d({type:"UPDATE_SLASH_CHORD",isSlashChord:u.current.slashChord,id:h.id})}(e)}},"slash"+u.current.id),Object(n.jsxs)("div",{className:"slashSelection",children:[Object(n.jsx)("div",{className:"slashSymbol","display-option":"".concat(u.current.slashChord),children:"/"}),Object(n.jsx)("div",{className:"slashChordSelection","display-option":"".concat(u.current.slashChord),children:Object(n.jsx)(ie.a.Control,{className:"selectorBox",as:"select",value:u.current.slashNote,custom:!0,onChange:function(e){return function(e){null!==e.target.value&&(u.current.slashNote=e.target.value,d({type:"UPDATE_SLASH_CHORD",isSlashChord:u.current.slashChord,slashNote:u.current.slashNote,id:h.id}))}(e)},children:j.concat("").map((function(e,t){return Object(n.jsx)("option",{value:e,children:e},t)}))})})]})]})})},le=function(e){var t=e.pianoComponentId;return Object(n.jsx)(n.Fragment,{children:Object(n.jsx)("div",{className:"container chordPiano",id:"piano-"+t,children:Object(n.jsx)("div",{className:"contentBox row",children:Object(n.jsxs)("div",{className:"pianoChordBox",children:[Object(n.jsx)(se,{className:"chordBox",pianoComponentId:t},"c-".concat(t)),Object(n.jsx)(ae,{className:"pianoBox",pianoComponentId:Number(t)},Number(t))]})})})})},de=function(){var e=Object(c.useContext)(Q),t=e.state,o=e.dispatch,a=Object(s.f)();t.history=a;var i=r.a.useState(),l=Object(d.a)(i,2)[1],u=r.a.useCallback((function(){return l({})}),[]);Object(c.useEffect)((function(){console.log("render"),u()}),[t.chordPianoSet,u]),function(e,t,o){var n=N(e),c=t.location.search.replace("?prog=","");c+=t.location.hash,e.building||n===c||(console.log("New chord code provided "+n+" vs "+c),o({type:"BUILD_PROG_FROM_CODE",payload:c}))}(t,a,o);return Object(n.jsxs)("div",{className:"pianoBoard",children:[t.chordPianoSet.map((function(e){return Object(n.jsxs)("div",{children:[Object(n.jsx)(le,{id:"piano-"+e.id,className:"row chordPianoComponent",pianoComponentId:Number(e.id),history:a},"piano-"+e.id),Object(n.jsx)("div",{className:"pianoStrip"},"strip-"+e.id)]},e.id)})),Object(n.jsx)("div",{className:"pianoBoardGutter"})]},"pianoBoard")};var ue=o(37),he=function(){var e=r.a.useState(!1),t=Object(d.a)(e,2),o=t[0],c=t[1];function a(e){return Object(n.jsxs)(ue.a,Object(u.a)(Object(u.a)({},e),{},{size:"l",className:"aboutModal","aria-labelledby":"contained-modal-title-vcenter",centered:!0,children:[Object(n.jsx)(ue.a.Header,{className:"modalHeader",closeButton:!0,children:Object(n.jsx)("div",{className:"headerBackground"})}),Object(n.jsxs)(ue.a.Body,{children:[Object(n.jsx)("p",{className:"aboutDescriptionText",children:"Chord Buildr provides an easy way for musicians and music lovers to create and share chord progressions."}),Object(n.jsx)("hr",{className:"aboutLine"}),Object(n.jsxs)("p",{children:[Object(n.jsxs)("h5",{children:[Object(n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",fill:"currentColor",class:"bi bi-music-note",viewBox:"0 0 16 16",children:[Object(n.jsx)("path",{d:"M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"}),Object(n.jsx)("path",{"fill-rule":"evenodd",d:"M9 3v10H8V3h1z"}),Object(n.jsx)("path",{d:"M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"})]})," ","transpose"]}),Object(n.jsxs)("div",{className:"aboutFeatureText",children:["Mark a chord as the key and the rest of your progression will transpose as you change its root note."," "]}),Object(n.jsx)("br",{}),Object(n.jsxs)("h5",{children:[Object(n.jsxs)("svg",{xmlns:"http://www.w3.org/2000/svg",width:"16",height:"16",fill:"currentColor",class:"bi bi-music-note-beamed",viewBox:"0 0 16 16",children:[Object(n.jsx)("path",{d:"M6 13c0 1.105-1.12 2-2.5 2S1 14.105 1 13c0-1.104 1.12-2 2.5-2s2.5.896 2.5 2zm9-2c0 1.105-1.12 2-2.5 2s-2.5-.895-2.5-2 1.12-2 2.5-2 2.5.895 2.5 2z"}),Object(n.jsx)("path",{"fill-rule":"evenodd",d:"M14 11V2h1v9h-1zM6 3v10H5V3h1z"}),Object(n.jsx)("path",{d:"M5 2.905a1 1 0 0 1 .9-.995l8-.8a1 1 0 0 1 1.1.995V3L5 4V2.905z"})]})," ","share"]}),Object(n.jsx)("div",{className:"aboutFeatureText",children:"To share a progression, simply copy the URL. No account needed!"}),Object(n.jsx)("br",{})]}),Object(n.jsxs)("p",{className:"creditsText",children:["Chord Buildr is an"," ",Object(n.jsx)("a",{className:"modalText",href:"https://github.com/jekrch/chord-buildr",children:"open source"})," ","project ",Object(n.jsx)("br",{})," by"," ",Object(n.jsx)("a",{className:"modalText",href:"https://www.jacobkrch.com",children:"Jacob Krch"})," ","and"," ",Object(n.jsx)("a",{className:"modalText",href:"https://www.linkedin.com/in/teran-keith-210941107/",children:"Teran Keith"})]}),Object(n.jsxs)("p",{className:"copyrightText",children:["\xa9 2020-",(new Date).getFullYear()," Jacob Krch All Rights Reserved"]})]})]}))}return Object(n.jsx)(n.Fragment,{children:Object(n.jsxs)(q.a,{className:"footNav",fixed:"bottom",children:[Object(n.jsx)(q.a.Brand,{href:"https://github.com/jekrch/chord-buildr",children:Object(n.jsx)("img",{className:"gitSrc",src:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NDkxMSwgMjAxMy8xMC8yOS0xMTo0NzoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6RERCMUIwQTM4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6RERCMUIwQTI4NkNFMTFFM0FBNTJFRTMzNTJEMUJDNDYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkU1MTc4QTMyOTlBMDExRTI5QTE1QkMxMDQ2QTg5MDREIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjJBNDE0QUJDOTlBMTExRTI5QTE1QkMxMDQ2QTg5MDREIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+8kSqyAAADD5JREFUeNrsXQ2Q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",alt:"github"})})," ",Object(n.jsx)("div",{className:"footNavText",children:"v1.0"}),Object(n.jsx)("div",{className:"footNavAbout",onClick:function(){return c(!0)},children:"about"}),Object(n.jsx)(a,{show:o,onHide:function(){return c(!1)}}),Object(n.jsx)("h1",{className:"titleText",children:"chord buildr"})]})})},be=function(){return Object(n.jsx)("div",{className:"App",children:Object(n.jsxs)(W,{className:"",children:[Object(n.jsx)(ce,{className:""}),Object(n.jsx)("div",{className:" mainContainer",children:Object(n.jsx)(l.a,{children:Object(n.jsx)(s.c,{children:Object(n.jsx)(s.a,{exact:!0,path:["/","/chord-buildr/"],component:de})})})}),Object(n.jsx)(he,{className:""})]})})},je=function(e){e&&e instanceof Function&&o.e(3).then(o.bind(null,93)).then((function(t){var o=t.getCLS,n=t.getFID,c=t.getFCP,r=t.getLCP,a=t.getTTFB;o(e),n(e),c(e),r(e),a(e)}))};i.a.render(Object(n.jsx)(r.a.StrictMode,{children:Object(n.jsx)(be,{})}),document.getElementById("root")),je()}},[[91,1,2]]]);
//# sourceMappingURL=main.6b4a2332.chunk.js.map