// ── Slide 팩토리 ─────────────────────────────────────────────────
function createSlide(el) {
    return {
        DOM: {
            el,
            imgWrap: el.querySelector(".img_wrap"),
            img: el.querySelector(".img"),
            text: [...el.querySelectorAll(".caption h2")],
            line:    el.querySelector(".line"),
            link: el.querySelector(".link"),
        }
    };
}

// ── Navigation ───────────────────────────────────────────────────
function initNavigation() {
    const DOM = {
        ctrls: {
            prev: document.querySelector("#slideControlsPrev"),
            next: document.querySelector("#slideControlsNext"),
        },
        current: document.querySelector("#slideIndexCurrent"),
        total: document.querySelector("#slideIndexTotal"),
    };

    function updateCurrent(index) {
        DOM.current.innerHTML = index < 9 ? `${index + 1}` : `${index + 1}`;
    }

    return {DOM, updateCurrent};
}

// ── Slideshow ────────────────────────────────────────────────────
function initSlideshow(el, {onUpdateCurrent, ctrls} = {}) {
    const slideEls = [...el.querySelectorAll(".slide")];
    const slides = slideEls.map(createSlide);
    const total = slides.length;

    let current = 0;
    let isAnimating = false;

    const config = {
        clipPath: {
            initial: "inset(9% round 20px)",
            final:   "inset(7% round 20px)",
            hover:   "inset(0%)",
        }
    };

    function init() {
        slides[current].DOM.el.classList.add("current");
        gsap.set(slides[current].DOM.imgWrap, {clipPath: config.clipPath.initial});

        slides.forEach(slide => {
            slide.DOM.link.addEventListener("mouseenter", () => {
                gsap.killTweensOf(slide.DOM.imgWrap);
                gsap.to(slide.DOM.imgWrap, {duration: 1, ease: "expo", clipPath: config.clipPath.hover});
                gsap.to([ctrls.prev, ctrls.next], { duration: 0.3, opacity: 0 });
            });
            slide.DOM.link.addEventListener("mouseleave", () => {
                gsap.killTweensOf(slide.DOM.imgWrap);
                gsap.to(slide.DOM.imgWrap, {duration: 1, ease: "expo", clipPath: config.clipPath.initial});
                gsap.to([ctrls.prev, ctrls.next], { duration: 0.3, opacity: .5 });
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
            .set(upcomingSlide.DOM.imgWrap, { y: direction === "next" ? "100%" : "-100%", clipPath: config.clipPath.final }, "start")
            .set(upcomingSlide.DOM.el,      { opacity: 1 }, "start")
            .set(upcomingSlide.DOM.img,     { y: direction === "next" ? "-50%" : "50%" }, "start")
            .set(upcomingSlide.DOM.text,    { y: direction === "next" ? "100%" : "-100%" }, "start")
            .set(upcomingSlide.DOM.link,    { opacity: 0 }, "start")
            .set(upcomingSlide.DOM.line,    { opacity: 0 }, "start")          // ← 추가
            // current 슬라이드 퇴장
            .to(currentSlide.DOM.imgWrap,   { duration: 0.85, ease: "power3", clipPath: config.clipPath.final, rotation: 0.001 }, "start")
            .to(currentSlide.DOM.text,      { duration: 0.85, ease: "power3", y: direction === "next" ? "-100%" : "100%" }, "start")
            .to(currentSlide.DOM.link,      { duration: 0.4, ease: "power3", opacity: 0 }, "start")
            .to(currentSlide.DOM.line,      { duration: 0.4, ease: "power3", opacity: 0 }, "start")  // ← 추가
            // 슬라이드 이동
            .to(currentSlide.DOM.imgWrap,   { duration: 0.85, ease: "power2.inOut", y: direction === "next" ? "-100%" : "100%", rotation: 0.001 }, "start+=0.5")
            .to(currentSlide.DOM.img,       { duration: 0.85, ease: "power2.inOut", y: direction === "next" ? "50%" : "-50%" }, "start+=0.5")
            .to(upcomingSlide.DOM.imgWrap,  { duration: 0.85, ease: "power2.inOut", y: "0%", rotation: 0.001 }, "start+=0.5")
            .to(upcomingSlide.DOM.img,      { duration: 0.85, ease: "power2.inOut", y: "0%" }, "start+=0.5")
            // upcoming 슬라이드 등장
            .to(upcomingSlide.DOM.imgWrap,  { duration: 1.2, ease: "expo.inOut", clipPath: config.clipPath.initial }, "start+=1.0")
            .to(upcomingSlide.DOM.text,     { duration: 1.2, ease: "expo.inOut", y: "0%", rotation: 0.001, stagger: direction === "next" ? 0.1 : -0.1 }, "start+=0.9")
            .to(upcomingSlide.DOM.link,     { duration: 0.8, ease: "expo.in", opacity: 1 }, "start+=1.2")
            .to(upcomingSlide.DOM.line,     { duration: 0.8, ease: "expo.in", opacity: 1 }, "start+=1.2");

        onUpdateCurrent?.(current);
    }

    init();

    return {
        next: () => navigate("next"),
        prev: () => navigate("prev"),
        get current() {
            return current;
        },
        get total() {
            return total;
        },
    };
}

// ── Entry Point ──────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const nav = initNavigation();
    const slideshow = initSlideshow(document.querySelector(".slideshow"), {
        onUpdateCurrent: (index) => nav.updateCurrent(index),
        ctrls: nav.DOM.ctrls
    });
    nav.DOM.ctrls.next.addEventListener("click", () => slideshow.next());
    nav.DOM.ctrls.prev.addEventListener("click", () => slideshow.prev());

    nav.updateCurrent(slideshow.current);
    nav.DOM.total.innerHTML = slideshow.total < 10 ? `${slideshow.total}` : `${slideshow.total}`;
});

