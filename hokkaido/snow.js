(() => {
  'use strict';
  const canvas = document.createElement('canvas');
  canvas.className = 'snowfall'; canvas.setAttribute('aria-hidden', 'true');
  const button = document.createElement('button');
  button.className = 'snow-toggle'; button.type = 'button';
  document.body.append(canvas, button);
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) { canvas.remove(); button.remove(); return; }
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = !motion.matches;
  try { const saved = sessionStorage.getItem('hokkaido-snow'); if (saved !== null) enabled = saved === 'on'; } catch {}
  let width = 0, height = 0, flakes = [], frame = 0, last = 0, time = 0, bounds = [];
  const random = (a,b) => a + Math.random() * (b-a);
  const sprites = Array.from({length: 12}, (_,i) => {
    const s = document.createElement('canvas'); s.width = s.height = 48;
    const c = s.getContext('2d');
    // Irregular soft ice aggregates, not decorative six-point icons.
    for (let n=0; n<7; n++) {
      const x=random(17,31), y=random(17,31), r=random(3,8);
      const g=c.createRadialGradient(x,y,0,x,y,r);
      g.addColorStop(0,'rgba(255,255,253,.65)');
      g.addColorStop(.38,'rgba(248,251,252,.38)');
      g.addColorStop(1,'rgba(244,249,252,0)');
      c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
    }
    return s;
  });
  function flake(initial=false) {
    const z=Math.pow(Math.random(),1.8);
    return { x:random(-60,width+60), y:initial?random(-30,height+30):random(-80,-15),
      z, size:1.8+z*10, speed:12+z*40+random(0,9), opacity:random(.28,.64)*(1-z*.25),
      phase:random(0,Math.PI*2), flutter:random(.25,.8), spin:random(-.25,.25),
      angle:random(0,6.28), sprite:Math.floor(random(0,sprites.length)) };
  }
  function measure() {
    bounds=[...document.querySelectorAll('.photo img,header,h1,#description,#filters,.snow-toggle')]
      .map(e=>e.getBoundingClientRect()).filter(r=>r.bottom>0&&r.top<height);
  }
  function resize() {
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,1.6);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    flakes=Array.from({length:Math.min(240,Math.max(65,Math.round(width*height/6000)))},()=>flake(true));
    measure();
  }
  function labels() {
    const l=document.documentElement.lang.split('-')[0];
    const copy=({ja:['雪を止める','雪を降らせる'],zh:['暂停飘雪','开启飘雪'],en:['Pause snow','Let it snow'],ko:['눈 멈추기','눈 내리기']})[l]||['Pause snow','Let it snow'];
    button.textContent=copy[enabled?0:1];button.setAttribute('aria-pressed',String(enabled));
    document.body.classList.toggle('snow-enabled',enabled);
  }
  function allowed(){return enabled&&!document.hidden&&!document.querySelector('dialog[open]');}
  function draw(now) {
    frame=0;if(!allowed()){last=0;return;}
    const dt=Math.min((now-(last||now))/1000,.05);last=now;time+=dt;
    ctx.clearRect(0,0,width,height);
    const wind=Math.sin(time*.16)*8+Math.sin(time*.047+2)*12;
    for(let i=0;i<flakes.length;i++){
      let p=flakes[i];
      p.x+=(wind*(.35+p.z)+Math.sin(time*p.flutter+p.phase)*(3+p.z*6))*dt;
      p.y+=p.speed*dt;p.angle+=p.spin*dt;
      if(p.y>height+30){flakes[i]=flake();continue;}
      if(p.x>width+40)p.x=-30;if(p.x< -40)p.x=width+30;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);
      ctx.globalAlpha=p.opacity;
      ctx.drawImage(sprites[p.sprite],-p.size,-p.size,p.size*2,p.size*2);ctx.restore();
    }
    // Keep actual photographs and reading surfaces clear of particles.
    for(const r of bounds)ctx.clearRect(r.left-3,r.top-3,r.width+6,r.height+6);
    frame=requestAnimationFrame(draw);
  }
  function update(){labels();cancelAnimationFrame(frame);frame=0;last=0;ctx.clearRect(0,0,width,height);if(allowed())frame=requestAnimationFrame(draw);}
  button.onclick=()=>{enabled=!enabled;try{sessionStorage.setItem('hokkaido-snow',enabled?'on':'off');}catch{}update();measure();};
  addEventListener('resize',()=>{resize();update();},{passive:true});
  addEventListener('scroll',measure,{passive:true});
  document.addEventListener('visibilitychange',update);
  document.addEventListener('load',measure,true);
  motion.addEventListener('change',()=>{enabled=!motion.matches;update();});
  new MutationObserver(()=>{labels();measure();}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
  new MutationObserver(()=>{measure();update();}).observe(document.querySelector('#viewer'),{attributes:true,attributeFilter:['open']});
  new MutationObserver(measure).observe(document.querySelector('#photos'),{childList:true,subtree:true});
  resize();update();
})();

