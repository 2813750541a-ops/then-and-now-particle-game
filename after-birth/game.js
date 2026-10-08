(()=>{'use strict';
// Only point fields are drawn. No mesh, surface, solid primitive or model loader.
const $=id=>document.getElementById(id),V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z),GOLD=0xeac38b,BLUE=0xaecbd0;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));let seed=728;function rand(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
let renderer;try{renderer=new THREE.WebGLRenderer({canvas:$('world'),antialias:false});}catch{$('error').style.display='block';$('error').textContent='请用支持 WebGL 的电脑浏览器打开。';return;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setClearColor(0x080909);const scene=new THREE.Scene(),world=new THREE.Group();scene.add(world);const camera=new THREE.PerspectiveCamera(47,innerWidth/innerHeight,.1,180);camera.position.set(0,2,17);let look=V(0,1.5,0);
const STORAGE='ordinary-life-v1';
function fresh(){return {chapter:0,route:'',world:'',family:'',housing:'',reserve:3,debt:0,skill:1,energy:7,support:3,autonomy:3,meaning:3,history:[],checkpoint:null};}
let chapter=-1,mode='intro',paused=false,muted=false,busy=false,time=0,last=0,cam=null,anim=[],actors=[],hotspots=[],drag=null,hold=null;
let st=fresh();try{let saved=JSON.parse(localStorage.getItem(STORAGE));if(saved&&saved.history&&saved.chapter>=0){st=saved;$('continue').style.display='block';}}catch{}
const vert=`uniform float uTime;uniform float uSize;uniform float uScatter;attribute float aSeed;varying float vSeed;varying float vZ;void main(){vSeed=aSeed;vec3 p=position;float a=aSeed*112.;p+=vec3(sin(a*1.3+uTime*.27),cos(a*.7+uTime*.19),sin(a*1.9+uTime*.17))*.024;p+=vec3(sin(a)*7.,cos(a*1.7)*5.,sin(a*.73)*6.)*uScatter;vec4 mv=modelViewMatrix*vec4(p,1.);vZ=-mv.z;gl_Position=projectionMatrix*mv;gl_PointSize=clamp(uSize*610./max(2.,-mv.z),.8,3.6);}`;
const frag=`uniform vec3 uColor;uniform float uTime;uniform float uOpacity;varying float vSeed;varying float vZ;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=pow(1.-2.*d,1.3)*(.65+.35*sin(vSeed*41.+uTime*.45));gl_FragColor=vec4(uColor*(.58+vSeed*.5),a*uOpacity*.85*exp(-vZ*.004));}`;
function points(coords,color=GOLD,size=.06,parent=world){let geo=new THREE.BufferGeometry(),seeds=[];for(let i=0;i<coords.length/3;i++)seeds.push(rand());geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1));let mat=new THREE.ShaderMaterial({vertexShader:vert,fragmentShader:frag,uniforms:{uTime:{value:0},uSize:{value:size},uScatter:{value:0},uColor:{value:new THREE.Color(color)},uOpacity:{value:1}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});let p=new THREE.Points(geo,mat);p.userData={alpha:.65,scatter:0};parent.add(p);actors.push(p);return p;}
function mask(type,q){q.fillStyle='#fff';q.strokeStyle='#fff';q.lineWidth=10;q.lineCap='round';q.lineJoin='round';q.beginPath();
if(type==='person'){q.ellipse(256,95,39,50,0,0,Math.PI*2);q.fill();q.beginPath();q.moveTo(240,143);q.bezierCurveTo(185,146,162,181,170,258);q.lineTo(152,325);q.lineTo(180,332);q.lineTo(197,265);q.lineTo(198,363);q.lineTo(182,481);q.lineTo(220,481);q.lineTo(252,375);q.lineTo(282,481);q.lineTo(319,481);q.lineTo(303,363);q.lineTo(306,252);q.lineTo(332,325);q.lineTo(355,315);q.bezierCurveTo(329,189,331,148,273,143);q.closePath();q.fill();}
if(type==='hand'){q.moveTo(185,490);q.lineTo(180,343);q.bezierCurveTo(119,284,92,235,128,230);q.bezierCurveTo(151,226,171,270,191,279);q.lineTo(184,100);q.bezierCurveTo(182,68,204,63,211,99);q.lineTo(232,233);q.lineTo(226,65);q.bezierCurveTo(225,30,250,28,255,65);q.lineTo(270,224);q.lineTo(278,72);q.bezierCurveTo(280,40,302,45,301,79);q.lineTo(306,245);q.lineTo(322,126);q.bezierCurveTo(328,99,349,104,344,132);q.lineTo(340,328);q.bezierCurveTo(340,356,315,376,303,402);q.lineTo(299,490);q.closePath();q.fill();}
if(type==='ticket'){q.lineWidth=5;q.strokeRect(78,160,356,202);for(let x=82;x<428;x+=18){q.moveTo(x,159);q.lineTo(x,168);q.moveTo(x,361);q.lineTo(x,352);}q.stroke();q.font='72px FilmSong';q.textAlign='center';q.fillText('粮票',256,268);q.font='24px FilmHei';q.fillText('生活示意',256,316);}
if(type==='money'){for(let i=0;i<3;i++){q.beginPath();q.ellipse(250+i*8,310-i*28,82,25,0,0,Math.PI*2);q.stroke();}q.beginPath();q.moveTo(178,300);q.lineTo(178,332);q.moveTo(345,254);q.lineTo(345,313);q.stroke();}
if(type==='sack'){q.moveTo(225,90);q.lineTo(287,90);q.lineTo(280,145);q.bezierCurveTo(399,230,367,430,315,455);q.bezierCurveTo(244,482,148,453,145,369);q.bezierCurveTo(122,225,168,192,231,142);q.closePath();q.fill();}
if(type==='case'){q.lineWidth=5;q.strokeRect(95,165,322,224);q.strokeRect(201,130,111,36);for(let x of [160,352]){q.moveTo(x,171);q.lineTo(x,382);}q.stroke();}
if(type==='train'){q.lineWidth=6;q.moveTo(37,224);q.bezierCurveTo(35,169,61,150,99,150);q.lineTo(472,150);q.lineTo(472,364);q.lineTo(37,364);q.closePath();q.stroke();for(let x=88;x<468;x+=78){q.strokeRect(x,204,55,66);q.beginPath();q.ellipse(x,382,22,22,0,0,Math.PI*2);q.stroke();}}
if(type==='key'){q.lineWidth=15;q.beginPath();q.ellipse(230,141,60,60,0,0,Math.PI*2);q.stroke();q.beginPath();q.moveTo(230,200);q.lineTo(230,430);q.lineTo(309,430);q.moveTo(234,375);q.lineTo(291,375);q.stroke();}
if(type==='door'){q.lineWidth=6;q.strokeRect(122,74,268,414);q.beginPath();q.ellipse(343,293,11,11,0,0,Math.PI*2);q.stroke();}
if(type==='clock'){q.beginPath();q.ellipse(256,256,157,157,0,0,Math.PI*2);q.stroke();q.beginPath();q.moveTo(256,144);q.lineTo(256,256);q.lineTo(325,300);q.stroke();}
if(type==='phone'){q.lineWidth=7;q.strokeRect(160,80,192,353);q.moveTo(217,112);q.lineTo(292,112);q.moveTo(239,397);q.lineTo(273,397);q.stroke();}
if(type==='rotary'){q.lineWidth=7;q.moveTo(86,365);q.lineTo(120,225);q.lineTo(396,225);q.lineTo(432,365);q.closePath();q.stroke();q.beginPath();q.ellipse(256,281,63,38,0,0,Math.PI*2);q.stroke();q.beginPath();q.moveTo(111,181);q.bezierCurveTo(157,111,346,111,402,184);q.moveTo(127,194);q.bezierCurveTo(168,164,338,164,388,194);q.stroke();}
if(type==='bowl'){q.moveTo(83,232);q.bezierCurveTo(110,401,399,401,430,232);q.stroke();q.beginPath();q.ellipse(256,234,174,37,0,0,Math.PI*2);q.stroke();}
if(type==='grip'){q.moveTo(226,490);q.lineTo(203,364);q.bezierCurveTo(182,337,180,301,204,272);q.bezierCurveTo(223,248,241,245,254,263);q.bezierCurveTo(266,283,256,302,239,304);q.bezierCurveTo(261,321,307,304,306,277);q.lineTo(301,227);q.bezierCurveTo(298,202,322,195,329,220);q.lineTo(343,284);q.bezierCurveTo(350,305,352,340,329,372);q.lineTo(316,490);q.closePath();q.fill();q.beginPath();q.moveTo(265,269);q.bezierCurveTo(237,243,211,216,222,200);q.bezierCurveTo(235,182,260,202,278,220);q.bezierCurveTo(257,183,246,159,263,151);q.bezierCurveTo(282,144,296,171,304,196);q.stroke();}
if(type==='book'){q.lineWidth=6;q.moveTo(255,150);q.bezierCurveTo(205,122,118,134,74,152);q.lineTo(74,397);q.bezierCurveTo(142,374,204,389,255,421);q.bezierCurveTo(305,389,380,374,438,397);q.lineTo(438,152);q.bezierCurveTo(370,133,302,128,255,150);q.lineTo(255,421);q.stroke();for(let j=0;j<5;j++){q.moveTo(110,205+j*32);q.lineTo(210,209+j*32);q.moveTo(296,209+j*32);q.lineTo(398,202+j*32);}q.stroke();}
if(type==='pencil'){q.moveTo(218,441);q.lineTo(228,90);q.lineTo(279,90);q.lineTo(289,441);q.lineTo(253,484);q.closePath();q.stroke();q.moveTo(251,91);q.lineTo(251,434);q.stroke();}
if(type==='lamp'){q.lineWidth=5;q.moveTo(202,100);q.lineTo(310,100);q.lineTo(349,212);q.lineTo(157,212);q.closePath();q.stroke();q.moveTo(254,212);q.lineTo(254,400);q.moveTo(173,410);q.lineTo(334,410);q.stroke();}
if(type==='letter'){q.lineWidth=5;q.strokeRect(62,146,388,238);q.moveTo(62,146);q.lineTo(256,283);q.lineTo(450,146);q.moveTo(62,384);q.lineTo(196,271);q.moveTo(450,384);q.lineTo(312,270);q.stroke();}
if(type==='badge'){q.lineWidth=5;q.strokeRect(130,102,252,353);q.strokeRect(213,79,86,45);q.beginPath();q.ellipse(256,213,42,48,0,0,Math.PI*2);q.stroke();q.moveTo(193,301);q.bezierCurveTo(198,247,312,247,318,301);q.stroke();q.font='38px FilmSong';q.textAlign='center';q.fillText('职工',256,384);}
if(type==='window'){q.lineWidth=5;q.strokeRect(77,53,358,409);q.moveTo(256,53);q.lineTo(256,462);q.moveTo(77,244);q.lineTo(435,244);q.stroke();}
if(type==='rice'){q.lineWidth=5;for(let i=0;i<23;i++){q.beginPath();let x=110+(i*83%295),y=156+(i*61%225);q.ellipse(x,y,8,19,(i%5)*.3,0,Math.PI*2);q.stroke();}}
if(type==='baby'){q.lineWidth=5;q.beginPath();q.ellipse(256,173,48,52,0,0,Math.PI*2);q.stroke();q.beginPath();q.moveTo(221,220);q.bezierCurveTo(148,288,157,379,235,411);q.bezierCurveTo(300,431,362,363,336,282);q.lineTo(294,221);q.moveTo(199,267);q.lineTo(314,327);q.moveTo(179,303);q.lineTo(299,377);q.moveTo(244,176);q.lineTo(249,176);q.moveTo(271,176);q.lineTo(276,176);q.stroke();}
if(type==='bag'){q.lineWidth=5;q.moveTo(121,204);q.bezierCurveTo(107,101,403,101,389,204);q.lineTo(389,415);q.lineTo(121,415);q.closePath();q.stroke();q.strokeRect(161,270,188,100);q.moveTo(188,161);q.bezierCurveTo(193,71,319,71,324,161);q.stroke();}
if(type==='parcel'){q.lineWidth=5;q.strokeRect(83,164,346,231);q.moveTo(228,164);q.lineTo(228,395);q.moveTo(280,164);q.lineTo(280,395);q.moveTo(92,343);q.lineTo(165,343);q.moveTo(92,362);q.lineTo(151,362);q.stroke();}
if(type==='wrench'){q.lineWidth=6;q.moveTo(212,212);q.bezierCurveTo(103,176,149,59,220,72);q.lineTo(187,144);q.lineTo(246,179);q.lineTo(303,126);q.lineTo(277,68);q.bezierCurveTo(385,94,371,217,286,239);q.lineTo(176,441);q.bezierCurveTo(158,473,105,452,127,418);q.closePath();q.stroke();}
if(type==='screen'){q.lineWidth=5;q.strokeRect(75,115,362,229);q.moveTo(58,361);q.lineTo(454,361);q.lineTo(471,389);q.lineTo(43,389);q.closePath();q.moveTo(222,208);q.lineTo(268,177);q.lineTo(302,208);q.moveTo(155,279);q.lineTo(352,279);q.stroke();}
if(type==='bike'){q.lineWidth=5;for(let x of [111,400]){q.beginPath();q.ellipse(x,346,80,80,0,0,Math.PI*2);q.stroke();}q.beginPath();q.moveTo(111,346);q.lineTo(212,205);q.lineTo(277,346);q.lineTo(111,346);q.moveTo(212,205);q.lineTo(371,205);q.lineTo(277,346);q.moveTo(400,346);q.lineTo(351,160);q.lineTo(398,160);q.moveTo(192,187);q.lineTo(247,187);q.stroke();}
if(type==='bed'){q.lineWidth=5;q.strokeRect(58,276,396,121);q.strokeRect(85,206,114,69);q.moveTo(58,188);q.lineTo(58,437);q.moveTo(454,268);q.lineTo(454,437);q.moveTo(58,363);q.lineTo(454,363);q.stroke();}
if(type==='heart'){q.moveTo(255,429);q.bezierCurveTo(55,285,84,124,191,130);q.bezierCurveTo(237,131,255,184,255,184);q.bezierCurveTo(268,104,398,112,408,214);q.bezierCurveTo(414,299,307,391,255,429);q.stroke();}
if(type==='health'){q.lineWidth=5;q.strokeRect(88,161,336,245);q.strokeRect(209,132,94,30);q.moveTo(256,223);q.lineTo(256,340);q.moveTo(198,281);q.lineTo(314,281);q.stroke();}
if(type==='plant'){q.lineWidth=4;q.moveTo(256,439);q.lineTo(256,182);q.bezierCurveTo(180,213,116,123,131,102);q.bezierCurveTo(207,95,247,120,256,182);q.bezierCurveTo(263,122,363,112,393,142);q.bezierCurveTo(365,218,291,236,256,241);q.moveTo(167,430);q.lineTo(347,430);q.moveTo(256,338);q.bezierCurveTo(168,348,151,279,166,254);q.bezierCurveTo(231,254,251,290,256,338);q.stroke();}

if(type==='breath'){for(let j=0;j<4;j++){q.beginPath();for(let x=48;x<470;x+=3){let y=190+j*36+Math.sin(x*.012)*35;q.lineTo(x,y);}q.stroke();}}
}
function form(type,x,y,z,w=4,color=GOLD,count=4500){let c=document.createElement('canvas');c.width=c.height=512;let q=c.getContext('2d');mask(type,q);let d=q.getImageData(0,0,512,512).data,coords=[];let tries=0;while(coords.length<count*3&&tries++<count*60){let xx=Math.floor(rand()*512),yy=Math.floor(rand()*512);if(d[(yy*512+xx)*4+3]>90)coords.push((xx-256)/512*w,(256-yy)/512*w,(rand()-.5)*w*.1);}let p=points(coords,color,['sack','money','lamp'].includes(type)?.037:.058);p.position.set(x,y,z);p.userData.type=type;return p;}
function glyph(txt,x,y,z,w=6,color=GOLD){let c=document.createElement('canvas'),q=c.getContext('2d');q.font='120px FilmSong';c.width=Math.ceil(q.measureText(txt).width)+50;c.height=190;q=c.getContext('2d');q.fillStyle='#fff';q.textAlign='center';q.font='120px FilmSong';q.fillText(txt,c.width/2,137);let d=q.getImageData(0,0,c.width,c.height).data,a=[];for(let yy=0;yy<c.height;yy+=2)for(let xx=0;xx<c.width;xx+=2)if(d[(yy*c.width+xx)*4+3]>90)a.push((xx-c.width/2)/c.width*w,(c.height/2-yy)/c.width*w,(rand()-.5)*.16);let p=points(a,color,.055);p.position.set(x,y,z);p.userData.text=txt;return p;}
function after(seconds,fn){let start=time;anim.push({tick(t){if(t-start>=seconds){fn();return true;}return false;}});}
function lightBeam(from,to,width,color=GOLD){let coords=[];for(let i=0;i<18000;i++){let k=rand(),p=from.clone().lerp(to,k),a=rand()*Math.PI*2,r=Math.sqrt(rand())*width*(.12+k);coords.push(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.7,p.z+(rand()-.5)*width*.4);}let p=points(coords,color,.04);p.userData.alpha=.085;anim.push({tick(t){p.rotation.z=Math.sin(t*.04)*.012;return false;}});return p;}
function corridor(width=7,length=26,tint=GOLD){let a=[];for(let i=0;i<14000;i++){let z=-length/2+rand()*length;let x=(i%2?-1:1)*(width/2+rand()*.15);a.push(x,rand()*5-1,z);}let p=points(a,tint,.019);p.userData.alpha=.34;let floor=[];for(let i=0;i<9000;i++){let z=rand()*length-length/2;floor.push((rand()-.5)*width,-1.15+rand()*.03,z);}points(floor,tint,.032).userData.alpha=.31;}
function memoryWord(txt,x=0,y=3,z=-7,w=5,color=GOLD){let p=glyph(txt,x,y,z,w,color);reveal(p,2);after(5,()=>tween(p.userData,{scatter:.8,alpha:0},3));return p;}
function morph(a,type,pos,w,d=3,done){let target=form(type,0,0,0,w,a.material.uniforms.uColor.value.getHex(),a.geometry.getAttribute('position').count);world.remove(target);actors=actors.filter(p=>p!==target);let from=a.geometry.getAttribute('position'),to=target.geometry.getAttribute('position'),src=new Float32Array(from.array),start=time,origin=a.position.clone();let shift=pos.clone().sub(origin);anim.push({tick(t){let k=clamp((t-start)/d),e=k*k*(3-2*k);for(let i=0;i<from.count;i++){let j=i%to.count;from.setXYZ(i,src[i*3]*(1-e)+(to.getX(j)+shift.x)*e+Math.sin(k*Math.PI)*Math.sin(i*7)*1.2,src[i*3+1]*(1-e)+(to.getY(j)+shift.y)*e+Math.sin(k*Math.PI)*Math.cos(i*9),src[i*3+2]*(1-e)+(to.getZ(j)+shift.z)*e);}from.needsUpdate=true;if(k>=1){target.geometry.dispose();target.material.dispose();if(done)done();return true;}return false;}});}
function field(){let a=[];for(let i=0;i<10000;i++)a.push((rand()-.5)*110,rand()*38-5,(rand()-.5)*110);let p=points(a,0xa58b64,.024,scene);p.userData.alpha=.42;for(let i=0;i<3;i++){let a=[];for(let j=0;j<4000;j++){let x=(rand()-.5)*65,z=(rand()-.5)*4;a.push(x,-1.2+Math.sin(x*.19)*.16,z-4);}let r=points(a,i===1?BLUE:GOLD,.023,scene);r.userData.alpha=.2;}return p;}let ambient=field();let persistent=actors.slice();
function reveal(actor,seconds=2){actor.userData.alpha=0;actor.userData.scatter=.7;tween(actor.userData,{alpha:.75,scatter:0},seconds);}
function tween(obj,to,duration,done){let from={};Object.keys(to).forEach(k=>from[k]=obj[k]);let start=time;anim.push({tick(t){let k=clamp((t-start)/duration),e=k*k*(3-2*k);Object.keys(to).forEach(j=>obj[j]=from[j]+(to[j]-from[j])*e);if(k>=1){if(done)done();return true;}}});}
function move(a,pos,d=2,done){let from=a.position.clone(),start=time;anim.push({tick(t){let k=clamp((t-start)/d),e=k*k*(3-2*k);a.position.lerpVectors(from,pos,e);a.position.y+=Math.sin(k*Math.PI)*.22;if(k>=1){if(done)done();return true;}}});}
function cameraEase(k){if(k<.2)return .1*Math.pow(k/.2,2);if(k<.38){let p=(k-.2)/.18;return .1+.65*(p*p*(3-2*p));}let p=(k-.38)/.62;return .75+.25*(1-Math.pow(1-p,3));}
function fly(pos,target,d=3,done){cam={a:camera.position.clone(),b:V(pos.x,pos.y,pos.z*Math.max(1,1.25/camera.aspect)),c:look.clone(),d:target,start:time,dur:d,done};}
function clear(){world.traverse(o=>{if(o.isPoints){o.geometry.dispose();o.material.dispose();}});world.clear();actors=persistent.slice();anim=[];hotspots=[];$('labels').replaceChildren();hold=null;drag=null;cam=null;busy=false;$('choices').replaceChildren();$('sources').style.display='none';}
function say(s){$('subtitle').textContent=s;$('headline').textContent='';}
function hint(s){$('hint').textContent=s;}
function choices(items){$('choices').replaceChildren();items.forEach(([label,fn])=>{let b=document.createElement('button');b.textContent=label;b.onclick=()=>{if(!paused&&!busy&&!cam){sound('click');fn();}};$('choices').appendChild(b);});}
function hot(actor,label,id,fn,dy=0){let b=document.createElement('button');b.textContent=label;b.dataset.action=id;b.onclick=()=>{if(!paused&&!busy&&!cam)fn();};$('labels').appendChild(b);hotspots.push({actor,b,fn,dy});return b;}
function hideHot(){hotspots.forEach(h=>h.b.style.display='none');}
function save(){st.chapter=chapter;try{localStorage.setItem(STORAGE,JSON.stringify(st));}catch{}}

// Fictional resource units. They are not income figures, risk probabilities or forecasts.
const metrics=['reserve','debt','skill','energy','support','autonomy','meaning'];
const routeNames={degree:'本科',trade:'学一门手艺',early:'早早工作'};
const worldNames={opening:'技术打开新岗位',squeeze:'机会分配不均',care:'照护支持扩大'};
let entry=null;
let mini=null;
function copy(v){return JSON.parse(JSON.stringify(v));}
function record(id,delta={}){
  for(const [key,value] of Object.entries(delta)) if(metrics.includes(key))st[key]=clamp(st[key]+value,0,key==='debt'||key==='skill'||key==='reserve'?12:10);
  st.history.push({year:chapters[chapter].year(),id,delta});
}
function dissolve(p,d=2){tween(p.userData,{scatter:1,alpha:0},d);}
function outline(path,color=GOLD,size=.025,density=55){
  const a=[];for(let j=1;j<path.length;j++)for(let k=0,n=Math.ceil(path[j].distanceTo(path[j-1])*density);k<n;k++){
    const p=path[j-1].clone().lerp(path[j],k/n);a.push(p.x+(rand()-.5)*.035,p.y+(rand()-.5)*.035,p.z+(rand()-.5)*.035);
  }return points(a,color,size);
}
function halo(x,y,z,r,color=GOLD,amount=9000){
  const a=[];for(let j=0;j<amount;j++){let t=rand()*Math.PI*2,rr=r+(rand()-.5)*.09;
    a.push(x+Math.cos(t)*rr,y+Math.sin(t)*rr*.6,z+(rand()-.5)*.2);}
  let p=points(a,color,.025);p.userData.alpha=.25;return p;
}
function curtainRoom(color=GOLD){
  corridor(9,25,color);const w=form('window',-3.2,2.4,-7,4,color,3000);w.userData.alpha=.25;
  lightBeam(V(-3.2,4,-7),V(1,-.7,2),1.2,color);
  outline([V(-4,-.2,-4),V(4,-.2,-4),V(4,-.2,2),V(-4,-.2,2),V(-4,-.2,-4)],color);
}
function road(color=BLUE){
  const a=[];for(let i=0;i<16000;i++){let z=-36+rand()*43,x=(i%2?1:-1)*(2.6+rand()*.18);a.push(x,-.7+rand()*.07,z);}
  const p=points(a,color,.023);p.userData.alpha=.4;
  for(let side of [-1,1])for(let j=0;j<6;j++){
    const z=-j*5;outline([V(side*4,-.7,z),V(side*4,3+rand()*4,z),V(side*6,3+rand()*4,z)],color,.016);
    const door=form('door',side*4.7,1,-j*5,2.2,color,1100);door.userData.alpha=.18;
  }
  lightBeam(V(0,3,-25),V(0,0,2),.9,color);
}
function rain(){
  const a=[];for(let i=0;i<2800;i++)a.push((rand()-.5)*17,rand()*12-2,(rand()-.5)*30);
  const p=points(a,BLUE,.02);p.userData.alpha=.32;const src=new Float32Array(a),attr=p.geometry.attributes.position;
  anim.push({tick(t){for(let i=0;i<attr.count;i++){const y=((src[i*3+1]+t*-2.3+200)%12+12)%12-2;
    attr.setXYZ(i,src[i*3]+Math.sin(t*.14)*.35,y,src[i*3+2]);}attr.needsUpdate=true;return false;}});
  sound('rain');let played=time;anim.push({tick(t){if(t-played>4){sound('rain');played=t;}return false;}});
}
function stream(from,to,color=GOLD,d=3,count=1400){
  const a=Array(count*3).fill(0),p=points(a,color,.03),attr=p.geometry.attributes.position,start=time;
  const seeds=Array.from({length:count},()=>rand());
  anim.push({tick(t){let k=clamp((t-start)/d);for(let i=0;i<count;i++){
    let phase=clamp((k-seeds[i]*.28)/.72),v=from.clone().lerp(to,phase),curve=Math.sin(phase*Math.PI);
    v.x+=Math.sin(i*2.13)*curve*.7;v.y+=Math.cos(i*3.79)*curve*.4;
    attr.setXYZ(i,v.x,v.y,v.z);}
    attr.needsUpdate=true;p.userData.alpha=Math.sin(k*Math.PI)*.65;
    return k>=1;}});return p;
}
function crowd(words,z=-13,color=BLUE){
  for(let j=0;j<words.length;j++){
    let a=form('person',(j-(words.length-1)/2)*2.5,1,z-(j%2)*2,3.5,color,2200);a.userData.alpha=.17;
    let g=glyph(words[j],a.position.x,3.4,a.position.z,2,color);g.userData.alpha=.28;
  }
}
function holdHot(actor,label,id,seconds,onProgress,onFinish){
  let active=false,automatic=false,start=0,k=0;const b=hot(actor,label,id,()=>{});b.dataset.gesture='hold';
  function begin(auto){if(active||paused||busy||cam)return;active=true;automatic=auto;start=time;
    anim.push({tick(t){if(!active)return true;k=clamp((t-start)/seconds);onProgress(k);
      if(k>=1){active=false;b.classList.add('complete');onFinish();return true;}return false;}});
  }
  b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);begin(false);};
  b.onpointerup=e=>{e.preventDefault();if(!automatic&&active){active=false;onProgress(0);hint('再按住一会儿。');}};
  b.onpointercancel=()=>{active=false;onProgress(0);};b.onclick=e=>{if(e.detail===0)begin(true);};
  return b;
}
function scrubHot(actor,label,id,onProgress,onFinish,axis='x',pixels=180){
  let active=false,start=0,k=0;const b=hot(actor,label,id,()=>{});b.dataset.gesture='drag';
  function auto(){if(active||paused||busy||cam)return;active=true;let t=time;
    anim.push({tick(now){if(!active)return true;k=clamp((now-t)/2.2);onProgress(k);
      if(k===1){active=false;b.classList.add('complete');onFinish();return true;}return false;}});}
  b.onpointerdown=e=>{if(paused||busy||cam)return;e.preventDefault();b.setPointerCapture(e.pointerId);
    active=true;k=0;start=axis==='x'?e.clientX:e.clientY;b.style.cursor='grabbing';};
  b.onpointermove=e=>{if(!active)return;let v=axis==='x'?e.clientX:e.clientY;
    k=clamp(Math.abs(v-start)/Math.min(pixels,innerWidth*.3));onProgress(k);
    if(k>=1){active=false;b.classList.add('complete');onFinish();}};
  b.onpointerup=e=>{e.preventDefault();active=false;b.style.cursor='grab';if(k<1)hint('按住物件，再拖动。');};
  b.onpointercancel=()=>active=false;b.onclick=e=>{if(e.detail===0)auto();};return b;
}
function take(id,delta,text,animate,d=2.8,done){
  if(busy||paused||cam)return;busy=true;hideHot();choices([]);hint('');record(id,delta);say(text);sound('paper');
  if(animate)animate();after(d,()=>{busy=false;if(done)done();else onward();});
}
function onward(label='让时间往前走'){choices([[label,()=>next(chapter+1)]]);}
function offer(items){
  choices(items.map(item=>[item.label,()=>take(item.id,item.delta,item.text,item.animate,item.duration||3,item.done)]));
  [...$('choices').children].forEach((b,i)=>b.dataset.action=items[i].id);
}
function ready(pos,target,fn,d=3.8){fly(pos,target,d,()=>{if(fn)fn();});}
function collectSchool(bag,done){
  mini={kind:'collect',collected:0,total:3};
  const things=[['book','课本',-3.1,2.3],['pencil','铅笔',0,2.8],['bowl','饭盒',3.1,2.3]];
  let remaining=3;hint('点击收好三样东西，再背起书包。');
  things.forEach(([type,label,x,y],i)=>{
    const p=form(type,x,y,1,2.2,i===1?BLUE:GOLD,2500);reveal(p,1.6);
    const b=hot(p,label,'collect-school-'+i,()=>{
      if(b.classList.contains('complete'))return;b.classList.add('complete');b.style.display='none';
      sound('paper');stream(p.position,bag.position,GOLD,1.2,600);move(p,bag.position.clone(),1.2,()=>dissolve(p,.5));
      mini.collected++;remaining--;hint('已收好 '+mini.collected+' / 3');
      if(!remaining){hideHot();after(1.6,()=>{record('school-collected',{meaning:1});done();});}
    },-.5);
  });
}
function familyPuzzle(done){
  const sources=[form('person',-1.4,1,0,3.4,GOLD,5000),form('person',1.4,1,0,3.4,BLUE,5000),form('person',0,.55,.1,1.9,GOLD,3200)];
  const buckets=Array.from({length:6},()=>[]),cols=3,cellW=1.6,cellH=1.75;
  for(const source of sources){let a=source.geometry.attributes.position;
    for(let j=0;j<a.count;j++){
      let x=a.getX(j)+source.position.x,y=a.getY(j)+source.position.y,z=a.getZ(j)+source.position.z;
      let col=clamp(Math.floor((x+2.4)/cellW),0,2),row=clamp(Math.floor((2.75-y)/cellH),0,1),id=row*cols+col;
      let cx=-1.6+col*cellW,cy=1.875-row*cellH;
      buckets[id].push(x-cx,y-cy,z);
    }
    world.remove(source);actors=actors.filter(a=>a!==source);source.geometry.dispose();source.material.dispose();
  }
  mini={kind:'puzzle',slots:[1,4,0,5,2,3],moves:0};let selected=-1,complete=false;
  const pieces=buckets.map((a,i)=>points(a,i%2?BLUE:GOLD,.049));
  function center(slot){return V(-1.6+slot%3*cellW,1.875-Math.floor(slot/3)*cellH,.4);}
  pieces.forEach((p,i)=>p.position.copy(center(mini.slots[i])));
  for(let slot=0;slot<6;slot++){
    const c=center(slot);outline([V(c.x-.77,c.y-.85,0),V(c.x+.77,c.y-.85,0),V(c.x+.77,c.y+.85,0),V(c.x-.77,c.y+.85,0),V(c.x-.77,c.y-.85,0)],BLUE,.017).userData.alpha=.18;
  }
  say('十二岁。把散开的家庭合影拼回去。');hint('点一块，再点另一块交换位置。三个人会重新站在一起。');
  function finish(assisted=false){
    if(complete)return;complete=true;hideHot();choices([]);mini.complete=true;record(assisted?'puzzle-together':'puzzle-solved',{support:1});
    sound('coin');say('那一年，你们还没有老去。');hint('拼好了一张合影。');
    pieces.forEach((p,i)=>move(p,center(i),1.2));after(2.5,()=>{pieces.forEach(p=>dissolve(p));after(1.8,()=>{clear();mini=null;done();});});
  }
  pieces.forEach((p,i)=>hot(p,'◇','puzzle-piece-'+i,()=>{
    if(complete)return;if(selected<0){selected=i;p.userData.alpha=1;hint('再点另一块，交换这两块。');return;}
    if(selected===i){selected=-1;p.userData.alpha=.65;hint('选择两块交换位置。');return;}
    const prev=selected;selected=-1;busy=true;mini.moves++;
    [mini.slots[prev],mini.slots[i]]=[mini.slots[i],mini.slots[prev]];
    move(pieces[prev],center(mini.slots[prev]),.9);move(p,center(mini.slots[i]),.9);pieces[prev].userData.alpha=.65;sound('paper');
    after(1,()=>{busy=false;if(mini.slots.every((slot,j)=>slot===j))finish();else hint('已交换 '+mini.moves+' 次 · 看看肩膀和身形能否接上。');});
  }));
  choices([['一起拼好',()=>finish(true)]]);
}
function deliveryRound(done){
  // No timeout: players plan a route by choosing the sequence, then carry each parcel.
  mini={kind:'delivery',order:[],done:0,total:3};
  let position=V(0,1,1),distance=0,pending=false;
  const destinations=[V(-3.3,1,-3),V(3.3,1,-6),V(-3.3,1,-10)];
  const doors=destinations.map((v,i)=>form('door',v.x,v.y,v.z,3,BLUE,2500));
  const parcel=form('parcel',position.x,position.y,position.z,2.5,GOLD,3000);
  say('三单配送。先看清地址，少走一些回头路。');hint('点击门牌选下一站，再拖动包裹送到那里。');
  function pick(){
    pending=false;hotspots.forEach(h=>h.b.remove());hotspots=[];
    doors.forEach((door,i)=>{if(mini.order.includes(i))return;
      hot(door,['一号门','二号门','三号门'][i],'delivery-door-'+i,()=>{
        if(pending)return;pending=true;hideHot();const origin=parcel.position.clone(),target=destinations[i].clone();
        hint('这单送到 '+['一号门','二号门','三号门'][i]);
        scrubHot(parcel,'带着包裹走 →','delivery-carry',k=>parcel.position.lerpVectors(origin,target,k),()=>{
          hideHot();distance+=origin.distanceTo(target);mini.order.push(i);mini.done++;sound('notification');stream(parcel.position,door.position,BLUE,1.2,400);
          door.userData.alpha=.2;say('已送达 '+mini.done+' / 3');
          if(mini.done===3){const efficient=distance<20;mini.distance=Math.round(distance*10)/10;mini.efficient=efficient;
            record('delivery-round',efficient?{reserve:1,energy:1}:{reserve:1});hint(efficient?'你规划了一条顺路的路线。':'你走了些回头路。下一次，可以先看清三个地址。');
            after(2,()=>{dissolve(parcel);doors.forEach(p=>dissolve(p));after(1.5,done);});
          }else after(1.2,pick);
        });
      },-.5);
    });
  }pick();
}
function birth(){
  mode='birth';let baby=form('baby',0,1.2,0,4.8,GOLD,8500),left=form('hand',-3,1.1,.2,5.5,GOLD,8000),right=form('hand',3,1.1,.2,5.5,BLUE,8000);
  left.rotation.z=-.5;right.rotation.z=.5;right.scale.x=-1;reveal(baby,4);reveal(left,3);reveal(right,3);
  const nest=halo(0,.7,-.3,3.9);nest.rotation.x=.4;
  lightBeam(V(0,7,-4),V(0,1,0),1.9);sound('pulse');
  let start=time;anim.push({tick(t){let pulse=Math.sin((t-start)*2)*.02;baby.scale.setScalar(1+pulse);return false;}});
  say('2003年。你出生在一个普通家庭。');hint('按住光里的孩子，听见第一口呼吸。');
  ready(V(0,2.4,12),V(0,1.2,0),()=>holdHot(baby,'握住一点光','birth-hold',2.6,k=>{
    left.position.x=-3+k*1.1;right.position.x=3-k*1.1;baby.userData.alpha=.45+k*.3;nest.userData.alpha=.2+k*.25;
  },()=>take('born',{},'他们把最柔软的地方留给了你。',()=>{sound('breath');memoryWord('2003',0,3,-5,3);move(left,V(-1.8,.7,.3),2);move(right,V(1.8,.7,.3),2);},3.5)));
}
function school(){
  mode='school';curtainRoom();let bag=form('bag',-2.7,.7,0,4),hand=form('hand',-3.6,1,1,3.8),door=form('door',2.8,1,-3,5,BLUE,7000);
  let chalk=glyph('一',0,3,-8,2.6);chalk.userData.alpha=.25;
  say('六岁。书包很大，世界更大。');hint('把书包拖向校门。');
  ready(V(0,1.8,13),V(0,1,-1),()=>collectSchool(bag,()=>{hint('把书包拖向校门。');scrubHot(bag,'背起书包 →','school-bag',k=>{
    bag.position.set(-2.7+k*5,.7+k*.25,-k*2);hand.position.set(-3.6+k*5,1,-k*1.8);door.userData.alpha=.45+k*.3;
  },()=>take('first-school',{meaning:1},'你学会了写自己的名字。',()=>{
    dissolve(hand);morph(bag,'book',V(0,1,0),4,2.5);sound('paper');memoryWord('我',0,3,-5,1.8);
  },3.6));}));
}
function childhoodScene(){
  mode='childhood';curtainRoom();let lamp=form('lamp',0,2,-2,4.2),parent=form('person',-3.2,.6,-3,5,GOLD,6500),book=form('book',2.5,.8,.3,4,BLUE),clock=form('clock',-1,-.1,0,2.5);
  parent.userData.alpha=.3;lightBeam(V(0,2,-2),V(2,0,1),1.4);say('十二岁。父母下班时，饭已经凉了。');
  hint('你不必替大人解决生活。今晚，你想靠近哪一点？');
  ready(V(0,1.7,13),V(0,.7,-1),()=>{
    hot(book,'把不会的题摊开','child-question',()=>take('question',{skill:1,meaning:1},'答案之外，你还记住了被耐心对待。',()=>{move(book,V(0,.8,.5));stream(book.position,parent.position,BLUE);lamp.userData.alpha=.85;}),-.4);
    hot(parent,'坐到他们身边','child-listen',()=>take('listen',{support:1},'“今天累不累？”你第一次问出口。',()=>{move(parent,V(-1.1,.7,-.5));dissolve(clock);memoryWord('在一起',0,3,-6,3);}),-.4);
  });
}
function childhood(){mode='childhood';curtainRoom();ready(V(0,2.2,12),V(0,1,0),()=>familyPuzzle(childhoodScene));}
function pandemic(){
  mode='pandemic';curtainRoom(BLUE);let phone=form('phone',-2.6,1,0,4.5,BLUE,6000),book=form('book',2.7,.5,0,4,GOLD),screen=form('screen',0,2,-5,6,BLUE,8000);
  screen.userData.alpha=.25;crowd(['停课','远方'], -15,BLUE);say('2020年。课堂缩进了一块屏幕。');hint('学习、空间和陪伴，开始挤在同一个房间。');
  ready(V(0,2,13),V(0,1,-2),()=>{
    hot(phone,'把信号接起来','pandemic-connect',()=>take('connect',{support:1},'你向同学借来笔记，也把自己的传过去。',()=>{sound('notification');stream(phone.position,screen.position,BLUE);screen.userData.alpha=.7;}),-.5);
    hot(book,'给自己留一小时','pandemic-study',()=>take('self-study',{skill:1,energy:-1},'没人催的这一小时，你慢慢找回了节奏。',()=>{move(book,V(0,1,1));dissolve(screen);memoryWord('一点一点',0,3,-7,4);}),-.5);
  });
}
function fork(){
  mode='fork';road();let book=form('book',-4,1,-2,3.8,GOLD),wrench=form('wrench',0,1,-5,3.8,BLUE),parcel=form('parcel',4,1,-2,3.8,GOLD);
  for(let x of [-4,0,4])outline([V(0,-.7,5),V(x,-.7,-3),V(x*1.7,-.7,-22)],x===0?BLUE:GOLD,.024);
  say('十八岁。有些路要先花钱，有些路先挣钱。');hint('这是一个虚构孩子的三条可能人生。以后仍能转向。');
  ready(V(0,2.7,17),V(0,1,-3),()=>{
    const choose=(route,id,delta,text,p)=>{st.route=route;take(id,delta,text,()=>{[book,wrench,parcel].filter(a=>a!==p).forEach(a=>dissolve(a));fly(V(p.position.x*.65,1.8,10),p.position.clone(),3.1);},3.6);};
    hot(book,'去读本科','route-degree',()=>choose('degree','university',{reserve:-2,skill:2},'你把四年交给课堂，也把一部分压力留给家里。',book),-.9);
    hot(wrench,'学一门手艺','route-trade',()=>choose('trade','vocational',{reserve:-1,skill:2},'你想让双手先掌握一件具体的事。',wrench),-.9);
    hot(parcel,'先出去工作','route-early',()=>choose('early','early-work',{reserve:2,energy:-1},'你先有了收入。未来暂时没有答案。',parcel),-.9);
  });
}
function pathway(){
  mode='pathway';
  if(st.route==='degree'){
    curtainRoom(BLUE);const book=form('book',-2,1,.4,5,BLUE,6500),letter=form('letter',2.6,1,-2,3.8,GOLD),crowdWords=['简历','实习','毕业'];crowd(crowdWords);
    say('2025年。你毕业了，招聘通知却没有随铃声一起到来。');hint('把毕业证放进简历，然后决定下一步。');
    ready(V(0,2,13),V(0,1,-1),()=>scrubHot(book,'交出第一份简历 →','degree-cv',k=>{book.position.set(-2+k*3.8,1,.4-k*2);},()=>{
      hideHot();sound('paper');morph(book,'badge',V(-2,1,0),3.8,2.4);say('学历是敲门砖。门后的要求还在变化。');
      offer([{id:'degree-practice',label:'接一个实际项目',delta:{skill:2,reserve:1,energy:-1},text:'课堂里的知识，开始遇到真实的问题。',animate:()=>stream(letter.position,book.position,BLUE)},
        {id:'degree-exam',label:'再准备一年考试',delta:{skill:1,reserve:-1,energy:-1,autonomy:1},text:'你换来备考时间。结果仍然不确定。',animate:()=>morph(letter,'book',V(2,1,0),4,2.5)}]);
    }));
  }else if(st.route==='trade'){
    curtainRoom();const tool=form('wrench',-2.8,1,0,4,BLUE),panel=form('screen',2.4,1,-1,4.5,GOLD),mentor=form('person',0,1,-7,5,GOLD,5500);mentor.userData.alpha=.22;
    say('2024年。证书到手，手上的活还得重新学。');hint('拖动工具，把眼前的故障处理完。');
    ready(V(0,2,13),V(0,1,-1),()=>scrubHot(tool,'对准故障 →','trade-repair',k=>{tool.position.set(-2.8+k*4.7,1,-k);panel.userData.alpha=.3+k*.5;},()=>{
      hideHot();say('会修好它，只是开始。');offer([
        {id:'trade-upskill',label:'跟师傅再学一层',delta:{skill:2,support:1,energy:-1},text:'你学会判断故障，也多了一个能请教的人。',animate:()=>stream(mentor.position,tool.position,GOLD)},
        {id:'trade-shifts',label:'先接满这个月的活',delta:{reserve:2,energy:-2},text:'收入先到手。新的技能留到下个月。',animate:()=>{morph(panel,'clock',V(2,1,-1),4,2.4);sound('step');}}
      ]);
    }));
  }else{
    road(BLUE);rain();const parcel=form('parcel',-2.5,1,1,3.8,GOLD),door=form('door',2.5,1,-4,5,BLUE),bike=form('bike',0,-.1,-2,5,GOLD,7000);bike.userData.alpha=.35;
    say('2022年。第一单，送到别人亮着灯的门口。');hint('拖动包裹，走完这一段夜路。没有失败倒计时。');
    ready(V(0,2,13),V(0,1,-2),()=>scrubHot(parcel,'把这一单送到 →','early-deliver',k=>{parcel.position.set(-2.5+k*5,1,1-k*4.5);bike.position.z=-2-k*3;},()=>{
      hideHot();sound('notification');deliveryRound(()=>{say('到手的钱，来自走过的路。');offer([
        {id:'early-learn',label:'留半晚学别的技能',delta:{skill:2,reserve:1,energy:-1,autonomy:1},text:'你开始给下一份工作留入口。',animate:()=>morph(parcel,'book',V(0,1,0),4,2.5)},
        {id:'early-more',label:'趁还能跑，多跑一些',delta:{reserve:3,energy:-2},text:'你攒到第一笔钱。疲惫也一起攒着。',animate:()=>{stream(parcel.position,V(0,1,1));morph(parcel,'money',V(0,1,0),4,2.5);}}
      ]);});
    }));
  }
}
function work(){
  mode='work';road(BLUE);let phone=form('phone',0,1,0,4.8,BLUE,7000),clock=form('clock',-3.6,1,-3,3.6,GOLD),book=form('book',3.6,1,-3,3.6,GOLD);
  const words=st.route==='degree'?['学历','经验','岗位']:st.route==='trade'?['订单','技术','客户']:['接单','时限','里程'];crowd(words,-13);
  say('2026年。日历满了，心里还是没有着落。');hint('接起这一条工作通知。');
  ready(V(0,2,13),V(0,1,-1),()=>hot(phone,'打开通知','work-message',()=>{
    hideHot();sound('notification');memoryWord(st.route==='degree'?'项目到期':st.route==='trade'?'赶工加单':'订单变多',0,3,-7,4,BLUE);
    say('今天多赚一点，还是给明天留一点？');offer([
      {id:'work-extra',label:'把空闲也接成工作',delta:{reserve:3,energy:-2,autonomy:-1},text:'这个月宽裕了一些。你的时间却更紧了。',animate:()=>{stream(clock.position,phone.position);dissolve(clock);}},
      {id:'work-learn',label:'固定留出学习时间',delta:{reserve:1,skill:2,energy:-1,autonomy:1},text:'你少接了一些活，也开始拥有另一种可能。',animate:()=>{move(book,V(0,1,.5));dissolve(clock);}},
      {id:'work-rest',label:'给自己留一个晚上',delta:{energy:2,meaning:1,reserve:1},text:'工作没有消失。你先让自己恢复一点。',animate:()=>{dissolve(phone);morph(clock,'breath',V(0,1,0),5,2.5);sound('breath');}}
    ]);
  },-.9));
}
function housing(){
  mode='housing';curtainRoom(BLUE);let key=form('key',0,1,0,3.8,GOLD),small=form('door',-3.3,1,-4,4,BLUE),large=form('window',3.3,1,-4,4,GOLD);
  say('2027年。在这条未来里，你要安顿下来。');hint('住房故事是情景设定，开支用虚构资源量表示。');
  ready(V(0,2,14),V(0,1,-2),()=>{
    hot(small,'住得小一点，留余地','house-small',()=>{st.housing='small';take('small-home',{reserve:1,autonomy:1,energy:-1},'地方不大，但还留得出一次转身。',()=>{move(key,V(-3,1,-3));dissolve(large);sound('key');});},-.7);
    hot(large,'先背上更大的承诺','house-large',()=>{st.housing='large';take('large-home',{debt:4,reserve:-2,meaning:1},'你想给生活一个确定的形状。月月要还的，也开始确定。',()=>{move(key,V(3,1,-3));morph(small,'clock',V(-2,1,-1),4,2.5);sound('key');});},-.7);
  });
}
function family(){
  mode='family';curtainRoom();const partner=form('person',-2.4,1,-2,5,BLUE,7000),self=form('person',2.4,1,-2,5,GOLD,7000),heart=form('heart',0,2,.2,3.8,GOLD),baby=form('baby',0,.2,-4,2.6,GOLD,3500);
  baby.userData.alpha=.22;halo(0,1,-2,4,BLUE);say('2028年。你们开始谈：接下来，怎么生活？');hint('生不生孩子，由你们决定。游戏没有标准答案。');
  ready(V(0,2.5,14),V(0,1,-1),()=>offer([
    {id:'family-share',label:'迎接孩子，提前分工',delta:{reserve:-1,support:2,meaning:1},text:'孩子来到生活里。你们先把夜晚怎么分，谈清楚。',animate:()=>{st.family='shared';move(partner,V(-1.2,1,-1));move(self,V(1.2,1,-1));reveal(baby);}},
    {id:'family-rush',label:'先迎接孩子，再慢慢想',delta:{reserve:-1,meaning:1},text:'爱是真的。未分配的照护，也很快变得具体。',animate:()=>{st.family='unplanned';reveal(baby);dissolve(heart);}},
    {id:'family-later',label:'暂时不生，先过好现在',delta:{autonomy:1,energy:1,support:1},text:'这段生活也值得认真经营。你们给彼此留了时间。',animate:()=>{st.family='later';dissolve(baby);stream(self.position,partner.position,BLUE);}}
  ]));
}
function night(){
  mode='night';curtainRoom(BLUE);const clock=form('clock',-3.2,1,-3,4,BLUE),phone=form('phone',3.2,1,-3,4,GOLD),bed=form(st.family==='later'?'bed':'baby',0,1,0,4.8,GOLD,6500);
  say(st.family==='later'?'凌晨一点。工作消息还在亮。':'凌晨一点。孩子醒了，工作消息也亮着。');
  hint(st.family==='later'?'按住这段夜晚，让呼吸慢下来。':'按住，慢慢安抚。照顾一个人需要真实的时间。');
  ready(V(0,2.3,13),V(0,1,-1),()=>holdHot(bed,st.family==='later'?'给自己一点安静':'陪他慢慢睡着','night-hold',3,k=>{
    bed.rotation.z=Math.sin(k*Math.PI*4)*.07*(1-k);phone.userData.alpha=.8-k*.4;clock.userData.scatter=k*.4;
  },()=>{
    hideHot();sound('breath');say('这一晚，不能把所有事情都做完。');
    const hasChild=st.family!=='later';offer([
      {id:'night-support',label:hasChild?'请伴侣换班，自己休息':'和伴侣约定消息边界',delta:{support:1,energy:2,autonomy:1},text:hasChild?'你开口了。照护从一个人的忍耐，变成两个人的安排。':'你把工作通知关到明早。',animate:()=>{morph(phone,'hand',V(2,1,-1),4,2.3);dissolve(clock);}},
      {id:'night-alone',label:hasChild?'自己扛住，继续处理工作':'把今晚的工作也做完',delta:{reserve:1,energy:-2,support:-1},text:'事情一件件做完。你的睡眠却没有人替你补上。',animate:()=>{stream(bed.position,phone.position,BLUE);dissolve(bed);}},
      {id:'night-paid',label:hasChild?'花一些储备换照护':'花一些储备换一天休整',delta:{reserve:-2,energy:2,meaning:1},text:'支持需要成本。你为自己的恢复买回一点时间。',animate:()=>{morph(clock,'money',V(-2,1,-1),3,2.3);dissolve(phone);}}
    ]);
  }));
}
function call(){
  mode='call';curtainRoom();const phone=form('phone',0,1,0,5,BLUE,7000);crowd(['稳定','懂事','以后'], -11,GOLD);
  say('2029年。父母问：“怎么还没稳定下来？”');hint('接起来。理解他们，也听见自己的处境。');sound('ring');
  ready(V(0,2,12),V(0,1,0),()=>hot(phone,'接起电话','parent-call',()=>{
    hideHot();sound('answer');memoryWord('你得想长远',0,3,-6,4,GOLD);say('他们想替你避险，但用的是自己熟悉的地图。');
    offer([
      {id:'call-boundary',label:'说出近况，讲清自己的安排',delta:{autonomy:2,support:1},text:'“我知道你担心。我会告诉你计划，但决定由我来做。”',animate:()=>{stream(V(-4,2,-7),phone.position,GOLD);stream(phone.position,V(4,2,-7),BLUE);}},
      {id:'call-obey',label:'先答应，再把压力留给自己',delta:{autonomy:-2,energy:-1},text:'争执停了。你的日程里，又多了一份别人的期待。',animate:()=>{memoryWord('应该',0,3,-4,3);dissolve(phone);}},
      {id:'call-distance',label:'先结束话题，改天再谈',delta:{autonomy:1,support:-1,energy:1},text:'暂停让你缓了一口气。联系也需要以后重新接上。',animate:()=>{dissolve(phone);sound('off');}}
    ]);
  },-.9));
}
function horizon(){
  mode='horizon';if(!st.checkpoint){let v=copy(st);v.checkpoint=null;st.checkpoint=v;}
  road(BLUE);const doors=[form('screen',-4.2,1,-3,4,BLUE),form('clock',0,1,-6,4,GOLD),form('hand',4.2,1,-3,4,BLUE)];
  say('2030年。未来还没有写好。');hint('选择一种社会情景。没有概率排名，也不是确定预测。');
  ready(V(0,3,18),V(0,1,-4),()=>{
    const arr=[['opening','新技术，也有新入口'],['squeeze','机会更挤，变化更快'],['care','照护支持，逐步跟上']];
    arr.forEach(([name,label],i)=>hot(doors[i],label,'world-'+name,()=>{
      st.world=name;const text={opening:'假设：部分新岗位出现。转向仍需要时间和技能。',squeeze:'假设：订单与岗位波动加大，缓冲储备更重要。',care:'假设：当地可用的托育、培训与照护支持扩大。'}[name];
      take('world-'+name,{},text,()=>{doors.filter((_,j)=>j!==i).forEach(a=>dissolve(a));fly(V(doors[i].position.x*.65,2,10),doors[i].position.clone(),3);},3.5);
    },-.9));
  });
}
function transition(){
  mode='transition';road(st.world==='squeeze'?GOLD:BLUE);const currentJob=form(st.route==='early'?'parcel':st.route==='trade'?'wrench':'screen',-2.8,1,0,4.5,GOLD),newJob=form('screen',3,1,-3,4.5,BLUE);
  const messages={opening:'2032年。部分旧任务交给机器，新工作开始招人。',squeeze:'2032年。相同的订单，多了竞争，也少了确定。',care:'2032年。你所在的地方，多了一些能用的支持。'};
  say(messages[st.world]);hint('拖动现在的工作，看看它怎样变了。');
  ready(V(0,2.4,14),V(0,1,-1),()=>scrubHot(currentJob,'把时间往前推 →','future-shift',k=>{
    currentJob.userData.scatter=k*.7;currentJob.userData.alpha=.8-k*.5;newJob.userData.alpha=.2+k*.55;
  },()=>{
    hideHot();let adequate=st.skill>=5,opening=st.world==='opening',squeeze=st.world==='squeeze';
    say('变化不会问你准备好了没有。');
    offer([
      {id:'future-adapt',label:'用积累转进新任务',delta:{reserve:adequate?(opening?3:1):-1,skill:2,energy:-1,autonomy:1},text:adequate?'以前留出的学习时间，终于接上了新的机会。':'准备还不够。转向需要再交一段学习的成本。',animate:()=>{dissolve(currentJob);move(newJob,V(0,1,0));}},
      {id:'future-stay',label:'把熟悉的活继续做好',delta:{reserve:squeeze?-1:2,energy:squeeze?-1:0,meaning:1},text:squeeze?'熟练还在，需求却变少了。你需要更长的缓冲。':'有些工作仍需要人的手感、判断和耐心。',animate:()=>{currentJob.userData.scatter=0;currentJob.userData.alpha=.7;dissolve(newJob);}},
      {id:'future-network',label:'找培训，也找人一起做',delta:{reserve:st.world==='care'?1:-1,skill:2,support:2,energy:-1},text:st.world==='care'?'当地支持真的可用。你也付出了时间与练习。':'你开始找到伙伴。机会没有立即变成收入。',animate:()=>{crowd(['一起','学习'], -10,BLUE);stream(currentJob.position,newJob.position,BLUE);}}
    ]);
  }));
}
function care(){
  mode='care';curtainRoom(BLUE);const parent=form('person',-3.1,1,-3,5.3,GOLD,7000),caseBox=form('health',2.7,1,0,4,BLUE),clock=form('clock',0,3,-5,3.6,GOLD);
  parent.userData.alpha=.35;say('2035年。父母六十岁。一次身体不适，让安排突然改了。');hint('这是假设事件，不代表六十岁必然患病。把照护包送到身边。');
  ready(V(0,2.3,14),V(0,1,-1),()=>scrubHot(caseBox,'带着照护包过去 ←','care-deliver',k=>{
    caseBox.position.set(2.7-k*5,1,-k*2.7);parent.userData.alpha=.35+k*.3;
  },()=>{
    hideHot();const helped=st.world==='care'||st.support>=6;
    say(st.family==='later'?'你的工作和父母的照护，挤在同一周。':'孩子的日程，父母的照护，挤在同一周。');offer([
      {id:'care-share',label:'一起排班，寻找可用的服务',delta:{support:1,reserve:helped?-1:-2,energy:helped?0:-1},text:helped?'你动用了以前建立的支持。这次有人接得住。':'支持有限，协调也花时间。至少你开始分担。',animate:()=>{form('hand',0,1,-1,4,BLUE);stream(caseBox.position,parent.position,BLUE);}},
      {id:'care-solo',label:'自己请假，亲自陪着',delta:{reserve:-2,energy:-2,meaning:1},text:'陪伴有价值。少掉的收入和睡眠，也是真实的代价。',animate:()=>{move(caseBox,V(-2.5,.6,-2));dissolve(clock);}},
      {id:'care-finance',label:'先借一点钱，安排照护',delta:{debt:2,energy:1},text:'眼前的照护有人接手。偿还会进入之后的生活。',animate:()=>{morph(clock,'money',V(0,2,-2),3.6,2.5);stream(clock.position,parent.position);}}
    ]);
  }));
}
function wish(){
  mode='wish';road(BLUE);const plant=form('plant',0,1,0,4.9,BLUE,6500),money=form('money',-3.2,1,-3,3.7,GOLD),clock=form('clock',3.2,1,-3,3.7,GOLD);
  say('2038年。你三十五岁。生活没有统一的交卷时间。');hint('最后一次安排，会改变一些东西，但不能重写前面的人生。');
  ready(V(0,2.3,14),V(0,1,-1),()=>offer([
    {id:'wish-buffer',label:'先修复储备和债务',delta:{reserve:2,debt:-2,energy:-1},text:'你先为突如其来的事，留一个能站住的地方。',animate:()=>{stream(money.position,plant.position);dissolve(money);}},
    {id:'wish-health',label:'减少透支，找回日常',delta:{energy:2,meaning:1,reserve:-1},text:'你把可以少做的事放下。生活慢慢重新有了触感。',animate:()=>{morph(clock,'breath',V(0,1,0),5,2.5);sound('breath');}},
    {id:'wish-choice',label:'给下一次转向留入口',delta:{skill:1,autonomy:1,support:1,reserve:-1},text:'你不再只问自己能不能忍，也开始问还能怎么走。',animate:()=>{reveal(plant);memoryWord('还有路',0,3,-8,4,BLUE);}}
  ]));
}
// Six endings, computed from the accumulated trajectory and the selected world.
function endingFor(s){
  const buffer=s.reserve-s.debt*.7;
  if(s.energy<=2)return {id:'spent',title:'灯还亮着',line:'你撑过了很多事。接下来，需要有人和你一起把负担放下来。',reason:'连续加班、独自承担或照护，把恢复的时间挤掉了。'};
  if(buffer<=0&&s.debt>=4)return {id:'tethered',title:'被承诺牵着走',line:'你认真兑现了很多承诺。现在，也需要给承诺设一个上限。',reason:'住房或照护的长期支出，超过了留下的缓冲。'};
  if(s.skill>=7&&s.autonomy>=5&&s.energy>=3)return {id:'turn',title:'还可以转身',line:'不是一路顺利。你曾为改变保留技能、联系和一点余地。',reason:'几次学习和边界选择，让变化没有堵住所有出口。'};
  if(s.support>=6&&s.energy>=4)return {id:'shared',title:'有人接得住',line:'日子仍然普通。难的时候，照护和压力不再只落在一个人身上。',reason:'持续的联系、分工和可用服务，形成了一张支持的网。'};
  if(buffer>=3&&s.energy>=3)return {id:'steady',title:'一小块安稳',line:'你没有得到所有想要的。但守住了能喘息、能选择的一小块生活。',reason:'一些储备与不过度承诺，替你挡住了波动。'};
  return {id:'unfinished',title:'人生仍在途中',line:'未来没有把你变成一个标准答案。你仍然可以调整下一天。',reason:'资源还有限，机会也没消失。先找一个能改变的小环节。'};
}
function ending(){
  mode='ending';const end=endingFor(st);st.ending=end.id;
  let plant=form(end.id==='spent'?'lamp':'plant',0,.8,-1,5,BLUE,8000);reveal(plant,4);
  let title=glyph(end.title,0,3.4,-5,7,GOLD);reveal(title,4);halo(0,1,-3,5,BLUE,12000);
  crowd(['2003','2021','2026','2030'], -20,GOLD);
  say('2040年。你三十七岁。');hint(worldNames[st.world]+' · '+routeNames[st.route]+' · 这是情景结局，不是人生判决。');
  ready(V(0,2.5,17),V(0,1,-3),()=>{
    say(end.line);$('reflection').hidden=false;$('reflection').replaceChildren();
    const reason=document.createElement('span');reason.textContent=end.reason;$('reflection').appendChild(reason);
    after(4,()=>choices([
      ['想一想，再往前',()=>reflection(end)],
      ['同一个我，另一种未来',()=>{st=copy(st.checkpoint);st.checkpoint=null;next(11);}],
      ['从出生重新走一次',()=>{st=fresh();next(0);}]
    ]));
  },4.5);
}
function reflection(end){
  hideHot();choices([]);$('reflection').hidden=true;world.children.filter(p=>p.userData.text).forEach(p=>dissolve(p));
  memoryWord('你的生活',0,3,-6,5,BLUE);say('理解父母，不必把自己的人生交回去。');hint('改变认知未必做得到。安排、边界和支持，可以从眼前的一件事开始。');
  after(4,()=>{say('如果明天没有按计划来，你想为自己留下什么？');choices([
    ['留一点余地',()=>closeStory('余地')],['留一个能开口的人',()=>closeStory('联系')],['留一个自己的选择',()=>closeStory('选择')]
  ]);});
}
function closeStory(word){
  choices([]);record('reflection-'+word,{});memoryWord(word,0,2,-3,5,BLUE);say('这一件事，可以从今天开始。');hint('');
  after(3,()=>choices([['试走另一种未来',()=>{st=copy(st.checkpoint);st.checkpoint=null;next(11);}],['从出生重来',()=>{st=fresh();next(0);}],['音乐与时代资料',showSources]]));
}
const chapters=[
  {year:()=>2003,name:'出生',build:birth,score:0,at:25},
  {year:()=>2009,name:'第一次背起书包',build:school,score:0,at:54},
  {year:()=>2015,name:'灯下的家庭',build:childhood,score:0,at:77},
  {year:()=>2020,name:'缩进屏幕的课堂',build:pandemic,score:1,at:40},
  {year:()=>2021,name:'十八岁的岔路',build:fork,score:2,at:24},
  {year:()=>st.route==='degree'?2025:st.route==='trade'?2024:2022,name:'第一道门',build:pathway,score:2,at:49},
  {year:()=>2026,name:'进入此刻',build:work,score:1,at:82},
  {year:()=>2027,name:'一处落脚',build:housing,score:1,at:107},
  {year:()=>2028,name:'一起生活',build:family,score:0,at:115},
  {year:()=>2028,name:'凌晨一点',build:night,score:1,at:142},
  {year:()=>2029,name:'一通电话',build:call,score:0,at:91},
  {year:()=>2030,name:'三种未来',build:horizon,score:2,at:72},
  {year:()=>2032,name:'工作变了',build:transition,score:2,at:92},
  {year:()=>2035,name:'另一种照护',build:care,score:1,at:165},
  {year:()=>2038,name:'给自己留什么',build:wish,score:3,at:24},
  {year:()=>2040,name:'尚未写完',build:ending,score:3,at:50}
];
function next(n){
  if(busy||!chapters[n])return;busy=true;hideHot();choices([]);hint('');$('reflection').hidden=true;
  $('curtain').style.transition='opacity .6s';$('curtain').style.opacity=1;sound('wind');
  after(.75,()=>{clear();chapter=n;st.chapter=n;entry=copy(st);save();
    mini=null;const c=chapters[n],year=c.year();$('chapter').textContent=year+' · '+(year-2003)+'岁 · '+c.name;
    $('projection').hidden=year<=2026;score(c.score,c.at,.28);c.build();$('curtain').style.opacity=0;
  });
}
function showSources(){
  const wasPaused=paused;pause(true);$('sources').innerHTML=`<div class="credits-inner"><button id="closeCredits" aria-label="关闭资料">×</button>
  <h2>一段普通人生，三种可能的明天</h2>
  <p>人物为虚构：2003年出生，父母生于1975年。家庭不代表所有普通家庭。游戏没有把学历、工种、生育选择排成高低，也不把童年困境归咎于孩子。</p>
  <h3>历史、现在和未来</h3>
  <p>2003—2026有真实时代背景；个人情节是创作。2027—2040全部标注为情景推演。三种情景没有概率，六种结局不预测玩家的实际人生。</p>
  <p>技术情景假设部分新岗位出现、任务重新分配；压力情景假设岗位与订单波动加大；支持情景假设当地照护和培训可及性提高。现实可能同时包含三者，地区、家庭和政策落实都会不同。</p>
  <p>储备、债务、技能、精力、支持与自主，用虚构资源单位记录。它们只构成游戏规则，没有对应收入金额、就业概率或个人诊断。恢复、求助和转向均有代价。</p>
  <h3>未来推演的现实锚点</h3>
  <p><a href="https://www.stats.gov.cn/xxgk/sjfb/tjgb2020/202602/t20260228_1962662.html" target="_blank" rel="noopener">国家统计局：2025年统计公报</a> · 人口年龄结构与就业背景。</p>
  <p><a href="https://www.moe.gov.cn/jyb_xwfb/s5147/202606/t20260615_1440719.html" target="_blank" rel="noopener">教育部：2026届毕业生就业工作</a> · 毕业生规模与岗位服务。</p>
  <p><a href="https://jxca.miit.gov.cn/xwdt/szyw/art/2025/art_298e9617d3d54da69aa70b9cebd910ac.html" target="_blank" rel="noopener">国务院：深入实施“人工智能+”行动</a> · 任务变化与新机会，不等同于所有岗位消失。</p>
  <p><a href="https://www.gov.cn/zhengce/zhengceku/202507/content_7032222.htm" target="_blank" rel="noopener">大规模职业技能提升培训行动</a> · 学习支持不保证就业。</p>
  <p><a href="https://www.nhc.gov.cn/rkjcyjtfzs/c100147/202507/06cb12b180904128ae7e55620b713ac0.shtml" target="_blank" rel="noopener">2025年育儿补贴制度实施方案</a> · 当前政策依据，不外推未来金额或资格。</p>
  <h3>音乐、声音与字体</h3>
  <p>“Signal to Noise”（含 No Piano Melody）、“Undertow”、“Penumbra” · Scott Buckley。<a href="https://www.scottbuckley.com.au/library/" target="_blank" rel="noopener">音乐库</a>，<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>。游戏对配乐做了截取、循环、增益与交叉淡化。</p>
  <p>声音来源及许可详见 <a href="../音乐与素材署名.md" target="_blank" rel="noopener">完整素材署名</a>。Joseph SARDIN / BigSoundBank、aleckmackay 与 alexdarek / Freesound 的 CC0 素材，以及 Pixabay 的转场声音。部分呼吸、脚步与雨声由程序合成。</p>
  <p>Noto Serif SC / Noto Sans SC，Adobe，SIL OFL 1.1；Three.js r147，MIT。仅绘制粒子点，无实体建模。</p>
  <p><a href="../" rel="noopener">回到《从前与此刻》：理解父辈</a> · <a href="https://github.com/2813750541a-ops/then-and-now-particle-game" target="_blank" rel="noopener">公开源码</a></p></div>`;
  if(window.LOCAL_CREDITS){
    const details=document.createElement('details'),summary=document.createElement('summary'),text=document.createElement('pre');
    summary.textContent='完整素材署名（已包含在本地文件内）';text.textContent=window.LOCAL_CREDITS;
    text.style.cssText='white-space:pre-wrap;font:12px/1.8 FilmHei';details.append(summary,text);$('sources').querySelector('.credits-inner').append(details);
    $('sources').querySelector('a[href="../音乐与素材署名.md"]')?.remove();$('sources').querySelector('a[href="../"]')?.remove();
  }
  $('sources').style.display='flex';$('closeCredits').onclick=()=>{$('sources').style.display='none';if(!wasPaused)pause(false);};
}

