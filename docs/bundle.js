/*! For license information please see bundle.js.LICENSE.txt */
    width: ${t=>t.width};
    height: ${t=>t.height};
`,yg=kb.input`
    width: ${t=>t.width};
    height: ${t=>t.height};
`;async function Ag(t,e=""){const n=[];for(let i=0;i<t.length;i++){const r=t[i];if(r.isDirectory){const t=r.createReader(),i=await new Promise(((e,n)=>{t.readEntries(e,n)}));n.push(...await Ag(i,e+r.name+"/"))}else n.push(r)}return n}function vg(t){const e=nm.useRef(null);nm.useEffect((()=>{e.current&&(e.current.setAttribute("directory",""),e.current.setAttribute("allowdirs",""),e.current.setAttribute("webkitdirectory",""))}),[e]);const n=nm.useCallback((t=>{t.preventDefault(),t.stopPropagation()}),[]),i=nm.useCallback((e=>{e.preventDefault(),e.stopPropagation();const n=e.dataTransfer.items;if(!n)return;const i=[];for(let t=0;t<n.length;++t){const e=n[t].webkitGetAsEntry();e&&i.push(e)}Ag(i).then((e=>{(async function(t){const e=[],n=await Ag(t);for(let t=0;t<n.length;t++){const i=n[t],r=await new Promise(((t,e)=>{i.file(t,e)}));""===r.webkitRelativePath&&(Object.defineProperty(r,"webkitRelativePath",{writable:!0}),r.webkitRelativePath=i.fullPath),e.push(r)}return e})(e).then((e=>{t.onFiles(e)}))}))}),[]),r=nm.useCallback((e=>{e.preventDefault(),e.stopPropagation();const n=e.target.files;if(!n)return;const i=Array.from(n);t.onFiles(i)}),[]);return(0,em.jsx)(gg,{width:t.width,height:t.height,children:(0,em.jsx)(yg,{width:t.width,height:t.height,type:"file",name:"editor-file-drop",ref:e,onDragOver:n,onDrop:i,onChange:r})})}var xg=n(935);function Sg(t){const{children:e,elementId:n}=t,i=nm.useMemo((()=>document.getElementById(n)),[n]);if(!i)throw new Error(`Could not find element with id: ${n}`);return xg.createPortal(e,i)}const Cg=kb.div`
    width: auto;
    min-height: 32px;
    padding: 5px 10px;
    box-sizing: border-box;
    margin-bottom: 3px;
    background-color: #555;
    overflow-x: auto;
    overflow-y: hidden;
    white-space: nowrap;

    ::-webkit-scrollbar {
        display: none;
    }

    &:hover {
        background-color: #666;
    }

    &:active {
        background-color: #777;
    }
`;function wg(t){const e=nm.useCallback((()=>{t.onClick(t.file)}),[t.file,t.onClick]);return(0,em.jsx)(Cg,{onClick:e,children:t.file.name})}const Mg=kb.div`
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    pointer-events: auto;
`,Tg=kb.div`
    width: 400px;
    height: 300px;
    background-color: #333;
    color: #fff;

    display: flex;
    flex-direction: column;
    align-items: center;

    user-select: none;
`,Rg=kb.div`
    width: 100%;
    height: 50px;
    background-color: #444;
    display: flex;
    justify-content: center;
    align-items: center;
`,Eg=kb.div`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: calc(100% - 50px);
    box-sizing: border-box;
