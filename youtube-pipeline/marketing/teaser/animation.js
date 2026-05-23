// HyperFrames Teaser Animation Timeline
window.__timelines = window.__timelines || {};

const tl = gsap.timeline({ paused: true });

// --- SETUPS ---
gsap.set(".hidden", { visibility: "hidden" });
gsap.set("#markdown-text", { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)" });
gsap.set("#scanline", { top: 0, opacity: 0 });
gsap.set("#raw-text", { y: 1080 }); // start scrolling from bottom

// Scene 2
gsap.set(".x-post", { visibility: "hidden", scale: 3, opacity: 0 });

// Scene 3
gsap.set("#scene3", { visibility: "hidden", scale: 1 });
gsap.set(".node", { opacity: 0, scale: 0 });
gsap.set(".graph-link", { strokeDashoffset: 1000 });
gsap.set(".side-panel", { x: -400, opacity: 0 });


// === SCENE 1: From Noise to Signal (0 - 3s) ===
tl.addLabel("s1", 0);

// Raw text frantic scrolling
tl.to("#raw-text", { y: -800, duration: 3, ease: "none" }, "s1");

// Fake UI click
tl.to("#s1-ui", { scale: 0.95, duration: 0.1, ease: "power2.out" }, "s1+=0.5");
tl.to("#s1-ui", { scale: 1, duration: 0.1, ease: "power2.in" }, "s1+=0.6");

// Scanline drop & Markdown reveal
tl.to("#scanline", { opacity: 1, duration: 0.1 }, "s1+=1.4");
tl.to("#scanline", { top: 880, duration: 1.0, ease: "power2.inOut" }, "s1+=1.5");
// Synchronize clipPath with scanline
tl.to("#markdown-text", { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)", duration: 1.0, ease: "power2.inOut" }, "s1+=1.5");
tl.to("#scanline", { opacity: 0, duration: 0.2 }, "s1+=2.5");

// Caption 1
tl.fromTo("#cap1", { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, "s1+=2.2");


// === SCENE 2: Community Validation (3 - 6s) ===
tl.addLabel("s2", 3);

// Push back Scene 1
tl.to("#scene1", { scale: 0.8, opacity: 0, filter: "blur(10px)", duration: 0.5, ease: "power3.inOut" }, "s2");
tl.set("#scene1", { visibility: "hidden" }, "s2+=0.5");

// X Posts cascade slams
tl.set("#scene2", { visibility: "visible" }, "s2");

const slamPost = (id, time, rot) => {
  tl.set(id, { visibility: "visible" }, time);
  tl.fromTo(id, 
    { scale: 3, opacity: 0, rotation: rot + 15, z: 500 },
    { scale: 1, opacity: 1, rotation: rot, z: 0, duration: 0.4, ease: "back.out(1.7)" },
    time
  );
};

slamPost("#xp1", "s2+=0.3", -5);
slamPost("#xp2", "s2+=0.7", 3);
slamPost("#xp3", "s2+=1.1", -2);
slamPost("#xp4", "s2+=1.5", 4);
slamPost("#xp5", "s2+=1.9", 0);

// Caption 2
tl.fromTo("#cap2", { y: 50, opacity: 0, scale: 0.9 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "power3.out" }, "s2+=2.2");


// === SCENE 3: The Ecosystem (6 - 10s) ===
tl.addLabel("s3", 6);

// Fly out Scene 2
tl.to(".x-post", { scale: 3, opacity: 0, duration: 0.4, ease: "power3.in", stagger: 0.05 }, "s3");
tl.to("#cap2", { opacity: 0, scale: 1.1, duration: 0.3 }, "s3");
tl.set("#scene2", { visibility: "hidden" }, "s3+=0.5");

// Reveal Ecosystem Graph
tl.set("#scene3", { visibility: "visible" }, "s3+=0.5");

// Main Node pops in
tl.fromTo("#main-node", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: "back.out(2)" }, "s3+=0.5");

// Surrounding Nodes pop in
tl.to(".node:not(#main-node)", { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.5)", stagger: 0.05 }, "s3+=0.8");

// Links draw themselves
tl.to(".graph-link", { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut", stagger: 0.05 }, "s3+=1.1");

// Camera pull back
tl.to("#scene3", { scale: 0.9, duration: 2.0, ease: "power1.inOut" }, "s3+=1.5");

// UI panels slide in
tl.to(".side-panel", { x: 0, opacity: 1, duration: 0.6, ease: "power3.out", stagger: 0.1 }, "s3+=1.8");

// Final Caption
tl.fromTo("#cap3", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }, "s3+=2.2");

// Register Timeline
window.__timelines["teaser"] = tl;