const scoreFiles=['score-memory','score-tension','score-change','score-after'];
const scoreTitles=['Signal to Noise','Signal to Noise · No Piano Melody','Undertow','Penumbra'];
let ac=null,bus=null,musicOut=null,audioMeter=null,recordDest=null,tracks=[],trackGains=[],current=-1,musicTarget=.3,sfxActive=new Set();
function initAudio(){if(ac){ac.resume();return;}ac=new(window.AudioContext||window.webkitAudioContext)();let limiter=ac.createDynamicsCompressor(),mixLift=ac.createGain();mixLift.gain.value=2.8;mixLift.connect(limiter);limiter.threshold.value=-5;limiter.knee.value=8;limiter.ratio.value=8;limiter.attack.value=.006;limiter.release.value=.28;audioMeter=ac.createAnalyser();audioMeter.fftSize=2048;limiter.connect(audioMeter);audioMeter.connect(ac.destination);recordDest=ac.createMediaStreamDestination();limiter.connect(recordDest);bus=ac.createGain();bus.gain.value=.65;bus.connect(mixLift);musicOut=ac.createGain();musicOut.gain.value=.3;musicOut.connect(mixLift);for(let i=0;i<scoreFiles.length;i++){let a=new Audio(window.LOCAL_SCORES?.[i]||'../assets/'+scoreFiles[i]+'.mp3');a.loop=true;a.preload='metadata';a.volume=1;let source=ac.createMediaElementSource(a),gain=ac.createGain();gain.gain.value=0;source.connect(gain).connect(musicOut);tracks.push(a);trackGains.push(gain);}ac.resume();}
function gainTo(param,value,seconds){if(!ac)return;let t=ac.currentTime;param.cancelScheduledValues(t);param.setValueAtTime(param.value,t);param.linearRampToValueAtTime(value,t+seconds);}
function musicLevel(level,seconds=2){musicTarget=level;if(musicOut)gainTo(musicOut.gain,muted?0:level,seconds);}
function score(i,at=0,level=.32){if(!ac)return;let old=current;current=i;tracks[i].currentTime=at;tracks[i].play().catch(()=>{});musicLevel(level,2.5);trackGains.forEach((g,j)=>gainTo(g.gain,j===i?1:0,j===i?3:2.6));after(3.2,()=>{if(current===i)tracks.forEach((a,j)=>{if(j!==i)a.pause();});});}
function recorded(type,volume=.35,pan=0){if(!ac||muted||paused)return false;let name={wind:'transition',dull:'change',off:'notification',answer:'dial'}[type]||type;if(!['paper','dial','train','transition','change','click','notification','ring','rail'].includes(name))return false;let a=new Audio(window.LOCAL_SFX?.[name]||'../assets/sfx/'+name+'.mp3');a.volume=1;let src=ac.createMediaElementSource(a),g=ac.createGain(),p=ac.createStereoPanner();g.gain.value=volume;p.pan.value=pan;src.connect(g).connect(p).connect(bus);sfxActive.add(a);a.onended=()=>{src.disconnect();g.disconnect();p.disconnect();sfxActive.delete(a);};a.onerror=a.onended;a.play().catch(()=>a.onended());return true;}
function tone(freq,d,g=.12,delay=0,pan=0){if(!ac||muted||paused)return;let o=ac.createOscillator(),v=ac.createGain(),p=ac.createStereoPanner();o.type='sine';o.frequency.value=freq;v.gain.setValueAtTime(.001,ac.currentTime+delay);v.gain.linearRampToValueAtTime(g,ac.currentTime+delay+.02);v.gain.exponentialRampToValueAtTime(.001,ac.currentTime+delay+d);p.pan.value=pan;o.connect(v).connect(p).connect(bus);o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+d+.1);}
function noise(d,g=.2,cut=2200,pan=0){if(!ac||muted||paused)return;let b=ac.createBuffer(1,ac.sampleRate*d,ac.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=(rand()-.5)*g*Math.sin(Math.PI*i/a.length);let s=ac.createBufferSource(),f=ac.createBiquadFilter(),p=ac.createStereoPanner();s.buffer=b;f.type='lowpass';f.frequency.value=cut;p.pan.value=pan;s.connect(f).connect(p).connect(bus);s.start();}
function sound(type){
 if(type==='rain'){noise(2,.11,4400);return;}
 if(type==='breath'){noise(1.2,.13,900);return;}
 if(type==='grain'){noise(.8,.25,3200,.2);return;}
 if(type==='step'){noise(.18,.35,550,-.2);tone(90,.18,.035);return;}
 if(type==='stamp'){noise(.14,.4,750,-.5);tone(100,.23,.08);return;}
 if(type==='coin'||type==='key'){tone(1430,.45,.06,.02,.3);tone(2110,.32,.03,.07,.25);return;}
 if(type==='pulse'){tone(52,.38,.07);tone(66,.3,.035,.42);return;}
 const map={wind:'transition',dull:'change',off:'notification',answer:'dial'};
 recorded(map[type]||type,{transition:.07,change:.13,notification:.2,ring:.34,paper:.32,rail:.22}[map[type]||type]||.22);
}

function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}resize();addEventListener('resize',resize);
function loop(now){requestAnimationFrame(loop);let dt=last?Math.min((now-last)/1000,.3):0;last=now;if(paused)return;dt*=playbackRate;time+=dt;if(cam){let c=cam,k=clamp((time-c.start)/c.dur),e=cameraEase(k);camera.position.lerpVectors(c.a,c.b,e);camera.position.y+=Math.sin(k*Math.PI)*.12;look.lerpVectors(c.c,c.d,e);if(k>=1){cam=null;if(c.done)c.done();}}camera.lookAt(look);let previous=anim;anim=[];previous.forEach(a=>{if(!a.tick(time))anim.push(a);});ambient.rotation.y=time*.001;actors.forEach(p=>{p.material.uniforms.uTime.value=time;p.material.uniforms.uOpacity.value=p.userData.alpha;p.material.uniforms.uScatter.value=p.userData.scatter;});scene.updateMatrixWorld();hotspots.forEach(h=>{let p=h.actor.position.clone();p.y+=h.dy;p.project(camera);h.b.style.left=clamp((p.x*.5+.5)*innerWidth,innerWidth*.12,innerWidth*.88)+'px';h.b.style.top=clamp((-p.y*.5+.5)*innerHeight,innerHeight*.28,innerHeight*.72)+'px';h.b.style.visibility=p.z<0||p.z>1?'hidden':'visible';});renderer.render(scene,camera);}
const ray=new THREE.Raycaster();ray.params.Points.threshold=.3;let pointer=new THREE.Vector2();$('world').onpointerdown=e=>{if(paused||busy||cam||mode==='intro')return;drag={x:e.clientX,y:e.clientY,moved:false};$('world').setPointerCapture(e.pointerId);};$('world').onpointermove=e=>{if(!drag||cam)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>3){drag.moved=true;look.x-=dx*.008;look.y=clamp(look.y+dy*.004,-.3,3.2);drag.x=e.clientX;drag.y=e.clientY;}};$('world').onpointerup=e=>{if(drag&&!drag.moved&&!cam&&!busy){pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(pointer,camera);let hits=ray.intersectObjects(hotspots.filter(h=>h.b.style.display!=='none'&&h.b.style.visibility!=='hidden').map(h=>h.actor),false);if(hits.length){let h=hotspots.find(h=>h.actor===hits[0].object&&h.b.style.display!=='none'&&h.b.style.visibility!=='hidden');if(h&&h.b.dataset.gesture!=='drag'&&h.b.dataset.gesture!=='hold')h.fn();}}drag=null;};

