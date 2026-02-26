const header=document.getElementById('header');window.addEventListener('scroll',()=>{header.classList.toggle('scrolled',window.scrollY>50)});
const hamburger=document.getElementById('hamburger');const nav=document.getElementById('nav');
hamburger.addEventListener('click',()=>{nav.classList.toggle('active');hamburger.classList.toggle('active')});
document.querySelectorAll('.nav-link').forEach(l=>l.addEventListener('click',()=>{nav.classList.remove('active');hamburger.classList.remove('active')}));
document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!hamburger.contains(e.target)){nav.classList.remove('active');hamburger.classList.remove('active')}});
const currentPage=window.location.pathname.split('/').pop()||'index.html';
document.querySelectorAll('.nav-link').forEach(link=>{link.classList.toggle('active',link.getAttribute('href')===currentPage)});
document.querySelectorAll('.filter-btn').forEach(btn=>{btn.addEventListener('click',()=>{document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');const filter=btn.dataset.filter;document.querySelectorAll('.portfolio-card').forEach(card=>{if(filter==='all'||card.dataset.category===filter){card.style.display='block'}else{card.style.display='none'}})})});
