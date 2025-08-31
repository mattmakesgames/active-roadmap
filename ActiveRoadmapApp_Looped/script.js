document.addEventListener('DOMContentLoaded', function(){
// Clean version: theme toggle + reveal + vertical glow fill
(function(){
  const toggle = document.getElementById('themeToggle');
  toggle.addEventListener('click', ()=>{
    document.body.classList.toggle('light');
    try { localStorage.setItem('theme', document.body.classList.contains('light') ? 'light' : 'dark'); } catch(_){}
  });
  // persist preference
  try {
    const pref = localStorage.getItem('theme');
    if(pref === 'light') document.body.classList.add('light');
  } catch(_){}

  const stages = document.querySelectorAll('.reveal');
  const glow = document.querySelector('.track-glow');
  const roadmap = document.querySelector('.roadmap');

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  }, {rootMargin: '0px 0px -10% 0px', threshold: 0.15});
  stages.forEach(s=>io.observe(s));

  function updateGlow(){
    if(!glow || !roadmap) return;
    const rect = roadmap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const start = vh * 0.6;
    const end = vh * 0.3;
    const total = (rect.height + start + end);
    const scrolled = Math.min(Math.max(start - rect.top, 0), total);
    glow.style.height = (scrolled/total*100).toFixed(2) + '%';
  }
  updateGlow();
  window.addEventListener('scroll', updateGlow, {passive:true});
  window.addEventListener('resize', updateGlow);
})();

// Improved progress calc: fill to 100% when the bottom of roadmap hits or passes viewport bottom.
(function(){
  const glow = document.querySelector('.track-glow');
  const roadmap = document.querySelector('.roadmap');

  function calcProgress(){
    if(!glow || !roadmap) return 0;
    const rect = roadmap.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;

    const start = vh * 0.6; // when glow starts
    const end = vh * 0.4;   // when we want it to finish

    const distance = rect.height + start + end;
    const advanced = Math.min(Math.max(start - rect.top, 0), distance);
    let pct = advanced / distance;

    // Force 100% when the bottom is within 1px of the viewport bottom or above
    if (rect.bottom <= vh + 1) pct = 1;

    return Math.max(0, Math.min(1, pct));
  }

  function update(){
    const p = calcProgress();
    if(glow) glow.style.height = (p*100).toFixed(2) + '%';
  }
  update();
  window.addEventListener('scroll', update, {passive:true});
  window.addEventListener('resize', update);
})();

}); // DOMContentLoaded end


// Initial pass to reveal items in view on load/resize
(function(){
  const items = document.querySelectorAll('.reveal');
  function revealInView(){
    const vh = window.innerHeight || document.documentElement.clientHeight;
    items.forEach(el=>{
      const r = el.getBoundingClientRect();
      if(r.top < vh * 0.9) el.classList.add('visible');
    });
  }
  revealInView();
  window.addEventListener('resize', revealInView);
})();

// Expand / collapse with height animation and ARIA
(function(){
  const pairs = Array.from(document.querySelectorAll('.expand-btn')).map(btn => {
    const id = btn.getAttribute('aria-controls');
    const panel = document.getElementById(id);
    return {btn, panel};
  });

  function setOpen(p, open){
    p.btn.setAttribute('aria-expanded', String(open));
    p.panel.setAttribute('aria-hidden', String(!open));
    if(open){
      p.panel.classList.add('open');
      p.panel.style.maxHeight = p.panel.scrollHeight + 'px';
    }else{
      p.panel.style.maxHeight = p.panel.scrollHeight + 'px'; // set current for transition
      requestAnimationFrame(()=>{
        p.panel.classList.remove('open');
        p.panel.style.maxHeight = '0px';
      });
    }
  }

  pairs.forEach(p => {
    p.btn.addEventListener('click', ()=>{
      const open = p.btn.getAttribute('aria-expanded') === 'true';
      setOpen(p, !open);
    });
    // start closed
    setOpen(p, false);
  });
})();

// Animated loop inside expand-panels
(function(){
  const panels = document.querySelectorAll('.expand-panel');
  const SPEED = 1200; // ms per step

  function startLoop(panel){
    if(panel.dataset.loopRunning === '1') return;
    const steps = panel.querySelectorAll('.loop-step');
    if(!steps.length) return;
    let i = 0;
    function tick(){
      steps.forEach((s,idx)=> s.classList.toggle('active', idx===i));
      i = (i + 1) % steps.length;
      panel.dataset.loopTimer = setTimeout(tick, SPEED);
    }
    panel.dataset.loopRunning = '1';
    tick();
  }
  function stopLoop(panel){
    if(panel.dataset.loopTimer){
      clearTimeout(panel.dataset.loopTimer);
      delete panel.dataset.loopTimer;
    }
    panel.dataset.loopRunning = '0';
    panel.querySelectorAll('.loop-step').forEach(s=>s.classList.remove('active'));
  }

  // Hook into existing expand buttons
  document.querySelectorAll('.expand-btn').forEach(btn=>{
    const id = btn.getAttribute('aria-controls');
    const panel = document.getElementById(id);
    btn.addEventListener('click', ()=>{
      const open = btn.getAttribute('aria-expanded') === 'true';
      // after state flips in our other handler, schedule start/stop
      setTimeout(()=>{
        const isOpenNow = btn.getAttribute('aria-expanded') === 'true';
        if(isOpenNow) startLoop(panel); else stopLoop(panel);
      }, 50);
    });
  });
})();