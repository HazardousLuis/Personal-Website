
const load=async src=>{const i=new Image();i.src=src;await i.decode();return i};
export async function renderPoster({portrait,name,axes,star,score,buddies,note}){
const [art,qr]=await Promise.all([portrait,'./assets/quiz-entry.png'].map(load));
const c=document.createElement('canvas');c.width=720;c.height=1550;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,720,1550);g.addColorStop(0,'#e5efff');g.addColorStop(1,'#fce7f1');x.fillStyle=g;x.fillRect(0,0,720,1550);
function line(t,y,size,color){x.textAlign='center';x.font='bold '+size+'px sans-serif';x.fillStyle=color;x.fillText(t,360,y,650)}
line('与游 TraWithU',72,30,'#615399');line('我的旅行人格',155,54,'#292444');const k=Math.min(340/art.width,320/art.height);x.drawImage(art,(720-art.width*k)/2,180,art.width*k,art.height*k);line(name,570,42,'#895082');line('遇见同频的人，去更远的地方',630,27,'#564967');const scores=axes.map(axis=>axis.value/100);
const labels=axes.map(axis=>axis.name);
const cx=360,cy=816,radius=112;
function polygon(values){
  x.beginPath();
  values.forEach((value,i)=>{
    const angle=(i-1)*Math.PI/2;
    const px=cx+Math.cos(angle)*radius*value,py=cy+Math.sin(angle)*radius*value;
    if(i===0)x.moveTo(px,py);else x.lineTo(px,py);
  });
  x.closePath();x.stroke();
}
x.strokeStyle='#bca2cb';x.lineWidth=2;
for(const level of [.25,.5,.75,1])polygon(Array(4).fill(level));
x.strokeStyle='#8054ac';polygon(scores);x.fillStyle='rgba(132,106,199,.35)';x.fill();
x.fillStyle='#504369';x.font='bold 24px sans-serif';
[[360,687],[538,825],[360,964],[179,825]].forEach(([px,py],i)=>x.fillText(labels[i],px,py));
line(star?'我的名人搭子 · '+star:'名人匹配暂不可用',1045,35,'#754c83');
line(star?'趣味匹配 '+score+' / 100':'',1086,25,'#645977');
line('我的问卷搭子',1153,30,'#494c85');
buddies.forEach((b,i)=>line(b.nickname+'  '+b.score+'/100',1200+39*i,26,'#43405b'));if(!buddies.length)line(note,1200,24,'#645977');
x.drawImage(qr,293,1325,134,134);
line('扫码测测你的旅行人格',1495,24,'#564967');
line('匹配仅供娱乐 · 问卷搭子可能包含示例',1530,20,'#756c80');return c.toDataURL();}