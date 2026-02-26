// Language Switcher - Translate feature for ID, EN, JP
const translations = {
  nav: {
    id: {home:'Home',about:'About',portfolio:'Portfolio',publications:'Publications',certificates:'Certificates',contact:'Contact'},
    en: {home:'Home',about:'About',portfolio:'Portfolio',publications:'Publications',certificates:'Certificates',contact:'Contact'},
    jp: {home:'ホーム',about:'経歴',portfolio:'ポートフォリオ',publications:'出版物',certificates:'証明書',contact:'お問い合わせ'}
  },
  langLabels: {id:'ID',en:'EN',jp:'JP'},
  langNames: {id:'Indonesia',en:'English',jp:'日本語'}
};

function initLangSwitcher() {
  const switcher = document.querySelector('.lang-switcher');
  if (!switcher) return;
  const btn = switcher.querySelector('.lang-btn');
  const dropdown = switcher.querySelector('.lang-dropdown');
  const options = switcher.querySelectorAll('.lang-option');
  const currentLang = localStorage.getItem('siteLang') || 'id';

  function setLang(lang) {
    localStorage.setItem('siteLang', lang);
    document.documentElement.lang = lang === 'jp' ? 'ja' : lang;
    const label = btn.querySelector('.lang-label');
    if (label) label.textContent = translations.langLabels[lang];
    options.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.lang === lang);
    });
    // Translate nav links
    const navLinks = document.querySelectorAll('.nav-link');
    const navTr = translations.nav[lang];
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href.includes('index')) link.textContent = navTr.home;
      else if (href.includes('about')) link.textContent = navTr.about;
      else if (href.includes('portfolio') && !href.includes('publications')) link.textContent = navTr.portfolio;
      else if (href.includes('publications')) link.textContent = navTr.publications;
      else if (href.includes('certificates')) link.textContent = navTr.certificates;
      else if (href.includes('contact')) link.textContent = navTr.contact;
    });
    // Translate data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.dataset.i18n;
      const parts = key.split('.');
      let val = translations;
      for (const p of parts) { val = val && val[p]; }
      if (val && val[lang]) el.textContent = val[lang];
    });
    switcher.classList.remove('open');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    switcher.classList.toggle('open');
  });

  options.forEach(opt => {
    opt.addEventListener('click', () => setLang(opt.dataset.lang));
  });

  document.addEventListener('click', () => switcher.classList.remove('open'));
  setLang(currentLang);
}

document.addEventListener('DOMContentLoaded', initLangSwitcher);
