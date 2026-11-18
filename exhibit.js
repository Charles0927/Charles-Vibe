(() => {
  const grid=document.querySelector('#gallery-grid');
  if(!grid)return;
  const words={
    zh:['漫游','底片总览','慢一点，看见更多。','上一帧','下一帧','放大观看','← → 切换 · 点击照片放大','私人影像档案'],
    en:['Wander','Contact sheet','Stay a little longer.','Previous frame','Next frame','View photograph','← → Navigate · Select to enlarge','A personal photographic archive'],
    ja:['めぐる','コンタクトシート','少し、立ち止まる。','前の一枚','次の一枚','写真を拡大','← → 切り替え · 写真を選んで拡大','個人の写真アーカイブ'],
    ko:['산책','전체 필름','조금 더 머물러 보세요.','이전 사진','다음 사진','사진 확대','← → 이동 · 사진을 눌러 확대','개인 사진 아카이브']
  };
  const bar=document.createElement('div');bar.className='exhibit-bar';
  const modes=document.createElement('div');modes.className='exhibit-modes';
  const wander=document.createElement('button'),sheet=document.createElement('button');
  wander.type=sheet.type='button';modes.append(wander,sheet);
  const note=document.createElement('p');bar.append(modes,note);
  const stage=document.createElement('section');stage.className='exhibit-stage';stage.tabIndex=0;
  const mount=document.createElement('button');mount.className='exhibit-mount';mount.type='button';
  const img=document.createElement('img');img.decoding='async';mount.append(img);
  const side=document.createElement('div');side.className='exhibit-caption';
  const number=document.createElement('span');number.className='exhibit-number';number.setAttribute('aria-hidden','true');
  const title=document.createElement('h3'),meta=document.createElement('p');
  const nav=document.createElement('div');nav.className='exhibit-nav';
  const prev=document.createElement('button'),next=document.createElement('button');prev.type=next.type='button';prev.textContent='←';next.textContent='→';
  const count=document.createElement('span');count.setAttribute('aria-live','polite');nav.append(prev,count,next);
  const hint=document.createElement('p');hint.className='exhibit-hint';
  side.append(number,title,meta,nav,hint);stage.append(mount,side);
  const rail=document.createElement('div');rail.className='exhibit-rail';
  grid.before(bar,stage,rail);
  let cards=[],index=0,shownIndex=0,mode='wander',timer,sequence=0;
  const lang=()=>document.documentElement.lang.split('-')[0];
  const keys=["exhibitWander","exhibitSheet","exhibitNote","exhibitPrevious","exhibitNext","exhibitEnlarge","exhibitHint","exhibitArchive"];
  const w=()=>keys.map((k,i)=>window.siteContent?.labels?.[lang()]?.[k]||(words[lang()]||words.en)[i]);
  function labels(){
    const a=w();wander.textContent=a[0];sheet.textContent=a[1];note.textContent=a[2];
    prev.setAttribute('aria-label',a[3]);next.setAttribute('aria-label',a[4]);mount.setAttribute('aria-label',a[5]);
    hint.textContent=a[6];stage.setAttribute('aria-label',a[7]);
    wander.setAttribute('aria-pressed',String(mode==='wander'));sheet.setAttribute('aria-pressed',String(mode==='sheet'));
  }
  function display(n,animate=true){
    const token=++sequence;
    if(!cards.length)return;
    index=(n+cards.length)%cards.length;
    const card=cards[index],source=card.querySelector('img');
    if(animate)stage.classList.add('is-fading');
    const apply=()=>{
      if(token!==sequence)return;
      img.src=source.src;img.alt=source.alt;shownIndex=index;
      title.textContent=card.querySelector('strong')?.textContent||'';
      meta.textContent=document.querySelector('#collection-title').textContent;
      number.textContent=String(index+1).padStart(2,'0');
      count.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
      stage.classList.toggle('is-polaroid',card.classList.contains('is-polaroid'));
      rail.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===index));b.tabIndex=i===index?0:-1;});
      stage.classList.remove('is-fading');
      const active=rail.children[index];if(active){const x=active.offsetLeft-rail.offsetLeft-rail.clientWidth/2+active.clientWidth/2;rail.scrollTo({left:x,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
    };
    const preload=new Image();preload.src=source.src;
    Promise.all([preload.decode().catch(()=>{}),new Promise(r=>timer=setTimeout(r,animate&&!matchMedia('(prefers-reduced-motion: reduce)').matches?260:0))]).then(apply);
  }
  function layout(){
    const has=cards.length>0;
    stage.hidden=rail.hidden=!has||mode!=='wander';
    grid.hidden=has&&mode==='wander';bar.hidden=!has;
    grid.classList.toggle('contact-sheet',mode==='sheet');labels();
  }
  function rebuild(){
    cards=[...grid.querySelectorAll('.gallery-card')];index=0;
    rail.replaceChildren(...cards.map((c,i)=>{
      const b=document.createElement('button');b.type='button';const thumb=document.createElement('img');
      thumb.src=c.querySelector('img').src;thumb.alt='';thumb.loading='lazy';
      const label=document.createElement('span');label.textContent=String(i+1).padStart(2,'0');
      b.setAttribute('aria-label',(c.querySelector('strong')?.textContent||w()[5])+' · '+(i+1));
      b.append(thumb,label);b.onclick=()=>display(i);return b;
    }));layout();display(0,false);
    prev.disabled=next.disabled=cards.length<2;
  }
  wander.onclick=()=>{mode='wander';layout();};sheet.onclick=()=>{mode='sheet';layout();};
  prev.onclick=()=>display(index-1);next.onclick=()=>display(index+1);
  mount.onclick=()=>cards[shownIndex]?.click();
  function handleKeys(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();display(index+(e.key==='ArrowLeft'?-1:1));}}
  stage.addEventListener('keydown',handleKeys);rail.addEventListener('keydown',handleKeys);
  let start=null,swiped=false;
  mount.addEventListener('touchstart',e=>{start={x:e.touches[0].clientX,y:e.touches[0].clientY};swiped=false;},{passive:true});
  mount.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start.x,dy=e.changedTouches[0].clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4){swiped=true;display(index+(dx<0?1:-1));}start=null;},{passive:true});
  mount.addEventListener('click',e=>{if(swiped){e.preventDefault();e.stopImmediatePropagation();swiped=false;}},true);
  new MutationObserver(rebuild).observe(grid,{childList:true});
  new MutationObserver(labels).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  rebuild();
})();
