//<![CDATA[

/* ======================================================
   GLOBAL CONFIG
====================================================== */
const CATEGORY_MAP = {
  "Mezopotamya": "Mezopotamya",
  "Antik Mısır": "Misir",
  "Antik Çin": "Cin",
  "Ege Uygarlıkları": "Ege",
  "Antik Yunan": "Yunan",
  "Antik Roma": "Roma",
  "Tarihe Yön Veren Savaşlar": "Savaslar",
  "Türklerin Kökeni": "Turk",
  "Osmanlı Hayatı": "Osmanli"
};

/* ======================================================
   HELPERS
====================================================== */
function animateCount(el, target, duration = 1500) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ======================================================
   ARCHIVE + COUNTERS + FOOTER
====================================================== */
function fastArchiveLoader() {
  fetch('/feeds/posts/default?alt=json&max-results=150')
    .then(r => r.json())
    .then(data => {
      if (!data.feed || !data.feed.entry) return;

      const entries = data.feed.entry;
      const storage = {};
      const uniqueLabels = new Set();

      Object.values(CATEGORY_MAP).forEach(id => storage[id] = []);

      entries.forEach(entry => {
        (entry.category || []).forEach(cat => {
          uniqueLabels.add(cat.term);
          const safeId = CATEGORY_MAP[cat.term];
          if (safeId) {
            storage[safeId].push({
              title: entry.title.$t,
              url: entry.link.find(l => l.rel === 'alternate').href
            });
          }
        });
      });

      
Object.keys(storage).forEach(id => {

  // EN ESKİ → EN YENİ olacak şekilde TEK KERE sırala
  const orderedList = storage[id].slice().reverse();

  // Bölüm sayısı
  const countEl = document.getElementById('count-' + id);
  if (countEl) {
    countEl.textContent = orderedList.length + " BÖLÜM";
  }

  // Ana liste (ilk en eski)
  const listEl = document.getElementById('list-' + id);
  if (listEl) {
    listEl.innerHTML = orderedList.map((item, i) => `
      <a class="ep-item" href="${item.url}">
        <span class="ep-num">${i + 1}</span>
        <span class="ep-title">${item.title}</span>
        <span class="ep-discover">KEŞFET</span>
      </a>
    `).join('');
  }

  // Footer (ilk 6 = en eski 6)
  const footerEl = document.getElementById('flist-' + id);
  if (footerEl) {
    footerEl.innerHTML = orderedList.slice(0, 6).map(item =>
      `<li><a href="${item.url}">• ${item.title}</a></li>`
    ).join('');
  }
});


      const bolum = document.getElementById('count-bolum');
      const konu = document.getElementById('count-konu');
      if (bolum) animateCount(bolum, entries.length);
      if (konu) animateCount(konu, uniqueLabels.size);
    })
    .catch(e => console.error("Archive error:", e));
}
/* ======================================================
   OVERLAY PANEL
====================================================== */
function togglePanel(label) {
    const overlay = document.getElementById('global-overlay');
    const title = document.getElementById('overlay-label');
    const content = document.getElementById('overlay-list-content');
    if (!overlay || !title || !content) return;

    const safeId = CATEGORY_MAP[label];
    const source = document.getElementById('list-' + safeId);
    if (!source) return;

    // 1. Kaydırma pozisyonunu kaydet ve body'ye uygula
    const scrollY = window.scrollY;
    document.body.style.top = `-${scrollY}px`;
    document.body.classList.add('modal-open');

    // 2. İçeriği yükle ve göster
    title.textContent = label.toUpperCase() + " BÖLÜMLERİ";
    content.innerHTML = source.innerHTML; 
    overlay.style.display = 'flex';
}

