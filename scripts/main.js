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
                if (dictionary[key] === '') {
                    el.style.display = 'none';
                } else {
                    el.style.display = '';
                    el.innerHTML = dictionary[key];
                }
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

    // --- Smooth Scroll Effect ---
    let isScrolling = false;
    let scrollTarget = window.scrollY;

    function smoothScroll() {
        if (!isScrolling) return;

        const currentScroll = window.scrollY;
        const distance = scrollTarget - currentScroll;
        const step = distance * 1.0; 

        if (Math.abs(distance) > 1) {
            window.scrollTo(0, currentScroll + step);
            requestAnimationFrame(smoothScroll);
        } else {
            isScrolling = false;
        }
    }

    window.addEventListener('scroll', () => {
        if (!isScrolling) {
            scrollTarget = window.scrollY;
        }
    });

    window.addEventListener('wheel', (e) => {
        e.preventDefault();
        scrollTarget += e.deltaY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        scrollTarget = Math.max(0, Math.min(scrollTarget, maxScroll));

        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(smoothScroll);
        }
    }, { passive: false });



    // --- Smooth Anchor Scrolling ---
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
                }, 300); // Delay to ensure GNB and other elements are loaded
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
        { id: "auto-1", category: "AUTOMOTIVE", tags: ["AMR", "AFL", "TAMS"], title: "현대자동차 글로벌 EV 생산 거점 무인화", description: "글로벌 6개국 이상의 생산 현장에서 300대 이상의 로봇을 TAMS로 통합 관제하여 혁신적인 생산 유연성을 확보했습니다.", highlights: ["단일 사이트 188대 최대 규모", "글로벌 표준 관제 시스템 구축"], icon: "fas fa-car-front", customer: "현대자동차" },
        { id: "auto-2", category: "AUTOMOTIVE", tags: ["AMR", "TAMS"], title: "현대모비스 해외 부품 공장 자동화", description: "미국 및 체코 등 해외 주요 거점에 200대 이상의 자율 주행 로봇을 도입하여 부품 공급 효율을 극대화했습니다.", highlights: ["해외 거점 200대+ 도입", "이기종 로봇 통합 제어"], icon: "fas fa-car-front", customer: "현대모비스" },
        { id: "batt-1", category: "BATTERY & ENERGY", tags: ["AMR", "TAMS"], title: "LG에너지솔루션 해외 배터리 공장 이공정 자동화", description: "폴란드와 중국 공장에 120대 이상의 AGV를 도입하여 배터리 셀 제조 공정의 물류 흐름을 자동화했습니다.", highlights: ["해외 공장 120대+ 통합 운영", "24시간 무중단 자재 공급"], icon: "fas fa-battery-charging", customer: "LG에너지솔루션" },
        { id: "batt-2", category: "BATTERY & ENERGY", tags: ["AMR"], title: "SK온 해외 배터리 생산 라인 자동화", description: "중국 및 미국 생산 거점에 85대 이상의 AMR을 도입하여 배터리 제조 공정 물류를 지능화했습니다.", highlights: ["글로벌 거점 85대+ 도입", "정밀 반송 솔루션 적용"], icon: "fas fa-car-battery", customer: "SK온" },
        { id: "batt-3", category: "BATTERY & ENERGY", tags: ["AMR", "TAMS", "WMS"], title: "한화큐셀 태양광 모듈 생산 풀스택 자동화", description: "로봇 관제(TAMS)와 창고관리시스템(WMS)을 유기적으로 결합하여 자재 입고부터 생산 투입까지 전 과정을 자동화했습니다.", highlights: ["로봇 + WMS 복합 구축", "자재 흐름 가시성 100% 확보"], icon: "fas fa-sun", customer: "한화큐셀" },
        { id: "batt-4", category: "BATTERY & ENERGY", tags: ["AMR"], title: "Verkor 배터리 기가팩토리 AMR 도입", description: "유럽 신흥 배터리 강자 Verkor의 생산 라인에 정밀 이송을 위한 AMR 솔루션을 공급했습니다.", highlights: ["유럽 기가팩토리 레퍼런스", "정밀 가이던스 기술 적용"], icon: "fas fa-charging-station", customer: "Verkor" },
        { id: "batt-5", category: "BATTERY & ENERGY", tags: ["AMR"], title: "Northvolt 배터리 생산 공정 자동화", description: "유럽 최대 배터리 제조사인 Northvolt 생산 현장에 자율 주행 로봇 솔루션을 도입했습니다.", highlights: ["유럽 핵심 배터리 제조사 공급", "글로벌 기술 경쟁력 입증"], icon: "fas fa-bolt", customer: "Northvolt" },
        { id: "semi-1", category: "SEMICONDUCTOR & ELECTRONICS", tags: ["AFL", "TAMS"], title: "삼성전자 반도체 부문 TAMS 전사 표준 채택", description: "반도체 생산 현장의 수백 대 로봇 운용을 위한 통합 관제 표준 플랫폼으로 TAMS가 채택되어 전사 확산 중입니다.", highlights: ["반도체 공정 표준 관제 채택", "확장 가능한 아키텍처 구현"], icon: "fas fa-cpu", customer: "삼성전자" },
        { id: "semi-2", category: "SEMICONDUCTOR & ELECTRONICS", tags: ["AMR"], title: "LG전자 캘리포니아 물류센터 AMR 도입", description: "미국 캘리포니아 가전 물류 거점에 자율 주행 로봇을 도입하여 피킹 및 이송 효율을 극대화했습니다.", highlights: ["북미 물류 거점 자동화", "이송 효율 대폭 개선"], icon: "fas fa-tv", customer: "LG전자" },
        { id: "semi-3", category: "SEMICONDUCTOR & ELECTRONICS", tags: ["WMS"], title: "서울반도체 LED 제조 통합 물류 관리", description: "LED 생산 및 유통 과정의 투명성을 확보하기 위한 지능형 창고 관리 시스템(WMS)을 구축했습니다.", highlights: ["재고 정확도 향상", "실시간 물류 가시성 확보"], icon: "fas fa-lightbulb", customer: "서울반도체" },
        { id: "semi-4", category: "SEMICONDUCTOR & ELECTRONICS", tags: ["WMS"], title: "세메스 반도체 장비 부품 통합 물류 고도화", description: "정밀 부품의 입출고 및 재고 관리를 위해 WMS 2차 고도화를 진행하여 반도체 장비 제조 경쟁력을 높였습니다.", highlights: ["2차 고도화 프로젝트 완료", "부품 오피킹 제로화"], icon: "fas fa-microchip", customer: "세메스" },
        { id: "food-1", category: "FOOD & MANUFACTURING", tags: ["WMS", "TMS", "OMS"], title: "하림그룹 가금류·사료 통합 물류 시스템", description: "자재 입고부터 주문, 배송까지 아우르는 통합 물류 SW 플랫폼을 구축하여 전사 운영 효율을 개선했습니다.", highlights: ["OMS·WMS·TMS 통합 구축", "신선식품 물류 체계 최적화"], icon: "fas fa-egg", customer: "하림그룹" },
        { id: "food-2", category: "FOOD & MANUFACTURING", tags: ["OMS", "WMS", "VMS"], title: "신세계푸드 전국 통합 물류 인프라", description: "전국 23개 물류 거점의 주문부터 재고까지 전 과정을 통합 관리하여 콜드체인 운영을 최적화했습니다.", highlights: ["전국 23개 센터 통합 관리", "주문-재고 실시간 연동"], icon: "fas fa-bread-slice", customer: "신세계푸드" },
        { id: "food-3", category: "FOOD & MANUFACTURING", tags: ["TMS"], title: "SPC삼립 제과·제빵 배송 최적화 시스템", description: "복잡한 배송 경로를 효율화하는 TMS 솔루션을 도입하여 물류 비용 절감 및 배송 품질을 향상시켰습니다.", highlights: ["전국 단위 배송 경로 최적화", "배송 가동률 향상"], icon: "fas fa-truck-fast", customer: "SPC그룹" },
        { id: "food-4", category: "FOOD & MANUFACTURING", tags: ["TMS"], title: "롯데칠성 음료 물류 배송 고도화", description: "대규모 음료 물량의 효율적인 운송 관리를 위한 지능형 배송 관리 시스템(TMS)을 구축했습니다.", highlights: ["대량 물동량 처리 최적화", "운송 가시성 확보"], icon: "fas fa-wine-bottle", customer: "롯데칠성" },
        { id: "dist-1", category: "DISTRIBUTION & FULFILLMENT", tags: ["OMS", "WMS", "VMS"], title: "이마트24 전국 물류 거점 통합 운영 플랫폼", description: "전국 각지의 편의점 물류 센터를 아우르는 통합 관리 시스템을 구축하여 재고 및 주문 효율을 극대화했습니다.", highlights: ["전국 DC 통합 관리", "물류 데이터 표준화"], icon: "fas fa-store", customer: "이마트24" },
        { id: "dist-4", category: "DISTRIBUTION & FULFILLMENT", tags: ["OMS", "WMS", "TMS", "VMS"], title: "우아한형제들(배민상회) 4모듈 풀스택 구축", description: "OMS, WMS, TMS, VMS 등 물류 운영에 필요한 4개 핵심 모듈을 모두 구축하여 풀필먼트 서비스를 구현했습니다.", highlights: ["4개 핵심 모듈 통합 구축", "배민상회 풀필먼트 최적화"], icon: "fas fa-rocket", customer: "우아한형제들" },
        { id: "fashion-1", category: "FASHION & CONSUMER GOODS", tags: ["WMS"], title: "F&F 패션 물류 자동화 설비 연동 고도화", description: "RFID 및 자동화 설비(Sorter, DAS 등)와 유기적으로 연동되는 WMS를 구축하여 물류 속도를 혁신했습니다.", highlights: ["자동화 설비 커스텀 연동", "1~3차 단계적 고도화 완료"], icon: "fas fa-tshirt", customer: "F&F" },
        { id: "fashion-2", category: "FASHION & CONSUMER GOODS", tags: ["OMS", "WMS"], title: "신성통상 통합 관리 및 4차 고도화", description: "전국 18개 패션 물류 거점을 아우르는 통합 시스템을 구축하여 효율적인 재고 운영 체계를 마련했습니다.", highlights: ["전국 18개 센터 통합", "4차 연속 고도화 신뢰 관계"], icon: "fas fa-shirt", customer: "신성통상" }
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
            
            const industries = [
                { id: 'auto-1', icon: 'fas fa-car-side' },
                { id: 'auto-2', icon: 'fas fa-cogs' },
                { id: 'batt-1', icon: 'fas fa-battery-full' },
                { id: 'batt-2', icon: 'fas fa-microchip' }
            ];

            const itemsHtml = industries.map(ind => {
                const title = dict[`reference.case.${ind.id}.title`] || '';
                const desc = dict[`reference.case.${ind.id}.desc`] || '';
                const customer = dict[`reference.case.${ind.id}.customer`] || '';
                const highlights = [
                    dict[`reference.case.${ind.id}.h1`] || '',
                    dict[`reference.case.${ind.id}.h2`] || ''
                ].filter(h => h !== '');

                const category = ind.id.startsWith('auto') ? 'AUTOMOTIVE' : 'BATTERY & ENERGY';

                return `
                <a href="reference.html?filter=${encodeURIComponent(category)}" class="use-case-card">
                    <div class="case-img"><i class="${ind.icon}"></i></div>
                    <div class="case-info">
                        <span class="case-card-category" style="color: #7C0b47; font-weight: 700;">${category}</span>
                        <h4 style="font-size: 1.4rem; font-weight: 700; margin-bottom: 15px;">${title}</h4>
                        <div class="case-customer-mini">${lang === 'en' ? 'Principal Customer' : '주요 고객사'}: <strong>${customer}</strong></div>
                        <p style="font-size: 0.95rem; color: #555;">${desc}</p>
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
                    const title = dict[`reference.case.${caseItem.id}.title`] || caseItem.title;
                    const desc = dict[`reference.case.${caseItem.id}.desc`] || caseItem.description;
                    const customer = dict[`reference.case.${caseItem.id}.customer`] || caseItem.customer;
                    const highlights = caseItem.highlights.map((h, idx) => dict[`reference.case.${caseItem.id}.h${idx + 1}`] || h);

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