let playbackRate=1;
$('start').disabled=true;
$('start').onclick=()=>{initAudio();$('intro').style.display='none';clear();st=fresh();next(0);};
$('continue').onclick=()=>{initAudio();$('intro').style.display='none';clear();next(st.chapter);};
$('sound').onclick=()=>{muted=!muted;$('sound').textContent=muted?'声音 关':'声音 开';
  if(bus)gainTo(bus.gain,muted?0:.65,.15);if(musicOut)gainTo(musicOut.gain,muted?0:musicTarget,.3);};
$('fullscreen').onclick=()=>document.fullscreenElement?document.exitFullscreen?.():document.documentElement.requestFullscreen?.();
function pause(on){
  paused=on;$('pause').style.display=on?'flex':'none';
  if(on){ac?.suspend();tracks.forEach(a=>a.pause());sfxActive.forEach(a=>a.pause());}
  else{ac?.resume();if(current>=0)tracks[current].play().catch(()=>{});sfxActive.forEach(a=>a.play().catch(()=>{}));}
}
$('pauseButton').onclick=()=>pause(true);$('resume').onclick=()=>pause(false);
$('restart').onclick=()=>{pause(false);$('intro').style.display='none';clear();st=fresh();next(0);};
$('credits').onclick=showSources;
document.onkeydown=e=>{if(e.key==='Escape'){
  if($('sources').style.display==='flex')$('closeCredits').click();else pause(!paused);
}};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode!=='intro'&&!paused)pause(true);});
function audioRMS(){if(!audioMeter)return 0;let a=new Float32Array(audioMeter.fftSize);audioMeter.getFloatTimeDomainData(a);
  let sum=0;for(let x of a)sum+=x*x;return Math.sqrt(sum/a.length);}
window.Game={
  getState:()=>({...copy(st),chapter,mode,busy,paused,camMoving:!!cam,mini:copy(mini)}),
  getAudioStatus:()=>({current,title:scoreTitles[current],musicTarget,muted,rms:audioRMS(),tracks:tracks.map(a=>({ready:a.readyState,error:a.error?.message||null,paused:a.paused}))}),
  captureStream:()=>{let stream=$('world').captureStream(30);if(recordDest)recordDest.stream.getAudioTracks().forEach(t=>stream.addTrack(t));return stream;},
  renderer,scene,camera
};
// QA accelerates time only on loopback; interactions still use actual pointer/keyboard events.
if(['127.0.0.1','localhost'].includes(location.hostname))window.Game.setPlaybackRate=k=>playbackRate=clamp(k,1,15);
document.fonts.ready.then(()=>{
  const seedLight=halo(0,1,-3,4.5,BLUE,12000);seedLight.rotation.x=.4;lightBeam(V(0,7,-8),V(0,1,-3),1.8);
  const child=form('baby',0,1,-3,3,GOLD,4000);child.userData.alpha=.24;
  $('start').disabled=false;requestAnimationFrame(loop);
});

})();
