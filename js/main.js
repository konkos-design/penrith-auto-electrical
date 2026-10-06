/* Penrith Auto Electrical — interactions */
(function(){
  'use strict';
  var d=document, w=window, body=d.body;
  var reduce=w.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- page load + transitions ---------- */
  w.addEventListener('load',function(){body.classList.add('loaded')});
  setTimeout(function(){body.classList.add('loaded')},1600);
  w.addEventListener('pageshow',function(e){if(e.persisted){body.classList.add('loaded');var p=d.querySelector('.pt');p&&p.classList.remove('leaving')}});
  d.addEventListener('click',function(e){
    var a=e.target.closest('a');
    if(!a||e.defaultPrevented||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank')return;
    var href=a.getAttribute('href')||'';
    if(!href||href.charAt(0)==='#'||/^(tel:|mailto:|https?:)/.test(href))return;
    if(href.indexOf('#')>0&&href.split('#')[0]===location.pathname.split('/').pop())return;
    e.preventDefault();
    var pt=d.querySelector('.pt'); if(pt) pt.classList.add('leaving');
    body.classList.remove('menu-open');
    setTimeout(function(){location.href=href},reduce?0:520);
  });

  /* ---------- header, progress, call bar ---------- */
  var header=d.querySelector('.header'), prog=d.querySelector('.progress'), callbar=d.querySelector('.callbar');
  function onScroll(){
    var y=w.scrollY||d.documentElement.scrollTop;
    if(header) header.classList.toggle('scrolled',y>20);
    var h=d.documentElement.scrollHeight-w.innerHeight;
    if(prog) prog.style.transform='scaleX('+(h>0?y/h:0)+')';
    if(callbar) callbar.classList.toggle('show',y>w.innerHeight*.6);
  }
  w.addEventListener('scroll',onScroll,{passive:true}); onScroll();

  /* ---------- burger ---------- */
  var burger=d.querySelector('.burger');
  if(burger){
    burger.addEventListener('click',function(){
      var open=body.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded',open?'true':'false');
    });
    d.addEventListener('keydown',function(e){if(e.key==='Escape'){body.classList.remove('menu-open');burger.setAttribute('aria-expanded','false')}});
  }

  /* ---------- open / closed (Sydney time) ---------- */
  var HOURS={1:[8,16.5],2:[8,16.5],3:[8,16.5],4:[8,16.5],5:[8,13],6:null,0:null};
  function sydneyNow(){
    try{
      var parts=new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',weekday:'short',hour:'numeric',minute:'numeric',hour12:false}).formatToParts(new Date());
      var o={};parts.forEach(function(p){o[p.type]=p.value});
      var map={Sun:0,Mon:1,Tue:2,Wed:3,Thu:4,Fri:5,Sat:6};
      return {day:map[o.weekday.replace('.','').slice(0,3)],h:(parseInt(o.hour,10)%24)+parseInt(o.minute,10)/60};
    }catch(err){var n=new Date();return {day:n.getDay(),h:n.getHours()+n.getMinutes()/60}}
  }
  var now=sydneyNow();
  var today=HOURS[now.day];
  var isOpen=!!(today&&now.h>=today[0]&&now.h<today[1]);
  d.querySelectorAll('[data-open-status]').forEach(function(el){
    el.classList.add(isOpen?'on':'off');
    var t=el.querySelector('span');
    if(t) t.textContent=isOpen?'Workshop open now':'Closed now · opens '+nextOpen();
  });
  function nextOpen(){
    for(var i=0;i<8;i++){
      var dd=(now.day+i)%7, hh=HOURS[dd];
      if(!hh)continue;
      if(i===0&&now.h<hh[0])return 'today 8am';
      if(i===0)continue;
      return (i===1?'tomorrow':['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dd])+' 8am';
    }
    return 'Mon 8am';
  }
  d.querySelectorAll('.hours tr[data-day]').forEach(function(tr){
    if(parseInt(tr.getAttribute('data-day'),10)===now.day) tr.classList.add('today');
  });

  /* ---------- split headings into words ---------- */
  d.querySelectorAll('.split').forEach(function(el){
    var i=0;
    function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(n){
        if(n.nodeType===3){
          var frag=d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function(part){
            if(!part)return;
            if(/^\s+$/.test(part)){frag.appendChild(d.createTextNode(' '));return}
            var s=d.createElement('span');s.className='w';
            var inner=d.createElement('span');inner.textContent=part;inner.style.setProperty('--i',i++);
            s.appendChild(inner);frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag,n);
        }else if(n.nodeType===1&&n.tagName!=='BR'){walk(n)}
      });
    }
    walk(el);
  });

  /* ---------- reveal on scroll ---------- */
  var targets=d.querySelectorAll('.rv,.split,.img-reveal,.stats,.steps,.rev-summary,.temp-gauge,[data-count]');
  if('IntersectionObserver' in w && !reduce){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        if(en.isIntersecting){
          en.target.classList.add('in');
          if(en.target.hasAttribute('data-count')) countUp(en.target);
          io.unobserve(en.target);
        }
      });
    },{threshold:.14,rootMargin:'0px 0px -6% 0px'});
    targets.forEach(function(t){io.observe(t)});
  }else{
    targets.forEach(function(t){t.classList.add('in');if(t.hasAttribute('data-count'))countUp(t)});
  }

  /* ---------- counters ---------- */
  function countUp(el){
    var end=parseFloat(el.getAttribute('data-count')), dec=(el.getAttribute('data-count').split('.')[1]||'').length;
    var suffix=el.getAttribute('data-suffix')||'', t0=null, dur=1800;
    var sup=el.querySelector('sup'); var supHTML=sup?sup.outerHTML:'';
    function fmt(v){var s=v.toFixed(dec);if(end>=1000)s=Math.round(v).toLocaleString('en-AU');return s+suffix}
    if(reduce){el.innerHTML=fmt(end)+supHTML;return}
    function step(ts){
      if(!t0)t0=ts;var p=Math.min((ts-t0)/dur,1);var e=1-Math.pow(1-p,4);
      el.innerHTML=fmt(end*e)+supHTML; if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---------- hero scope slideshow ---------- */
  var scope=d.querySelector('.scope-screen');
  if(scope){
    var imgs=scope.querySelectorAll('img'), cap=d.querySelector('.scope-cap p'), dots=d.querySelectorAll('.scope-dots i'), idx=0;
    function show(n){
      imgs.forEach(function(im,k){im.classList.toggle('on',k===n)});
      dots.forEach(function(dt,k){dt.classList.toggle('on',k===n)});
      if(cap){cap.style.opacity=0;setTimeout(function(){cap.innerHTML='<small>'+imgs[n].getAttribute('data-tag')+'</small>'+imgs[n].getAttribute('data-cap');cap.style.opacity=1},300)}
    }
    show(0);
    if(!reduce) setInterval(function(){idx=(idx+1)%imgs.length;show(idx)},4200);
  }
  /* oscilloscope wave */
  var wave=d.querySelector('.scope-wave path');
  if(wave&&!reduce){
    var ph=0;
    (function draw(){
      ph+=.06;var pts=[];
      for(var x=0;x<=400;x+=4){
        var y=35+Math.sin(x*.045+ph)*12*Math.sin(ph*.3+x*.004)+Math.sin(x*.18+ph*2.2)*3;
        if(x>180&&x<200)y-=Math.sin((x-180)/20*Math.PI)*24;
        pts.push((x===0?'M':'L')+x+' '+y.toFixed(1));
      }
      wave.setAttribute('d',pts.join(' '));
      requestAnimationFrame(draw);
    })();
  }
  /* volt meter */
  var volt=d.querySelector('[data-volt]');
  if(volt&&!reduce){
    setInterval(function(){var v=(13.9+Math.random()*.5).toFixed(1);volt.firstChild.nodeValue=v},1300);
  }

  /* ---------- ticker duplicate ---------- */
  d.querySelectorAll('.ticker-track').forEach(function(t){t.innerHTML+=t.innerHTML});

  /* ---------- button sparks ---------- */
  d.addEventListener('pointerdown',function(e){
    var b=e.target.closest('.btn');if(!b||reduce)return;
    var r=b.getBoundingClientRect();
    for(var i=0;i<8;i++){
      var s=d.createElement('i');s.className='spark';
      var ang=Math.random()*Math.PI*2,dist=24+Math.random()*30;
      s.style.left=(e.clientX-r.left-3)+'px';s.style.top=(e.clientY-r.top-3)+'px';
      s.style.setProperty('--dx',Math.cos(ang)*dist+'px');s.style.setProperty('--dy',Math.sin(ang)*dist+'px');
      b.appendChild(s);setTimeout(function(x){return function(){x.remove()}}(s),650);
    }
  });

  /* ---------- tilt cards (desktop) ---------- */
  if(w.matchMedia('(hover:hover) and (pointer:fine)').matches&&!reduce){
    d.querySelectorAll('[data-tilt]').forEach(function(c){
      c.addEventListener('pointermove',function(e){
        var r=c.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        c.style.transform='perspective(900px) rotateX('+(-y*6)+'deg) rotateY('+(x*8)+'deg) translateY(-8px)';
      });
      c.addEventListener('pointerleave',function(){c.style.transform=''});
    });
  }

  /* ---------- review filters ---------- */
  var chips=d.querySelectorAll('.chip[data-filter]');
  chips.forEach(function(ch){
    ch.addEventListener('click',function(){
      chips.forEach(function(c){c.classList.remove('on')});ch.classList.add('on');
      var f=ch.getAttribute('data-filter');
      d.querySelectorAll('.rev[data-tags]').forEach(function(r){
        var show=f==='all'||r.getAttribute('data-tags').indexOf(f)>-1;
        r.classList.toggle('hide',!show);
        if(show){r.classList.remove('in');void r.offsetWidth;r.classList.add('in')}
      });
    });
  });

  /* ---------- symptoms ---------- */
  d.querySelectorAll('.symptom').forEach(function(s){
    s.addEventListener('click',function(){var o=s.classList.toggle('open');s.setAttribute('aria-expanded',o?'true':'false')});
  });

  /* ---------- lightbox ---------- */
  var jobs=Array.prototype.slice.call(d.querySelectorAll('.job[data-full]'));
  if(jobs.length){
    var lb=d.createElement('div');lb.className='lightbox';lb.setAttribute('role','dialog');lb.setAttribute('aria-modal','true');
    lb.innerHTML='<button class="lb-btn lb-close" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg></button><button class="lb-btn lb-prev" aria-label="Previous"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 5l-7 7 7 7"/></svg></button><button class="lb-btn lb-next" aria-label="Next"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg></button><figure><img alt=""><figcaption></figcaption></figure>';
    body.appendChild(lb);
    var li=0,lbImg=lb.querySelector('img'),lbCap=lb.querySelector('figcaption');
    function open(n){li=(n+jobs.length)%jobs.length;lbImg.src=jobs[li].getAttribute('data-full');lbImg.alt=jobs[li].getAttribute('data-caption');lbCap.textContent=jobs[li].getAttribute('data-caption');lb.classList.add('on');body.style.overflow='hidden'}
    function close(){lb.classList.remove('on');body.style.overflow=''}
    jobs.forEach(function(j,k){j.addEventListener('click',function(){open(k)})});
    lb.querySelector('.lb-close').addEventListener('click',close);
    lb.querySelector('.lb-prev').addEventListener('click',function(){open(li-1)});
    lb.querySelector('.lb-next').addEventListener('click',function(){open(li+1)});
    lb.addEventListener('click',function(e){if(e.target===lb)close()});
    d.addEventListener('keydown',function(e){if(!lb.classList.contains('on'))return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')open(li-1);if(e.key==='ArrowRight')open(li+1)});
  }

  /* ---------- services index highlight ---------- */
  var idxLinks=d.querySelectorAll('.svc-index a');
  if(idxLinks.length&&'IntersectionObserver' in w){
    var so=new IntersectionObserver(function(en){
      en.forEach(function(e){
        if(e.isIntersecting){
          idxLinks.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});
        }
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    d.querySelectorAll('.svc[id]').forEach(function(s){so.observe(s)});
  }

  /* ---------- year ---------- */
  d.querySelectorAll('[data-year]').forEach(function(y){y.textContent=new Date().getFullYear()});
})();
