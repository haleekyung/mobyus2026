document.addEventListener('DOMContentLoaded', () => {
    const DEFAULT_LANG = 'ko';
    let currentCategory = 'All'; // Track for re-rendering
    let currentPage = 1;

    // Safe localStorage wrapper
    const safeStorage = {
        getItem: (key) => { try { return localStorage.getItem(key); } catch (e) { return null; } },
        setItem: (key, value) => { try { localStorage.setItem(key, value); } catch (e) { } }
    };

    function getLanguage() {
        return safeStorage.getItem('preferredLanguage') || DEFAULT_LANG;
    }

    function setLanguage(lang) {
        const dicts = window.i18nData || { ko: {}, en: {} };
        const dictionary = dicts[lang];
        if (!dictionary) {
            console.error('i18nData not loaded or language not found:', lang);
            return;
        }
        
        safeStorage.setItem('preferredLanguage', lang);
        document.documentElement.lang = lang;  // ← reference.html 인라인 스크립트와 동기화
        updateContent(lang);
        updateGnbUI(lang);
        
        // Dispatch custom event for dynamic components (like the reference grid)
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
    }

    function updateContent(lang) {
        const dicts = window.i18nData;
        if (!dicts) return;
        const dictionary = dicts[lang];
        if (!dictionary) return;

        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dictionary && key in dictionary) {
                el.innerHTML = dictionary[key];
            }
        });

        // Handle data-i18n-attr (attribute translations like placeholder, title, etc.)
        const attrElements = document.querySelectorAll('[data-i18n-attr]');
        attrElements.forEach(el => {
            const attrData = el.getAttribute('data-i18n-attr');
            if (!attrData) return;
            const parts = attrData.split(':');
            if (parts.length < 2) return;
            const attr = parts[0];
            const key = parts[1];
            if (dictionary && key in dictionary) {
                el.setAttribute(attr, dictionary[key]);
            }
        });

        // Handle data-suffix translation for animated counters
        const suffixEls = document.querySelectorAll('[data-i18n-suffix]');
        suffixEls.forEach(el => {
            const key = el.getAttribute('data-i18n-suffix');
            if (key in dictionary) {
                const newSuffix = dictionary[key];
                el.setAttribute('data-suffix', newSuffix);
                const target = parseFloat(el.getAttribute('data-target'));
                if (!isNaN(target)) {
                    if (target % 1 !== 0) {
                        el.textContent = target.toFixed(1) + newSuffix;
                    } else {
                        el.textContent = Math.floor(target) + newSuffix;
                    }
                }
            }
        });
    }

    function updateGnbUI(lang) {
        const langContainer = document.querySelector('.gnb-lang');
        if (!langContainer) return;

        const links = langContainer.querySelectorAll('a');
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-lang') === lang) {
                link.classList.add('active');
            }
        });
    }

    // Export to window for global access
    window.setLanguage = setLanguage;
    window.getLanguage = getLanguage;

    // --- Smooth Anchor Scrolling (Simplified) ---
    function handleAnchorScroll() {
        const hash = window.location.hash;
        if (hash) {
            const target = document.querySelector(hash);
            if (target) {
                setTimeout(() => {
                    const headerHeight = 84; 
                    const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }, 300); 
            }
        }
    }

    // Handle initial load
    window.addEventListener('load', handleAnchorScroll);

    // Handle hash changes
    window.addEventListener('hashchange', handleAnchorScroll);

    // --- GNB Component ---
    function loadGNB() {
        const header = document.getElementById('gnb');
        if (!header) return;

        const activeLang = safeStorage.getItem('preferredLanguage') || 'ko';
        const currentPath = window.location.pathname.split('/').pop() || 'index.html';

        const mainItems = [
            { name: 'Products & Solution', link: 'products-solution.html', key: 'gnb.products' },
            { name: 'Reference', link: 'reference.html', key: 'gnb.reference' },
            { name: 'Insights', link: 'resource-guide.html', key: 'gnb.insights' },
            { name: 'About Us', link: 'aboutus.html', key: 'gnb.aboutus' }
        ];

        const contactItem = { name: 'Contact', link: 'contact.html', key: 'gnb.contact' };

        const menuHTML = mainItems.map(item => {
            let isActive = currentPath === item.link;
            const isSubmenuActive = item.submenu && item.submenu.some(sub => currentPath === sub.link);

            if (isActive || isSubmenuActive) isActive = true;
            if (item.name === 'Insights' && (currentPath === 'resource-faq.html' || currentPath === 'resource-blog.html' || currentPath === 'resource-guide.html')) {
                isActive = true;
            }

            const activeClass = isActive ? 'active' : '';

            if (item.submenu) {
                const submenuHTML = item.submenu.map(sub => {
                    const subActiveClass = currentPath === sub.link ? 'active' : '';
                    return `<li><a href="${sub.link}" class="${subActiveClass}">${sub.name}</a></li>`;
                }).join('');

                return `
                    <li class="has-submenu">
                        <a href="${item.link}" class="${activeClass}">${item.name} <i class="fas fa-chevron-down"></i></a>
                        <ul class="submenu">
                            ${submenuHTML}
                        </ul>
                    </li>`;
            }

            return `<li><a href="${item.link}" class="${activeClass}" data-i18n="${item.key}">${item.name}</a></li>`;
        }).join('');

        const isContactActive = currentPath === contactItem.link ? 'active' : '';
        const contactHTML = `<a href="${contactItem.link}" class="gnb-btn ${isContactActive}" data-i18n="${contactItem.key}">${contactItem.name}</a>`;

        const langHTML = `
            <div class="gnb-lang">
                <i class="fas fa-globe"></i>
                <a href="#" class="lang-toggle-btn" data-lang="${activeLang === 'ko' ? 'en' : 'ko'}">
                    ${activeLang === 'ko' ? 'EN' : 'KO'}
                </a>
            </div>
        `;

        header.innerHTML = `
            <div class="gnb-container">
                <div class="gnb-left">
                    <a href="index.html" class="logo">
                        <img src="images/logo_mobyus.png" alt="MOBYUS">
                    </a>
                </div>
                
                <nav class="nav-menu center-nav">
                    <ul>
                        ${menuHTML}
                    </ul>
                </nav>

                <div class="gnb-right">
                    ${langHTML}
                    ${contactHTML}
                    <button class="mobile-menu-btn" aria-label="Menu">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </div>
        `;

        attachMobileMenuEvents();
        
        // Trigger translation for newly injected content
        updateContent(getLanguage());
    }

    function attachMobileMenuEvents() {
        const header = document.getElementById('gnb');
        const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
        const navMenu = document.querySelector('.nav-menu');

        let lastScrollY = window.scrollY;

        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > 50) {
                header.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            } else {
                header.style.boxShadow = 'none';
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            }

            if (currentScrollY > lastScrollY && currentScrollY > 100) {
                header.classList.add('gnb-hidden');
                document.body.classList.add('scroll-down-mode');
            } else {
                header.classList.remove('gnb-hidden');
                document.body.classList.remove('scroll-down-mode');
            }

            lastScrollY = currentScrollY;
        };

        window.removeEventListener('scroll', handleScroll);
        window.addEventListener('scroll', handleScroll);

        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                const spans = mobileMenuBtn.querySelectorAll('span');
                if (navMenu.classList.contains('active')) {
                    spans[0].style.transform = 'rotate(45deg)';
                    spans[0].style.top = '50%';
                    spans[1].style.opacity = '0';
                    spans[2].style.transform = 'rotate(-45deg)';
                    spans[2].style.top = '50%';
                } else {
                    spans[0].style.transform = 'none';
                    spans[0].style.top = '0';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                    spans[2].style.top = 'auto';
                    spans[2].style.bottom = '0';
                }
            });
        }
    }

    // --- Case Study Data ---
    const caseStudyData = [
        { id: "ref-aut-001", category: "AUTOMOTIVE",                   tags: ["AMR", "AFL", "TAMS"],        icon: "fas fa-car-side" },
        { id: "ref-aut-002", category: "AUTOMOTIVE",                   tags: ["AMR", "TAMS"],               icon: "fas fa-gears" },
        { id: "ref-aut-003", category: "AUTOMOTIVE",                   tags: ["AMR", "TAMS"],               icon: "fas fa-plug-circle-bolt" },
        { id: "ref-bat-001", category: "BATTERY & ENERGY",             tags: ["AMR", "TAMS"],               icon: "fas fa-battery-full" },
        { id: "ref-bat-002", category: "BATTERY & ENERGY",             tags: ["AMR"],                       icon: "fas fa-car-battery" },
        { id: "ref-bat-003", category: "BATTERY & ENERGY",             tags: ["AMR", "TAMS", "WMS"],        icon: "fas fa-sun" },
        { id: "ref-bat-004", category: "BATTERY & ENERGY",             tags: ["AMR"],                       icon: "fas fa-charging-station" },
        { id: "ref-bat-005", category: "BATTERY & ENERGY",             tags: ["AMR"],                       icon: "fas fa-bolt" },
        { id: "ref-bat-006", category: "BATTERY & ENERGY",             tags: ["WMS"],                       icon: "fas fa-battery-half" },
        { id: "ref-bat-007", category: "BATTERY & ENERGY",             tags: ["WMS"],                       icon: "fas fa-flask" },
        { id: "ref-sem-001", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["TAMS"],                      icon: "fas fa-server" },
        { id: "ref-sem-002", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["AFL", "TAMS"],               icon: "fas fa-cpu" },
        { id: "ref-sem-003", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["WCS"],                       icon: "fas fa-microchip" },
        { id: "ref-sem-004", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["AMR"],                       icon: "fas fa-tv" },
        { id: "ref-sem-005", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["WMS"],                       icon: "fas fa-lightbulb" },
        { id: "ref-sem-006", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["WMS"],                       icon: "fas fa-microchip" },
        { id: "ref-sem-007", category: "SEMICONDUCTOR & ELECTRONICS",  tags: ["AFL", "TAMS", "MCS"],         icon: "fas fa-shield-halved" },
        { id: "ref-foo-001", category: "FOOD & MANUFACTURING",         tags: ["WMS", "TMS", "OMS"],         icon: "fas fa-industry" },
        { id: "ref-foo-002", category: "FOOD & MANUFACTURING",         tags: ["OMS", "WMS", "VMS"],         icon: "fas fa-industry" },
        { id: "ref-foo-003", category: "FOOD & MANUFACTURING",         tags: ["TMS"],                       icon: "fas fa-bread-slice" },
        { id: "ref-foo-004", category: "FOOD & MANUFACTURING",         tags: ["TMS"],                       icon: "fas fa-wine-bottle" },
        { id: "ref-dis-001", category: "DISTRIBUTION & FULFILLMENT",   tags: ["OMS", "WMS", "VMS"],         icon: "fas fa-store" },
        { id: "ref-dis-002", category: "DISTRIBUTION & FULFILLMENT",   tags: ["OMS", "WMS", "TMS", "VMS"], icon: "fas fa-rocket" },
        { id: "ref-dis-003", category: "DISTRIBUTION & FULFILLMENT",   tags: ["WMS", "TMS"],                icon: "fas fa-truck-fast" },
        { id: "ref-fas-001", category: "FASHION & CONSUMER GOODS",     tags: ["WMS"],                       icon: "fas fa-shirt" },
        { id: "ref-fas-002", category: "FASHION & CONSUMER GOODS",     tags: ["OMS", "WMS"],                icon: "fas fa-tshirt" },
        { id: "ref-fas-003", category: "FASHION & CONSUMER GOODS",     tags: ["WMS"],                       icon: "fas fa-shirt" }
    ];

    currentPage = 1;
    const itemsPerPage = 6;
    currentCategory = 'All';
    currentTag = null;

    // --- Utility: Count Up Animation ---
    function animateCountUp(el) {
        const target = parseFloat(el.getAttribute('data-target'));
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        const prefix = el.getAttribute('data-prefix') || '';
        const suffix = el.getAttribute('data-suffix') || '';

        function update(t) {
            const now = performance.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * easeProgress;

            if (target % 1 !== 0) {
                el.textContent = prefix + current.toFixed(1) + suffix;
            } else {
                el.textContent = prefix + Math.floor(current) + suffix;
            }

            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // --- Certifications & News (Restore) ---
    function renderCertifications() {
        const container = document.getElementById('certifications-list');
        if (!container) return;
        const certs = ["ISO 9001", "벤처인증", "특허 1", "특허 2", "기술인증", "수상내역"];
        container.innerHTML = certs.map(c => `<div class="logo-box">${c}</div>`).join('');
    }

    function renderNews() {
        const container = document.getElementById('news-list');
        if (!container) return;
        const news = [
            { date: "2026.02.01", title: "글로벌 물류 박람회 성료", link: "#" },
            { date: "2026.01.20", title: "TAMS 3.0 공식 런칭", link: "#" }
        ];
        container.innerHTML = news.map(item => `
            <div class="news-card" onclick="window.location.href='${item.link}'" style="cursor: pointer;">
                <div class="news-thumb"></div>
                <div class="news-info">
                    <span class="date">${item.date}</span>
                    <h4>${item.title}</h4>
                </div>
            </div>
        `).join('');
    }

    // --- Case Study Rendering ---
    function renderCaseStudies(filterCategory = currentCategory, page = 1) {
        const homeGrid = document.querySelector('.reference-grid-container');
        const caseGrid = document.querySelector('.case-grid');
        const filterContainer = document.querySelector('.filter-container');
        const paginationContainer = document.querySelector('.pagination-container');

        currentCategory = filterCategory;
        currentPage = page;

        if (filterContainer && filterContainer.children.length === 0) {
            const lang = localStorage.getItem('preferredLanguage') || 'ko';
            const dicts = window.i18nData || { ko: {}, en: {} };
            const dict = dicts[lang] || dicts['ko'] || {};
            
            const industryCategories = [
                { id: 'All', name: dict['reference.filter.all'] || '전체' },
                { id: 'AUTOMOTIVE', name: dict['reference.filter.auto'] || '자동차' },
                { id: 'BATTERY & ENERGY', name: dict['reference.filter.battery'] || '배터리·에너지' },
                { id: 'SEMICONDUCTOR & ELECTRONICS', name: dict['reference.filter.semi'] || '반도체·전자' },
                { id: 'FOOD & MANUFACTURING', name: dict['reference.filter.food'] || '식음료·제조' },
                { id: 'DISTRIBUTION & FULFILLMENT', name: dict['reference.filter.dist'] || '유통·풀필먼트' },
                { id: 'FASHION & CONSUMER GOODS', name: dict['reference.filter.fashion'] || '패션·소비재' }
            ];

            const tabsWrapper = document.createElement('div');
            tabsWrapper.className = 'filter-tabs';
            tabsWrapper.innerHTML = industryCategories.map(cat => `<button class="filter-tab ${cat.id === filterCategory ? 'active' : ''}" data-category="${cat.id}">${cat.name}</button>`).join('');

            tabsWrapper.querySelectorAll('.filter-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    const category = tab.getAttribute('data-category');
                    tabsWrapper.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                    tab.classList.add('active');
                    currentCategory = category;
                    currentTag = null;
                    renderCaseStudies(currentCategory, 1);
                });
            });
            filterContainer.appendChild(tabsWrapper);
        }

        if (homeGrid) {
            const lang = localStorage.getItem('preferredLanguage') || 'ko';
            const dicts = window.i18nData || { ko: {}, en: {} };
            const dict = dicts[lang] || dicts['ko'] || {};

            // 메인 홈 레퍼런스 카드: 새 케이스 2개 + 대표 기존 케이스 2개
            const homeCards = [
                { id: 'ref-aut-003', icon: 'fas fa-plug-circle-bolt', category: 'AUTOMOTIVE' },
                { id: 'ref-sem-007', icon: 'fas fa-shield-halved',    category: 'SEMICONDUCTOR & ELECTRONICS' },
                { id: 'ref-sem-001', icon: 'fas fa-server',            category: 'SEMICONDUCTOR & ELECTRONICS' },
                { id: 'ref-foo-001', icon: 'fas fa-industry',          category: 'FOOD & MANUFACTURING' }
            ];

            const itemsHtml = homeCards.map(card => {
                const title = dict[`case.${card.id}.title`] || '';
                const desc  = dict[`case.${card.id}.desc`]  || '';
                const h1    = dict[`case.${card.id}.h1`]    || '';
                const h2    = dict[`case.${card.id}.h2`]    || '';
                const highlights = [h1, h2].filter(h => h !== '');

                return `
                <a href="reference.html?filter=${encodeURIComponent(card.category)}" class="use-case-card">
                    <div class="case-img"><i class="${card.icon}"></i></div>
                    <div class="case-info">
                        <span class="case-card-category" style="color: #7C0b47; font-weight: 700;">${card.category}</span>
                        <h4 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 15px;">${title}</h4>
                        <p style="font-size: 0.95rem; color: #555; margin-bottom: 14px;">${desc}</p>
                        <div class="case-tags">
                            ${highlights.map(h => `<span class="case-meta-tag">${h}</span>`).join('')}
                        </div>
                    </div>
                </a>
            `}).join('');
            homeGrid.innerHTML = `<div class="reference-grid">${itemsHtml}</div>`;
        }

        if (caseGrid) {
            let filteredData = currentCategory === 'All' ? caseStudyData : caseStudyData.filter(item => item.category === currentCategory);
            if (currentTag) filteredData = filteredData.filter(item => item.tags && item.tags.includes(currentTag));

            const totalPages = Math.ceil(filteredData.length / itemsPerPage);
            const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            caseGrid.style.opacity = '0';
            setTimeout(() => {
                const lang = safeStorage.getItem('preferredLanguage') || 'ko';
                const dicts = window.i18nData || { ko: {}, en: {} };
                const dict = dicts[lang] || dicts['ko'] || {};

                const noResultsMessage = currentTag 
                    ? (dict['reference.no_results_with_tag'] || "<strong>'{{tag}}'</strong> 솔루션이 포함된 해당하는 사례가 없습니다.").replace('{{tag}}', currentTag)
                    : (dict['reference.no_results'] || '해당하는 사례가 없습니다.');

                caseGrid.innerHTML = paginatedData.length > 0 ? paginatedData.map(caseItem => {
                    const title = dict[`case.${caseItem.id}.title`] || '';
                    const desc = dict[`case.${caseItem.id}.desc`] || '';
                    const h1 = dict[`case.${caseItem.id}.h1`] || '';
                    const h2 = dict[`case.${caseItem.id}.h2`] || '';
                    const highlights = [h1, h2].filter(h => h !== '');

                    return `
                    <div id="${caseItem.id}" class="case-card-horizontal fade-in">
                        <div class="case-card-image"><i class="${caseItem.icon}"></i></div>
                        <div class="case-card-content">
                            <span class="case-card-category">${caseItem.category}</span>
                            <h3 class="case-card-title">${title}</h3>
                            <div class="case-tags">${caseItem.tags ? caseItem.tags.map(tag => `<span class="case-meta-tag ${tag === currentTag ? 'active' : ''}" data-tag="${tag}">${tag}</span>`).join('') : ''}</div>
                            <p class="case-card-desc">${desc}</p>
                            <div class="case-card-highlights">
                                ${highlights.map(h => `<div class="highlight-item"><svg class="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="4" ry="4"></rect><path d="M9 12l2 2 4-4"></path></svg><span>${h}</span></div>`).join('')}
                            </div>
                        </div>
                    </div>
                `}).join('') : `<p class="no-results">${noResultsMessage}</p>`;

                const handleScroll = () => {
                    const casesSection = document.getElementById('industry-cases');
                    if (casesSection) {
                        const headerHeight = 80;
                        const offset = 20;
                        const targetPosition = casesSection.getBoundingClientRect().top + window.scrollY - headerHeight - offset;
                        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    }
                };

                caseGrid.querySelectorAll('.case-meta-tag').forEach(tagEl => {
                    tagEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const tag = tagEl.getAttribute('data-tag');
                        currentTag = (currentTag === tag) ? null : tag;
                        renderCaseStudies(currentCategory, 1);
                        handleScroll();
                    });
                });

                if (paginationContainer) {
                    const lang = localStorage.getItem('preferredLanguage') || 'ko';
                    const dict = window.i18nData[lang];
                    const prevText = dict['reference.pagination.prev'] || '<i class="fas fa-arrow-left"></i> 이전';
                    const nextText = dict['reference.pagination.next'] || '다음 <i class="fas fa-arrow-right"></i>';

                    let paginationHTML = '<div class="pagination">';
                    paginationHTML += `<button class="page-btn page-arrow prev-page ${currentPage === 1 ? 'disabled' : ''}" ${currentPage === 1 ? 'disabled' : ''}>${prevText}</button>`;
                    for (let i = 1; i <= totalPages; i++) paginationHTML += `<button class="page-btn num-page ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
                    paginationHTML += `<button class="page-btn page-arrow next-page ${currentPage === totalPages ? 'disabled' : ''}" ${currentPage === totalPages ? 'disabled' : ''}>${nextText}</button></div>`;
                    paginationContainer.innerHTML = totalPages > 1 ? paginationHTML : '';

                    paginationContainer.querySelectorAll('.num-page').forEach(btn => {
                        btn.addEventListener('click', () => {
                            handleScroll();
                            renderCaseStudies(currentCategory, parseInt(btn.getAttribute('data-page')));
                        });
                    });

                    const prevBtn = paginationContainer.querySelector('.prev-page');
                    if (prevBtn && !prevBtn.classList.contains('disabled')) {
                        prevBtn.addEventListener('click', () => {
                            handleScroll();
                            renderCaseStudies(currentCategory, currentPage - 1);
                        });
                    }

                    const nextBtn = paginationContainer.querySelector('.next-page');
                    if (nextBtn && !nextBtn.classList.contains('disabled')) {
                        nextBtn.addEventListener('click', () => {
                            handleScroll();
                            renderCaseStudies(currentCategory, currentPage + 1);
                        });
                    }
                }
                caseGrid.style.transition = 'opacity 0.3s ease';
                caseGrid.style.opacity = '1';
            }, 100);
        }
    }

    // --- Stats Animation ---
    const statContainers = document.querySelectorAll('.stats-banner, .company-snapshot, .investor-snapshot, .hero-stats');
    if (statContainers.length > 0) {
        const io = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.querySelectorAll('.count-up, .stat-count, .counter').forEach(el => animateCountUp(el));
                    io.unobserve(e.target);
                }
            });
        }, { threshold: 0.2 });
        statContainers.forEach(container => io.observe(container));
    }

    // --- Init Calls ---
    try {
        const initialLang = getLanguage();
        updateContent(initialLang);
        loadGNB();
        if (document.querySelector('.case-grid') || document.querySelector('.reference-grid-container')) {
            const urlParams = new URLSearchParams(window.location.search);
            const initialFilter = urlParams.get('filter');
            renderCaseStudies(initialFilter ? initialFilter.trim() : 'All');
        }
        renderCertifications();
        renderNews();
        loadFooter();
    } catch (e) {
        console.error('Initial load failed:', e);
    }

    window.addEventListener('languageChanged', (e) => {
        const isReferencePage = !!document.querySelector('.case-grid');
        const isHomePage = !!document.querySelector('.reference-grid-container');

        // GNB 언어 버튼 active 상태를 갱신하기 위해 재렌더링
        loadGNB();

        if (isReferencePage) {
            const filterContainer = document.querySelector('.filter-container');
            if (filterContainer) filterContainer.innerHTML = '';
            // caseGrid도 비워야 카드가 새 언어로 재렌더링됨
            const caseGrid = document.querySelector('.case-grid');
            if (caseGrid) caseGrid.innerHTML = '';
            renderCaseStudies(currentCategory, currentPage);
        }

        if (isHomePage) {
            const homeGrid = document.querySelector('.reference-grid-container');
            if (homeGrid) homeGrid.innerHTML = '';
            renderCaseStudies();
        }
    });

    // Event delegation for language toggle
    document.addEventListener('click', (e) => {
        const langBtn = e.target.closest('[data-lang]');
        if (langBtn) {
            const lang = langBtn.getAttribute('data-lang');
            if (window.setLanguage) {
                window.setLanguage(lang);
                e.preventDefault();
            }
        }
    });
    


    function loadFooter() {
        const footer = document.getElementById('contact');
        if (footer) {
            footer.innerHTML = `
                <div class="container">
                    <div class="footer-content">
                        <div class="footer-info">
                            <h2>MOBYUS</h2>
                            <!-- PC Version -->
                            <div class="pc-only">
                                <p data-i18n="footer.address">서울특별시 강남구 테헤란로 326(역삼동707-27) 역삼태보아이타워 4층, 15층<br>Tel: 02-598-5838 | Email: contact@mobyus.com</p>
                                <p class="copyright">© 2026 MOBYUS. All Rights Reserved.</p>
                            </div>
                            <!-- Mobile Version -->
                            <div class="mobile-only">
                                <p class="footer-addr" data-i18n="footer.address_mobile">
                                    서울특별시 강남구 테헤란로 326(역삼동707-27)<br>
                                    역삼태보아이타워 4층, 15층<br>
                                    Tel: 02-598-5838 | Email: contact@mobyus.com
                                </p>
                                <p class="copyright">© 2026 MOBYUS. All Rights Reserved.</p>
                            </div>
                        </div>
                        <div class="footer-contact">
                            <h3 data-i18n="footer.title">Ready to Innovate?</h3>
                            <a href="contact.html" class="contact-btn" data-i18n="footer.btn">Contact Us</a>
                        </div>
                    </div>
                </div>
            `;
        }
    }
    loadFooter();

    const fadeInObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in-section').forEach(section => fadeInObserver.observe(section));

});
