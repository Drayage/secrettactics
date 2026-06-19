#!/usr/bin/env node
/* 의존성 없이 PWA 아이콘 PNG(icon-192/512)를 생성한다.
   icon.svg와 동일한 모티브(다크 배경 + 파란 링 + 금색 별)를 픽셀로 그린다. */
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function lerp(a, b, t){ return a + (b - a) * t; }
function mix(c1, c2, t){ return [lerp(c1[0],c2[0],t), lerp(c1[1],c2[1],t), lerp(c1[2],c2[2],t)]; }

const BG_TOP=[0x1a,0x22,0x33], BG_BOT=[0x0d,0x10,0x17];
const PANEL=[0x15,0x1a,0x23];
const RING=[0x63,0x84,0xff];
const GOLD_TOP=[0xff,0xe7,0x9a], GOLD_BOT=[0xf2,0xb7,0x36];

function starPolygon(N){
  const cx=N/2, cy=N*0.47, oR=N*0.205, iR=N*0.085, pts=[];
  for(let i=0;i<10;i++){
    const ang=-Math.PI/2 + i*Math.PI/5;
    const r=(i%2===0)?oR:iR;
    pts.push([cx+r*Math.cos(ang), cy+r*Math.sin(ang)]);
  }
  return {pts, top:cy-oR, bot:cy+oR};
}
function inPoly(x,y,pts){
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i][0],yi=pts[i][1],xj=pts[j][0],yj=pts[j][1];
    if(((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function sample(x, y, N, star){
  const cx=N/2, cy=N/2, dx=x-cx, dy=y-cy, r=Math.hypot(dx,dy);
  const outerR=N*0.345, ringW=N*0.028, innerR=N*0.300;
  // star 우선
  if(inPoly(x,y,star.pts)){
    const t=Math.min(1,Math.max(0,(y-star.top)/(star.bot-star.top)));
    return mix(GOLD_TOP,GOLD_BOT,t);
  }
  if(r<=outerR && r>=outerR-ringW) return RING;            // 파란 링
  if(r<innerR) return PANEL;                                 // 안쪽 패널
  return mix(BG_TOP,BG_BOT,y/N);                             // 배경 그라데이션
}

function render(N){
  const SS=4; // 슈퍼샘플(안티앨리어싱)
  const buf=Buffer.alloc(N*N*4);
  const star=starPolygon(N);
  for(let py=0;py<N;py++){
    for(let px=0;px<N;px++){
      let r=0,g=0,b=0;
      for(let sy=0;sy<SS;sy++)for(let sx=0;sx<SS;sx++){
        const c=sample(px+(sx+0.5)/SS, py+(sy+0.5)/SS, N, star);
        r+=c[0]; g+=c[1]; b+=c[2];
      }
      const n=SS*SS, o=(py*N+px)*4;
      buf[o]=Math.round(r/n); buf[o+1]=Math.round(g/n); buf[o+2]=Math.round(b/n); buf[o+3]=255;
    }
  }
  return buf;
}

function crc32(buf){
  let c=~0;
  for(let i=0;i<buf.length;i++){
    c^=buf[i];
    for(let k=0;k<8;k++) c=(c>>>1)^(0xEDB88320 & -(c&1));
  }
  return (~c)>>>0;
}
function chunk(type, data){
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length,0);
  const t=Buffer.from(type,'ascii');
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t,data])),0);
  return Buffer.concat([len,t,data,crc]);
}
function encodePNG(N, rgba){
  const sig=Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(N,0); ihdr.writeUInt32BE(N,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  const raw=Buffer.alloc(N*(N*4+1));
  for(let y=0;y<N;y++){
    raw[y*(N*4+1)]=0;
    rgba.copy(raw, y*(N*4+1)+1, y*N*4, (y+1)*N*4);
  }
  const idat=zlib.deflateSync(raw,{level:9});
  return Buffer.concat([sig, chunk('IHDR',ihdr), chunk('IDAT',idat), chunk('IEND',Buffer.alloc(0))]);
}

const outDir=path.join(__dirname,'..');
for(const N of [192,512]){
  const png=encodePNG(N, render(N));
  fs.writeFileSync(path.join(outDir,`icon-${N}.png`), png);
  console.log(`wrote icon-${N}.png (${png.length} bytes)`);
}
