// ── Slide 팩토리 ─────────────────────────────────────────────────
function createSlide(el) {
    return {
        DOM: {
            el,
            imgWrap: el.querySelector(".img_wrap"),
            img: el.querySelector(".img"),
            title: [...el.querySelectorAll(".caption h2")],
            desc: [...el.querySelectorAll(".caption p")],
            link: el.querySelector(".link"),
        }
    };
}

// ── Navigation ───────────────────────────────────────────────────
function initNavigation() {
    const DOM = {
        controls: {
            prev: document.querySelector("#slideControlsPrev"),
            next: document.querySelector("#slideControlsNext"),
        },
        current: document.querySelector("#slideIndexCurrent"),
        total: document.querySelector("#slideIndexTotal"),
    };

    function updateCurrent(index) {
        DOM.current.innerHTML = `${index + 1}`;
    }

    return { DOM, updateCurrent };
}

// ── Slideshow ────────────────────────────────────────────────────
function initSlideshow(el, { onUpdateCurrent, controls } = {}) {
    const slideEls = [...el.querySelectorAll(".slide")];
    const slides = slideEls.map(createSlide);
    const total = slides.length;

    let current = 0;
    let isAnimating = false;

    const config = {
        clipPath: {
            initial: "inset(9% round 10px)",
            final: "inset(7% round 10px)",
            hover: "inset(0%)",
        }
    };

    function init() {
        slides[current].DOM.el.classList.add("current");
        gsap.set(slides[current].DOM.imgWrap, { clipPath: config.clipPath.initial });

        slides.forEach(slide => {
            // p 초기 숨김 (공간 차지 안 하게)
            gsap.set(slide.DOM.desc, { opacity: 0, height: 0, marginTop: 0, overflow: "hidden" });

            slide.DOM.link.addEventListener("mouseenter", () => {
                gsap.killTweensOf(slide.DOM.imgWrap);
                gsap.killTweensOf(slide.DOM.desc);
                gsap.to(slide.DOM.imgWrap, { duration: 1, ease: "expo", clipPath: config.clipPath.hover });
                gsap.to(slide.DOM.desc, { duration: 0.5, ease: "expo.out", opacity: 1, height: "auto", marginTop: 12 });
                gsap.to([controls.prev, controls.next], { duration: 0.3, opacity: 0 });
            });

            slide.DOM.link.addEventListener("mouseleave", () => {
                gsap.killTweensOf(slide.DOM.imgWrap);
                gsap.killTweensOf(slide.DOM.desc);
                gsap.to(slide.DOM.imgWrap, { duration: 1, ease: "expo", clipPath: config.clipPath.initial });
                gsap.to(slide.DOM.desc, { duration: 0.3, ease: "power2.in", opacity: 0, height: 0, marginTop: 0 });
                gsap.to([controls.prev, controls.next], { duration: 0.3, opacity: 0.5 });
            });
        });
    }

    function navigate(direction) {
        if (isAnimating) return;
        isAnimating = true;

        const currentSlide = slides[current];

        current = direction === "next"
            ? (current < total - 1 ? current + 1 : 0)
            : (current > 0 ? current - 1 : total - 1);

        const upcomingSlide = slides[current];

        gsap.timeline({
            onStart: () => upcomingSlide.DOM.el.classList.add("current"),
            onComplete: () => {
                isAnimating = false;
                currentSlide.DOM.el.classList.remove("current");
            }
        })
            .addLabel("start", 0)
            .set(upcomingSlide.DOM.imgWrap, {
                y: direction === "next" ? "100%" : "-100%",
                clipPath: config.clipPath.final
            }, "start")
            .set(upcomingSlide.DOM.el, { opacity: 1 }, "start")
            .set(upcomingSlide.DOM.img, { y: direction === "next" ? "-50%" : "50%" }, "start")
            .set(upcomingSlide.DOM.title, { y: direction === "next" ? "100%" : "-100%" }, "start")
            .set(upcomingSlide.DOM.desc, { opacity: 0, height: 0, marginTop: 0 }, "start")
            .set(upcomingSlide.DOM.link, { opacity: 0 }, "start")
            // current 퇴장
            .to(currentSlide.DOM.imgWrap, {
                duration: 0.85, ease: "power3",
                clipPath: config.clipPath.final, rotation: 0.001
            }, "start")
            .to(currentSlide.DOM.title, {
                duration: 0.85, ease: "power3",
                y: direction === "next" ? "-100%" : "100%"
            }, "start")
            .to(currentSlide.DOM.desc, { duration: 0.3, ease: "power2.in", opacity: 0, height: 0, marginTop: 0 }, "start")
            .to(currentSlide.DOM.link, { duration: 0.4, ease: "power3", opacity: 0 }, "start")
            // 슬라이드 이동
            .to(currentSlide.DOM.imgWrap, {
                duration: 0.85, ease: "power2.inOut",
                y: direction === "next" ? "-100%" : "100%", rotation: 0.001
            }, "start+=0.5")
            .to(currentSlide.DOM.img, {
                duration: 0.85, ease: "power2.inOut",
                y: direction === "next" ? "50%" : "-50%"
            }, "start+=0.5")
            .to(upcomingSlide.DOM.imgWrap, {
                duration: 0.85, ease: "power2.inOut", y: "0%", rotation: 0.001
            }, "start+=0.5")
            .to(upcomingSlide.DOM.img, { duration: 0.85, ease: "power2.inOut", y: "0%" }, "start+=0.5")
            // upcoming 등장
            .to(upcomingSlide.DOM.imgWrap, {
                duration: 1.2, ease: "expo.inOut", clipPath: config.clipPath.initial
            }, "start+=1.0")
            .to(upcomingSlide.DOM.title, {
                duration: 1.2, ease: "expo.inOut", y: "0%", rotation: 0.001,
                stagger: direction === "next" ? 0.1 : -0.1
            }, "start+=0.9")
            .to(upcomingSlide.DOM.link, { duration: 0.8, ease: "expo.in", opacity: 1 }, "start+=1.2");

        onUpdateCurrent?.(current);
    }

    init();

    return {
        next: () => navigate("next"),
        prev: () => navigate("prev"),
        get current() { return current; },
        get total() { return total; },
    };
}

