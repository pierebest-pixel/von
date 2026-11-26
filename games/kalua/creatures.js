/* Les Échoués de Kalua — animaux de l'île : dessins (repris du bestiaire validé) et promenades.
 * Les déplacements sont calculés à partir de l'heure commune : les deux joueurs voient les mêmes animaux au même endroit. */
"use strict";

const Creatures = (() => {
const TAU = Math.PI * 2;
let c;
const circle=(x,y,r)=>{c.beginPath();c.arc(x,y,r,0,TAU);c.fill();};
const ell=(x,y,rx,ry,r=0)=>{c.beginPath();c.ellipse(x,y,rx,ry,r,0,TAU);c.fill();};
const line=(pts,w,col)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.lineJoin='round';c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
const fill=(col)=>{c.fillStyle=col;};
const eyes=(x1,x2,y,r=2.2,angry=false,blush=true)=>{fill('#2b2230');ell(x1,y,r*.8,r);ell(x2,y,r*.8,r);fill('#fff');circle(x1+r*.3,y-r*.4,r*.35);circle(x2+r*.3,y-r*.4,r*.35);
  if(angry){line([[x1-r*1.4,y-r*2],[x1+r,y-r*1.2]],1.4,'#2b2230');line([[x2+r*1.4,y-r*2],[x2-r,y-r*1.2]],1.4,'#2b2230');}
  if(blush){c.globalAlpha=.45;fill('#ff8a9a');ell(x1-r*1.2,y+r*1.7,r*.9,r*.55);ell(x2+r*1.2,y+r*1.7,r*.9,r*.55);c.globalAlpha=1;}};
const shadow=(x,y,rx)=>{fill('rgba(120,90,60,.16)');ell(x,y,rx,rx*.25);};
const smile=(x,y,w=2)=>{c.strokeStyle='#6b4040';c.lineWidth=1;c.beginPath();c.arc(x,y-w*.6,w,.2*Math.PI,.8*Math.PI);c.stroke();};


const C={
 crabe(){shadow(0,18,22);for(const s of[-1,1]){for(let i=0;i<3;i++)line([[s*8,8+i*2],[s*18,12+i*3],[s*20,18]],2,'#e86a6a');}
  fill('#ff8a8a');ell(0,6,16,11);fill('#ffb0b0');ell(-4,2,8,4);for(const s of[-1,1]){fill('#ff8a8a');line([[s*12,0],[s*20,-8]],3,'#ff8a8a');circle(s*22,-12,6);fill('#fff');c.beginPath();c.moveTo(s*22,-12);c.lineTo(s*28,-16);c.lineTo(s*28,-9);c.fill();}
  line([[-4,-2],[-5,-10]],1.6,'#e86a6a');line([[4,-2],[5,-10]],1.6,'#e86a6a');fill('#fff');circle(-5,-11,3);circle(5,-11,3);fill('#2b2230');circle(-5,-11,1.6);circle(5,-11,1.6);smile(0,9,3);},
 mouette(){shadow(0,20,16);line([[-3,12],[-3,19]],1.5,'#f0a040');line([[3,12],[3,19]],1.5,'#f0a040');fill('#fff');ell(0,4,15,11);fill('#d6d3e3');ell(4,4,10,6,.3);fill('#fff');circle(-8,-6,8);fill('#ffc04a');c.beginPath();c.moveTo(-15,-5);c.lineTo(-24,-3);c.lineTo(-15,-1);c.fill();fill('#2b2230');circle(-10,-8,1.6);fill('#fff');circle(-9.5,-8.5,.5);},
 bernard(){shadow(0,18,16);fill('#ff9a6a');ell(-10,10,8,5);for(let i=0;i<3;i++)line([[-14+i*4,12],[-16+i*4,17]],1.6,'#e86a4a');
  fill('#ffe6d0');circle(5,2,13);c.strokeStyle='#e8b8a0';c.lineWidth=1.6;c.beginPath();for(let t=0;t<14;t+=.2){const r=t*.85;c.lineTo(5+Math.cos(t)*r,2+Math.sin(t)*r);}c.stroke();
  line([[-12,6],[-13,-2]],1.4,'#e86a4a');line([[-8,6],[-8,-2]],1.4,'#e86a4a');fill('#2b2230');circle(-13,-3,1.8);circle(-8,-3,1.8);},
 crabeGeant(){shadow(0,20,30);for(const s of[-1,1])for(let i=0;i<3;i++)line([[s*10,8+i*2],[s*24,10+i*4],[s*27,19]],2.6,'#c0392b');
  fill('#e0503a');ell(0,4,22,14);fill('#ff7a5a');ell(-5,-1,10,5);for(let i=-2;i<=2;i++){fill('#a8301f');c.beginPath();c.moveTo(i*7-3,-8);c.lineTo(i*7,-14);c.lineTo(i*7+3,-8);c.fill();}
  for(const s of[-1,1]){line([[s*16,-2],[s*26,-12]],4.5,'#e0503a');fill('#e0503a');circle(s*29,-16,9);fill('#fdf6ec');c.beginPath();c.moveTo(s*29,-16);c.lineTo(s*39,-22);c.lineTo(s*38,-11);c.fill();}
  fill('#fff');circle(-6,-6,3.4);circle(6,-6,3.4);fill('#2b2230');circle(-6,-6,2);circle(6,-6,2);line([[-10,-11],[-3,-8]],1.8,'#2b2230');line([[10,-11],[3,-8]],1.8,'#2b2230');
  line([[-5,8],[0,5],[5,8]],1.5,'#6b2020');},
 singe(){shadow(0,20,16);c.strokeStyle='#8a5a3c';c.lineWidth=3;c.beginPath();c.moveTo(10,12);c.quadraticCurveTo(26,10,22,-2);c.quadraticCurveTo(20,-8,25,-8);c.stroke();
  fill('#8a5a3c');ell(0,10,11,10);circle(-14,-6,5);circle(14,-6,5);circle(0,-6,12);fill('#f2c9a0');circle(-14,-6,2.6);circle(14,-6,2.6);ell(0,-3,9,8);ell(0,10,6,6);eyes(-4,4,-5,1.9);smile(0,0,2.4);
  fill('#ffd23a');c.save();c.translate(-12,10);c.rotate(-.6);ell(0,0,3,7);c.restore();},
 perroquet(){shadow(0,20,12);line([[-2,12],[-2,19]],1.5,'#6b5050');line([[3,12],[3,19]],1.5,'#6b5050');
  fill('#3a7ad8');c.beginPath();c.moveTo(-2,10);c.lineTo(-6,26);c.lineTo(4,26);c.closePath();c.fill();fill('#e8403a');ell(0,4,10,12);fill('#ffd23a');ell(4,4,6,8,.3);fill('#3a7ad8');ell(6,8,4,6,.3);
  fill('#e8403a');circle(0,-10,9);fill('#fff');ell(-3,-11,4,4);fill('#3a3a3a');c.beginPath();c.moveTo(-8,-9);c.quadraticCurveTo(-16,-8,-11,-2);c.lineTo(-7,-5);c.fill();fill('#2b2230');circle(-3,-11,1.7);},
 papillon(){for(const s of[-1,1]){fill('#c9a3e8');ell(s*14,-6,14,11,s*.4);fill('#ffb0d8');ell(s*11,10,9,7,-s*.3);fill('#fff');circle(s*16,-8,3.4);fill('#ffd23a');circle(s*16,-8,1.6);}
  fill('#6b5050');ell(0,2,3,13);circle(0,-12,4);line([[-1,-15],[-5,-22]],1,'#6b5050');line([[1,-15],[5,-22]],1,'#6b5050');fill('#fff');circle(-1.5,-12.5,1);circle(1.5,-12.5,1);},
 sanglier(){const one=(x,y,s)=>{c.save();c.translate(x,y);c.scale(s,s);shadow(0,16,16);fill('#5a3e30');for(const i of[-8,-3,3,8])c.fillRect(i-1.5,8,3,8);ell(0,4,16,10);
   for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*3-2,-5);c.lineTo(i*3,-12+Math.abs(i));c.lineTo(i*3+2,-5);c.fill();}fill('#7a5440');circle(-14,0,8);fill('#d8a890');ell(-21,2,4,3.4);fill('#5a3e30');circle(-22,1.5,.8);circle(-20,2.5,.8);
   fill('#fffaf0');c.beginPath();c.moveTo(-19,5);c.quadraticCurveTo(-24,4,-23,-2);c.lineTo(-20,3);c.fill();fill('#ffd23a');circle(-15,-2,1.8);line([[-18,-6],[-12,-4]],1.4,'#2b2230');c.restore();};
   one(14,-4,.62);one(-14,-2,.62);one(2,8,.8);},
 grenouille(){shadow(0,18,18);fill('#5fbf5a');ell(0,8,17,11);for(const s of[-1,1]){ell(s*14,14,7,4);}fill('#bfe8a0');ell(0,11,10,6);fill('#5fbf5a');circle(-8,-4,7);circle(8,-4,7);fill('#fff');circle(-8,-5,5);circle(8,-5,5);fill('#2b2230');circle(-8,-5,2.8);circle(8,-5,2.8);fill('#fff');circle(-7,-6,1);circle(9,-6,1);
  c.strokeStyle='#2b5a2a';c.lineWidth=1.4;c.beginPath();c.arc(0,2,7,.15*Math.PI,.85*Math.PI);c.stroke();c.globalAlpha=.5;fill('#ff8a9a');ell(-12,4,3,2);ell(12,4,3,2);c.globalAlpha=1;},
 libellule(){c.globalAlpha=.75;fill('#bfe8ff');for(const s of[-1,1]){ell(s*14,-6,15,4,s*-.25);ell(s*13,2,13,3.6,s*.25);}c.globalAlpha=1;fill('#3aa8a0');c.fillRect(-2,-4,4,26);for(let i=0;i<5;i++){fill(i%2?'#2a8a88':'#3aa8a0');c.fillRect(-2.4,0+i*4.5,4.8,3);}circle(0,-8,5);fill('#fff');circle(-2,-9,2);circle(2,-9,2);fill('#2b2230');circle(-2,-9,1);circle(2,-9,1);},
 heron(){shadow(0,22,12);line([[-2,6],[-2,22]],1.6,'#8a7a6a');line([[3,6],[4,22]],1.6,'#8a7a6a');fill('#b9c0c8');ell(2,2,11,8);fill('#9aa2ac');ell(6,1,8,5,.3);
  c.strokeStyle='#b9c0c8';c.lineWidth=4;c.beginPath();c.moveTo(-4,-2);c.quadraticCurveTo(-12,-10,-6,-18);c.stroke();fill('#b9c0c8');circle(-6,-20,5);fill('#ffc04a');c.beginPath();c.moveTo(-10,-20);c.lineTo(-24,-18);c.lineTo(-10,-17);c.fill();fill('#2b2230');circle(-7,-21,1.3);line([[-3,-22],[6,-26]],1.2,'#5a5a6a');},
 croco(){const one=(x,y,s)=>{c.save();c.translate(x,y);c.scale(s,s);shadow(0,10,20);fill('#5a8a4a');ell(2,4,16,7);c.beginPath();c.moveTo(16,4);c.lineTo(30,6);c.lineTo(16,9);c.fill();
   for(let i=0;i<5;i++){fill('#4a7a3a');c.beginPath();c.moveTo(-6+i*5,-2);c.lineTo(-4+i*5,-6);c.lineTo(-2+i*5,-2);c.fill();}
   fill('#5a8a4a');ell(-16,4,10,5);fill('#fffaf0');for(let i=0;i<4;i++){c.beginPath();c.moveTo(-24+i*3,5);c.lineTo(-22.5+i*3,8);c.lineTo(-21+i*3,5);c.fill();}
   fill('#5a8a4a');circle(-12,-2,3.6);fill('#ffd23a');circle(-12,-2.4,2.2);fill('#2b2230');ell(-12,-2.4,.6,1.8);c.restore();};one(10,-12,.6);one(-14,-6,.6);one(0,8,.75);},
 bouquetin(){shadow(0,20,18);fill('#c9a888');for(const i of[-10,-4,6,11])c.fillRect(i-1.6,8,3.2,12);ell(2,4,16,9);fill('#b08868');ell(-13,-4,7,8,.3);
  c.strokeStyle='#8a6a4a';c.lineWidth=3.5;c.beginPath();c.moveTo(-12,-10);c.quadraticCurveTo(-4,-28,10,-20);c.stroke();c.lineWidth=1;for(let i=0;i<5;i++){c.beginPath();c.arc(-6+i*3,-20+(i>2?2:0)-(i<2?2:0),1,0,TAU);c.stroke();}
  fill('#f4e8d8');ell(-17,2,3,6);fill('#2b2230');circle(-14,-5,1.6);},
 aigle(){fill('#8a5a3c');for(const s of[-1,1]){c.beginPath();c.moveTo(s*4,0);c.quadraticCurveTo(s*22,-18,s*36,-6);c.lineTo(s*30,-2);c.lineTo(s*32,4);c.lineTo(s*24,4);c.lineTo(s*22,10);c.quadraticCurveTo(s*12,8,s*4,8);c.fill();}
  ell(0,6,8,12);fill('#fff');circle(0,-10,7);fill('#ffc04a');c.beginPath();c.moveTo(-3,-8);c.quadraticCurveTo(0,-1,3,-8);c.fill();fill('#2b2230');circle(-3,-11,1.4);circle(3,-11,1.4);line([[-6,-14],[-1,-12]],1.3,'#2b2230');line([[6,-14],[1,-12]],1.3,'#2b2230');},
 lezard(){shadow(0,14,22);c.strokeStyle='#6a8aa8';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(12,6);c.quadraticCurveTo(26,8,30,-2);c.stroke();
  fill('#7a9ab8');ell(0,6,14,6);for(const [x,s] of [[-8,-1],[8,1]]){line([[x,8],[x-3,14]],2.4,'#6a8aa8');line([[x,4],[x+2*s,-1]],2.4,'#6a8aa8');}
  fill('#9ab8d0');for(let i=0;i<4;i++)circle(-6+i*4,4,1.4);fill('#7a9ab8');ell(-16,3,7,5);fill('#ffd23a');circle(-17,1,2);fill('#2b2230');circle(-17,1,1);line([[-23,5],[-27,4]],1,'#e0566b');},
 condor(){fill('#3a3346');for(const s of[-1,1]){c.beginPath();c.moveTo(s*4,0);c.quadraticCurveTo(s*24,-22,s*40,-10);c.lineTo(s*34,-4);c.lineTo(s*37,2);c.lineTo(s*28,3);c.lineTo(s*26,10);c.quadraticCurveTo(s*12,8,s*4,8);c.fill();}
  ell(0,6,9,13);fill('#fff');ell(0,-4,7,3);fill('#e0a090');circle(0,-11,6);fill('#ffc04a');c.beginPath();c.moveTo(-3,-9);c.quadraticCurveTo(0,0,3,-9);c.fill();
  fill('#ffd23a');circle(-2.5,-12,1.6);circle(2.5,-12,1.6);line([[-6,-16],[-1,-13]],1.5,'#2b2230');line([[6,-16],[1,-13]],1.5,'#2b2230');
  fill('#ffe85a');c.beginPath();c.moveTo(26,-24);c.lineTo(20,-14);c.lineTo(25,-14);c.lineTo(19,-4);c.lineTo(30,-17);c.lineTo(25,-17);c.lineTo(30,-24);c.fill();},
 salamandre(){shadow(0,14,22);c.strokeStyle='#ff7a3a';c.lineWidth=5;c.beginPath();c.moveTo(10,6);c.quadraticCurveTo(26,10,28,-4);c.stroke();fill('#ff7a3a');ell(0,6,14,6.5);
  for(const x of[-8,8]){line([[x,8],[x-3,14]],2.6,'#ff7a3a');}fill('#ffd23a');[[-4,4],[3,7],[8,3],[18,7]].forEach(([x,y])=>circle(x,y,1.8));fill('#ff7a3a');ell(-15,3,8,6);eyes(-19,-12,1,1.8,false,false);smile(-15,7,2);
  fill('#ffb347');c.beginPath();c.moveTo(26,-6);c.quadraticCurveTo(32,-14,28,-20);c.quadraticCurveTo(36,-12,30,-4);c.fill();},
 scarabee(){shadow(0,16,18);for(const s of[-1,1])for(let i=0;i<3;i++)line([[s*8,2+i*5],[s*17,4+i*6]],1.8,'#2b2230');fill('#3a2a33');ell(0,4,14,15);c.strokeStyle='#ff8a3a';c.lineWidth=1.6;c.beginPath();c.moveTo(0,-10);c.lineTo(0,18);c.moveTo(-8,0);c.lineTo(-3,6);c.lineTo(-7,12);c.moveTo(8,-2);c.lineTo(4,5);c.lineTo(9,11);c.stroke();
  fill('#2b2230');ell(0,-12,8,5);fill('#ffb347');circle(-3,-13,1.6);circle(3,-13,1.6);line([[-2,-16],[-6,-22]],1.3,'#2b2230');line([[2,-16],[6,-22]],1.3,'#2b2230');},
 chauvesouris(){fill('#6a6070');for(const s of[-1,1]){c.beginPath();c.moveTo(s*5,-2);c.quadraticCurveTo(s*18,-16,s*30,-8);c.quadraticCurveTo(s*26,-2,s*28,6);c.quadraticCurveTo(s*22,0,s*18,8);c.quadraticCurveTo(s*13,2,s*6,8);c.fill();}
  circle(0,2,9);c.beginPath();c.moveTo(-7,-3);c.lineTo(-6,-12);c.lineTo(-2,-5);c.fill();c.beginPath();c.moveTo(7,-3);c.lineTo(6,-12);c.lineTo(2,-5);c.fill();fill('#ffb0b0');eyes(-3.5,3.5,1,1.7);
  fill('#fff');c.beginPath();c.moveTo(-1.5,5);c.lineTo(-1,7.5);c.lineTo(-.5,5);c.fill();c.beginPath();c.moveTo(.5,5);c.lineTo(1,7.5);c.lineTo(1.5,5);c.fill();},
 golem(){shadow(0,22,24);fill('#4a3a3a');c.fillRect(-14,10,9,12);c.fillRect(5,10,9,12);ell(0,2,18,15);fill('#5a4646');circle(-20,4,8);circle(20,4,8);ell(0,-14,11,9);
  c.strokeStyle='#ff8a3a';c.lineWidth=2;c.beginPath();c.moveTo(-6,-4);c.lineTo(-2,4);c.lineTo(-7,12);c.moveTo(6,-2);c.lineTo(3,6);c.moveTo(-20,0);c.lineTo(-17,7);c.moveTo(18,0);c.lineTo(22,6);c.stroke();
  fill('#ffd23a');c.shadowColor='#ffb347';c.shadowBlur=8;ell(-4,-15,2.4,1.8);ell(4,-15,2.4,1.8);c.shadowBlur=0;line([[-8,-19],[-2,-17]],1.8,'#2b2230');line([[8,-19],[2,-17]],1.8,'#2b2230');
  fill('#ff8a3a');c.fillRect(-4,-10,8,2);},
 tortue(){shadow(0,18,30);fill('#8ab878');for(const [x,y] of[[-18,12],[16,12],[-20,0],[18,0]])ell(x,y,6,4);ell(-28,2,9,7);eyes(-31,-25,0,1.6);smile(-28,4,2);
  fill('#6a9a5a');ell(0,0,24,16);fill('#8aba7a');for(const [x,y] of[[0,-4],[-10,2],[10,2],[-6,-10],[6,-10]]){c.beginPath();for(let k=0;k<6;k++){const a=k*TAU/6;c.lineTo(x+Math.cos(a)*5,y+Math.sin(a)*5);}c.fill();}
  fill('#9ad68a');ell(-6,-14,9,4);Avatar.flower(c,6,-15,2,'#ff9fb8');Avatar.flower(c,-10,-16,1.6,'#fff');fill('#ffe08a');Avatar.star(c,14,-12,2.4);},
 hibou(){const g=c.createRadialGradient(0,6,2,0,6,30);g.addColorStop(0,'rgba(255,230,140,.7)');g.addColorStop(1,'rgba(255,230,140,0)');c.fillStyle=g;circle(0,6,30);shadow(0,22,14);
  fill('#8a7aa8');ell(0,4,15,18);c.beginPath();c.moveTo(-12,-10);c.lineTo(-14,-22);c.lineTo(-5,-13);c.fill();c.beginPath();c.moveTo(12,-10);c.lineTo(14,-22);c.lineTo(5,-13);c.fill();
  fill('#ffe08a');ell(0,10,9,10);fill('#fff8d0');ell(0,10,5,6);fill('#d8cce8');circle(-6,-6,6);circle(6,-6,6);fill('#2b2230');circle(-6,-6,3.4);circle(6,-6,3.4);fill('#fff');circle(-5,-7,1.2);circle(7,-7,1.2);
  fill('#ffc04a');c.beginPath();c.moveTo(-2,-2);c.lineTo(0,3);c.lineTo(2,-2);c.fill();},
 renard(){const g=c.createRadialGradient(0,0,2,0,0,34);g.addColorStop(0,'rgba(201,163,232,.5)');g.addColorStop(1,'rgba(201,163,232,0)');c.fillStyle=g;circle(0,0,34);shadow(0,20,18);
  fill('#7a6ad8');c.beginPath();c.moveTo(10,8);c.quadraticCurveTo(34,10,28,-14);c.quadraticCurveTo(26,0,12,2);c.fill();fill('#fff');ell(29,-12,3,4,.4);
  fill('#8a7ae8');for(const i of[-8,-3,4,9])c.fillRect(i-1.4,10,2.8,9);ell(0,6,14,8);circle(-12,-6,8);c.beginPath();c.moveTo(-18,-9);c.lineTo(-19,-20);c.lineTo(-12,-13);c.fill();c.beginPath();c.moveTo(-8,-12);c.lineTo(-4,-21);c.lineTo(-4,-10);c.fill();
  fill('#fff');ell(-15,-2,5,3);eyes(-15,-8,-7,1.5);fill('#ffe08a');[[-2,2],[6,6],[2,10],[20,-4],[-10,6]].forEach(([x,y])=>Avatar.star(c,x,y,1.8));},
 // domestiques
 vache(){shadow(0,20,20);fill('#fff');for(const i of[-10,-4,6,11])c.fillRect(i-2,8,4,12);ell(2,4,18,11);fill('#5a4a4a');ell(6,2,5,4);ell(-4,8,4,3);ell(12,9,3,2);
  fill('#fff');ell(-16,-4,9,8);fill('#ffc0c8');ell(-19,0,6,4);fill('#6b4040');circle(-21,0,.9);circle(-17,0,.9);fill('#e8d8c8');c.beginPath();c.moveTo(-20,-11);c.lineTo(-23,-16);c.lineTo(-17,-12);c.fill();c.beginPath();c.moveTo(-12,-11);c.lineTo(-9,-16);c.lineTo(-14,-12);c.fill();
  fill('#2b2230');circle(-19,-6,1.4);circle(-13,-6,1.4);fill('#ffd23a');circle(-16,4,1.6);},
 cochon(){shadow(0,18,18);fill('#ffb0c0');for(const i of[-9,-4,4,9])c.fillRect(i-2,8,4,9);ell(2,4,16,11);c.strokeStyle='#ff90a8';c.lineWidth=1.6;c.beginPath();c.arc(19,0,3,0,1.6*Math.PI);c.stroke();
  fill('#ffb0c0');circle(-12,-2,9);c.beginPath();c.moveTo(-17,-8);c.lineTo(-19,-15);c.lineTo(-13,-10);c.fill();c.beginPath();c.moveTo(-8,-9);c.lineTo(-5,-15);c.lineTo(-10,-10);c.fill();
  fill('#ff90a8');ell(-15,1,4,3);fill('#c06070');circle(-16.4,1,.8);circle(-13.6,1,.8);eyes(-16,-9,-4,1.5);},
 chevre(){shadow(0,20,16);fill('#f4f0e8');for(const i of[-8,-3,5,9])c.fillRect(i-1.6,8,3.2,12);ell(1,4,14,9);fill('#ede6da');ell(-12,-4,6,7,.3);c.strokeStyle='#a89a8a';c.lineWidth=2.4;c.beginPath();c.moveTo(-12,-10);c.quadraticCurveTo(-8,-18,-2,-16);c.stroke();
  fill('#e0d6c8');c.beginPath();c.moveTo(-14,2);c.lineTo(-12,8);c.lineTo(-10,2);c.fill();fill('#2b2230');circle(-13,-5,1.4);fill('#ffc0c8');ell(-17,-1,2,1.4);},
 mouton(){shadow(0,18,18);fill('#5a4a4a');for(const i of[-8,-3,4,9])c.fillRect(i-1.6,8,3.2,9);fill('#fff');for(const [x,y] of[[-8,0],[0,-4],[8,0],[-4,7],[6,7],[12,3],[-12,6]])circle(x,y,7);
  fill('#5a4a4a');ell(-16,-2,6,7);fill('#fff');circle(-16,-8,4);fill('#fff');circle(-18,-3,1.2);circle(-14,-3,1.2);fill('#2b2230');circle(-18,-3,.6);circle(-14,-3,.6);},
 poule(){shadow(0,18,12);line([[-2,10],[-3,17]],1.5,'#f0a040');line([[3,10],[3,17]],1.5,'#f0a040');fill('#fff');ell(2,4,11,9);c.beginPath();c.moveTo(10,0);c.lineTo(17,-6);c.lineTo(14,4);c.fill();circle(-6,-6,7);
  fill('#e8403a');circle(-7,-13,2.4);circle(-4,-14,2.4);circle(-9,-1,1.8);fill('#ffc04a');c.beginPath();c.moveTo(-12,-6);c.lineTo(-17,-5);c.lineTo(-12,-3);c.fill();fill('#2b2230');circle(-8,-7,1.3);},
 canard(){shadow(0,16,14);fill('#ffe85a');ell(2,6,13,8);c.beginPath();c.moveTo(12,2);c.lineTo(18,-2);c.lineTo(15,8);c.fill();circle(-7,-4,7);fill('#ffa030');ell(-15,-3,5,2.6);fill('#2b2230');circle(-8,-6,1.3);fill('#ffd23a');ell(4,5,6,4,.3);},
 cheval(){shadow(0,22,24);fill('#a8734f');for(const i of[-13,-7,8,14])c.fillRect(i-2,6,4,16);fill('#5a3a2a');for(const i of[-13,-7,8,14])c.fillRect(i-2,19,4,3);
  fill('#a8734f');ell(1,2,20,10);c.beginPath();c.moveTo(-12,-2);c.lineTo(-18,-18);c.lineTo(-10,-20);c.lineTo(-6,-4);c.fill();ell(-19,-18,8,5,.5);fill('#5a3a2a');c.beginPath();c.moveTo(-10,-22);c.quadraticCurveTo(-4,-14,-6,-2);c.lineTo(-9,-4);c.quadraticCurveTo(-8,-14,-13,-20);c.fill();
  c.beginPath();c.moveTo(20,0);c.quadraticCurveTo(30,4,26,16);c.quadraticCurveTo(24,6,19,4);c.fill();fill('#2b2230');circle(-18,-20,1.3);fill('#ff9fb8');c.fillRect(-4,-6,12,8);fill('#fff');c.fillRect(-4,-6,12,2);fill('#ffd23a');circle(2,4,1.5);},
 chien(){shadow(0,18,16);fill('#e0b070');for(const i of[-8,-3,4,9])c.fillRect(i-2,7,4,10);ell(2,4,14,8);c.strokeStyle='#e0b070';c.lineWidth=3;c.beginPath();c.moveTo(15,0);c.quadraticCurveTo(22,-6,20,-12);c.stroke();
  fill('#e0b070');circle(-11,-4,8);fill('#a8734f');ell(-17,-6,3,6,.3);ell(-5,-6,3,6,-.3);fill('#fff');ell(-12,1,5,3.4);fill('#2b2230');circle(-12,-1,1.6);eyes(-14,-8,-5,1.4);fill('#ff7f9f');ell(-11,4,1.4,2);fill('#e0566b');c.fillRect(-14,2,7,1.6);},
 chat(){shadow(0,18,14);fill('#9a9aa8');ell(2,6,12,8);c.strokeStyle='#9a9aa8';c.lineWidth=3;c.beginPath();c.moveTo(13,6);c.quadraticCurveTo(24,4,20,-8);c.stroke();
  circle(-8,-4,8);c.beginPath();c.moveTo(-14,-8);c.lineTo(-15,-17);c.lineTo(-9,-11);c.fill();c.beginPath();c.moveTo(-6,-11);c.lineTo(-1,-17);c.lineTo(-2,-8);c.fill();fill('#ffc0c8');c.beginPath();c.moveTo(-13.5,-10);c.lineTo(-14,-15);c.lineTo(-10.5,-11.5);c.fill();
  fill('#bfe08a');ell(-11,-4,1.7,2);ell(-5,-4,1.7,2);fill('#2b2230');ell(-11,-4,.5,1.6);ell(-5,-4,.5,1.6);fill('#ff9fb8');circle(-8,-1,.9);line([[-14,0],[-19,-1]],.6,'#6b5050');line([[-2,0],[3,-1]],.6,'#6b5050');},
 lapin(){shadow(0,18,12);fill('#fff');ell(2,8,10,8);circle(12,8,3.4);circle(-5,-2,7);ell(-8,-14,2.4,7,-.2);ell(-2,-14,2.4,7,.2);fill('#ffc0c8');ell(-8,-14,1.1,5,-.2);ell(-2,-14,1.1,5,.2);eyes(-8,-2,-3,1.3);fill('#ff9fb8');circle(-5,0,.9);},
};

  // espèce -> taille dans le monde, vitesse, vole ?, rayon de promenade
  const SPEC = {
    vache: [1.8, 30, 0, 260], cochon: [1.5, 34, 0, 240], chevre: [1.5, 40, 0, 260], mouton: [1.5, 30, 0, 240], poule: [1.2, 46, 0, 150], canard: [1.2, 36, 0, 170],
    cheval: [2, 60, 0, 380], chien: [1.4, 70, 0, 300], chat: [1.3, 46, 0, 200], lapin: [1.1, 80, 0, 220],
    crabe: [1.1, 36, 0, 200], mouette: [1.2, 90, 1, 380], bernard: [1.1, 18, 0, 120], singe: [1.5, 60, 0, 260], perroquet: [1.2, 90, 1, 320], papillon: [1, 40, 1, 200],
    grenouille: [1.2, 50, 0, 160], libellule: [1, 80, 1, 240], heron: [1.6, 30, 0, 200], bouquetin: [1.7, 50, 0, 300], lezard: [1.1, 60, 0, 200], aigle: [1.6, 110, 1, 500],
    salamandre: [1.2, 44, 0, 200], scarabee: [1, 24, 0, 140], chauvesouris: [1.1, 100, 1, 300],
  };
  const list = [];
  function init(world) {
    const K = KALUA.K; let id = 0;
    for (const [kind, x, y, n] of KALUA.ANIMAL_ZONES) for (let i = 0; i < n; i++) {
      const sp = SPEC[kind]; const h = KALUA.hash(id * 7 + 3, id * 13 + 1);
      list.push({ id: id++, kind, hx: x * K + (h - .5) * 260, hy: y * K + (KALUA.hash(id, 5) - .5) * 200, size: sp[0], speed: sp[1], fly: sp[2], range: sp[3], phase: h * 40, period: 7 + h * 6, hop: 0, cache: new Map() });
    }
    // le point de départ de chaque animal doit être sur la terre
    for (const a of list) if (!a.fly) for (let k = 0; k < 30 && !world.walkable(a.hx, a.hy); k++) { a.hx += (KALUA.hash(a.id, k) - .5) * 200; a.hy += (KALUA.hash(k, a.id) - .5) * 200; }
  }
  function waypoint(a, n, world) {
    let p = a.cache.get(n); if (p) return p;
    p = { x: a.hx, y: a.hy };
    for (let k = 0; k < 6; k++) { const ang = KALUA.hash(a.id * 31 + n, k) * TAU, r = Math.sqrt(KALUA.hash(n, a.id * 17 + k)) * a.range;
      const x = a.hx + Math.cos(ang) * r, y = a.hy + Math.sin(ang) * r * .8; if (a.fly || world.walkable(x, y)) { p = { x, y }; break; } }
    a.cache.set(n, p); if (a.cache.size > 6) a.cache.delete(a.cache.keys().next().value);
    return p;
  }
  // position à l'instant T (secondes communes)
  function pos(a, T, world) {
    const u = (T + a.phase) / a.period, n = Math.floor(u), f = u - n;
    const p0 = waypoint(a, n, world), p1 = waypoint(a, n + 1, world);
    const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y), walkT = Math.min(.85, dist / a.speed / a.period);
    const k = f < walkT ? f / walkT : 1, e = k * k * (3 - 2 * k);
    return { x: p0.x + (p1.x - p0.x) * e, y: p0.y + (p1.y - p0.y) * e, moving: k < 1, right: p1.x > p0.x };
  }
  function visible(view, T, world, out) {
    for (const a of list) {
      if (a.hx < view.x0 - a.range - 200 || a.hx > view.x1 + a.range + 200 || a.hy < view.y0 - a.range - 200 || a.hy > view.y1 + a.range + 200) continue;
      const p = pos(a, T, world); if (p.x < view.x0 - 100 || p.x > view.x1 + 100 || p.y < view.y0 - 100 || p.y > view.y1 + 100) continue;
      out.push({ y: p.y, animal: a, p });
    }
    return out;
  }
  function draw(ctx, a, p, t) {
    c = ctx; c.save(); c.translate(p.x, p.y);
    const bob = a.fly ? -26 + Math.sin(t * 5 + a.id) * 4 : (p.moving ? -Math.abs(Math.sin(t * 12 + a.id)) * 2.5 : 0) - (a.hop > 0 ? Math.sin(a.hop * Math.PI) * 18 : 0);
    if (a.fly) { c.fillStyle = "rgba(60,50,40,.12)"; c.beginPath(); c.ellipse(0, 4, 10 * a.size, 3 * a.size, 0, 0, TAU); c.fill(); }
    c.translate(0, bob - 20 * a.size * .5); c.scale(p.right ? -a.size : a.size, a.size);
    C[a.kind]();
    c.restore();
  }
  // l'animal le plus proche (pour « Taper » / « Ramasser »)
  function nearest(x, y, T, world, reach = 60) {
    let best = null, bd = reach;
    for (const a of list) { if (Math.abs(a.hx - x) > a.range + 300 || Math.abs(a.hy - y) > a.range + 300) continue; const p = pos(a, T, world); const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = { a, p }; } }
    return best;
  }
  const NAMES = { vache: "Vache", cochon: "Cochon", chevre: "Chèvre", mouton: "Mouton", poule: "Poule", canard: "Canard", cheval: "Cheval", chien: "Chien", chat: "Chat", lapin: "Lapin",
    crabe: "Crabe rose", mouette: "Mouette", bernard: "Bernard-l'ermite", singe: "Singe", perroquet: "Perroquet", papillon: "Papillon géant", grenouille: "Grenouille", libellule: "Libellule",
    heron: "Héron", bouquetin: "Bouquetin", lezard: "Lézard", aigle: "Aigle", salamandre: "Salamandre", scarabee: "Scarabée de lave", chauvesouris: "Chauve-souris" };
  const DOMESTIC = ["vache", "cochon", "chevre", "mouton", "poule", "canard", "cheval", "chien", "chat", "lapin"];
  return { init, visible, draw, nearest, list, NAMES, DOMESTIC, drawKind: (ctx, kind) => { c = ctx; C[kind](); } };
})();
