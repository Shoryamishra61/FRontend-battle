/**
 * QuantumCore AI - Frontend Application Script
 *
 * This script initializes all interactive and animated components of the website.
 * It follows a modular architecture to ensure scalability and maintainability.
 *
 * @version 2.0.0
 * @author Gemini AI for Frontend Battle
 * @license MIT
 */

// Strict mode helps catch common coding errors and "unsafe" actions.
"use strict";

// Main application wrapper to avoid polluting the global namespace.
const QuantumCoreApp = (function () {

    // --- 1. STATE MANAGEMENT ---
    const state = {
        isLoaded: false,
        isScrolling: false,
        theme: 'dark',
        lastScrollTop: 0,
        isPopupShown: false,
        dependencies: {
            gsap: window.gsap,
            ScrollTrigger: window.ScrollTrigger,
            Chart: window.Chart,
            Swiper: window.Swiper,
            THREE: window.THREE,
        }
    };

    // --- 2. DOM SELECTOR UTILITY ---
    const DOM = {
        select: (selector, scope = document) => scope.querySelector(selector),
        selectAll: (selector, scope = document) => [...scope.querySelectorAll(selector)],
    };

    // --- 3. EVENT BUS (Pub/Sub Pattern) ---
    // For decoupled component communication.
    const events = (function() {
        const topics = {};
        return {
            subscribe: (topic, listener) => {
                if (!topics[topic]) topics[topic] = [];
                topics[topic].push(listener);
            },
            publish: (topic, data) => {
                if (!topics[topic] || topics[topic].length < 1) return;
                topics[topic].forEach(listener => listener(data));
            }
        };
    })();

    // --- 4. CORE MODULES ---

    /**
     * Loader Module
     * Handles the pre-loading animation and transitions.
     */
    const loaderModule = (function() {
        const loader = DOM.select('#loader');
        const progressEl = DOM.select('.loader-progress');

        function updateProgress(p) {
            progressEl.textContent = `${Math.floor(p)}%`;
        }

        function onAssetsLoaded() {
            if (state.isLoaded) return;
            state.isLoaded = true;

            const tl = gsap.timeline({
                onComplete: () => {
                    loader.style.display = 'none';
                    events.publish('loader:complete');
                }
            });

            tl.to(progressEl, { opacity: 0, duration: 0.3 })
              .to(loader, {
                  opacity: 0,
                  duration: 0.8,
                  ease: 'power2.inOut'
              });
        }

        function init() {
            // Simulating load progress
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                    if (document.readyState === 'complete') {
                        onAssetsLoaded();
                    }
                }
                updateProgress(progress);
            }, 100);

            window.addEventListener('load', onAssetsLoaded);

            // Failsafe timeout
            setTimeout(onAssetsLoaded, 5000);
        }

        return { init };
    })();
    
    /**
     * Theme Module
     * Manages light/dark theme switching and persistence.
     */
    const themeModule = (function() {
        const toggleBtn = DOM.select('#theme-toggle');

        function setTheme(theme, fromClick = false) {
            state.theme = theme;
            document.documentElement.className = '';
            document.documentElement.classList.add(`${theme}-mode`);
            localStorage.setItem('QuantumCore-theme', theme);
            if(fromClick) {
                events.publish('theme:switched', { theme });
            }
        }

        function init() {
            const savedTheme = localStorage.getItem('QuantumCore-theme');
            const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            
            const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
            setTheme(initialTheme);

            toggleBtn.addEventListener('click', () => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                setTheme(newTheme, true);
            });
        }
        
        return { init };
    })();

    /**
     * UI Interactions Module
     * Handles general UI patterns like header scroll and ripple effects.
     */
    const uiModule = (function() {
        function initHeaderScroll() {
            const header = DOM.select('#header');
            ScrollTrigger.create({
                start: "top top-=" + (header.offsetHeight + 20),
                onUpdate: (self) => {
                    header.classList.toggle("hidden", self.direction === 1);
                },
            });
        }

        function initRippleEffect() {
            DOM.selectAll('.ripple-effect').forEach(button => {
                button.addEventListener('click', function(e) {
                    const circle = document.createElement('span');
                    const diameter = Math.max(this.clientWidth, this.clientHeight);
                    circle.style.width = circle.style.height = `${diameter}px`;
                    const rect = this.getBoundingClientRect();
                    circle.style.left = `${e.clientX - rect.left - diameter / 2}px`;
                    circle.style.top = `${e.clientY - rect.top - diameter / 2}px`;
                    circle.classList.add('ripple');
                    
                    const existingRipple = this.querySelector('.ripple');
                    if (existingRipple) existingRipple.remove();
                    
                    this.appendChild(circle);
                });
            });
        }
        
        function initNavLinks() {
            gsap.utils.toArray('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute('href');
                    gsap.to(window, {duration: 1.5, scrollTo: targetId, ease: 'power3.inOut'});
                });
            });
            
            // Active link highlighting on scroll
            gsap.utils.toArray('main section').forEach(section => {
                ScrollTrigger.create({
                    trigger: section,
                    start: 'top center',
                    end: 'bottom center',
                    onToggle: self => {
                        const link = DOM.select(`.nav-link[href="#${section.id}"]`);
                        if(link) link.classList.toggle('active', self.isActive);
                    }
                });
            });
        }

        function init() {
            initHeaderScroll();
            initRippleEffect();
            initNavLinks();
        }

        return { init };
    })();

    /**
     * Animations Module
     * Central hub for all GSAP-powered animations.
     */
    const animationModule = (function() {
        function initHeroAnimation() {
            const tl = gsap.timeline({ delay: 0.5 });
            tl.to('.word-reveal', {
                y: 0,
                duration: 1.2,
                stagger: 0.15,
                ease: 'power4.out',
            })
            .fromTo('[data-reveal="fade"]', 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
                "-=0.8"
            );
        }

        function initScrollTriggers() {
            // General reveal animations
            DOM.selectAll('[data-reveal="up"], [data-reveal="fade"]').forEach(el => {
                gsap.fromTo(el,
                    { opacity: 0, y: el.dataset.reveal === 'up' ? 50 : 0 },
                    {
                        opacity: 1, y: 0, duration: 1, ease: 'power3.out',
                        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
                    }
                );
            });

            // Staggered group animations
            DOM.selectAll('[data-reveal="group"]').forEach(group => {
                const targets = DOM.selectAll('.service-card, .case-study-slide, .stat-item, .graph-container', group);
                gsap.fromTo(targets,
                    { opacity: 0, y: 40 },
                    {
                        opacity: 1, y: 0, duration: 1, stagger: 0.15, ease: 'power3.out',
                        scrollTrigger: { trigger: group, start: 'top 80%', toggleActions: 'play none none reverse' }
                    }
                );
            });
        }

        function init() {
            events.subscribe('loader:complete', () => {
                initHeroAnimation();
                initScrollTriggers();
            });
        }

        return { init };
    })();
    
    /**
     * WebGL Module (Hero and Globe)
     * Handles all Three.js scenes.
     */
    const webglModule = (function() {
        
        function initHeroCanvas() {
            const container = DOM.select('#hero-webgl-canvas');
            if (!container) return;

            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            
            renderer.setSize(window.innerWidth, window.innerHeight);
            container.appendChild(renderer.domElement);

            const geometry = new THREE.IcosahedronGeometry(2, 5);
            const material = new THREE.ShaderMaterial({
                vertexShader: `
                    varying vec2 vUv;
                    void main() {
                        vUv = uv;
                        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                `,
                fragmentShader: `
                    uniform float u_time;
                    uniform vec3 u_color1;
                    uniform vec3 u_color2;
                    varying vec2 vUv;
                    
                    // 2D Perlin noise function
                    float noise(vec2 p) {
                        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                    }
                    
                    void main() {
                        vec2 uv = vUv * 5.0; // Scale UVs
                        float n = noise(uv + u_time * 0.1);
                        vec3 color = mix(u_color1, u_color2, smoothstep(0.4, 0.6, n));
                        gl_FragColor = vec4(color, 1.0);
                    }
                `,
                uniforms: {
                    u_time: { value: 0.0 },
                    u_color1: { value: new THREE.Color(0xAF52DE) }, // Purple
                    u_color2: { value: new THREE.Color(0x0A84FF) }  // Blue
                }
            });

            const sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);
            camera.position.z = 5;

            const clock = new THREE.Clock();

            function animate() {
                requestAnimationFrame(animate);
                sphere.rotation.x += 0.0005;
                sphere.rotation.y += 0.001;
                material.uniforms.u_time.value = clock.getElapsedTime();
                renderer.render(scene, camera);
            }

            animate();
            
            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
        }
        
        function initInteractiveGlobe() {
            const container = DOM.select('#globe-container');
            if (!container) return;
            // ... (A full Three.js globe implementation would be several hundred lines)
            // This is a placeholder for that complexity.
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
            const sphereMat = new THREE.MeshBasicMaterial({ color: 0x0A84FF, wireframe: true });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            scene.add(sphere);

            camera.position.z = 3;
            function animate() {
                requestAnimationFrame(animate);
                sphere.rotation.y += 0.002;
                renderer.render(scene, camera);
            }
            animate();
            
            window.addEventListener('resize', () => {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });
        }

        function init() {
            initHeroCanvas();
            initInteractiveGlobe();
        }

        return { init };
    })();

    /**
     * Components Module
     * Initializes complex UI components like carousels and charts.
     */
    const componentsModule = (function() {

        function initCaseStudyCarousel() {
            try {
                new Swiper('.case-study-swiper', {
                    loop: true,
                    effect: 'slide',
                    slidesPerView: 1,
                    spaceBetween: 30,
                    navigation: {
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    },
                    pagination: {
                        el: '.swiper-pagination',
                        clickable: true,
                    },
                    breakpoints: {
                        768: {
                            slidesPerView: 2,
                        },
                        1024: {
                            slidesPerView: 3,
                        }
                    }
                });
            } catch(e) { console.error("Swiper init failed:", e); }
        }

        function initStatsCounters() {
            DOM.selectAll('.stat-number').forEach(statNum => {
                const endValue = parseFloat(statNum.dataset.target);
                const decimals = statNum.dataset.decimals ? parseInt(statNum.dataset.decimals) : 0;
                
                gsap.from(statNum, {
                    textContent: 0,
                    duration: 3,
                    ease: 'power3.out',
                    snap: { textContent: 1 },
                    scrollTrigger: {
                        trigger: statNum,
                        start: 'top 90%',
                        toggleActions: 'play none none reverse',
                        onUpdate: self => {
                            const val = gsap.utils.interpolate(0, endValue, self.progress);
                            statNum.textContent = val.toFixed(decimals);
                        }
                    },
                });
            });
        }

        function initImpactChart() {
            const canvas = DOM.select('#performance-chart');
            if(!canvas) return;

            const chartData = {
                efficiency: {
                    labels: ['2021', '2022', '2023', '2024', '2025'],
                    data: [28, 45, 62, 78, 95],
                    label: "Computational Efficiency"
                },
                adoption: {
                    labels: ['2021', '2022', '2023', '2024', '2025'],
                    data: [15, 35, 75, 110, 150],
                    label: "Enterprise Deployments"
                }
            };
            
            const ctx = canvas.getContext('2d');
            const gradient = ctx.createLinearGradient(0, 0, 0, 400);
            gradient.addColorStop(0, 'rgba(10, 132, 255, 0.5)');
            gradient.addColorStop(1, 'rgba(10, 132, 255, 0)');
            
            const impactChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.efficiency.labels,
                    datasets: [{
                        label: chartData.efficiency.label,
                        data: chartData.efficiency.data,
                        fill: true,
                        backgroundColor: gradient,
                        borderColor: '#0A84FF',
                        tension: 0.4,
                        pointRadius: 5,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#fff'
                    }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: 'rgba(128,128,128,0.1)' } },
                        x: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });

            // Chart filtering logic
            DOM.selectAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    DOM.selectAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    const filter = btn.dataset.filter;
                    const newData = chartData[filter];
                    impactChart.data.labels = newData.labels;
                    impactChart.data.datasets[0].data = newData.data;
                    impactChart.data.datasets[0].label = newData.label;
                    impactChart.update();
                });
            });
        }

        function init() {
            initCaseStudyCarousel();
            initStatsCounters();
            initImpactChart();
        }
        
        return { init };
    })();

    /**
     * Popup Module
     * Handles the scroll-triggered promotional popup.
     */
    const popupModule = (function() {
        const popup = DOM.select('#scroll-popup');
        
        function showPopup() {
            if (state.isPopupShown) return;
            popup.classList.add('visible');
            sessionStorage.setItem('QuantumCore-popup', 'true');
            state.isPopupShown = true;
        }

        function hidePopup() {
            popup.classList.remove('visible');
        }

        function init() {
            if (!popup) return;
            
            if (sessionStorage.getItem('QuantumCore-popup')) {
                state.isPopupShown = true;
                return;
            }

            ScrollTrigger.create({
                trigger: '#impact',
                start: 'top center',
                onEnter: showPopup,
                once: true
            });

            DOM.select('.popup-close').addEventListener('click', hidePopup);
            DOM.select('.popup-cta').addEventListener('click', hidePopup);
        }

        return { init };
    })();


    // --- 5. GLOBAL INITIALIZER ---
    function init() {
        // Check for dependencies first
        const missing = Object.keys(state.dependencies).filter(key => !state.dependencies[key]);
        if (missing.length > 0) {
            console.error(`Fatal Error: Missing required libraries: ${missing.join(', ')}`);
            return;
        }
        
        gsap.registerPlugin(ScrollTrigger);
        gsap.config({ nullTargetWarn: false });

        // Initialize all modules
        try {
            loaderModule.init();
            themeModule.init();
            uiModule.init();
            animationModule.init();
            webglModule.init();
            componentsModule.init();
            popupModule.init();
        } catch (e) {
            console.error("Initialization failed:", e);
        }
    }

    return {
        init: init
    };

})();

// Run the application
document.addEventListener('DOMContentLoaded', QuantumCoreApp.init);
