/* New preliminary block: mathematically computed SVG widgets, no network or dependencies.
 * Numeric arithmetic is JavaScript Number / IEEE 754 binary64.
 * Public API: PreliminaryWidgets.ready, widgets, states, init(), setState(), getState(), math.
 */
(function (root) {
  'use strict';
  const C = {ink:'#202020', muted:'#707070', grid:'#d6d6d6', lime:'#bef264', white:'#ffffff'};
  const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
  const norm = a => Math.hypot(...a);
  const add = (a,b) => a.map((x,i)=>x+b[i]);
  const sub = (a,b) => a.map((x,i)=>x-b[i]);
  const mul = (a,s) => a.map(x=>x*s);
  const matvec = (a,x) => a.map(r=>dot(r,x));
  const transpose = a => a[0].map((_,j)=>a.map(r=>r[j]));
  const matmul = (a,b) => a.map(r=>transpose(b).map(c=>dot(r,c)));
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const basis = [[1,0,0],[0,1,0],[0,0,1]];
  const x1 = [-1,0,1], x2 = [1,1,1], target = [-1,0,3];
  const fit = [-4/3,2/3,8/3], residual = [1/3,-2/3,1/3];
  const response = (w,c) => add(mul(x1,w),mul(x2,c));
  const rotateZ = (p,a) => [Math.cos(a)*p[0]-Math.sin(a)*p[1], Math.sin(a)*p[0]+Math.cos(a)*p[1],p[2]];
  const rotateY = (p,a) => [Math.cos(a)*p[0]+Math.sin(a)*p[2],p[1],-Math.sin(a)*p[0]+Math.cos(a)*p[2]];
  const identity = p=>p.slice();

  // Analytic condition of the exact SPD family; no cancellation in its smaller root.
  function idealCondition(epsilon) {
    const largest=1+epsilon/2+Math.hypot(1,epsilon/2), smallest=epsilon/largest;
    return {largest,smallest,condition:largest/smallest};
  }
  function normalEquations(a,b) {
    const at=transpose(a), gram=matmul(at,a), rhs=matvec(at,b);
    const l00=Math.sqrt(gram[0][0]), l10=gram[1][0]/l00, pivot=gram[1][1]-l10*l10;
    if (!(pivot>0)) return {x:null,pivot,failure:'Cholesky: nonpositive pivot'};
    const l11=Math.sqrt(pivot), y0=rhs[0]/l00, y1=(rhs[1]-l10*y0)/l11, xlast=y1/l11;
    return {x:[(y0-l10*xlast)/l00,xlast],pivot};
  }
  function householderQR(a,b) {
    const r=a.map(row=>row.slice()), c=b.slice();
    for (let j=0;j<a[0].length;j++) {
      const v=r.slice(j).map(row=>row[j]), length=norm(v);
      if (!length) return {x:null,failure:'Zero triangular pivot'};
      v[0]+=(v[0]>=0?1:-1)*length;
      const vn=norm(v); for(let i=0;i<v.length;i++) v[i]/=vn;
      for(let col=j;col<a[0].length;col++) {
        let inner=0; for(let i=0;i<v.length;i++) inner+=v[i]*r[j+i][col];
        for(let i=0;i<v.length;i++) r[j+i][col]-=2*v[i]*inner;
      }
      const inner=dot(v,c.slice(j)); for(let i=0;i<v.length;i++) c[j+i]-=2*v[i]*inner;
    }
    const x=new Array(a[0].length).fill(0);
    for(let i=x.length-1;i>=0;i--) {
      if(!r[i][i]) return {x:null,failure:'Zero triangular pivot'};
      let value=c[i]; for(let j=i+1;j<x.length;j++) value-=r[i][j]*x[j];
      x[i]=value/r[i][i];
    }
    return {x};
  }
  function symmetricSVD(a,b) {
    // Specialized SVD of this symmetric positive definite 2×2, U=V.
    const largest=(a[0][0]+a[1][1])/2+Math.hypot((a[0][0]-a[1][1])/2,a[0][1]);
    const smallest=(a[1][1]-1)/largest;
    if(!(smallest>0)) return {x:null,failure:'Rounded matrix has deficient rank'};
    const raw=[1,largest-1], u1=mul(raw,1/norm(raw)), u2=[-u1[1],u1[0]];
    return {x:add(mul(u1,dot(u1,b)/largest),mul(u2,dot(u2,b)/smallest))};
  }
  function labCase(epsilon,perturb=false) {
    const a=[[1,1],[1,1+epsilon]], truth=[1,-1], clean=matvec(a,truth), delta=perturb?1e-8:0;
    const b=[clean[0],clean[1]+delta], effectiveEpsilon=a[1][1]-1;
    const entries=[['Normal equations / Cholesky',normalEquations(a,b)],['Householder QR',householderQR(a,b)],['SVD · SPD 2×2',symmetricSVD(a,b)]];
    return {a,b,clean,truth,delta,epsilon,effectiveEpsilon,condition:idealCondition(effectiveEpsilon).condition,
      reference:[-b[1]/effectiveEpsilon,b[1]/effectiveEpsilon],
      entries:entries.map(([name,s])=>({name,...s,residual:s.x?norm(sub(matvec(a,s.x),b)):null,error:s.x?norm(sub(s.x,truth)):null}))};
  }
  const math={dot,norm,add,sub,mul,matvec,idealCondition,normalEquations,householderQR,symmetricSVD,labCase,response,x1,x2,target,fit,residual};
  const api={ready:false,widgets:[],states:[],math};
  root.PreliminaryWidgets=api;
  if(typeof module!=='undefined'&&module.exports) module.exports=api;
  if(typeof document==='undefined') return;

  const esc=s=>String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const fmt=(x,d=3)=> x===null||!Number.isFinite(x)?'—':x===0?'0':Math.abs(x)>=1e4||Math.abs(x)<.001?x.toExponential(2):Number(x.toPrecision(d)).toString();
  const txt=(x,y,s,size=22,color=C.ink,anchor='start')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}">${esc(s)}</text>`;
  const line=(a,b,color=C.grid,width=1,dash='')=>`<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${color}" stroke-width="${width}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const circle=(p,r=6,color=C.ink)=>`<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${color}" stroke="${C.white}" stroke-width="2"/>`;
  const poly=(p,fill,stroke='none')=>`<polygon points="${p.map(x=>x.slice(0,2).join(',')).join(' ')}" fill="${fill}" stroke="${stroke}"/>`;
  const path=(p,color=C.ink,width=1.4)=>`<polyline points="${p.map(x=>x.slice(0,2).join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}"/>`;
  function arrow(a,b,color=C.ink,width=2.7) {
    const d=Math.atan2(b[1]-a[1],b[0]-a[0]);
    if(Math.hypot(b[0]-a[0],b[1]-a[1])<3) return circle(b,3,color);
    return line(a,b,color,width)+poly([b,[b[0]-10*Math.cos(d-.4),b[1]-10*Math.sin(d-.4)],[b[0]-10*Math.cos(d+.4),b[1]-10*Math.sin(d+.4)]],color);
  }
  function svg(body,width,height,label) {return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}">${body}</svg>`;}
  const width=host=>Math.max(420,host.clientWidth||900);
  function control(name,min,max,value,step=1,label=name) {return `<label>${esc(label)} <input type="range" data-control="${name}" min="${min}" max="${max}" value="${value}" step="${step}" aria-label="${esc(label)}"><output data-output="${name}"></output></label>`;}
  const toy='<span class="pw-toy">Toy example</span>';
  const note=s=>`<p class="pw-note">${s}</p>`;
  const stat=(name,value)=>`<span class="pw-stat">${name} <strong>${value}</strong></span>`;
  function shell(host,controls='') {host.innerHTML=`<div class="pw-controls">${controls}${toy}</div><div class="pw-body"></div>`;return host.querySelector('.pw-body');}
  function register(host,type,state,render) {
    const instance={host,type,getState:()=>({...state}),setState:values=>{Object.assign(state,values);render();return instance.getState();},render};
    api.widgets.push(instance); host.dataset.preReady='true'; render(); return instance;
  }
  function bindRanges(host,state,render) {host.querySelectorAll('input[data-control]').forEach(input=>input.addEventListener('input',()=>{state[input.dataset.control]=+input.value;render();}));}
  function sync(host,state) {for(const [name,value] of Object.entries(state)){const input=host.querySelector(`[data-control="${name}"]`),out=host.querySelector(`[data-output="${name}"]`);if(input) input.value=value;if(out) out.textContent=fmt(value);}}

  // Orthographic camera is shared across response/projection; projection coordinates are never faked.
  const camera={yaw:-.8,pitch:.25};
  function rawProject(p) {
    const c=Math.cos(camera.yaw),s=Math.sin(camera.yaw),x=c*p[0]-s*p[1],y=s*p[0]+c*p[1];
    return [x,Math.sin(camera.pitch)*y-Math.cos(camera.pitch)*p[2]];
  }
  function makeView(points,w,h,pad=42) {
    const ps=points.map(rawProject),xs=ps.map(p=>p[0]),ys=ps.map(p=>p[1]);
    const lx=Math.min(...xs),hx=Math.max(...xs),ly=Math.min(...ys),hy=Math.max(...ys);
    const scale=Math.min((w-2*pad)/(hx-lx||1),(h-2*pad)/(hy-ly||1));
    return p=>{const q=rawProject(p);return [w/2+(q[0]-(lx+hx)/2)*scale,h/2+(q[1]-(ly+hy)/2)*scale];};
  }
  const planeCorners=[response(-.6,-.8),response(3.25,-.8),response(3.25,1.7),response(-.6,1.7)];
  const scenePoints=[...planeCorners,target,[-2,0,0],[3,0,0],[0,-1,0],[0,3,0],[0,0,-1],[0,0,4]];
  // Keep labels readable at the slide scale, including when two vectors coincide.
  // Leader lines identify the true endpoints; labels never change any geometry.
  function sceneLabels(items,w,h) {
    const placed=[], offsets=[[12,-10],[12,30],[-14,-12],[-14,31],[25,-38],[-26,53],[55,13],[-55,13],[12,-66]];
    return items.map(item=>{
      const size=item.size||23, tw=item.text.length*size*.59+10, th=size+8;
      const candidates=[item.offset||offsets[0],...offsets];
      let best=null;
      for(const [dx,dy] of candidates){
        let x=item.point[0]+dx-(dx<0?tw:0), y=item.point[1]+dy-size;
        x=clamp(x,5,w-tw-5);y=clamp(y,4,h-th-4);
        const box={x,y,w:tw,h:th},overlap=placed.reduce((sum,b)=>sum+Math.max(0,Math.min(x+tw,b.x+b.w)-Math.max(x,b.x))*Math.max(0,Math.min(y+th,b.y+b.h)-Math.max(y,b.y)),0);
        const score=overlap*100+Math.hypot(x+tw/2-item.point[0],y+th/2-item.point[1]);
        if(!best||score<best.score)best={...box,score};
        if(!overlap)break;
      }
      placed.push(best);
      const nearest=[clamp(item.point[0],best.x,best.x+best.w),clamp(item.point[1],best.y,best.y+best.h)];
      const leader=Math.hypot(nearest[0]-item.point[0],nearest[1]-item.point[1])>10?line(item.point,nearest,C.muted,1):'';
      return leader+`<rect x="${best.x-2}" y="${best.y}" width="${best.w+4}" height="${best.h}" fill="white" fill-opacity=".88"/>`+txt(best.x+5,best.y+size,item.text,size,item.color||C.ink);
    }).join('');
  }
  function responseScene(w,h,pred,showResidual=false,transform=identity,transformed=false) {
    // One fit per demo keeps the camera and scale fixed while vectors move.
    const extents=transform===identity?scenePoints:[...scenePoints,...scenePoints.map(p=>rotateZ(p,.72))];
    const view=makeView(extents,w,h,15), p=v=>view(transform(v));
    let s=poly(planeCorners.map(p),'#f2f2f2',C.grid);
    const labels=[];
    for(let a=0;a<=3;a+=.5) s+=line(p(response(a,-.8)),p(response(a,1.7)),C.grid);
    for(let b=-.5;b<=1.5;b+=.5) s+=line(p(response(-.6,b)),p(response(3.25,b)),C.grid);
    // Coordinate axes remain the calibration-example basis under O.
    basis.forEach((e,i)=>{const q=view(mul(e,i===2?3.5:2.6));s+=arrow(view(mul(e,-.8)),q,'#aaa',1.5);labels.push({point:q,text:`e${'₁₂₃'[i]}`,size:21,color:C.muted,offset:i===2?[12,-8]:[13,8]});});
    s+=arrow(p([0,0,0]),p(x1),C.muted,2)+arrow(p([0,0,0]),p(x2),C.muted,2);
    s+=arrow(p([0,0,0]),p(pred),C.lime,11)+arrow(p([0,0,0]),p(pred),C.ink,2.2);
    const py=p(target),pp=p(pred),pc=p(response(2.8,1.35));
    s+=line(pp,py,C.ink,showResidual?2.6:1.5,showResidual?'':'5 5')+circle(py,7,C.ink)+circle(pp,7,C.lime);
    const prefix=transformed?'O':'';
    const important=[{point:py,text:prefix+'y',size:25,offset:[15,-10]},
      {point:pp,text:prefix+(showResidual?'ŷ':'Xθ'),size:25,offset:[15,33]},
      {point:pc,text:transformed?'Col(OX)':'Col(X)',size:23,color:C.muted,offset:[-16,-17]},
      {point:p(x1),text:prefix+'x₁',size:23,color:C.muted,offset:[-26,35]},
      {point:p(x2),text:prefix+'x₂',size:23,color:C.muted,offset:[15,-12]}];
    if(showResidual){
      const q=.32,nu=mul(residual,1/norm(residual)),tu=mul(x1,1/norm(x1));
      s+=path([add(pred,mul(nu,q)),add(add(pred,mul(nu,q)),mul(tu,q)),add(pred,mul(tu,q))].map(p),C.ink,1.7);
      important.splice(2,0,{point:p(add(pred,mul(sub(target,pred),.56))),text:prefix+'r',size:23,offset:[33,7]});
    }
    return s+sceneLabels([...important,...labels],w,h);
  }
  function responseWidget(host,isProjection) {
    const state={w:.8,c:.1};
    const body=shell(host,control('w',0,3,state.w,.01)+control('c',-.7,1.5,state.c,.01)+(isProjection?'<button type="button" data-fit>Best fit</button>':''));
    const render=()=>{
      state.w=clamp(+state.w,0,3);state.c=clamp(+state.c,-.7,1.5);sync(host,state);
      const pred=response(state.w,state.c),r=sub(target,pred),e=sub(pred,target),optimal=norm(sub(pred,fit))<1e-10;
      const w=width(host),h=330;
      body.innerHTML=svg(responseScene(w,h,pred,isProjection&&optimal),w,h,'Response space: a plane of model predictions and the target outside it')+
        `<div class="pw-stats">${stat('‖y − Xθ‖² =',fmt(dot(r,r)))}${isProjection?stat(optimal?'Xᵀr =':'Xᵀe(θ) =',optimal?'(0, 0)':`(${fmt(dot(x1,e))}, ${fmt(dot(x2,e))})`):''}</div>`+
        note(isProjection?(optimal?'Best fit: θ̂ = (2, 2/3), e(θ̂) = −r. eᵢ = example axes.':'e(θ) = Xθ − y. Choose “Best fit” for Xᵀe = 0. eᵢ = example axes.'):'eᵢ = calibration-example axes. Xθ = wx₁ + cx₂ stays in Col(X).');
    };
    bindRanges(host,state,render);
    if(isProjection) host.querySelector('[data-fit]').addEventListener('click',()=>{state.w=2;state.c=2/3;render();});
    register(host,isProjection?'projection':'response-space',state,render);
  }
  function orthogonalWidget(host) {
    const state={after:0};const body=shell(host,'<button type="button" data-mode="0">Before</button><button type="button" data-mode="1">After orthogonal transformation</button>');
    const render=()=>{
      host.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.mode===+state.after)));
      const w=width(host),h=330,angle=state.after?.72:0;
      // A common fixed fit for both states prevents an apparent change of residual length from camera autoscaling.
      const transform=p=>rotateZ(p,angle);
      const scene=responseScene(w,h,fit,true,transform,!!state.after);
      body.innerHTML=svg(scene+txt(34,35,state.after?'OX, Oy, Oŷ, Or':'X, y, ŷ, r',27),w,h,'Orthogonal rotation applied jointly to the whole regression problem')+
        `<div class="pw-stats">${stat('‖Or‖² = ‖r‖² =','2/3')}${stat('(OX)ᵀOr =','0')}${stat('OᵀO =','I')}</div>`+note('O transforms the vectors and plane; the eᵢ axes and camera stay fixed. The 3D norm is preserved; screen length may change.');
    };
    host.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>{state.after=+b.dataset.mode;render();}));
    register(host,'orthogonal',state,render);
  }
  function conditioningWidget(host) {
    const state={exponent:4};const body=shell(host,control('exponent',1,12,4,.1,'−log₁₀ ε'));
    const render=()=>{
      state.exponent=clamp(+state.exponent,1,12);sync(host,state);
      const w=width(host),h=290,e=10**(-state.exponent),k=idealCondition(e).condition;
      const px=p=>60+(p-1)/11*(w-120),py=v=>h-55-v/26*78;
      const colOrigin=[54,116],col1=[130,40],col2=[130,40-76*e];
      let s=txt(36,21,'Nearly parallel columns',20)+arrow(colOrigin,col1,C.muted,5)+arrow(colOrigin,col2,C.ink,2)+txt(143,50,'x₁, x₂',20)+txt(36,139,'‖x₂ − x₁‖ = ε',20,C.muted);
      const paramX=w*.41,outX=w*.76,baseY=85,unit=40;
      s+=txt(paramX-10,21,'Different θ → close Xθ',20);
      s+=line([paramX-6,baseY],[paramX+unit+12,baseY],C.grid)+line([paramX,baseY+5],[paramX,baseY-unit-12],C.grid);
      s+=circle([paramX,baseY],5,C.muted)+circle([paramX+unit,baseY+unit],6,C.ink)+line([paramX,baseY],[paramX+unit,baseY+unit],C.ink,1.5,'4 3');
      s+=txt(paramX-8,baseY-13,'0',20,C.muted)+txt(paramX+unit+7,baseY+unit-10,'(1, −1)',20);
      s+=arrow([paramX+unit+88,baseY-13],[outX-20,baseY-13],C.muted,1.8);
      s+=circle([outX,baseY],7,C.muted)+circle([outX,baseY+unit*e],4,C.lime)+txt(outX+13,baseY-10,'0, (0, −ε)',20);
      s+=txt(paramX-10,139,'‖Δθ‖ = √2',20,C.muted)+txt(outX-5,139,'‖XΔθ‖ = ε',20,C.muted);
      s+=txt(60,159,'log₁₀ κ₂',20);
      for(let v=0;v<=24;v+=12)s+=line([60,py(v)],[w-45,py(v)],'#e8e8e8')+txt(47,py(v)+6,v,20,C.muted,'end');
      [2,4,6,8,10,12].forEach(p=>s+=txt(px(p),h-29,p,20,C.muted,'middle'));s+=txt(w/2,h-3,'−log₁₀ ε',21,C.muted,'middle');
      for(const factor of [1,2])s+=path(Array.from({length:111},(_,i)=>{const p=1+i/10;return[px(p),py(factor*Math.log10(idealCondition(10**(-p)).condition))];}),factor===2?C.ink:C.muted,2);
      const v=Math.log10(k);s+=line([px(state.exponent),151],[px(state.exponent),h-55],C.grid,1,'4 4')+circle([px(state.exponent),py(v)],6,C.lime)+circle([px(state.exponent),py(2*v)],6,C.lime);
      s+='<g paint-order="stroke fill" stroke="white" stroke-width="6" stroke-linejoin="round">'+txt(px(7.6),py(21),'κ₂(XᵀX)',22)+txt(px(8.5),py(6),'κ₂(X)',22,C.muted)+'</g>';
      body.innerHTML=svg(s,w,h,'Condition number of X and its Gram matrix')+
        `<div class="pw-stats">${stat('ε =',fmt(e))}${stat('κ₂(X) ≈',fmt(k))}${stat('κ₂(XᵀX) ≈',fmt(k*k))}</div>`+
        note('X = [[1, 1], [1, 1 + ε]], Δθ = (1, −1). Exact κ₂ values for this toy family are shown.')+note('The appendix examines the rounded Gram matrix.');
    };
    bindRanges(host,state,render);register(host,'conditioning',state,render);
  }
  function directionsWidget(host) {
    const state={selected:0,sigma3:.3};const body=shell(host,'<button type="button" data-direction="0">v₁ → σ₁u₁</button><button type="button" data-direction="1">v₂ → σ₂u₂</button><button type="button" data-direction="2">v₃ → σ₃u₃</button>'+control('sigma3',0,1,.3,.02,'σ₃'));
    const V=p=>rotateZ(rotateY(p,.45),-.3),U=p=>rotateZ(rotateY(p,-.35),.55);
    const render=()=>{
      state.selected=clamp(Math.round(+state.selected),0,2);state.sigma3=clamp(+state.sigma3,0,1);sync(host,state);
      host.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.direction===state.selected)));
      const sig=[2,1,state.sigma3],w=width(host),h=325,panel=w/2,scale=Math.min((panel-90)/4.4,100);
      let s='';
      const paint=(offset,transform,label)=>{
        const p=v=>{const q=rawProject(transform(v));return[offset+panel/2+q[0]*scale,155+q[1]*scale];};
        for(let lat=-2;lat<=2;lat++){
          const a=lat*Math.PI/6,rr=Math.cos(a);s+=path(Array.from({length:81},(_,i)=>{const b=i*Math.PI/40;return p([rr*Math.cos(b),rr*Math.sin(b),Math.sin(a)]);}),lat===0?C.ink:'#b6b6b6',lat===0?1.8:1);
        }
        for(let lon=0;lon<6;lon++)s+=path(Array.from({length:81},(_,i)=>{const a=lon*Math.PI/6,b=i*Math.PI/40;return p([Math.cos(a)*Math.cos(b),Math.sin(a)*Math.cos(b),Math.sin(b)]);}), '#b6b6b6',1);
        const labels=[];
        basis.forEach((v,i)=>{const chosen=i===state.selected,end=p(v),zero=offset>0&&sig[i]===0;
          if(chosen&&!zero)s+=line(p([0,0,0]),end,C.lime,12);
          s+=arrow(p([0,0,0]),end,chosen?C.ink:C.muted,chosen?3:1.6);
          labels.push({point:end,text:offset===0?`v${'₁₂₃'[i]}`:zero?'σ₃u₃ = 0':`σ${'₁₂₃'[i]}u${'₁₂₃'[i]}`,size:chosen?24:21,color:chosen?C.ink:C.muted,offset:zero?[18,54]:i===1?[18,29]:[12,-10]});
        });
        s+=sceneLabels(labels,w,h-42)+txt(offset+panel/2,h-13,label,22,C.ink,'middle');
      };
      paint(0,V,'Parameter changes');paint(panel,p=>U(p.map((x,i)=>x*sig[i])),'Prediction changes across examples');
      s+=txt(w/2,155,'X →',30,C.ink,'middle');
      body.innerHTML=svg(s,w,h,'A parameter sphere maps to a prediction ellipsoid along singular directions')+
        `<div class="pw-stats">${stat(`Xv${'₁₂₃'[state.selected]} =`,`${fmt(sig[state.selected])} u${'₁₂₃'[state.selected]}`)}${stat('σ =',`(2, 1, ${fmt(state.sigma3)})`)}</div>`+note('3D toy analogy. X = U diag(2, 1, σ₃)Vᵀ. When σ₃ = 0, moving along v₃ leaves predictions unchanged.');
    };
    host.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{state.selected=+b.dataset.direction;render();}));bindRanges(host,state,render);register(host,'svd-directions',state,render);
  }
  function spectrumWidget(host) {
    const sig=[6,2,.5,.001,0],state={selected:3};
    const body=shell(host,sig.map((s,i)=>`<button type="button" data-direction="${i}">v${'₁₂₃₄₅'[i]}</button>`).join(''));
    const render=()=>{
      state.selected=clamp(Math.round(+state.selected),0,4);host.querySelectorAll('[data-direction]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.direction===state.selected)));
      const w=width(host),h=320,right=w*.75,py=s=>194-(Math.log10(s)+3)/4*137;
      let s=txt(60,28,'Positive σᵢ · log scale',22)+txt(w*.875,28,'Exact zero',22,C.ink,'middle');
      [-3,-2,-1,0,1].forEach((p,i)=>{s+=line([60,py(10**p)],[right-25,py(10**p)],'#e6e6e6')+txt(49,py(10**p)+6,['10⁻³','10⁻²','10⁻¹','1','10'][i],18,C.muted,'end');});
      sig.slice(0,4).forEach((v,i)=>{const xp=88+i*(right-143)/3;const selected=i===state.selected;s+=`<g data-spectrum-index="${i}" style="cursor:pointer"><rect x="${xp-42}" y="34" width="84" height="200" fill="transparent"/>`+line([xp,210],[xp,py(v)],selected?C.lime:C.ink,selected?12:4)+circle([xp,py(v)],selected?8:5,selected?C.lime:C.ink)+txt(xp,py(v)-14,fmt(v),23,C.ink,'middle')+txt(xp,239,`σ${'₁₂₃₄'[i]}`,22,C.ink,'middle')+'</g>';});
      s+=line([right,45],[right,239],C.grid,1,'5 4')+'<g data-spectrum-index="4" style="cursor:pointer">'+`<rect x="${right+5}" y="35" width="${w-right-10}" height="205" fill="transparent"/>`;
      if(state.selected===4)s+=`<rect x="${w*.875-28}" y="80" width="56" height="48" fill="${C.lime}"/>`;
      s+=txt(w*.875,122,'0',53,C.ink,'middle')+txt(w*.875,164,'log(0) undefined',17,C.muted,'middle')+txt(w*.875,239,'σ₅',22,C.ink,'middle')+'</g>';
      const selected=sig[state.selected],message=selected===0?'Unobserved':selected<.01?'Weakly observed':'Observed';
      const vectorY=280,vectorStart=w*.38,unit=34;
      const tiny=selected>0&&unit*selected<3;
      s+=arrow([50,vectorY],[50+unit,vectorY],C.ink,3)+txt(50,312,`v${'₁₂₃₄₅'[state.selected]}`,22)+txt(w*.22,vectorY+7,'X →',26);
      // The true linear-scale length remains unchanged; an explicitly marked detail
      // reveals the tiny nonzero channel without making it look equal to exact zero.
      s+=tiny?line([vectorStart,vectorY],[vectorStart+unit*selected,vectorY],C.ink,2):arrow([vectorStart,vectorY],[vectorStart+unit*selected,vectorY],C.lime,9)+arrow([vectorStart,vectorY],[vectorStart+unit*selected,vectorY],C.ink,2);
      s+=txt(vectorStart,312,selected===0?'Xv₅ = 0':`${fmt(selected)} u${'₁₂₃₄₅'[state.selected]}`,22);
      if(tiny){
        const inset=w*.66;
        s+=`<rect x="${inset-13}" y="254" width="${w-inset+4}" height="64" fill="none" stroke="${C.grid}" stroke-dasharray="4 3"/>`+arrow([inset,vectorY],[inset+unit*selected*1000,vectorY],C.lime,8)+arrow([inset,vectorY],[inset+unit*selected*1000,vectorY],C.ink,2)+txt(inset+48,vectorY+6,'×1000 detail',19)+txt(inset,310,'0.001 is nonzero',18,C.muted);
      }else s+=txt(w-5,vectorY+7,'linear lengths',19,C.muted,'end');
      body.innerHTML=svg(s,w,h,'Positive singular values on a logarithmic axis; exact zero in a separate region')+
        `<div class="pw-stats">${stat('rank(X) =','4')}${stat(`Xv${'₁₂₃₄₅'[state.selected]} =`,selected===0?'0':`${fmt(selected)} u${'₁₂₃₄₅'[state.selected]}`)}</div>`+note(`${message}. Toy X has five parameter directions and deficient column rank: κ₂(X) = ∞.`);
    };
    host.querySelectorAll('[data-direction]').forEach(b=>b.addEventListener('click',()=>{state.selected=+b.dataset.direction;render();}));body.addEventListener('click',event=>{const bar=event.target.closest('[data-spectrum-index]');if(bar){state.selected=+bar.dataset.spectrumIndex;render();}});register(host,'svd',state,render);
  }
  function truncationWidget(host) {
    const sig=[6,2,.5,.1],state={k:3};const body=shell(host,control('k',0,4,3,1,'Retained k'));
    const render=()=>{
      state.k=clamp(Math.round(+state.k),0,4);sync(host,state);
      const w=width(host),h=200,px=i=>100+i*(w-200)/3,py=v=>155-v/10*120;
      let s='';
      [0,2,4,6,8,10].forEach(v=>s+=line([60,py(v)],[w-40,py(v)],'#e5e5e5')+txt(45,py(v)+5,v,17,C.muted,'end'));
      sig.forEach((v,i)=>{const g=1/v,kept=i<state.k,x=px(i);s+=line([x-9,py(0)],[x-9,py(g)],'#aaa',7)+circle([x-9,py(g)],5,'#aaa')+line([x+9,py(0)],[x+9,py(kept?g:0)],C.lime,10)+circle([x+9,py(kept?g:0)],6,C.ink)+txt(x,py(g)-13,fmt(g),22,C.ink,'middle')+txt(x,193,`σ${'₁₂₃₄'[i]} = ${fmt(v)}`,21,C.ink,'middle');});
      body.innerHTML='<div class="pw-legend"><span>Inverse gain</span><span>Gray: full pseudoinverse · Lime: truncated</span></div>'+svg(s,w,h,'Inverse singular channel gains before and after truncation')+
        `<div class="pw-stats">${stat('Maximum retained gain =',state.k?fmt(1/sig[state.k-1]):'0')}${stat('Channels discarded =',String(4-state.k))}</div>`+note('Toy spectrum. Setting a channel to zero suppresses its response to noise and its response to signal.');
    };
    bindRanges(host,state,render);register(host,'truncation',state,render);
  }
  function instabilityWidget(host) {
    const state={exponent:8,perturb:false};const body=shell(host,control('exponent',2,12,8,.1,'−log₁₀ ε')+'<label><input type="checkbox" data-perturb> δy = (0, 10⁻⁸)</label>');
    const render=()=>{
      state.exponent=clamp(+state.exponent,2,12);state.perturb=!!state.perturb;sync(host,state);host.querySelector('[data-perturb]').checked=state.perturb;
      const v=labCase(10**(-state.exponent),state.perturb);
      const rows=v.entries.map(e=>`<tr><td>${esc(e.name)}</td><td>${e.x?`(${fmt(e.x[0],6)}, ${fmt(e.x[1],6)})`:'—'}</td><td>${e.x?fmt(e.residual):'—'}</td><td>${e.x?fmt(e.error):`<span class="pw-failure">${esc(e.failure)}</span>`}</td></tr>`).join('');
      body.innerHTML=`<div class="pw-equation-line"><span>Aε = <span class="pw-matrix"><span>1</span><span>1</span><span>1</span><span>1 + ε</span></span></span><span>θ* = (1, −1)ᵀ</span><span>y = Aεθ*${state.perturb?' + δy':''}</span></div><div class="pw-stats">${stat('ε =',fmt(v.epsilon))}${stat('κ₂(A stored) ≈',fmt(v.condition))}${stat('stored ε =',v.effectiveEpsilon.toPrecision(6))}</div><table><thead><tr><th>Computed in Float64</th><th>θ̂</th><th>Residual ‖Aθ̂ − y‖₂</th><th>Deviation ‖θ̂ − θ*‖₂</th></tr></thead><tbody>${rows}</tbody></table>`+
        note(state.perturb?'δy₂ = 10⁻⁸ is a fixed absolute perturbation; it is not small relative to y for every ε. Deviation includes both changed data and arithmetic error.':'The target y is formed from the stored Aε. A small residual can coexist with inaccurate coefficients.')+
        note('Synthetic least-squares test; SVD is specialized to SPD 2×2. No rank threshold or truncation. Displayed zero is a Float64 result.');
    };
    bindRanges(host,state,render);host.querySelector('[data-perturb]').addEventListener('change',e=>{state.perturb=e.target.checked;render();});register(host,'instability',state,render);
  }
  function familyWidget(host) {
    const state={t:0};const body=shell(host,control('t',0,2,0,.01,'t'));
    const render=()=>{
      state.t=clamp(+state.t,0,2);sync(host,state);
      const w=width(host),h=125,t=state.t,left=w*.46,px=v=>left+40+v/2*(w-left-75),py=v=>98-v/8*83;
      let s=txt(0,26,`Bₜ = diag(${fmt(3+t)}, 0)`,26)+txt(0,57,'rank(Bₜ) = 1',21)+line([1,80],[25,80],C.ink,3)+txt(33,87,'Spectral error',19)+line([1,107],[25,107],C.muted,2)+txt(33,114,'Frobenius error²',19,C.muted);
      [0,2,4,6,8].forEach(v=>s+=line([left+40,py(v)],[w-30,py(v)],'#e8e8e8')+txt(left+30,py(v)+6,v,18,C.muted,'end'));
      s+=path(Array.from({length:41},(_,i)=>[px(i/20),py(4+(i/20)**2)]),C.muted,2)+line([px(0),py(2)],[px(2),py(2)],C.ink,3);
      s+=circle([px(t),py(2)],6,C.lime)+circle([px(t),py(4+t*t)],6,C.lime);
      [0,1,2].forEach(v=>s+=txt(px(v),123,v,18,C.muted,'middle'));s+=txt(w-12,123,'t',20,C.muted);
      body.innerHTML=svg(s,w,h,'Toy family B_t: spectral error stays at 2 while squared Frobenius error grows from 4 to 8')+`<div class="pw-stats">${stat('‖A − Bₜ‖₂ =','2')}${stat('‖A − Bₜ‖<sub>F</sub>² =',fmt(4+t*t))}</div>`;
    };
    bindRanges(host,state,render);register(host,'spectral-family',state,render);
  }
  function projectorWeightsWidget(host) {
    const state={t:0};const body=shell(host,control('t',0,1,0,.01,'Transfer t'));
    const render=()=>{
      state.t=clamp(+state.t,0,1);sync(host,state);
      const w=width(host),h=170,lambda=[9,4,1,0],weights=[1,1-state.t,state.t,0],energy=13-3*state.t;
      let s='';
      lambda.forEach((v,i)=>{
        const x=60+i*(w-120)/4,bw=(w-180)/4;
        s+=txt(x+bw/2,25,`λ${'₁₂₃₄'[i]} = ${v}`,24,C.ink,'middle');
        s+=`<rect x="${x}" y="55" width="${bw}" height="26" fill="#eeeeee"/><rect x="${x}" y="55" width="${bw*weights[i]}" height="26" fill="${C.lime}"/>`;
        s+=txt(x+bw/2,118,`a${'₁₂₃₄'[i]} = ${fmt(weights[i])}`,23,C.ink,'middle');
      });
      body.innerHTML=svg(s,w,h,'A fixed budget of two projector weights moves from the second to the third direction')+`<div class="pw-stats">${stat('Σaᵢ = k =','2')}${stat('Σλᵢaᵢ = 13 − 3t =',fmt(energy))}${stat('Upper bound =','13')}</div>`+note('Toy λ = (9, 4, 1, 0). Necessary weight constraints are illustrated; no general construction of P is assumed.');
    };
    bindRanges(host,state,render);register(host,'projector-weights',state,render);
  }
  const factories={'response-space':host=>responseWidget(host,false),projection:host=>responseWidget(host,true),conditioning:conditioningWidget,orthogonal:orthogonalWidget,'svd-directions':directionsWidget,svd:spectrumWidget,truncation:truncationWidget,instability:instabilityWidget,'spectral-family':familyWidget,'projector-weights':projectorWeightsWidget};

  function stateHost(value) {return typeof value==='number'?api.states[value]:typeof value==='string'?document.querySelector(value):value;}
  api.getState=value=>{const host=stateHost(value);return host&&host._preStates?{index:host._preStates.index,count:host._preStates.children.length}:null;};
  api.setState=(value,index)=>{
    const host=stateHost(value);if(!host||!host._preStates)return null;
    const store=host._preStates;store.index=clamp(Math.round(+index)||0,0,store.children.length-1);host.dataset.stateIndex=String(store.index);
    store.children.forEach((child,i)=>{child.hidden=i!==store.index;child.setAttribute('aria-hidden',String(i!==store.index));});
    store.prev.disabled=store.index===0;store.next.disabled=store.index===store.children.length-1;store.counter.textContent=`${store.index+1} / ${store.children.length}`;
    host.dispatchEvent(new CustomEvent('prestatechange',{bubbles:true,detail:{index:store.index,count:store.children.length}}));
    api.widgets.filter(w=>host.contains(w.host)).forEach(w=>w.render());
    return api.getState(host);
  };
  function initStates(host) {
    if(host._preStates)return;
    const children=Array.from(host.children).filter(c=>c.classList.contains('pre-state'));
    if(!children.length)return;
    const nav=document.createElement('div');nav.className='pre-state-controls';nav.innerHTML='<button type="button" class="pre-state-prev" aria-label="Previous local state">← Previous</button><span class="pre-state-counter" aria-live="polite"></span><button type="button" class="pre-state-next" aria-label="Next local state">Next →</button>';
    host.appendChild(nav);host._preStates={children,index:0,prev:nav.querySelector('.pre-state-prev'),next:nav.querySelector('.pre-state-next'),counter:nav.querySelector('.pre-state-counter')};
    host._preStates.prev.addEventListener('click',e=>{e.stopPropagation();api.setState(host,host._preStates.index-1);});
    host._preStates.next.addEventListener('click',e=>{e.stopPropagation();api.setState(host,host._preStates.index+1);});
    // Focused local controls consume arrows/Space; the rest of the slide retains Reveal navigation.
    nav.addEventListener('keydown',e=>e.stopPropagation());api.states.push(host);api.setState(host,0);
  }
  api.init=()=>{
    document.querySelectorAll('.pre-states[data-pre-states]').forEach(initStates);
    document.querySelectorAll('.pre-widget[data-pre-widget]').forEach(host=>{
      if(host.dataset.preReady==='true')return;const factory=factories[host.dataset.preWidget];if(!factory)return;
      factory(host);host.addEventListener('keydown',e=>{if(e.target.matches('input,button,select'))e.stopPropagation();});
    });
    api.ready=true;document.dispatchEvent(new CustomEvent('preliminarywidgetsready'));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',api.init,{once:true});else api.init();
  // Reveal may initialize after this script. Its events need no dependency or global-key override.
  let revealBound=false;
  function bindReveal(){if(revealBound||!root.Reveal||typeof root.Reveal.on!=='function')return;revealBound=true;root.Reveal.on('slidechanged',()=>api.widgets.forEach(w=>w.render()));root.Reveal.on('ready',()=>api.widgets.forEach(w=>w.render()));}
  bindReveal();document.addEventListener('DOMContentLoaded',bindReveal,{once:true});root.addEventListener('load',bindReveal,{once:true});
  let resizePending=false;root.addEventListener('resize',()=>{if(resizePending)return;resizePending=true;root.requestAnimationFrame(()=>{resizePending=false;api.widgets.forEach(w=>w.render());});});
})(typeof window!=='undefined'?window:globalThis);