// ── Entry Point ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const mq = window.matchMedia("(min-width: 1025px)");

    let slideshow = null;
    let nav = null;

    function init() {
        nav = initNavigation();
        slideshow = initSlideshow(document.querySelector(".slideshow"), {
            onUpdateCurrent: (index) => nav.updateCurrent(index),
            controls: nav.DOM.controls
        });

        nav.DOM.controls.next.addEventListener("click", () => slideshow.next());
        nav.DOM.controls.prev.addEventListener("click", () => slideshow.prev());

        nav.updateCurrent(slideshow.current);
        nav.DOM.total.innerHTML = `${slideshow.total}`;
    }

    function destroy() {
        gsap.killTweensOf("*");

        // GSAP이 심은 인라인 스타일 전부 제거
        const slideEls = [...document.querySelectorAll(".slide")];
        slideEls.forEach(el => {
            // 슬라이드 자체
            el.removeAttribute("style");
            el.classList.remove("current");

            // 내부 요소들
            [
                el.querySelector(".img_wrap"),
                el.querySelector(".img"),
                el.querySelector(".link"),
                ...el.querySelectorAll(".caption h2"),
                ...el.querySelectorAll(".caption p"),
            ].forEach(target => target?.removeAttribute("style"));
        });

        // 네비게이션 컨트롤
        const prev = document.querySelector("#slideControlsPrev");
        const next = document.querySelector("#slideControlsNext");
        prev?.removeAttribute("style");
        next?.removeAttribute("style");

        slideshow = null;
        nav = null;
    }

    // 최초 실행
    if (mq.matches) init();

    // 창 크기 변화 대응
    mq.addEventListener("change", (e) => {
        if (e.matches) {
            init();
        } else {
            destroy();
        }
    });
});