/* ======================================================
   KAPATMA FONKSİYONU
====================================================== */
function closeArchive() {
    const overlay = document.getElementById('global-overlay');
    if (overlay) {
        overlay.style.display = 'none';

        // 1. Kaydedilen pozisyonu al
        const scrollY = document.body.style.top;
        
        // 2. Kilidi kaldır
        document.body.classList.remove('modal-open');
        document.body.style.top = '';

        // 3. Sayfayı eski yerine geri döndür
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
}

/* ======================================================
   HELPERS & BACK BUTTON
====================================================== */
// Geri dön butonu fonksiyonu
function smartBack() {
  if (document.referrer && document.referrer.indexOf(window.location.host) !== -1) {
    history.back();
  } else {
    window.location.href = "/";
  }
}

function animateCount(el, target, duration = 1500) {
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(p * target);
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ======================================================
   TOC (BU BÖLÜMDE NELER VAR)
====================================================== */
function generateTOC() {
  const body = document.getElementById('post-content') || document.querySelector('.post-body');
  const toc = document.getElementById('auto-toc');
  const list = document.getElementById('toc-content');
  if (!body || !toc || !list) return;

  const headers = body.querySelectorAll('h2, h3');
  if (!headers.length) return;

  list.innerHTML = "";
  headers.forEach((h, i) => {
    const text = h.textContent.trim();
    if (!text) return;
    const id = 'section-' + i;
    h.id = id;

    const li = document.createElement('li');
    if (h.tagName === 'H3') li.style.marginLeft = '20px';
    li.innerHTML = `<a href="#${id}">${text}</a>`;
    list.appendChild(li);
  });

  toc.style.display = 'block';
  const header = toc.querySelector('.toc-header');
  header.addEventListener('click', () => {
    toc.classList.toggle('toc-open');
    const open = toc.classList.contains('toc-open');
    list.style.display = open ? 'block' : 'none';
    list.style.maxHeight = open ? '2000px' : '0';
    list.style.opacity = open ? '1' : '0';
  });
}

/* ======================================================
   READING TIME
====================================================== */
function calculateReadingTime() {
  const content = document.getElementById('post-content');
  const el = document.getElementById('reading-time');
  if (!content || !el) return;
  const words = content.innerText.split(/\s+/).length;
  el.textContent = Math.ceil(words / 200);
}

/* ======================================================
   SMART NAV
====================================================== */
function buildSmartNav() {
  const nav = document.getElementById('custom-nav');
  if (!nav) return;

  const current = location.href.split('?')[0];
  fetch('/feeds/posts/default?alt=json&max-results=150&orderby=published')
    .then(r => r.json())
    .then(data => {
      const posts = data.feed.entry.reverse();
      const i = posts.findIndex(p =>
        p.link.find(l => l.rel === 'alternate').href.split('?')[0] === current
      );

      if (i > 0) {
        const p = posts[i - 1];
        document.getElementById('nav-prev-link').href =
          p.link.find(l => l.rel === 'alternate').href;
        document.getElementById('nav-prev-link').innerHTML = "&#8592;<br>" + p.title.$t;
        document.getElementById('nav-prev-box').style.display = 'flex';
      }

      if (i < posts.length - 1) {
        const n = posts[i + 1];
        document.getElementById('nav-next-link').href =
          n.link.find(l => l.rel === 'alternate').href;
        document.getElementById('nav-next-link').innerHTML = "&#8594;<br>" + n.title.$t;
        document.getElementById('nav-next-box').style.display = 'flex';
      }
    });
}

/* ======================================================
   RELATED POSTS
====================================================== */
function loadRelatedPosts() {
  const out = document.getElementById('related-posts-output');
  if (!out) return;

  const meta = document.querySelector('.post-meta-strip');
  if (!meta) {
    out.textContent = "Benzer içerik bulunamadı.";
    return;
  }

  const label = meta.innerText.split('|').pop().split(',')[0].trim();
  if (!label) {
    out.textContent = "Benzer içerik bulunamadı.";
    return;
  }

  fetch(`/feeds/posts/default/-/${encodeURIComponent(label)}?alt=json&max-results=5`)
    .then(r => r.json())
    .then(j => {
      const current = location.href;
      let html = "";
      (j.feed.entry || []).forEach(e => {
        const url = e.link.find(l => l.rel === 'alternate').href;
        if (url === current) return;
        html += `<a class="related-item" href="${url}">
          <div class="related-post-title">${e.title.$t}</div>
        </a>`;
      });
      out.innerHTML = html || "Benzer içerik bulunamadı.";
    });
}

/* ======================================================
   SCROLL EVENTS (SAFE)
====================================================== */
window.addEventListener('scroll', () => {
  const sc = document.documentElement.scrollTop;
  const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;

  const bar = document.getElementById('readingProgress');
  if (bar) bar.style.width = (sc / h) * 100 + "%";

  const btt = document.getElementById('backToTop');
  if (btt) btt.style.display = sc > 300 ? "flex" : "none";
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}


/* ======================================================
   INIT
====================================================== */
document.addEventListener('DOMContentLoaded', () => {
  fastArchiveLoader();
  generateTOC();
  calculateReadingTime();
  buildSmartNav();
  loadRelatedPosts();
	
	const reversePosts = () => {
    const grid = document.querySelector('.card-grid');
    if (grid && window.location.href.includes('/search/label/')) {
        const cards = Array.from(grid.querySelectorAll('.n-card'));
        if (cards.length > 0) {
            const fragment = document.createDocumentFragment();
            cards.reverse().forEach(card => fragment.appendChild(card));
            grid.innerHTML = ''; 
            grid.appendChild(fragment);
        }
        grid.style.opacity = "1";
        grid.classList.add('loaded');
    }
};

setTimeout(reversePosts, 10);

  document.addEventListener('click', e => {
    const overlay = document.getElementById('global-overlay');
    if (overlay && e.target === overlay) closeArchive();
  });
});


/* ======================================================
   HERO SLIDER SİSTEMİ (OKLAR VE OTOMATİK KAYDIRMA)
====================================================== */
let currentSlide = 0;
let slideCount = 0;
let autoSlideInterval;

function initHeroSlider() {
    const track = document.getElementById('slideTrack');
    const dotContainer = document.getElementById('sliderDots');
    if (!track) return;

    fetch('/feeds/posts/default?alt=json&max-results=20')
    .then(r => r.json())
    .then(data => {
        const rawEntries = data.feed.entry;
        if (!rawEntries) return;

        // FİLTRE: "dizin" etiketli yayını slider'a sokma
        const posts = rawEntries.filter(entry => {
            const link = entry.link.find(l => l.rel === 'alternate').href;
            const labels = entry.category ? entry.category.map(cat => cat.term) : [];
            const isDizin = labels.includes('dizin');
            return link.includes('/20') && !link.includes('/p/') && !isDizin;
        }).slice(0, 5);

        slideCount = posts.length;
        let sliderHtml = '';
        let dotsHtml = '';

        posts.forEach((post, i) => {
            const title = post.title.$t;
            const url = post.link.find(l => l.rel === 'alternate').href;
            let img = post.media$thumbnail ? post.media$thumbnail.url.replace(/\/s[0-9]+.*-c/, '/s1600') : 'https://via.placeholder.com/1600x900';
            const label = post.category ? post.category[0].term : "ARŞİV";
            const tag = (i < 2) ? "SON EKLENEN YAYIN" : "HAFTANIN POPÜLER YAYINI";

            sliderHtml += `
                <div class="slide" style="background-image: url('${img}')">
                    <div class="slide-content">
                        <span class="slide-tag">${tag}</span>
                        <span class="slide-category">${label}</span>
                        <h2 class="slide-title">${title}</h2>
                        <a href="${url}" class="slide-btn">BÖLÜMÜ KEŞFET <i class="fas fa-arrow-right"></i></a>
                    </div>
                </div>`;
            dotsHtml += `<div class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></div>`;
        });

        track.innerHTML = sliderHtml;
        dotContainer.innerHTML = dotsHtml;
        startAutoSlide();
    });
}

// GİTME FONKSİYONU (Oklar ve Dotlar bunu kullanır)
function goToSlide(index) {
    const track = document.getElementById('slideTrack');
    const dots = document.querySelectorAll('.dot');
    if(!track) return;
    
    currentSlide = index;
    track.style.transform = `translateX(-${index * 100}%)`;
    
    dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });
    
    // Manuel basıldığında süreyi sıfırla
    startAutoSlide();
}

// SONRAKİ SLIDE (Sağ Ok)
function nextSlide() {
    if (slideCount === 0) return;
    currentSlide = (currentSlide + 1) % slideCount;
    goToSlide(currentSlide);
}

// ÖNCEKİ SLIDE (Sol Ok)
function prevSlide() {
    if (slideCount === 0) return;
    currentSlide = (currentSlide - 1 + slideCount) % slideCount;
    goToSlide(currentSlide);
}

// OTOMATİK KAYDIRMA
function startAutoSlide() {
    clearInterval(autoSlideInterval);
    autoSlideInterval = setInterval(nextSlide, 7000); // 7 saniyede bir
}

// SAYFA YÜKLENDİĞİNDE BAŞLAT
document.addEventListener('DOMContentLoaded', () => {
    initHeroSlider();
});

/* ======================================================
   DOKUNMATİK KAYDIRMA (SWIPE) DESTEĞİ
====================================================== */
let touchStartX = 0;
let touchEndX = 0;

const sliderEl = document.getElementById('heroSlider');

sliderEl.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, {passive: true});

sliderEl.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, {passive: true});

function handleSwipe() {
    const swipeThreshold = 50; // Kaydırma hassasiyeti (piksel)
    if (touchStartX - touchEndX > swipeThreshold) {
        // Sola kaydırma -> Sonraki slide
        nextSlide();
    } else if (touchEndX - touchStartX > swipeThreshold) {
        // Sağa kaydırma -> Önceki slide
        prevSlide();
    }
}


//]]>
