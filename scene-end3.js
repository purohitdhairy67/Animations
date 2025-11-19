document.addEventListener('DOMContentLoaded', function() {

    // Load SVGs
    fetch('Assets/logo-icon.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('logo-icon').innerHTML = data;
        });
    
    fetch('Assets/logo-text.svg')
        .then(response => response.text())
        .then(data => {
            document.getElementById('logo-text').innerHTML = data;
        });

    const tl = gsap.timeline();

    // Phase 1: Let Them Bid
    tl.to("#let", { opacity: 1, y: -20, duration: 0.5, ease: "power2.out" })
      .to("#them", { opacity: 1, y: -20, duration: 0.5, ease: "power2.out" }, "+=0.3") // Pause for "Them"
      .to("#bid", { opacity: 1, y: -20, duration: 0.5, ease: "power2.out" }, "+=0.3"); // Pause for "Bid"

    // Pause before phase 2
    tl.to("#phase1", { opacity: 0, duration: 0.5, ease: "power1.in" }, "+=1.5");
    
    // Phase 2: Room?
    tl.fromTo("#room", { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.7)" })
      .to("#room", { opacity: 0, scale: 1.2, duration: 0.5, ease: "power1.in" }, "+=1.5");
      
    // Phase 3: Logo reveal
    tl.to("#logo-container", { opacity: 1, duration: 1, ease: "power2.out" });

    // Logo animation
    tl.to("#logo-text", { x: "-200%", opacity: 0, duration: 1, ease: "power2.inOut" }, "+=1")
      .to("#logo-icon", { 
          x: function() {
              const container = document.getElementById('animation-container').getBoundingClientRect();
              const logo = document.getElementById('logo-icon').getBoundingClientRect();
              const logoContainer = document.getElementById('logo-container').getBoundingClientRect();
              return (container.width / 2) - (logoContainer.left + logo.width / 2);
          },
          duration: 1, 
          ease: "power2.inOut" 
      }, "-=1");

    // Logo bounce
    tl.to("#logo-icon", { scale: 1.15, duration: 0.3, ease: "power2.out" })
      .to("#logo-icon", { scale: 1, duration: 0.5, ease: "bounce.out" });

});