`,Dg=kb.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    box-sizing: border-box;
    overflow: auto;
    width: 100%;
    
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`;function Ig(t){const e=nm.useCallback((()=>{t.onCanceled()}),[t.onCanceled]),n=nm.useCallback((t=>{t.stopPropagation()}),[]),i=nm.useCallback((e=>{t.onSelected(e)}),[t.onSelected]);return(0,em.jsx)(Sg,{elementId:"react-root",children:(0,em.jsx)(Mg,{onClick:e,children:(0,em.jsxs)(Tg,{onClick:n,children:[(0,em.jsx)(Rg,{children:t.title}),(0,em.jsx)(Eg,{children:(0,em.jsx)(Dg,{children:t.files.map((t=>(0,em.jsx)(wg,{file:t,onClick:i},t.name)))})})]})})})}const kg=kb.div`
    width: ${t=>t.width};
    height: ${t=>t.height};
    margin: 10px;
    margin-top: 0;
    box-sizing: border-box;
    background-color: #444;
`,Pg=kb.div`
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    font-size: 16px;
    background-color: #333;
    margin-bottom: 10px;
    user-select: none;
`,Lg=kb.div`
    width: 100%;
    height: calc(100% - 66px);
`;function Bg(t){return(0,em.jsxs)(kg,{width:t.width,height:t.height,children:[(0,em.jsx)(Pg,{children:t.title}),(0,em.jsx)(Lg,{children:t.children})]})}const Fg=kb.div`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 5px;
`,Og=kb.div`
    width: auto;
`;function Ng(t){return(0,em.jsxs)(Fg,{children:[(0,em.jsxs)(Og,{children:[t.title,": "]}),t.children]})}const Wg=kb.span`
    overflow-x: auto;
    white-space: nowrap;

    ::-webkit-scrollbar {
        display: none;
    }
`;function jg(t){return(0,em.jsx)(Ng,{title:t.title,children:(0,em.jsx)(Wg,{children:t.content})})}const Ug=kb.div`
    width: 180px;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`,Gg=kb.input`
    width: 60px;
    outline: none;
    overflow: hidden;
`;function zg(t){const[e,n,i]=t.value,r=nm.useCallback((e=>{const n=""===e.target.value?0:parseFloat(e.target.value),i=parseInt(e.target.name,10),r=[...t.value];r[i]=n,t.onChange(r)}),[t.value,t.onChange]);return(0,em.jsxs)(Ug,{children:[(0,em.jsx)(Gg,{type:"number",value:e,name:"0",onChange:r}),(0,em.jsx)(Gg,{type:"number",value:n,name:"1",onChange:r}),(0,em.jsx)(Gg,{type:"number",value:i,name:"2",onChange:r})]})}function Vg(t){const e=nm.useCallback((e=>{t.onChange(e.target.checked)}),[t.onChange]);return(0,em.jsx)("input",{type:"checkbox",checked:t.value,onChange:e,disabled:!t.enabled})}const Hg=kb.div`
    display: flex;
    flex-direction: column;
    margin: 10px;
    margin-top: 0;
    overflow: auto;

    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`,Xg=kb.div`
    height: 10px;
`,Yg=kb.button`
    width: 100%;
    height: 30px;
    margin: 10px 0;
    color: #fff;
    border: none;

    background-color: #f00;

    :hover {
        background-color: #f44;
    }

    :active {
        background-color: #f88;
    }
`,Qg=nm.memo((function(t){const[e,n]=nm.useState(0),[i,r]=nm.useState({ref:t.target}),o=am();nm.useEffect((()=>{r({ref:t.target})}),[t.target]);const a=nm.useCallback((t=>{i.ref.transform.position.set(t[0],t[1],t[2]),n(e+1)}),[i,e]),s=nm.useCallback((t=>{i.ref.transform.eulerAngles.set(t[0]*L,t[1]*L,t[2]*L),n(e+1)}),[i,e]),c=nm.useCallback((t=>{const r=i.ref.skinnedMesh;r&&(r.castShadow=t),n(e+1)}),[i,e]),l=nm.useCallback((t=>{const r=i.ref.skinnedMesh;r&&(r.receiveShadow=t),n(e+1)}),[i,e]),_=nm.useCallback((()=>{o.removeModel(i.ref),i.ref.removeAnimation(i.ref.animations.keys().next().value),P()}),[i,o]),[u,p]=nm.useState(!1),[d,h]=nm.useState([]),[f,m]=nm.useState(null),b=nm.useCallback((t=>{if(0!==(t=t.filter((t=>t.name.endsWith(".mp3")))).length)if(1===t.length){m(t[0].name);const e=URL.createObjectURL(t[0]);o.audioPlayer.asyncSetAudioFromUrl(e,(()=>{URL.revokeObjectURL(e),P(!0)}))}else h(t),p(!0)}),[o]),g=nm.useCallback((()=>{p(!1)}),[]),y=nm.useCallback((t=>{m(t.name);const e=URL.createObjectURL(t);o.audioPlayer.asyncSetAudioFromUrl(e,(()=>{URL.revokeObjectURL(e),P(!0)})),p(!1)}),[o]),[A,v]=nm.useState(!1),[x,S]=nm.useState([]),[C,w]=nm.useState(""),M=nm.useCallback((t=>{if(!i.ref.isAnimationLoading(C)&&0!==(t=t.filter((t=>t.name.endsWith(".vmd")))).length)if(1===t.length){i.ref.removeAnimation(C),o.audioPlayer.enabled=!1,o.animationPlayer.enabled=!1,i.ref instanceof Kf&&i.ref.poseToDefault();const e=t[0];w(e.name);const n=URL.createObjectURL(e);i.ref.asyncLoadAnimation(e.name,n,(()=>{URL.revokeObjectURL(n),r({ref:i.ref}),P()})),r({ref:i.ref})}else S(t),v(!0)}),[i,C]),T=nm.useCallback((()=>{i.ref.removeAnimation(C),o.audioPlayer.enabled=!1,o.animationPlayer.enabled=!1,i.ref instanceof Kf&&i.ref.poseToDefault(),w(""),r({ref:i.ref}),P()}),[i,C]),R=nm.useCallback((()=>{v(!1)}),[]),E=nm.useCallback((t=>{i.ref.removeAnimation(C),o.audioPlayer.enabled=!1,o.animationPlayer.enabled=!1,i.ref instanceof Kf&&i.ref.poseToDefault(),w(t.name);const e=URL.createObjectURL(t);i.ref.asyncLoadAnimation(t.name,e,(()=>{URL.revokeObjectURL(e),r({ref:i.ref}),P()})),v(!1),r({ref:i.ref})}),[i,C]),D=nm.useCallback((t=>{i.ref.gameObject.getComponent(bg).usePhysics=t,r({ref:i.ref})}),[i]),I=nm.useCallback((t=>{i.ref.gameObject.getComponent(bg).useIk=t,r({ref:i.ref})}),[i]),k=nm.useCallback((t=>[t[0]*B,t[1]*B,t[2]*B]),[]),P=nm.useCallback((t=>{const e=o.models,n=o.camera,i=o.audioPlayer,r=o.mmdController,a=o.animationPlayer;a.stop(),r.removeAllMmdPlayers(),r.removeAllModelLoaders(),null===f&&!t||null!==a.animationClock||(a.animationClock=new Pb(i)),r.cameraLoader=n;for(let t=0;t<e.length;++t){const n=e[t];if(0===n.animations.size)continue;n.poseToDefault();let i=n.gameObject.getComponent(bg);const o=i?.usePhysics??!0,a=i?.useIk??!0;i&&i.destroy(),i=n.gameObject.addComponent(bg),i.usePhysics=o,i.useIk=a,r.addMmdPlayer(i),r.addModelLoader(n)}const s=[];for(let t=0;t<e.length;++t){const n=e[t];globalThis.model=n,0!==n.animations.size&&s.push(n.animations.keys().next().value)}0!==s.length&&(i.enabled=!0,a.enabled=!0,r.asyncPlay(s,n.animations.keys().next().value))}),[o,f]);return(0,em.jsx)(Bg,{title:"Inspector",width:t.width,height:t.height,children:i.ref?.exists?(0,em.jsxs)(Hg,{children:[i.ref instanceof Kf&&(0,em.jsxs)(em.Fragment,{children:[(0,em.jsx)(Ng,{title:"position",children:(0,em.jsx)(zg,{value:i.ref.transform.position.toArray(),onChange:a})}),(0,em.jsx)(Ng,{title:"rotation",children:(0,em.jsx)(zg,{value:k(i.ref.transform.eulerAngles.toArray()),onChange:s})}),(0,em.jsx)(Xg,{}),(0,em.jsx)(Ng,{title:"cast shadow",children:(0,em.jsx)(Vg,{value:i.ref.skinnedMesh?.castShadow??!0,onChange:c,enabled:null!==i.ref.skinnedMesh})}),(0,em.jsx)(Ng,{title:"receive shadow",children:(0,em.jsx)(Vg,{value:i.ref.skinnedMesh?.receiveShadow??!0,onChange:l,enabled:null!==i.ref.skinnedMesh})}),(0,em.jsx)(Xg,{}),(0,em.jsx)(jg,{title:"model",content:i.ref.gameObject.name}),(0,em.jsx)(Yg,{onClick:_,children:"remove model"})]}),i.ref instanceof Hs&&(0,em.jsxs)(em.Fragment,{children:[(0,em.jsx)(jg,{title:"mp3 file",content:f??"none"}),(0,em.jsx)(vg,{onFiles:b}),(0,em.jsx)(Xg,{}),u&&(0,em.jsx)(Ig,{title:"Multiple Sound Files Have Been Found",files:d,onCanceled:g,onSelected:y})]}),(i.ref instanceof Hs||i.ref instanceof Kf)&&(0,em.jsxs)(em.Fragment,{children:[(0,em.jsx)(jg,{title:"motion",content:i.ref.isAnimationLoading(C)?"loading...":i.ref.animations.size>0?i.ref.animations.keys().next().value:"none"}),(0,em.jsx)(vg,{onFiles:M}),(0,em.jsx)(Yg,{onClick:T,children:"remove motion"}),A&&(0,em.jsx)(Ig,{title:"Multiple Motions Have Been Found",files:x,onCanceled:R,onSelected:E})]}),i.ref instanceof Kf&&(0,em.jsxs)(em.Fragment,{children:[(0,em.jsx)(Ng,{title:"use physics",children:(0,em.jsx)(Vg,{value:i.ref.gameObject.getComponent(bg)?.usePhysics??!0,onChange:D,enabled:null!==i.ref.gameObject.getComponent(bg)})}),(0,em.jsx)(Ng,{title:"use ik",children:(0,em.jsx)(Vg,{value:i.ref.gameObject.getComponent(bg)?.useIk??!0,onChange:I,enabled:null!==i.ref.gameObject.getComponent(bg)})})]})]}):(0,em.jsx)(em.Fragment,{children:"  "})})})),Zg=kb.div`
    width: auto;
    min-height: 32px;
    padding: 5px 10px;
    box-sizing: border-box;
    margin-bottom: 3px;
    background-color: ${t=>t.selected?"#585":"#555"};
    overflow-x: auto;
    white-space: nowrap;
    
    ::-webkit-scrollbar {
        display: none;
    }

    &:hover {
        background-color: ${t=>t.selected?"#585":"#666"};
    }

    &:active {
        background-color: ${t=>t.selected?"#585":"#777"};
    }
`;function qg(t){const e=nm.useCallback((()=>{t.onClick(t.model)}),[t.model,t.onClick]);return(0,em.jsx)(Zg,{onClick:e,selected:t.selected,children:t.name})}const Jg=kb(Zg)`
    background-color: #68689e;

    &:hover {
        background-color: #8484ad;
    }

    &:active {
        background-color: #83839c;
    }
`;function Kg(t){return(0,em.jsx)(Jg,{children:(0,em.jsx)(vg,{...t,width:"100%",height:"100%"})})}const $g=kb.div`
    display: flex;
    flex-direction: column;
    padding: 10px;
    padding-top: 0;
    overflow: auto;
    user-select: none;
    height: 100%;
    
    ::-webkit-scrollbar {
        width: 4px;
        height: 4px;
        background-color: #333;
    }

    ::-webkit-scrollbar-thumb {
        background-color: #555;
    }
`,ty=nm.memo((function(t){const[e,n]=nm.useState({ref:[]}),[i,r]=nm.useState(!1),[o,a]=nm.useState([]),[s,c]=nm.useState([]),[l,_]=nm.useState(null),u=am(),p=nm.useCallback((e=>{e.includes(l)||(_(null),t.onTargetSelected(null)),n({ref:e})}),[l,t.onTargetSelected]);nm.useEffect((()=>(u.onModelsUpdated.addListener(p),()=>{u.onModelsUpdated.removeListener(p)})),[u,p]);const d=nm.useCallback((()=>{r(!1)}),[]),h=nm.useCallback((t=>{u.spawnModel(t,o),r(!1)}),[u,o]),f=nm.useCallback((t=>{const e=t.filter((t=>t.name.endsWith(".pmx")));0!==e.length?1===e.length?u.spawnModel(e[0],t):(a(t),c(e),r(!0)):alert("No pmx files found.")}),[u]),m=nm.useCallback((e=>{l!==e&&(_(e),t.onTargetSelected(e))}),[t.onTargetSelected,l]),b=nm.useMemo((()=>e.ref.map((t=>(0,em.jsx)(qg,{name:t.gameObject.name,model:t,selected:t===l,onClick:m},t.instanceId)))),[e,m,l]);return(0,em.jsx)(Bg,{title:"Objects",width:t.width,height:t.height,children:(0,em.jsxs)($g,{children:[(0,em.jsx)(qg,{name:"Camera",model:u.camera,selected:u.camera===l,onClick:m}),b,(0,em.jsx)(Kg,{onFiles:f}),i&&(0,em.jsx)(Ig,{title:"Multiple Models Have Been Found",files:s,onCanceled:d,onSelected:h})]})})})),ey=kb.div`
    position: absolute;
    top: 0;
    right: ${t=>t.hidden?"-300px":"0"};
    width: 300px;
    height: 90%;
    background-color: #222;
    color: #fff;

    display: flex;
    flex-direction: column;

    padding-top: 10px;
    box-sizing: border-box;

    transition: right 0.5s;

    pointer-events: auto;
`,ny=kb.div`
    position: absolute;
    top: 0;
    right: 300px;
    width: 20px;
    height: 20px;

    background-color: #222;
    text-align: center;
    user-select: none;
`;function iy(){const[t,e]=nm.useState(!1),[n,i]=nm.useState(null),r=nm.useCallback((()=>{e(!t)}),[t]),o=nm.useCallback((t=>{i(t)}),[]);return(0,em.jsxs)(ey,{hidden:t,children:[(0,em.jsx)(ny,{onClick:r,children:t?"<":">"}),(0,em.jsx)(ty,{height:"calc(100% - 400px)",onTargetSelected:o}),(0,em.jsx)(Qg,{height:"400px",target:n})]})}function ry(){return(0,em.jsx)(iy,{})}class oy extends $e{requiredComponents=[tm];_reactDomRoot=null;_reactRootDiv=null;awake(){const t=this.gameObject.getComponent(tm),e=this._reactRootDiv=document.createElement("div");e.id="react-root",e.style.position="absolute",e.style.width="100%",e.style.height="calc(100% - 30px)",e.style.overflow="hidden",e.style.visibility="hidden",e.style.fontFamily="sans-serif",e.style.pointerEvents="none",this.engine.domElement.appendChild(e),(this._reactDomRoot=im.createRoot(e)).render((0,em.jsx)(nm.StrictMode,{children:(0,em.jsx)(om,{controller:t,children:(0,em.jsx)(ry,{})})}))}onEnable(){this._reactRootDiv.style.visibility="visible"}onDisable(){this._reactRootDiv.style.visibility="hidden"}onDestroy(){this._reactDomRoot&&(this._reactDomRoot.unmount(),this._reactDomRoot=null),this._reactRootDiv&&(this._reactRootDiv.remove(),this._reactRootDiv=null)}}class ay extends $e{static requiredComponents=[ms];_mmdPlayers=[];_animationSequencePlayer=null;_modelLoaders=[];_cameraLoader=null;_physicsUnitStep=1/65;_physicsMaximumStepCount=3;_gravity=new G(0,-98,0);_onLoadCompleteEvent=new u;_initializeFunction=null;_readyToPlay=!1;awake(){this._animationSequencePlayer=this.gameObject.getComponent(ms)}start(){this._readyToPlay=!0,null!==this._initializeFunction&&(this._initializeFunction(),this._initializeFunction=null)}asyncPlay(t,e){if(this._readyToPlay){if(0===this._modelLoaders.length)throw new Error("modelLoader is empty");if(e&&null===this._cameraLoader)throw new Error("cameraLoader is null");this.startCoroutine(this.playInternal(t,e))}else this._initializeFunction=()=>{this.asyncPlay(t,e)}}*playInternal(t,e){let n=null,i=null;if(e){const t=this._cameraLoader;for(;t.isAnimationLoading(e);)yield null;n=t.camera,i=t.animations.get(e)}const r=null!==n&&null!==i?Vs.createInstance(n,i):null,o=this._modelLoaders;for(let e=0;e<o.length;++e){const n=o[e],i=t instanceof Array?t[e]:t;for(;null===n.skinnedMesh||n.isAnimationLoading(i);)yield null}const a=this._mmdPlayers,s=a.length;if(s!==o.length)throw new Error("mmdPlayer count must be equal to modelLoader count");let c=0;for(let e=0;e<s;++e){const n=a[e],i=o[e],r=i.object3DContainer,s=t instanceof Array?t[e]:t,l=i.animations.get(s);n.manualUpdate=!0,n.play(r,{animation:l,unitStep:this._physicsUnitStep,maxStepNum:this._physicsMaximumStepCount}),c=Math.max(c,n.animationEndFrame)}const l=a[0];this._animationSequencePlayer.setAnimationAndBind(new os([new rs(hs.createScalarTrack([new ps(0,0,_s.Linear),new ps(c,c,_s.Linear)]))]),[1===o.length?t=>{l.process(t),r?.process(t)}:t=>{for(let e=0;e<s;++e)a[e].process(t),r?.process(t)}]),this._onLoadCompleteEvent.invoke(),this._animationSequencePlayer.play()}addMmdPlayer(t){this._mmdPlayers.push(t)}removeMmdPlayer(t){const e=this._mmdPlayers.indexOf(t);e>=0&&this._mmdPlayers.splice(e,1)}removeAllMmdPlayers(){this._mmdPlayers.length=0}get modelLoaders(){return this._modelLoaders}addModelLoader(t){this._modelLoaders.push(t)}removeModelLoader(t){const e=this._modelLoaders.indexOf(t);e>=0&&this._modelLoaders.splice(e,1)}removeAllModelLoaders(){this._modelLoaders.length=0}get cameraLoader(){return this._cameraLoader}set cameraLoader(t){this._cameraLoader=t}get physicsUnitStep(){return this._physicsUnitStep}set physicsUnitStep(t){this._physicsUnitStep=t;const e=this._mmdPlayers;for(let n=0;n<e.length;++n){const i=e[n].mixer;i&&i.physics&&(i.physics.unitStep=t)}}get physicsMaximumStepCount(){return this._physicsMaximumStepCount}set physicsMaximumStepCount(t){this._physicsMaximumStepCount=t;const e=this._mmdPlayers;for(let n=0;n<e.length;++n){const i=e[n].mixer;i&&i.physics&&(i.physics.maxStepNum=t)}}get gravity(){return this._gravity}set gravity(t){this._gravity.copy(t);const e=this._mmdPlayers;for(let n=0;n<e.length;++n){const i=e[n].mixer;i&&i.physics&&i.physics.gravity.copy(t)}}get onLoadComplete(){return this._onLoadCompleteEvent}}class sy{constructor(t,e){this.te=t.transform;const n=Object.getOwnPropertyNames(e);for(const t of n){const n=e[t];Object.defineProperty(this,t,{get:()=>n,set:n=>{e[t]=n},configurable:!0})}const i=new Map;this.Da(e,i);for(const[t,n]of i)this[t]=n.bind(e);this.Qa()}Da(t,e){const n=t.__proto__;t!==$.prototype&&this.Da(n,e);const i=Object.getOwnPropertyNames(n);for(const t of i){if("constructor"===t)continue;if(t.startsWith("_"))continue;const i=n[t];e.set(t,i)}}Qa(){const t=this.te.unsafeGetObject3D(),e=["id","uuid","name","parent","children","up","position","rotation","quaternion","scale","matrix","matrixWorld"];for(let n=0;n<e.length;n++){const i=e[n];Object.defineProperty(this,i,{get:()=>t[i],set:e=>{t[i]=e}})}const n=["add","applyMatrix4","applyQuaternion","attach","clear","getWorldDirection","getWorldPosition","getWorldQuaternion","getWorldScale","localToWorld","remove","removeFromParent","rotateOnAxis","rotateOnWorldAxis","rotateX","rotateY","rotateZ","setRotationFromAxisAngle","setRotationFromEuler","setRotationFromMatrix","setRotationFromQuaternion","translateOnAxis","translateX","translateY","translateZ","updateMatrix","updateMatrixWorld","updateWorldMatrix","worldToLocal"];for(let e=0;e<n.length;e++){const i=n[e];this[i]=t[i].bind(t)}this.lookAt=(e,n,i)=>{t.isCamera=!0,t.lookAt(e,n,i),t.isCamera=!1}}static createInterface(t){if(null===t.threeCamera)throw new Error("DuckThreeCamera must be constructed after Camera onEnable message called");let e=this.duckPool.get(t.threeCamera);return e||(e=new sy(t,t.threeCamera),this.duckPool.set(t.threeCamera,e)),e}}sy.duckPool=new Map,nn.removeCameraFromDuckPool=function(t){sy.duckPool.delete(t)};const cy={type:"change"},ly={type:"start"},_y={type:"end"};class uy extends kc{constructor(t,e){super(),void 0===e&&console.warn('THREE.OrbitControls: The second parameter "domElement" is now mandatory.'),e===document&&console.error('THREE.OrbitControls: "document" should not be used as the target "domElement". Please use "renderer.domElement" instead.'),this.object=t,this.domElement=e,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new dl,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:0,MIDDLE:1,RIGHT:2},this.touches={ONE:0,TWO:2},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(t){t.addEventListener("keydown",z),this._domElementKeyEvents=t},this.saveState=function(){n.target0.copy(n.target),n.position0.copy(n.object.position),n.zoom0=n.object.zoom},this.reset=function(){n.target.copy(n.target0),n.object.position.copy(n.position0),n.object.zoom=n.zoom0,n.object.updateProjectionMatrix(),n.dispatchEvent(cy),n.update(),r=i.NONE},this.update=function(){const e=new dl,u=(new pl).setFromUnitVectors(t.up,new dl(0,1,0)),p=u.clone().invert(),d=new dl,h=new pl,f=2*Math.PI;return function(){const t=n.object.position;e.copy(t).sub(n.target),e.applyQuaternion(u),a.setFromVector3(e),n.autoRotate&&r===i.NONE&&S(2*Math.PI/60/60*n.autoRotateSpeed),n.enableDamping?(a.theta+=s.theta*n.dampingFactor,a.phi+=s.phi*n.dampingFactor):(a.theta+=s.theta,a.phi+=s.phi);let m=n.minAzimuthAngle,b=n.maxAzimuthAngle;return isFinite(m)&&isFinite(b)&&(m<-Math.PI?m+=f:m>Math.PI&&(m-=f),b<-Math.PI?b+=f:b>Math.PI&&(b-=f),a.theta=m<=b?Math.max(m,Math.min(b,a.theta)):a.theta>(m+b)/2?Math.max(m,a.theta):Math.min(b,a.theta)),a.phi=Math.max(n.minPolarAngle,Math.min(n.maxPolarAngle,a.phi)),a.makeSafe(),a.radius*=c,a.radius=Math.max(n.minDistance,Math.min(n.maxDistance,a.radius)),!0===n.enableDamping?n.target.addScaledVector(l,n.dampingFactor):n.target.add(l),e.setFromSpherical(a),e.applyQuaternion(p),t.copy(n.target).add(e),n.object.lookAt(n.target),!0===n.enableDamping?(s.theta*=1-n.dampingFactor,s.phi*=1-n.dampingFactor,l.multiplyScalar(1-n.dampingFactor)):(s.set(0,0,0),l.set(0,0,0)),c=1,!!(_||d.distanceToSquared(n.object.position)>o||8*(1-h.dot(n.object.quaternion))>o)&&(n.dispatchEvent(cy),d.copy(n.object.position),h.copy(n.object.quaternion),_=!1,!0)}}(),this.dispose=function(){n.domElement.removeEventListener("contextmenu",V),n.domElement.removeEventListener("pointerdown",N),n.domElement.removeEventListener("pointercancel",U),n.domElement.removeEventListener("wheel",G),n.domElement.removeEventListener("pointermove",W),n.domElement.removeEventListener("pointerup",j),null!==n._domElementKeyEvents&&n._domElementKeyEvents.removeEventListener("keydown",z)};const n=this,i={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let r=i.NONE;const o=1e-6,a=new df,s=new df;let c=1;const l=new dl;let _=!1;const u=new Uc,p=new Uc,d=new Uc,h=new Uc,f=new Uc,m=new Uc,b=new Uc,g=new Uc,y=new Uc,A=[],v={};function x(){return Math.pow(.95,n.zoomSpeed)}function S(t){s.theta-=t}function C(t){s.phi-=t}const w=function(){const t=new dl;return function(e,n){t.setFromMatrixColumn(n,0),t.multiplyScalar(-e),l.add(t)}}(),M=function(){const t=new dl;return function(e,i){!0===n.screenSpacePanning?t.setFromMatrixColumn(i,1):(t.setFromMatrixColumn(i,0),t.crossVectors(n.object.up,t)),t.multiplyScalar(e),l.add(t)}}(),T=function(){const t=new dl;return function(e,i){const r=n.domElement;if(n.object.isPerspectiveCamera){const o=n.object.position;t.copy(o).sub(n.target);let a=t.length();a*=Math.tan(n.object.fov/2*Math.PI/180),w(2*e*a/r.clientHeight,n.object.matrix),M(2*i*a/r.clientHeight,n.object.matrix)}else n.object.isOrthographicCamera?(w(e*(n.object.right-n.object.left)/n.object.zoom/r.clientWidth,n.object.matrix),M(i*(n.object.top-n.object.bottom)/n.object.zoom/r.clientHeight,n.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),n.enablePan=!1)}}();function R(t){n.object.isPerspectiveCamera?c/=t:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom*t)),n.object.updateProjectionMatrix(),_=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function E(t){n.object.isPerspectiveCamera?c*=t:n.object.isOrthographicCamera?(n.object.zoom=Math.max(n.minZoom,Math.min(n.maxZoom,n.object.zoom/t)),n.object.updateProjectionMatrix(),_=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),n.enableZoom=!1)}function D(t){u.set(t.clientX,t.clientY)}function I(t){h.set(t.clientX,t.clientY)}function k(){if(1===A.length)u.set(A[0].pageX,A[0].pageY);else{const t=.5*(A[0].pageX+A[1].pageX),e=.5*(A[0].pageY+A[1].pageY);u.set(t,e)}}function P(){if(1===A.length)h.set(A[0].pageX,A[0].pageY);else{const t=.5*(A[0].pageX+A[1].pageX),e=.5*(A[0].pageY+A[1].pageY);h.set(t,e)}}function L(){const t=A[0].pageX-A[1].pageX,e=A[0].pageY-A[1].pageY,n=Math.sqrt(t*t+e*e);b.set(0,n)}function B(t){if(1==A.length)p.set(t.pageX,t.pageY);else{const e=Y(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);p.set(n,i)}d.subVectors(p,u).multiplyScalar(n.rotateSpeed);const e=n.domElement;S(2*Math.PI*d.x/e.clientHeight),C(2*Math.PI*d.y/e.clientHeight),u.copy(p)}function F(t){if(1===A.length)f.set(t.pageX,t.pageY);else{const e=Y(t),n=.5*(t.pageX+e.x),i=.5*(t.pageY+e.y);f.set(n,i)}m.subVectors(f,h).multiplyScalar(n.panSpeed),T(m.x,m.y),h.copy(f)}function O(t){const e=Y(t),i=t.pageX-e.x,r=t.pageY-e.y,o=Math.sqrt(i*i+r*r);g.set(0,o),y.set(0,Math.pow(g.y/b.y,n.zoomSpeed)),R(y.y),b.copy(g)}function N(t){!1!==n.enabled&&(0===A.length&&(n.domElement.setPointerCapture(t.pointerId),n.domElement.addEventListener("pointermove",W),n.domElement.addEventListener("pointerup",j)),function(t){A.push(t)}(t),"touch"===t.pointerType?function(t){switch(X(t),A.length){case 1:switch(n.touches.ONE){case 0:if(!1===n.enableRotate)return;k(),r=i.TOUCH_ROTATE;break;case 1:if(!1===n.enablePan)return;P(),r=i.TOUCH_PAN;break;default:r=i.NONE}break;case 2:switch(n.touches.TWO){case 2:if(!1===n.enableZoom&&!1===n.enablePan)return;n.enableZoom&&L(),n.enablePan&&P(),r=i.TOUCH_DOLLY_PAN;break;case 3:if(!1===n.enableZoom&&!1===n.enableRotate)return;n.enableZoom&&L(),n.enableRotate&&k(),r=i.TOUCH_DOLLY_ROTATE;break;default:r=i.NONE}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ly)}(t):function(t){let e;switch(t.button){case 0:e=n.mouseButtons.LEFT;break;case 1:e=n.mouseButtons.MIDDLE;break;case 2:e=n.mouseButtons.RIGHT;break;default:e=-1}switch(e){case 1:if(!1===n.enableZoom)return;!function(t){b.set(t.clientX,t.clientY)}(t),r=i.DOLLY;break;case 0:if(t.ctrlKey||t.metaKey||t.shiftKey){if(!1===n.enablePan)return;I(t),r=i.PAN}else{if(!1===n.enableRotate)return;D(t),r=i.ROTATE}break;case 2:if(t.ctrlKey||t.metaKey||t.shiftKey){if(!1===n.enableRotate)return;D(t),r=i.ROTATE}else{if(!1===n.enablePan)return;I(t),r=i.PAN}break;default:r=i.NONE}r!==i.NONE&&n.dispatchEvent(ly)}(t))}function W(t){!1!==n.enabled&&("touch"===t.pointerType?function(t){switch(X(t),r){case i.TOUCH_ROTATE:if(!1===n.enableRotate)return;B(t),n.update();break;case i.TOUCH_PAN:if(!1===n.enablePan)return;F(t),n.update();break;case i.TOUCH_DOLLY_PAN:if(!1===n.enableZoom&&!1===n.enablePan)return;!function(t){n.enableZoom&&O(t),n.enablePan&&F(t)}(t),n.update();break;case i.TOUCH_DOLLY_ROTATE:if(!1===n.enableZoom&&!1===n.enableRotate)return;!function(t){n.enableZoom&&O(t),n.enableRotate&&B(t)}(t),n.update();break;default:r=i.NONE}}(t):function(t){switch(r){case i.ROTATE:if(!1===n.enableRotate)return;!function(t){p.set(t.clientX,t.clientY),d.subVectors(p,u).multiplyScalar(n.rotateSpeed);const e=n.domElement;S(2*Math.PI*d.x/e.clientHeight),C(2*Math.PI*d.y/e.clientHeight),u.copy(p),n.update()}(t);break;case i.DOLLY:if(!1===n.enableZoom)return;!function(t){g.set(t.clientX,t.clientY),y.subVectors(g,b),y.y>0?R(x()):y.y<0&&E(x()),b.copy(g),n.update()}(t);break;case i.PAN:if(!1===n.enablePan)return;!function(t){f.set(t.clientX,t.clientY),m.subVectors(f,h).multiplyScalar(n.panSpeed),T(m.x,m.y),h.copy(f),n.update()}(t)}}(t))}function j(t){H(t),0===A.length&&(n.domElement.releasePointerCapture(t.pointerId),n.domElement.removeEventListener("pointermove",W),n.domElement.removeEventListener("pointerup",j)),n.dispatchEvent(_y),r=i.NONE}function U(t){H(t)}function G(t){!1!==n.enabled&&!1!==n.enableZoom&&r===i.NONE&&(t.preventDefault(),n.dispatchEvent(ly),function(t){t.deltaY<0?E(x()):t.deltaY>0&&R(x()),n.update()}(t),n.dispatchEvent(_y))}function z(t){!1!==n.enabled&&!1!==n.enablePan&&function(t){let e=!1;switch(t.code){case n.keys.UP:T(0,n.keyPanSpeed),e=!0;break;case n.keys.BOTTOM:T(0,-n.keyPanSpeed),e=!0;break;case n.keys.LEFT:T(n.keyPanSpeed,0),e=!0;break;case n.keys.RIGHT:T(-n.keyPanSpeed,0),e=!0}e&&(t.preventDefault(),n.update())}(t)}function V(t){!1!==n.enabled&&t.preventDefault()}function H(t){delete v[t.pointerId];for(let e=0;e<A.length;e++)if(A[e].pointerId==t.pointerId)return void A.splice(e,1)}function X(t){let e=v[t.pointerId];void 0===e&&(e=new Uc,v[t.pointerId]=e),e.set(t.pageX,t.pageY)}function Y(t){const e=t.pointerId===A[0].pointerId?A[1]:A[0];return v[e.pointerId]}n.domElement.addEventListener("contextmenu",V),n.domElement.addEventListener("pointerdown",N),n.domElement.addEventListener("pointercancel",U),n.domElement.addEventListener("wheel",G,{passive:!1}),this.update()}}class py extends $e{_camera=null;_orbitControls=null;_target=new G(0,0,0);_minDistance=20;_maxDistance=50;_maxPolarAngle=Math.PI/2;_enableDamping=!0;_dampingFactor=.05;awake(){this._camera=this.gameObject.getComponent(nn)}start(){const t=this._orbitControls=new uy(sy.createInterface(this._camera),this.engine.webGL.webglRenderer.domElement);t.listenToKeyEvents(window),t.enableDamping=this._enableDamping,t.dampingFactor=this._dampingFactor,t.screenSpacePanning=!0,t.minDistance=this._minDistance,t.maxDistance=this._maxDistance,t.maxPolarAngle=this._maxPolarAngle,t.target=this._target}onEnable(){this._orbitControls&&(this._orbitControls.enabled=!0)}onDisable(){this._orbitControls&&(this._orbitControls.enabled=!1)}update(){this._orbitControls.update()}onDestroy(){this._orbitControls.dispose(),this._orbitControls=null,this._camera=null}get target(){return this._target}set target(t){this._target.copy(t),this._orbitControls&&(this._orbitControls.target=this._target)}get minDistance(){return this._minDistance}set minDistance(t){this._minDistance=t,this._orbitControls&&(this._orbitControls.minDistance=t)}get maxDistance(){return this._maxDistance}set maxDistance(t){this._maxDistance=t,this._orbitControls&&(this._orbitControls.maxDistance=t)}get maxPolarAngle(){return this._maxPolarAngle}set maxPolarAngle(t){this._maxPolarAngle=t,this._orbitControls&&(this._orbitControls.maxPolarAngle=t)}get enableDamping(){return this._enableDamping}set enableDamping(t){this._enableDamping=t,this._orbitControls&&(this._orbitControls.enableDamping=t)}get dampingFactor(){return this._dampingFactor}set dampingFactor(t){this._dampingFactor=t,this._orbitControls&&(this._orbitControls.dampingFactor=t)}}class dy extends $e{orbitCamera=null;_switchCameraButton=null;_fullscreenButton=null;_ready=!1;onEnable(){this._ready=!0,this._switchCameraButton?.addEventListener("click",this.onSwitchCameraButtonClick),this._fullscreenButton?.addEventListener("click",this.onFullscreenButtonClick),document.addEventListener("fullscreenchange",this.onFullscreenChange),this.orbitCamera&&(this.orbitCamera.gameObject.activeSelf=-1!==this.orbitCamera.priority)}onDisable(){this._ready=!0,this._switchCameraButton?.removeEventListener("click",this.onSwitchCameraButtonClick),this._fullscreenButton?.removeEventListener("click",this.onFullscreenButtonClick),document.removeEventListener("fullscreenchange",this.onFullscreenChange)}onSwitchCameraButtonClick=()=>{this.orbitCamera&&(-1===this.orbitCamera.priority?(this.orbitCamera.priority=1,this.orbitCamera.gameObject.activeSelf=!0):(this.orbitCamera.priority=-1,this.orbitCamera.gameObject.activeSelf=!1))};onFullscreenButtonClick=()=>{this._fullscreenButton&&("fullscreen"===this._fullscreenButton.innerText?document.body.requestFullscreen():document.exitFullscreen())};onFullscreenChange=()=>{this._fullscreenButton&&(this._fullscreenButton.innerText="fullscreen"===this._fullscreenButton.innerText?"exit":"fullscreen")};get switchCameraButton(){return this._switchCameraButton}set switchCameraButton(t){this._switchCameraButton=t,t&&this._ready&&t.addEventListener("click",this.onSwitchCameraButtonClick)}get fullscreenButton(){return this._fullscreenButton}set fullscreenButton(t){this._fullscreenButton=t,t&&this._ready&&t.addEventListener("click",this.onFullscreenButtonClick)}}class hy extends class{constructor(t,e){this.H=t.instantiater,this.Y=e||null,this.Z=new Kt(t.sceneProcessor),this.S=new ee(ee.createDefaultObject())}getGameSettingObject(){return Object.freeze(this.S),this.S.make()}get instantiater(){return this.H}get interopObject(){return this.Y}get sceneBuilder(){return this.Z}get setting(){return this.S}}{run(){this.setting.render.useCss3DRenderer(!1),this.setting.render.webGLRendererLoader(He);const t=new ka({antialias:!0});this.setting.render.webGLRenderer((()=>(t.setPixelRatio(window.devicePixelRatio),t.shadowMap.enabled=!0,t.shadowMap.type=2,t)));const e=this.instantiater,n=new Xe,i=new Xe,r=new Xe,o=new Xe,a=new Xe,s=new Xe,c=new Xe;return this.sceneBuilder.withChild(e.buildGameObject("editor-object").withComponent(tm,(t=>{t.initialize(o.ref,a.ref,c.ref)})).withComponent(oy)).withChild(e.buildGameObject("game-manager").withComponent(dy,(t=>{t.orbitCamera=i.ref,t.switchCameraButton=document.getElementById("switch-camera-button"),t.fullscreenButton=document.getElementById("fullscreen_button")})).withComponent(bs,(t=>{t.playButton=document.getElementById("play_button"),t.frameDisplayText=document.getElementById("frame_display"),t.player=s.ref,t.slider=document.getElementById("animation_slider"),t.slider.value="0",t.playbackRateSlider=document.getElementById("playback_rate_slider"),t.playbackRateSlider.value="1"}))).withChild(e.buildGameObject("mmd-player").withComponent(ms,(t=>{t.loopMode=us.None})).withComponent(ay,(t=>{t.physicsMaximumStepCount=1})).getComponent(ms,s).getComponent(ay,c)).withChild(e.buildGameObject("orbit-camera",new G(0,0,40)).withComponent(nn,(t=>{t.cameraType=en.Perspective,t.fov=60,t.near=1,t.far=1500,t.priority=-1,t.backgroundColor=new Wt(1,1,1,1)})).withComponent(py,(t=>{t.enabled=!0,t.target=new G(0,14,0),t.minDistance=20,t.maxDistance=100,t.enableDamping=!1})).getComponent(nn,i)).withChild(e.buildPrefab("mmd-camera",Xs,new G(0,15,20)).withCameraInitializer((t=>{t.priority=0})).getCamera(n).getCameraLoader(o).getAudioPlayer(a).make()).withChild(e.buildGameObject("ambient-light").withComponent(rn,(t=>{t.setObject3D(new La(16777215,16777215,.3),(t=>t.dispose()))}))).withChild(e.buildGameObject("directional-light",new G(-20,30,100)).withComponent(rn,(t=>{const e=new Wa(16777215,.5);e.castShadow=!0,e.shadow.mapSize.width=8192,e.shadow.mapSize.height=8192;e.shadow.camera.top=200,e.shadow.camera.bottom=-200,e.shadow.camera.left=-200,e.shadow.camera.right=200,e.shadow.camera.near=.1,e.shadow.camera.far=400,t.setObject3D(e,(t=>t.dispose()))})).withComponent(rn,(t=>{t.enabled=!1,t.setObject3D(new Ka(r.ref.object3D.shadow.camera),(t=>t.dispose())),t.startCoroutine(function*(){for(;;)t.updateWorldMatrix(),yield null}())})).getComponent(rn,r))}}const fy=n.p+"asset/audio/audioTest.mp3?630c76711127d96bec075e1bd74305a8";!async function(){await class{static async invoke(){let t=new Audio(fy);try{await t.play()}catch(e){if(!(e instanceof DOMException&&"NotAllowedError"===e.name))throw e;{const e=document.createElement("button");e.style.position="absolute",e.style.left="0",e.style.top="0",e.style.width="100%",e.style.height="100%",e.style.border="none",e.style.fontSize="32px",e.innerText="Play",document.body.appendChild(e),await new Promise((n=>{e.onclick=()=>{t.play(),t.remove(),t=null,e.remove(),n()}}))}}}}.invoke(),await e()(e());const t=new Jt(document.getElementById("game_view"));t.run(hy),t.inputHandler.startHandleEvents()}()})()})();