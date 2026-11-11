/* Factorization, slides 22–44. All figures use local teaching data. */
(() => {
  'use strict';

  const ink = 'var(--vr-ink)', lineColor = 'var(--vr-line)', accent = 'var(--vr-accent)', muted = 'var(--vr-muted)', wash = 'var(--vr-wash)';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  const f = (x, p = 3) => typeof x !== 'number' ? x : Math.abs(x) < 1e-12 ? '0' : String(+x.toFixed(p)).replace('-', '−');
  const sci = x => !Number.isFinite(x) ? '—' : x === 0 ? '0' : x.toExponential(2);
  const subscript = n => String(n).replace(/\d/g, x => '₀₁₂₃₄₅₆₇₈₉'[x]);
  const vstr = (a, p = 3) => '(' + a.map(x => f(x,p)).join(', ') + ')';
  const dot = (a,b) => a.reduce((s,x,i) => s+x*b[i],0);
  const norm = a => Math.hypot(...a);
  const add = (a,b) => a.map((x,i) => x+b[i]);
  const sub = (a,b) => a.map((x,i) => x-b[i]);
  const scale = (a,s) => a.map(x => x*s);
  const trans = A => A[0].map((_,j) => A.map(r=>r[j]));
  const mv = (A,x) => A.map(row => dot(row,x));
  const mm = (A,B) => A.map(row => mv(trans(B),row));
  const outer = (a,b) => a.map(x=>scale(b,x));
  const col = a => a.map(x=>[x]);
  const diag = a => a.map((x,i)=>a.map((_,j)=>i===j?x:0));
  const rot = deg => {const t=deg*Math.PI/180;return [[Math.cos(t),-Math.sin(t)],[Math.sin(t),Math.cos(t)]];};
  const span = (label, value) => `<span><small>${esc(label)}</small><strong>${esc(value)}</strong></span>`;
  const metrics = (...args) => `<div class="fc-metrics">${args.map(([k,v])=>span(k,v)).join('')}</div>`;
  const panel = (title,body,active=false) => `<div class="vr-panel fc-panel${active?' fc-active':''}"><h3>${esc(title)}</h3>${body}</div>`;
  const grid = (...children) => `<div class="vr-grid fc-grid" style="--fc-columns:${children.length}">${children.join('')}</div>`;
  const note = text => `<div class="fc-note">${esc(text)}</div>`;
  const equation = s => `<div class="fc-equation">${esc(s)}</div>`;
  const matrix = (name,A,{hit=[],heat=0}={}) => `<div class="fc-array"><div class="vr-label">${esc(name)}</div><div class="vr-matrix fc-matrix" role="group" aria-label="${esc(name)}" style="--fc-n:${A[0].length}">${A.map((row,i)=>row.map((x,j)=>{
    const hot=hit.some(([r,c])=>r===i&&c===j);
    const level=heat ? Math.min(1,Math.abs(x)/heat) : 0;
    const shade=level? ` style="--fc-fill:color-mix(in srgb, ${x<0?lineColor:accent} ${Math.round(level*86)}%, white)"`:'';
    return `<span class="${hot?'fc-cell-hit':''}"${shade}>${esc(f(x))}</span>`;
  }).join('')).join('')}</div></div>`;
  const arrays = (...parts) => `<div class="fc-arrays">${parts.join('')}</div>`;
  const result = (html,status) => ({html,status});
  const txt = (x,y,s,anchor='start',color=ink) => `<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${color}">${esc(s)}</text>`;
  const line = (a,b,c=lineColor,w=1,dash='') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const poly = (p,c=ink,w=2,dash='',fill='none') => `<polyline points="${p.map(q=>q.join(',')).join(' ')}" fill="${fill}" stroke="${c}" stroke-width="${w}"${dash?` stroke-dasharray="${dash}"`:''}/>`;
  const point = (p,c=accent,r=6) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${c}" stroke="${ink}" stroke-width="1.5"/>`;
  const rect = (x,y,w,h,fill,stroke='none') => `<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" fill="${fill}" stroke="${stroke}"/>`;
  const arrow = (a,b,highlight=false) => {
    const l=norm(sub(b,a));
    if(l<1) return point(a,highlight?accent:ink,4);
    const [x,y]=scale(sub(b,a),1/l), h=Math.min(12,l*.55);
    return line(a,b,ink,highlight?8:3)+ (highlight?line(a,b,accent,4):'')+
      `<polygon points="${[b,[b[0]-h*x+h*.47*y,b[1]-h*y-h*.47*x],[b[0]-h*x-h*.47*y,b[1]-h*y+h*.47*x]].map(p=>p.join(',')).join(' ')}" fill="${highlight?accent:ink}" stroke="${ink}" stroke-width="1.5"/>`;
  };
  const svg = (label,body,w=560,h=330) => `<svg class="vr-chart fc-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;
  const at = (o,k) => ([x,y]) => [o[0]+k*x,o[1]-k*y];
  const axis = (p, r, xl, yl) => line(p([-r,0]),p([r,0]),muted,1.4)+line(p([0,-r]),p([0,r]),muted,1.4)+txt(...add(p([r,0]),[-4,-10]),xl,'end')+txt(...add(p([0,r]),[9,4]),yl);
  const ellipse = (p,a,b) => poly(Array.from({length:97},(_,i)=>p([a*Math.cos(i*Math.PI/48),b*Math.sin(i*Math.PI/48)])),muted,2.2);
  const arrowTo = (p,v,label,offset=[10,-10],active=false) => arrow(p([0,0]),p(v),active)+txt(...add(p(v),offset),label);
  const unit = deg => [Math.cos(deg*Math.PI/180),Math.sin(deg*Math.PI/180)];
  const signed = (names,values,bound) => {
    const zero=305, n=values.length;
    let body = line([zero,10],[zero,n*53],ink,1);
    for(let i=0;i<n;i++){
      const y=16+i*53, length=155*values[i]/bound;
      body+=txt(20,y+20,names[i])+rect(150,y,310,24,wash,lineColor)+rect(Math.min(zero,zero+length),y,Math.abs(length),24,values[i]<0?lineColor:accent,ink)+txt(482,y+20,f(values[i]));
    }
    return svg(`Signed bars from −${bound} to ${bound}: ${names.map((n,i)=>n+' '+f(values[i])).join(', ')}`,
      body+txt(150,n*53+23,'−'+bound,'middle',muted)+txt(zero,n*53+23,'0','middle',muted)+txt(460,n*53+23,bound,'middle',muted),560,n*53+34);
  };
  const bars = (names,values,bound,active=values.map(()=>true),reference=null,marks=[]) => {
    const x=130,w=330,n=values.length;
    let body='';
    for(let i=0;i<n;i++){
      const y=12+i*51, width=w*values[i]/bound;
      body+=txt(8,y+22,names[i])+rect(x,y,w,26,wash,lineColor);
      if(reference)body+=rect(x,y,w*reference[i]/bound,26,lineColor,muted);
      if(width>0)body+=rect(x,y,width,26,active[i]?accent:lineColor,ink);
      body+=txt(475,y+22,f(values[i]));
    }
    for(const [i,from,to] of marks) {
      const y=43+i*51,a=x+w*from/bound,b=x+w*to/bound;
      body+=poly([[a,y-4],[a,y+2],[b,y+2],[b,y-4]],ink,2)+txt((a+b)/2,y+16,'½','middle');
    }
    return svg(`Bars with common maximum ${bound}: ${names.map((n,i)=>n+' '+f(values[i])).join(', ')}`,
      body+txt(x,n*51+19,'0','middle',muted)+txt(x+w,n*51+19,bound,'middle',muted),560,n*51+30);
  };
  const controls = {
    slider:(key,label,min,max,step)=>({method:'slider',key,args:[label,min,max,step]}),
    choice:(key,label,options)=>({method:'choice',key,args:[label,options]}),
    steps:(key,label,labels)=>({method:'steps',key,args:[label,labels]})
  };
  const {slider,choice,steps}=controls;
  const scenes={};
  const scene=(id,label,initial,widgets,draw,print={}) => {scenes[id]={label,initial,widgets,draw,print};};

  scene('pre-lu','Pivot, elimination multiplier, and reconstruction in a two by two LU example',
    {s:0},[steps('s','Elimination',['1 · Choose pivot','2 · Update L and U','3 · Recover A'])],({s})=>{
      const A=[[2,3],[-1,-2]], ell=A[1][0]/A[0][0], L=[[1,0],[s?ell:'—',1]], U=s?[A[0],sub(A[1],scale(A[0],ell))]:A;
      const hits=s===0?[[0,0],[1,0]]:s===1?[[1,0],[1,1]]:[[1,0],[1,1]];
      const process=[
        'ℓ₂₁ = a₂₁ / a₁₁ = −1 / 2',
        'R₂ ← R₂ − ℓ₂₁ R₁ = (−1, −2) + ½(2, 3) = (0, −½)',
        'Row 2 of LU = −½(2, 3) + (0, −½) = (−1, −2)'
      ][s];
      return result(grid(panel(s===2?'Recovered input':'Input A',matrix('A',s===2?mm(L,U):A,{hit:hits}),s!==1),
        panel('Store the multiplier',matrix('L',L,{hit:s?[[1,0]]:[]}),s===1),
        panel(s?'Eliminated matrix':'Before elimination',matrix(s?'U':'Working rows',U,{hit:hits}),s===1))+
        equation(process)+note('With row pivoting: PA = LU. Then solve Lz = Pb and Ux = z.'),process);
    },{s:2});

  scene('pre-cholesky','Numerical Cholesky factors and the remaining pivot for the temperature regression',
    {s:0},[steps('s','Cholesky',['1 · First column','2 · Subtract its contribution','3 · Complete L and Lᵀ'])],({s})=>{
      const G=[[18,8],[8,4]], l1=[Math.sqrt(18),8/Math.sqrt(18)], P=outer(l1,l1), pivot=G[1][1]-P[1][1];
      const L=[['3√2',0],['4√2/3',s===2?'2/3':'—']];
      const process=['l₁ = (√18, 8/√18)ᵀ','Next pivot = 4 − 32/9 = 4/9','l₂₂ = √(4/9) = 2/3; the same entry appears in Lᵀ'][s];
      return result(grid(panel('Temperature Gram matrix',matrix('G',G,{hit:s?[[1,1]]:[[0,0],[1,0]]})),
        panel(s?'Subtract the first column’s contribution':'Build the first column',
          s?arrays(matrix('l₁l₁ᵀ',[[18,8],[8,'32/9']],{hit:[[1,1]]}),matrix('G − l₁l₁ᵀ',[[0,0],[0,'4/9']],{hit:[[1,1]]})):matrix('l₁',col(['3√2','4√2/3']),{hit:[[0,0],[1,0]]}),s<2),
        panel('Factors for both solves',arrays(matrix('L',L,{hit:s===2?[[1,1]]:[]}),matrix('Lᵀ',trans(L),{hit:s===2?[[1,1]]:[]})),s===2))+
        equation(process)+note('With G = XᵀX and C = XᵀY, solve LZ = C, then LᵀΘ̂ = Z.'),`${process}. Remaining pivot ${f(pivot)}.`);
    },{s:2});

  scene('pre-spectral','Eigenaxes, independent stretches, and solution for a symmetric two by two matrix',
    {s:0},[steps('s','Eigenbasis',['Stretch the axes','Resolve b','Divide and recombine'])],({s})=>{
      const rt=Math.SQRT1_2, v1=[rt,rt],v2=[rt,-rt],p=at([270,164],31);
      const b=[4,0], x=[1.5,-.5], a=dot(v1,b), d=dot(v2,b);
      const axisDraw=axis(p,4.6,'x₁','x₂')+line(p(scale(v1,-4.5)),p(scale(v1,4.5)),muted,1.5,'6 5')+line(p(scale(v2,-4.5)),p(scale(v2,4.5)),muted,1.5,'6 5')+
        txt(...add(p(scale(v1,4.5)),[-25,-5]),'v₁')+txt(...add(p(scale(v2,4.5)),[-12,24]),'v₂');
      let view=axisDraw;
      if(s===0) view+=arrowTo(p,scale(v1,4),'Av₁',[-75,-12],true)+arrowTo(p,scale(v2,2),'Av₂',[14,25])+point(p(v1))+point(p(v2),wash);
      else{
        const end=s===1?b:x, w1=scale(v1,a/(s===1?1:4)), w2=scale(v2,d/(s===1?1:2));
        view+=line(p(w1),p(end),muted,2,'6 5')+line(p(w2),p(end),muted,2,'6 5')+arrowTo(p,w1,s===1?'b₁v₁':'(b₁/4)v₁',[-118,-6])+arrowTo(p,w2,s===1?'b₂v₂':'(b₂/2)v₂',[8,25])+arrowTo(p,end,s===1?'b':'x',[9,-9],true);
        if(s===2)view+=line(p([0,0]),p(b),muted,2,'3 6')+txt(...add(p(b),[8,-9]),'b');
      }
      const detail=['Av₁ = 4v₁ · Av₂ = 2v₂','b = (2√2)v₁ + (2√2)v₂','x = (2√2/4)v₁ + (2√2/2)v₂ = (1.5, −0.5)'][s];
      return result(grid(panel('One coordinate grid',svg(detail,view)),panel('A = VΛVᵀ',arrays(matrix('A',[[3,1],[1,3]]),matrix('Λ',[[4,0],[0,2]],{hit:[[0,0],[1,1]]}))+metrics(['Right-hand side','b = (4, 0)'],['Solution','x = (1.5, −0.5)'])) )+equation(detail)+note('Divide by each eigenvalue only when it is nonzero.'),detail);
    },{s:2});

  const X=[[3,1],[1,3],[1,1]], G=mm(trans(X),X), vm=[[Math.SQRT1_2,Math.SQRT1_2],[-Math.SQRT1_2,Math.SQRT1_2]];
  const project3 = (o,k) => ([a,b,c]) => {
    const C=Math.cos(.57), S=Math.sin(.57), p=.35;
    return add(o,[k*(C*a-S*b),k*(Math.sin(p)*(S*a+C*b)-Math.cos(p)*c)]);
  };
  const sample = n=>Array.from({length:n+1},(_,i)=>360*i/n);
  const plane3 = (p,a,b) => {
    const q=(x,y)=>p(add(scale(a,x),scale(b,y)));
    return poly([q(-1,-1),q(1,-1),q(1,1),q(-1,1),q(-1,-1)],lineColor,1,'',wash)+
      line(q(-1,0),q(1,0),muted,1,'5 5')+line(q(0,-1),q(0,1),muted,1,'5 5');
  };
  scene('pre-16','Rotate orthogonal input axes and compare their images in the three-dimensional output space',
    {a:15},[slider('a','Input basis angle',0,90,1)],({a})=>{
      const v=unit(a),w=[-v[1],v[0]], u=mv(X,v), z=mv(X,w);
      const angle=Math.acos(Math.max(-1,Math.min(1,dot(u,z)/(norm(u)*norm(z)))))*180/Math.PI;
      const a1=scale(mv(X,vm[0]),1/Math.sqrt(18)),a2=scale(mv(X,vm[1]),.5),n=scale([-1,-1,4],1/Math.sqrt(18));
      const p=at([275,163],128), q=y=>[276+37*dot(a1,y),162-37*(Math.cos(.35)*dot(a2,y)+Math.sin(.35)*dot(n,y))], origin=q([0,0,0]);
      const inputs=axis(p,1.14,'x₁','x₂')+ellipse(p,1,1)+arrowTo(p,v,'v',[7,-12],true)+arrowTo(p,w,'w',[-23,-8]);
      const coord3=[[1,0,0],[0,1,0],[0,0,1]].map((e,j)=>{
        const tip=q(scale(e,3.1));
        return line(q(scale(e,-3.1)),tip,lineColor,1.3,'4 4')+txt(...add(tip,[5,17]),withIndex('e',j),'start',muted);
      }).join('');
      const outputs=plane3(q,scale(mv(X,vm[0]),1.18),scale(mv(X,vm[1]),1.18))+coord3+
        poly(sample(80).map(d=>q(mv(X,unit(d)))),muted,2)+arrow(origin,q(u),true)+arrow(origin,q(z))+
        txt(...add(q(u),[8,-9]),'Xv')+txt(...add(q(z),[-34,-12]),'Xw');
      const label=`Input angle ${a}°. Output angle ${f(angle,1)}°. Image lengths ${f(norm(u))} and ${f(norm(z))}.`;
      return result(grid(panel('Input plane · always orthogonal',svg('Unit circle with perpendicular trial axes',inputs)),
        panel('Output plane inside ℝ³',svg(label,outputs)))+metrics(['Basis angle',a+'°'],['Angle in output',f(angle,1)+'°'],['Image lengths',f(norm(u))+' and '+f(norm(z))])+
        note('X has rows (3, 1), (1, 3), (1, 1). Output angles are measured in 3D, before projection to the screen.'),label);
    },{a:45});

  scene('pre-17','Trace either singular channel through the Gram eigenpair, singular value, and normalized output',
    {i:0},[choice('i','Trace channel',[[0,'1 · Stronger'],[1,'2 · Weaker']])],({i})=>{
      const v=vm[i], lam=dot(v,mv(G,v)), sigma=Math.sqrt(lam), xv=mv(X,v), u=scale(xv,1/sigma), j=subscript(i+1);
      return result(grid(panel('1 · Right direction',matrix('v'+j,col(v),{hit:[[0,0],[1,0]]})+note('Unit eigenvector of XᵀX')),
        panel('2 · Gram eigenvalue',matrix('XᵀX',G)+equation('λ'+j+' = '+f(lam))),
        panel('3 · Singular value',matrix('Xv'+j,col(xv))+equation('σ'+j+' = √'+f(lam)+(Number.isInteger(sigma)?' = ':' ≈ ')+f(sigma))),
        panel('4 · Left direction',matrix('u'+j,col(u),{hit:u.map((_,j)=>[j,0])})+note('Normalize Xv'+j),true))+
        equation('v'+j+' → λ'+j+' = '+f(lam)+' → σ'+j+' = '+f(sigma)+' → u'+j+' = Xv'+j+'/σ'+j)+note('Positive Gram eigenvalues give orthonormal output axes: uᵢᵀuⱼ = vᵢᵀ(XᵀX)vⱼ/(σᵢσⱼ).'),
        'Channel '+(i+1)+': λ = '+f(lam)+', σ = '+f(sigma)+', u = '+vstr(u));
    });

  const sigma=[5,3,1], lambda=sigma.map(x=>x*x), energy=lambda.reduce((a,b)=>a+b,0);
  const kOptions=[[0,'0 · Nothing'],[1,'1 · One channel'],[2,'2 · Two channels'],[3,'3 · All channels']];
  const Qz = deg => {const r=rot(deg);return [[...r[0],0],[...r[1],0],[0,0,1]];};
  // Ry convention here maps e₁ toward e₃ for positive angles.
  const Qy = deg => {const [[c,n],[s]]=rot(deg);return [[c,0,n],[0,1,0],[s,0,c]];};
  const U=mm(Qz(32),Qy(-22)), V=mm(Qz(-27),Qy(18)), uc=trans(U),vc=trans(V);
  const layers=sigma.map((v,i)=>outer(scale(uc[i],v),vc[i]));
  const sums = k=>layers.slice(0,k).reduce((M,L)=>M.map((r,i)=>add(r,L[i])),diag([0,0,0]));
  const probe=[2/3,2/3,1/3]; // unit input expressed in v coordinates
  const axCoeffs=sigma.map((s,i)=>s*probe[i]);
  const sigNames=['σ₁','σ₂','σ₃'];
  const mask=(k,n=3)=>Array.from({length:n},(_,i)=>i<k);
  const withIndex=(letter,i)=>letter+subscript(i+1);
  scene('pre-tsvd-definition','Select a singular layer and change the rank of its reconstructed sum',
    {i:0,k:1},[choice('i','Inspect layer',[[0,'1 · σ₁ = 5'],[1,'2 · σ₂ = 3'],[2,'3 · σ₃ = 1']]),choice('k','Retain k',kOptions)],({i,k})=>{
      const label=withIndex('u',i), row=withIndex('v',i), output=axCoeffs.map((c,j)=>j<k?c:0);
      const origin=[155,123], p=project3(origin,34), actual=mv(U,output);
      const keptAxes=uc.map((u,j)=>{
        const a=p(scale(u,-2.35)), b=p(scale(u,2.35));
        return line(a,b,j<k?ink:lineColor,j<k?3:1.5,j<k?'':'6 5')+txt(...add(b,[8,-8]),withIndex('u',j),'start',j<k?ink:muted);
      }).join('');
      const axes=keptAxes+arrow(origin,p(actual),true)+txt(...add(p(actual),[10,27]),'Aₖx');
      return result(grid(panel('The selected layer',arrays(matrix(label,col(uc[i]),{heat:1}),matrix(row+'ᵀ',[vc[i]],{heat:1}))+equation(sigma[i]+' × '+label+row+'ᵀ'),true),
        panel(i<k?'Layer enters the sum':'Layer is discarded',matrix('σᵢuᵢvᵢᵀ',layers[i],{heat:5})),
        panel('Sum in original coordinates',matrix('Aₖ',sums(k),{heat:5})),
        panel('Output subspace',svg('Retained axes are solid. Truncated output lies in their span.',axes,310,246),true))+
        note('Layer and sum tiles share a 0–5 magnitude scale. Input and output vectors use 0–1. Gray cells are negative.')+
        metrics(['Kept output axes',k?Array.from({length:k},(_,j)=>withIndex('u',j)).join(', '):'None'],
          ['Image', ['Point','Line','Plane','3D'][k]],['Aₖx in the U basis',vstr(output)])+
        note('x has coordinates (2/3, 2/3, 1/3) in V. Every output uses only the retained axes.'),
        'Layer '+(i+1)+(i<k?' is retained. ':' is discarded. ')+'Rank '+k+'; output '+vstr(output)+' in the U basis.');
    },{i:0,k:1});

  function normEllipse(a) {
    const p=at([280,164],32), x=unit(a), y=[4*x[0],3*x[1]], l=norm(y);
    const body=axis(p,4.45,'e₁','e₂')+ellipse(p,1,1)+ellipse(p,4,3)+
      arrowTo(p,x,'x',[8,-8])+arrowTo(p,y,'Ax',[10,-10],true)+txt(19,315,'Unit circle and output ellipse share one scale','start',muted);
    return {l,chart:svg('Unit input at '+a+' degrees maps to an ellipse point of length '+f(l),body)};
  }
  scene('pre-tsvd-norms','Compare the total squared matrix entries with amplification of a unit input',
    {a:30},[slider('a','Unit input angle',0,90,1)],({a})=>{
      const {l,chart}=normEllipse(a);
      return result(grid(panel('How much is in the whole matrix?',matrix('A = diag(4, 3)',[[4,0],[0,3]],{hit:[[0,0],[0,1],[1,0],[1,1]],heat:4})+
        equation('4² + 0² + 0² + 3² = 25')+metrics(['Frobenius norm','5'])),
        panel('How much is one unit vector amplified?',chart,true))+
        metrics(['Input angle',a+'°'],['Current output length',f(l)],['Maximum over all unit inputs','4']),
        'Angle '+a+' degrees. Current output length '+f(l)+'. Frobenius norm 5; maximum unit-input gain 4.');
    });

  scene('pre-tsvd-frobenius','Rotate the left and right bases; squared-entry total and squared singular values agree',
    {l:22,r:48},[slider('l','Left rotation',0,90,1),slider('r','Right rotation',0,90,1)],({l,r})=>{
      const A=mm(mm(rot(l),diag([4,3])),trans(rot(r))), total=A.flat().reduce((s,x)=>s+x*x,0);
      return result(grid(panel('Read the entries after rotating',matrix('A = Rₗ diag(4, 3) Rᵣᵀ',A,{heat:4})+
        note('Fixed scale: |aᵢⱼ| from 0 to 4. Gray cells are negative.'),true),
        panel('Read the squared singular values',bars(['σ₁²','σ₂²'],[16,9],16)+note('The bar lengths encode 4² and 3².')))+
        metrics(['Left / right angles',l+'° / '+r+'°'],['Sum of all squared entries',f(total)],['Sum from the spectrum','16 + 9 = 25'])+
        equation('‖A‖F² = tr(AᵀA) = ∑ᵢ σᵢ²'),
        'Left '+l+' degrees; right '+r+' degrees. Squared entry sum and squared singular-value sum both '+f(total)+'.');
    });

  scene('pre-tsvd-spectral','Turn a unit input and locate the maximum output length on a fixed ellipse',
    {a:30},[slider('a','Unit input angle',0,360,1)],({a})=>{
      const {l,chart}=normEllipse(a), max=a%180===0;
      return result(grid(panel('Tip of Ax traces the ellipse',chart,true),
        panel('Maximum over the unit circle',bars(['‖Ax‖₂','σ₁','σ₂'],[l,4,3],4,[true,max,false])+
          equation(max?'x = ±v₁: maximum attained':'Rotate x onto ±v₁ to attain 4')+
          note('A = diag(4, 3). The major semiaxis has length σ₁ = 4.')))+
        metrics(['Input angle',a+'°'],['Current output length',f(l)],['Spectral norm','4']),
        a+' degrees: output length '+f(l)+'. '+(max?'The maximum 4 is attained.':'The maximum is 4.'));
    },{a:0});

  scene('pre-tsvd-tail','Split one output into orthogonal kept and discarded branches, and measure the error operator',
    {k:1},[choice('k','Retain k',kOptions)],({k})=>{
      const A=norm(axCoeffs.slice(0,k)), E=norm(axCoeffs.slice(k)), p=at([91,273],52), tail=sigma.slice(k);
      const e2=tail.reduce((s,x)=>s+x*x,0), op=tail[0]||0;
      const branch=line(p([0,0]),p([7.5,0]),lineColor)+line(p([0,0]),p([0,4.55]),lineColor)+
        line(p([A,0]),p([A,E]),muted,2,'5 5')+line(p([0,E]),p([A,E]),muted,2,'5 5')+
        (A&&E?poly([p([.22,0]),p([.22,.22]),p([0,.22])],ink,1.4):'')+
        arrow(p([0,0]),p([A,0]),true)+arrow(p([0,0]),p([0,E]))+arrow(p([0,0]),p([A,E]))+
        txt(...add(p([A,0]),[8,28]),'Aₖx')+txt(...add(p([0,E]),[-9,-12]),'Eₖx','end')+
        (A&&E?txt(...add(p([A,E]),[9,-10]),'Ax'):'');
      return result(grid(panel('One fixed input · orthogonal branches',svg('Kept length '+f(A)+' and discarded length '+f(E)+'. The branches are orthogonal.',branch)),
        panel('Entire operator · discarded spectrum',bars(sigNames,sigma,5,sigma.map((_,j)=>j>=k))+
          note('Lime bars are discarded. Tallest discarded bar gives ‖Eₖ‖₂; squared heights sum to ‖Eₖ‖F².'),true))+
        metrics(['Error for this input','‖Eₖx‖₂ = '+f(E)],['Spectral error','‖Eₖ‖₂ = '+f(op)],['Squared Frobenius error','‖Eₖ‖F² = '+(tail.length?tail.map(x=>x*x).join(' + ')+' = ':'')+f(e2)]),
        'k = '+k+'. Input error '+f(E)+', spectral error '+f(op)+', squared Frobenius error '+f(e2)+'.');
    });

  const ruler=(name,value,valueLabel,showBound)=> {
    const left=59,right=505,y=166,pos=x=>left+(right-left)*x/6;
    let v=showBound?rect(left,y-43,pos(value)-left,43,wash):'';
    v+=line([left,y],[right,y],ink,2)+Array.from({length:7},(_,i)=>line([pos(i),y-7],[pos(i),y+7],ink,1)+txt(pos(i),y+34,i,'middle',muted)).join('');
    v+=line([pos(value),y],[pos(value),y-60],ink,1.5)+point([pos(value),y])+txt(pos(value),y-70,'A₁ = '+valueLabel,'middle');
    if(showBound)v+=txt((left+pos(value))/2,y-16,'Impossible','middle',muted)+txt((pos(value)+right)/2,y-16,'Admissible errors','middle');
    return svg(name+': candidate '+valueLabel+(showBound?', also the lower bound.':'.'),v,560,230);
  };
  scene('pre-tsvd-theorem','Compare the truncated candidate with a lower bound for every rank-one approximation',
    {s:0},[steps('s','Optimality',['1 · Candidate A₁','2 · Every rank ≤ 1 competitor'])],({s})=>{
      const b=!!s;
      return result(grid(panel('Spectral error',ruler('Spectral error',3,'3',b)+equation('‖A − A₁‖₂ = σ₂ = 3'),b),
        panel('Frobenius error',ruler('Frobenius error',Math.sqrt(10),'√10',b)+equation('‖A − A₁‖F = √(3² + 1²) = √10'),b))+
        equation('Eckart–Young: Aₖ minimizes both errors over all B with rank(B) ≤ k.')+note(b?'The next slides prove both lower bounds.':'The candidate’s errors alone do not establish minimality.'),
        b?'The candidate attains both lower bounds.':'The candidate gives spectral error 3 and Frobenius error square root of 10.');
    },{s:1});

  scene('pre-tsvd-spectral-proof','Rotate the rank-one competitor and track the unit witness in its kernel',
    {a:0},[slider('a','Right direction of competitor B',0,90,1)],({a})=>{
      const v=unit(a),w=[-v[1],v[0]], y=[5*w[0],3*w[1]], L=norm(y);
      const p=at([275,164],117), q=at([278,170],27);
      const i=axis(p,1.15,'v₁','v₂')+ellipse(p,1,1)+arrowTo(p,v,'B axis',[11,25])+arrowTo(p,w,'w',[-22,-10],true);
      const o=axis(q,5.17,'u₁','u₂')+ellipse(q,5,3)+arrowTo(q,y,'Aw',[-30,-12],true)+txt(338,300,'Bw = 0');
      return result(grid(panel('Input · choose B, and w moves with it',svg('Perpendicular right direction and unit witness w',i)),
        panel('Output · A cannot erase this witness',svg('Image of witness with length '+f(L)+', competitor gives zero',o),true))+
        metrics(['Competitor angle',a+'°'],['‖(A − B)w‖₂',f(L)],['Uniform lower bound','σ₂ = 3'])+
        note('Here B = 5u₁(cos θ v₁ + sin θ v₂)ᵀ. For any rank ≤ k, B has a kernel direction in span(v₁,…,vₖ₊₁). Here w is perpendicular to the chosen right axis of B.'),
        'Competitor '+a+' degrees. Bw is zero; the norm of Aw is '+f(L)+', at least 3.');
    },{a:35});

  scene('pre-tsvd-projection','Move a candidate column along a fixed line and compare the two orthogonal errors',
    {b:1.5,j:1,s:0},[choice('j','Column to inspect',[[0,'a₁'],[1,'a₂'],[2,'a₃']]),slider('b','Position of bⱼ on the line',-5,5,.1),
      steps('s','Projection view',['One column','All columns'])],({b,j,s})=>{
      const A=sums(3), cols=trans(A), projected=cols.map(a=>scale(uc[0],dot(uc[0],a)));
      const errors=cols.map((a,i)=>norm(sub(a,projected[i]))**2), a=cols[j];
      const q=[dot(uc[0],a),Math.sqrt(errors[j])], p=at([280,255],46), t=[q[0],0], candidate=[b,0];
      const miss=q[1]**2, extra=(b-q[0])**2;
      const chart=line(p([-5.5,0]),p([5.7,0]),muted,1.8)+txt(...p([3.8,-.55]),'Col(B)')+
        line(p(q),p(t),ink,4)+line(p(t),p(candidate),accent,8)+line(p(q),p(candidate),muted,2,'6 5')+
        (miss&&extra?poly([p([t[0]+Math.sign(b-t[0])*.2,0]),p([t[0]+Math.sign(b-t[0])*.2,.2]),p([t[0],.2])],ink,1.4):'')+
        point(p(q),ink)+txt(...add(p(q),[7,-13]),'aⱼ')+point(p(t),wash)+txt(...add(p(t),[-6,28]),'Paⱼ','end')+
        point(p(candidate))+txt(...add(p(candidate),[8,-14]),'bⱼ');
      const caption='Fixed line is the u₁ axis. Display the slice spanned by the line and the perpendicular component of aⱼ.';
      return result(grid(panel('Column '+(j+1)+' · keep the line fixed',svg('Column '+(j+1)+', its projection, and candidate on the line',chart),!s),
        s?panel('All columns · nearest points',arrays(matrix('A',A,{heat:5}),matrix('PA',trans(projected),{heat:5}))+equation('‖A − PA‖F² = 9 + 1 = 10'),true):
        panel('Pythagorean split',bars(['Outside','Along line'],[miss,extra],100)+equation('‖aⱼ − bⱼ‖² = '+f(miss)+' + '+f(extra)+' = '+f(miss+extra))+
          note('Only the along-line term changes as bⱼ moves.')))+note(caption),
        'Column '+(j+1)+'. Squared perpendicular error '+f(miss)+' and squared along-line error '+f(extra)+'. '+(s?'Projecting all columns leaves squared error 10.':''));
    },{s:1});

  const weights = deg => {const [c,s]=unit(deg);return [c*c,s*s,0];};
  function weightsScene(a,transfer=false) {
    const w=weights(a), contributions=w.map((x,i)=>x*lambda[i]), E=contributions.reduce((x,y)=>x+y,0), [c,s]=unit(a), p=at([280,160],111), d=[c,s], pu1=scale(d,c),pu2=scale(d,s);
    const axes=axis(p,1.16,'u₁','u₂')+ellipse(p,1,1)+line(p(scale(d,-1.17)),p(scale(d,1.17)),ink,2)+
      arrow(p([0,0]),p(d),true)+line(p([1,0]),p(pu1),muted,2,'5 5')+line(p([0,1]),p(pu2),muted,2,'5 5')+
      point(p(pu1))+point(p(pu2),wash);
    return {w,contributions,E,view:grid(
      panel('Rank-one projector · angle '+a+'°',svg('Project u1 and u2 onto a line at '+a+' degrees. u3 projects to zero.',axes)),
      panel('Weights · capacity 1 per axis',bars(['w₁','w₂','w₃'],w,1,[true,true,true],null,transfer?[[0,.5,1],[1,0,.5]]:[])+(transfer?equation(a?'Free capacity in w₁ = 0.5':'Move 0.5 from w₂ to w₁'):note('wᵢ = ‖Puᵢ‖² · u₃ projects to zero')),true),
      panel('Contributions · separate scale',bars(['25w₁','9w₂','1w₃'],contributions,25)+equation('Captured energy = '+f(E))))};
  }
  scene('pre-tsvd-weights','Rotate a rank-one projector and compare squared projection weights with weighted energy',
    {a:45},[slider('a','Projector angle',0,90,1)],({a})=>{
      const {view,w,E}=weightsScene(a);
      return result(view+metrics(['Weight budget','w₁ + w₂ + w₃ = '+f(w.reduce((x,y)=>x+y,0))],['Captured squared energy',f(E)])+
        note('The sum of squared projections of a full orthonormal basis is tr(P) = rank(P).'),
        'Angle '+a+' degrees. Weights '+vstr(w)+' sum to 1; captured energy '+f(E)+'.');
    });
  scene('pre-tsvd-weight-bound','Transfer half a unit of projector weight from the smaller eigenvalue to the larger one',
    {s:0},[steps('s','Weight transfer',['1 · Split at 45°','2 · Align with u₁'])],({s})=>{
      const {view,E}=weightsScene(s?0:45,true);
      return result(view+metrics(['Free capacity before transfer','½ in w₁'],['Available weight in tail','½ in w₂'],['Increase after transfer','½ × (25 − 9) = 8'])+
        note('Moving weight toward a larger eigenvalue cannot decrease the sum. The first k slots can hold the whole budget k.'),
        'Captured energy '+f(E)+'. Transferring half a unit from eigenvalue 9 to 25 increases energy by 8.');
    },{s:1});

  scene('pre-tsvd-conclusion','Use the same energy scale to compare the lower bound and the error attained by rank-one truncation',
    {s:0},[steps('s','Close the proof',['1 · Bound any competitor','2 · Check A₁'])],({s})=>{
      const width=37, start=168, y=91, total=energy, kept=lambda[0], err=total-kept;
      const ticks=[0,10,25,35].map(v=>txt(start+v*width,y+66,v,'middle',muted)).join('');
      let chart=rect(start,y,total*width,38,wash,ink)+rect(start,y,kept*width,38,accent,ink)+
        txt(start+kept*width/2,y-15,'Captured ≤ 25','middle')+txt(start+(kept+err/2)*width,y-15,'Error ≥ 10','middle')+ticks;
      if(s)chart+=rect(start,y+119,kept*width,38,accent,ink)+rect(start+kept*width,y+119,9*width,38,lineColor,ink)+
        rect(start+34*width,y+119,width,38,muted,ink)+txt(start+kept*width/2,y+111,'A₁ keeps 25','middle')+txt(start+30*width,y+111,'A₁ discards 9 + 1','middle');
      return result(panel('Squared Frobenius energy · all bars use the same units',svg(s?'Rank-one truncation keeps 25 and discards 10, meeting the lower bound.':'A rank-one projector captures at most 25 of 35; error squared is at least 10.',chart,1660,270),true)+
        metrics(['Full energy','25 + 9 + 1 = 35'],['Lower bound on squared error','35 − 25 = 10'],[s?'Squared error of A₁':'Candidate to check',s?'9 + 1 = 10':'A₁'])+
        equation(s?'The lower bound is attained: min rank≤1 ‖A − B‖F = √10.':'For any rank-one competitor, ‖A − B‖F² ≥ ‖A − PA‖F² ≥ 10.'),
        s?'A1 attains squared Frobenius error 10.':'Every rank-one competitor has squared Frobenius error at least 10.');
    },{s:1});

  scene('pre-19','Follow the one nonzero singular channel to the minimum-norm least-squares parameters',
    {s:0},[steps('s','One active channel',['1 · Project the target','2 · Divide by σ₁','3 · Reconstruct θ̂'])],({s})=>{
      const y=[3,6], u=[Math.SQRT1_2,Math.SQRT1_2], v=scale([2,1],1/Math.sqrt(5)), z=scale([-1,2],1/Math.sqrt(5));
      const c=dot(u,y), gain=c/Math.sqrt(10), theta=scale(v,gain), p=at([252,176],65);
      const plane=axis(p,2.14,'θ₁','θ₂')+line(p(scale(z,-2.1)),p(scale(z,2.1)),muted,1.8,'5 5')+
        txt(...add(p(scale(z,1.8)),[-104,-6]),'ker X')+arrowTo(p,v,'v₁',[11,16])+
        (s===2?arrowTo(p,theta,'θ̂',[11,-8],true)+line(p(add(theta,scale(z,-1.25))),p(add(theta,scale(z,1.25))),muted,2,'5 5')+
          txt(...add(p(add(theta,scale(z,-1.17))),[12,17]),'Same fit'):'');
      const descriptions=['Projection gives u₁ᵀy = 9/√2','Divide by √10: v₁ᵀθ̂ = 9/√20','θ̂ = (9/√20)v₁ = (1.8, 0.9)'];
      return result(grid(panel('Project → divide → rebuild',
        metrics(['1 · Target component','9/√2'],['2 · Inverse gain',s>=1?'1/√10':'—'],['3 · Parameters',s>=2?vstr(theta,1):'—'])+
          equation(descriptions[s])+note('X repeats the row (2, 1). The unused left direction accounts for the residual.'),true),
        panel('Parameter space',svg(s===2?'Shortest fit lies along v1 and is perpendicular to the nullspace.':'Active parameter direction v1 is perpendicular to the nullspace.',plane)))+
        note('Adding any component in ker X leaves predictions fixed and increases the parameter norm.'),descriptions[s]);
    },{s:2});

  const x1=[-1,0,1],x2=[1,1,1],y3=[-1,0,3],fit3=[-4/3,2/3,8/3],r3=sub(fit3,y3);
  const q1=scale(x1,1/norm(x1)),q2=scale(x2,1/norm(x2)),q3=scale([1,-2,1],1/Math.sqrt(6));
  const cameraRight=scale(add(q1,q2),Math.SQRT1_2), cameraUp=scale(sub(q1,q2),Math.SQRT1_2);
  const fitCamera=a=>[277+46*dot(cameraRight,a),164-46*(.8*dot(cameraUp,a)+.6*dot(q3,a))];
  scene('pre-13','Apply the same orthogonal transformation to the regression plane, target, and residual',
    {s:0},[steps('s','Coordinate transformation',['Before','After orthogonal transformation'])],({s})=>{
      const O=Qz(s?42:0), T=a=>mv(O,a), p=fitCamera, y=T(y3), fit=T(fit3), r=T(r3);
      const a=T(scale(q1,3.06)), b=T(scale(q2,1.66)), t=s?'O':'';
      const view=plane3(p,a,b)+arrow(p([0,0,0]),p(y))+arrow(p([0,0,0]),p(fit))+
        arrow(p(y),p(fit),true)+txt(...add(p(y),[-66,-7]),t+'y')+
        txt(...add(p(fit),[15,15]),t+'ŷ')+txt(...add(p(scale(add(y,fit),.5)),[13,-8]),t+'r');
      return result(grid(panel(s?'Rotate X and y together':'Original regression in ℝ³',svg('Orthographic view: the residual points from target to fitted target.',view)),
        panel(s?'Three signed components of Or':'Three signed components of r',signed(['1','2','3'],r,1)+
          metrics(['Before: ‖r‖₂²','2/3'],['After: ‖Or‖₂²','2/3']),true))+
        note('r = Xθ̂ − y. Before: (−1/3, 2/3, −1/3). The 3D norm stays fixed even if the screen length changes.'),
        (s?'After rotation':'Before rotation')+': residual components '+vstr(r)+'; squared norm 2/3.');
    },{s:1});

  scene('pre-14','Select a QR projection and solve the resulting triangular system by back substitution',
    {i:0,s:0},[choice('i','Inspect basis direction',[[0,'q₁ · first column'],[1,'q₂ · second column'],[2,'q₃ · perpendicular']]),
      steps('s','Back substitution',['Form Qᵀy','Solve θ₂','Solve θ₁'])],({i,s})=>{
      const qs=[q1,q2,q3], coeff=qs.map(q=>dot(q,y3)), projection=scale(qs[i],coeff[i]), p=fitCamera, R=[['√2',0],[0,'√3']];
      const view=plane3(p,scale(q1,3.06),scale(q2,1.66))+arrow(p([0,0,0]),p(y3))+txt(...add(p(y3),[9,18]),'y')+
        line(p(projection),p(y3),muted,2,'5 5')+arrow(p([0,0,0]),p(projection),true)+txt(...add(p(projection),[-10,-10]),withIndex('q',i)+' projection');
      const answer=['Rθ̂ = Qᵀy','θ₂ = (2/√3)/√3 = 2/3','θ₁ = (2√2)/√2 = 2; θ̂ = (2, 2/3)'][s];
      return result(grid(panel(i===2?'Orthogonal component · stays outside the solve':'Read a coordinate of the target',svg('Projection along '+withIndex('q',i)+', coefficient '+f(coeff[i]),view)),
        panel('Thin QR · solve the two-row system',arrays(matrix('R',R,{hit:s?[[2-s,2-s]]:[]}),matrix('Qᵀy',col(['2√2','2/√3']),{hit:i<2?[[i,0]]:[]}))+
          equation(answer)+note('Excluded: q₃ᵀy = 2/√6. Its squared length is 2/3.'),true))+
        note('Since QᵀQ = I, the full residual splits into the two solved coordinates and the perpendicular part.'),
        withIndex('q',i)+' coefficient is '+f(coeff[i])+'. '+answer);
    },{i:1,s:2});

  scene('pre-12','Compare the weak axes of the normalized design and Gram matrices on identical scales',
        {t:.3,m:'family'},[choice('m','Compare', [['family','Two-column ε family'],['benchmark','τ = 0.1 example']]),slider('t','−log₁₀ ε',.3,12,.1)],({t,m})=>{
      const eps=10**(-t), leading=1+eps/2+Math.hypot(1,eps/2), demo=m==='benchmark', tau=demo?.1:eps/(leading*leading), p=at([280,164],123);
      const chart=(b,u,v)=>svg(`Semiaxes 1 and ${sci(b)} on a fixed scale`,axis(p,1.11,u,v)+ellipse(p,1,b)+
        arrowTo(p,[1,0],'1',[12,21])+arrow(p([0,0]),p([0,b]),true));
      return result(grid(panel('X / σ₁ · output basis U',chart(tau,'u₁','u₂')+metrics(['Semiaxes','1 and '+sci(tau)],['κ₂(X)',!demo&&t>2?sci(1/tau):f(1/tau,1)])),
        panel('XᵀX / σ₁² · input basis V',chart(tau*tau,'v₁','v₂')+metrics(['Semiaxes','1 and '+sci(tau*tau)],['κ₂(XᵀX)',!demo&&t>2?sci(1/tau**2):f(1/tau**2,1)]),true))+
        note(demo?'Benchmark: τ = 0.1. Full column rank gives κ₂(XᵀX) = κ₂(X)².':'Toy design X = [[1, 1], [1, 1 + ε]], ε = '+sci(eps)+'. Full column rank gives κ₂(XᵀX) = κ₂(X)².'),`Weak axis τ is ${sci(tau)}; condition numbers are ${sci(1/tau)} and ${sci(1/tau**2)}.`);
    },{m:'benchmark'});

  const gainSigma=[6,2,.5,.1];
  scene('pre-21','Compare inverse gains and separate the noise response from the clean signal left in the residual',
    {k:4},[slider('k','Retain k channels',0,4,1)],({k})=>{
      const gains=gainSigma.map(s=>1/s), kept=gains.map((x,i)=>i<k?x:0), delta=.02, clean=.25, noise=kept[3]*delta, residual=k===4?0:clean;
      return result(grid(panel('Inverse gain · full spectrum versus retained',bars(gainSigma.map((s,i)=>withIndex('σ',i)+'='+s),kept,10,mask(k,4),gains)+
        note('Gray extent = full gain. Lime extent and numbers = retained gain.'),true),
        panel('Two consequences in the fourth channel',
          metrics(['Noise input along u₄','δ = 0.02'],['Clean target along u₄','0.25'])+
          bars(['Noise','Clean'],[noise,residual],.3)+
          note('Noise bar: coefficient error along v₄. Clean bar: omitted target magnitude along u₄.')))+
        metrics(['Largest retained gain',f(Math.max(...kept))],['Noise response',k===4?'δ/0.1 = 0.2':'0 · suppressed'],['Clean residual',k===4?'0 · fitted':'0.25 · left out']),
        'k = '+k+'. Fourth-channel noise response '+f(noise)+'; clean signal remaining in residual '+f(residual)+'.');
    },{k:3});

  function houseTrace(A,b) {
    const r=A.map(row=>row.slice()), c=b.slice(), trace=[{A:r.map(x=>x.slice()),b:c.slice()}];
    for(let j=0;j<A[0].length;j++){
      const a=r.slice(j).map(x=>x[j]), length=norm(a);
      if(!length) return trace;
      const d=a.slice();
      d[0]+=(a[0]>=0?1:-1)*length;
      const v=scale(d,1/norm(d));
      const reflect=x=>sub(x,scale(v,2*dot(v,x)));
      for(let col=j;col<A[0].length;col++){
        const updated=reflect(r.slice(j).map(row=>row[col]));
        updated.forEach((x,i)=>{r[i+j][col]=x;});
      }
      reflect(c.slice(j)).forEach((x,i)=>{c[i+j]=x;});
      trace.push({A:r.map(x=>x.slice()),b:c.slice(),a,v});
    }
    return trace;
  }

  scene('pre-25','Compare QR computation routes and follow a Householder reflector through the matrix and right-hand side',
    {m:'hh',s:0},[choice('m','Method', [['hh','Householder'],['cgs','Classical Gram–Schmidt'],['mgs','Modified Gram–Schmidt'],['givens','Givens'],['ne','Cholesky of XᵀX']]),
      steps('s','Operation frame',['0 · Start','1 · First step','2 · Second step'])],({m,s})=>{
      const A=[[3,1],[4,2],[0,2]], b=[5,4,2], trace=houseTrace(A,b), baseA=trace[s].A, baseB=trace[s].b, j=s===2?1:0;
      if(m==='hh'){
        const {a,v}=trace[j+1], p=at([270,166],s===2?46:26), a2=a.slice(0,2), w=[-v[1],v[0]], h=[-(a[0]>=0?1:-1)*norm(a),0];
        // In this fixture both active vectors have only two nonzero coordinates.
        const chart=axis(p,s===2?2.9:5.35,j?'e₂':'e₁',j?'e₃':'e₂')+
          line(p(scale(w,-(j?2.8:5))),p(scale(w,j?2.8:5)),muted,2,'6 5')+
          arrowTo(p,a2,'a',[9,-9])+arrowTo(p,h,'Ha',[-25,-9],true);
        const hit=baseA.flatMap((row,i)=>row.flatMap((_,k)=>i>=j&&k>=j?[[i,k]]:[]));
        const cue=s===0?'Start with the first column. Its reflector also updates the second column and y.':
          s===1?'The first column has zero tail. The first reflector has also changed column 2 and y.':
          'The active block moves to rows 2–3 in column 2. Apply its reflector to the same rows of y.';
        return result(grid(panel('Reflect one active column tail',svg('Householder mirror maps the selected tail to a multiple of its first axis.',chart)),
          panel(['Input','After H₁','After H₂H₁'][s],arrays(matrix(s?'Working R':'X',baseA,{hit}),matrix(s?'Transformed y':'y',col(baseB),{hit:baseB.flatMap((_,i)=>i>=j?[[i,0]]:[])}))+
            equation(s?'Apply the same H to the active columns and y':'H = I − 2vvᵀ for unit normal v'),true))+note(cue),cue);
      }
      if(m==='ne'){
        const gram=mm(trans(A),A), rhs=mv(trans(A),b), r1=Math.sqrt(gram[0][0]), r12=gram[0][1]/r1, r2=Math.sqrt(gram[1][1]-r12**2);
        const z=[rhs[0]/r1,(rhs[1]-r12*rhs[0]/r1)/r2], theta2=z[1]/r2;
        return result(grid(panel('Form the Gram matrix',arrays(matrix('XᵀX',gram),matrix('Xᵀy',col(rhs)))),
          panel(['1 · Cholesky factor','2 · Forward substitution','3 · Back substitution'][s],
            matrix(s===0?'R':s===1?'z · solves Rᵀz = Xᵀy':'θ̂ · solves Rθ̂ = z',s===0?[[r1,r12],[0,r2]]:s===1?col(z):col([(z[0]-r12*theta2)/r1,theta2])),true))+
          note('Full column rank. The exact Cholesky factor with positive diagonal agrees with the positive-diagonal QR factor; the Gram route squares the condition number.'),
          ['Computed upper factor R','Solved R transpose z','Solved R theta'][s]);
      }
      if(m==='givens'){
        const r=A.map(a=>a.slice()), c=b.slice(), turns=[[0,1],[1,2]];
        for(const [i,j] of turns.slice(0,s)){
          const k=i, d=Math.hypot(r[i][k],r[j][k]), a=r[i][k]/d, e=r[j][k]/d;
          [r[i],r[j]]=[add(scale(r[i],a),scale(r[j],e)),add(scale(r[i],-e),scale(r[j],a))];
          [c[i],c[j]]=[a*c[i]+e*c[j],-e*c[i]+a*c[j]];
        }
        return result(grid(panel('Givens · two rows per rotation',matrix('X',A)+note('First rotate rows 1–2; then rows 2–3.')),
          panel(['Original','Zero (2, 1)','Zero (3, 2)'][s],arrays(matrix(s?'Working R':'X',r),matrix('Working y',col(c))),true))+
          note('A plane rotation zeros one entry and applies to those same rows of every column and y.'),'Givens frame '+s+'.');
      }
      const [x,z]=trans(A), q=scale(x,1/norm(x)), coef=dot(q,z), residual=sub(z,scale(q,coef)), qNew=scale(residual,1/norm(residual));
      return result(grid(panel('Start with q₁ from the first column',arrays(matrix('q₁',col(q)),matrix('Second column',col(z)))),
        panel(['Project','Subtract','Normalize'][s],matrix(['(q₁ᵀx₂)q₁','Residual','q₂'][s],col([scale(q,coef),residual,qNew][s])),true))+
        note(m==='cgs'?'Classical Gram–Schmidt computes all projection coefficients from the original column.':'Modified Gram–Schmidt updates the residual after each projection. With one earlier axis both routes take the same step.'),
        'Gram–Schmidt stage '+s+'.');
    },{s:2});

  // Treat each stored double as a dyadic integer pair. Do the reference division
  // and subtraction as BigInt rationals before rounding their displayed values.
  const dbits=new DataView(new ArrayBuffer(8));
  function rational(x) {
    dbits.setFloat64(0,x);
    const bits=dbits.getBigUint64(0), exp=Number((bits>>52n)&2047n), frac=bits&((1n<<52n)-1n);
    const n=(bits>>63n?-1n:1n)*(frac+(exp?1n<<52n:0n)), shift=(exp||1)-1075;
    return x===0?[0n,1n]:shift>=0?[n<<BigInt(shift),1n]:[n,1n<<BigInt(-shift)];
  }
  const divide=([a,b],[c,d])=>[a*d,b*c];
  const difference=([a,b],[c,d])=>[a*d-b*c,b*d];
  const approx=([a,b])=>Number(a)/Number(b);
  const negate=([a,b])=>[-a,b];
  const rationalError=(x,ref)=>norm(x.map((v,j)=>approx(difference(rational(v),ref[j]))));
  const cases=[['ne','Normal equations / Cholesky'],['qr','Householder QR'],['svd','SVD · SPD 2×2']];
  scene('pre-26','Separate the changed data problem, arithmetic error, and residual in the Float64 least-squares test',
    {e:8,p:1,m:'qr'},[slider('e','−log₁₀ ε',2,17,.1),choice('p','Target perturbation',[[0,'None'],[1,'(0, 10⁻⁸)']]),choice('m','Inspect solver',cases)],({e,p,m})=>{
      const lab=window.PreliminaryWidgets.math.labCase(10**(-e),!!p);
      const {a,b,truth,effectiveEpsilon:eps}=lab;
      if(!(eps>0)){
        return result(panel('Represented matrix has rank 1',arrays(matrix('Stored A',a),matrix('Stored y',col(b)))+
          equation('Float64 rounded 1 + ε to 1; there is no unique reference solution.')+
          metrics(['Stored ε','0'],['κ₂(A)','∞']),true)+note('Increase ε to separate the two columns.'),'The stored matrix is singular.');
      }
      const ratio=divide(rational(b[1]),rational(eps)), ref=[negate(ratio),ratio], refN=ref.map(approx), change=rationalError(truth,ref);
      const rows=lab.entries.map((item,i)=>{
        const err=item.x?rationalError(item.x,ref):null;
        return {key:cases[i][0],name:item.name,err,...item};
      });
      const selected=rows.find(x=>x.key===m), fmtPair=x=>x?'('+x.map(v=>String(Number(v.toPrecision(7))).replace(/e-/,'e⁠-⁠')).join(', ')+')':'—';
      const stages=[['Original θ*',fmtPair(truth)],['Exact solution of stored inputs',fmtPair(refN)],['Computed θ̂',fmtPair(selected.x)]];
      const flow='<div class="fc-flow">'+stages.map(([k,v],i)=>`<div>${span(k,v)}${i<2?`<div class="fc-flow-arrow"><b>→</b><span>${i===0?'Change in data':'Arithmetic error'}<br>${i===0?sci(change):sci(selected.err)}</span></div>`:''}</div>`).join('')+'</div>';
      const table='<table class="fc-lab-table"><thead><tr><th scope="col">Float64 solver</th><th scope="col">Arithmetic error</th><th scope="col">Residual ‖Aθ̂ − y‖₂</th><th scope="col">Status</th></tr></thead><tbody>'+
        rows.map(x=>`<tr${x.key===m?' class="fc-selected"':''}><th scope="row">${x.key===m?'▸ ':''}${esc(x.name)}</th><td>${sci(x.err)}</td><td>${sci(x.residual)}</td><td>${esc(x.failure||'Solved')}</td></tr>`).join('')+'</tbody></table>';
      return result(panel('Three different questions about the same stored problem',flow+
        metrics(['Requested ε',sci(10**(-e))],['Stored ε = a₂₂ − 1',sci(eps)],['κ₂ of stored A',sci(lab.condition)],['Stored y','(0, '+sci(b[1])+')'],['Fixed perturbation',p?'(0, 10⁻⁸)':'None'])+table,true)+
        note('A = [[1, 1], [1, 1 + ε]]. Reference uses exact rational arithmetic on the stored entries; coordinates are displayed rounded. Residual is evaluated in Float64.'),
        selected.name+': data change '+sci(change)+', arithmetic error '+sci(selected.err)+', residual '+sci(selected.residual)+'. '+(selected.failure||'Solved.'));
    });

  // A local snapshot tool uses the same pure scene functions for print and no-JS.
  if(typeof module==='object' && module.exports) {
    module.exports={scenes};
    return;
  }
  const entries=Object.fromEntries(Object.entries(scenes).map(([id,s])=>[id,(live,api)=>{
    const state={...s.initial};
    const controls=document.createElement('div'), body=document.createElement('div'), output=api.status();
    controls.className='vr-controls fc-controls';
    body.className='fc-body';
    const draw=()=>{
      const frame=s.draw(state);
      body.innerHTML=frame.html;
      output.textContent=frame.status;
      if(id==='pre-12') controls.querySelector('input[type=range]').disabled=state.m==='benchmark';
    };
    for(const widget of s.widgets){
      controls.append(api[widget.method](...widget.args,state[widget.key],value=>{
        state[widget.key]=value;
        draw();
      }));
    }
    live.append(controls,body,output);
    draw();
  }]));
  window.LinalgVisuals.register(entries);
})();
