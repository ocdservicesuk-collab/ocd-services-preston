
(function(){
  var pageMain = document.querySelector('main');
  var resultsSection = document.querySelector('#results');
  var servicesSection = document.querySelector('#services');
  var pricingSection = document.querySelector('#prices');
  var contactSection = document.querySelector('#contact');

  if(pageMain && resultsSection && servicesSection){
    pageMain.insertBefore(resultsSection, servicesSection);
  }

  if(pageMain && pricingSection && contactSection){
    pageMain.insertBefore(pricingSection, contactSection);
  }

  // Section order is adjusted before the page becomes interactive. Re-apply a
  // direct hash link after that move so shared URLs still land on the heading.
  if(window.location.hash){
    var directTarget = document.getElementById(window.location.hash.slice(1));
    if(directTarget){
      requestAnimationFrame(function(){
        directTarget.scrollIntoView({block:'start'});
      });
    }
  }

  var carousel = document.querySelector('[data-ba-carousel]');

  if(carousel){
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-ba-slide]'));
    var nextButtons = Array.prototype.slice.call(carousel.querySelectorAll('[data-ba-next]'));
    var activeIndex = 0;

    var holdBeforeMs = 1200;
    var revealMs = 5200;
    var holdAfterMs = 1800;

    var animationFrame = null;
    var timer = null;
    var resumeTimer = null;
    var runToken = 0;
    var idleResumeMs = 3000;
    var carouselVisible = true;

    function clearResumeTimer(){
      if(resumeTimer){
        clearTimeout(resumeTimer);
        resumeTimer = null;
      }
    }

    function cancelPlayback(){
      runToken += 1;
      if(animationFrame){
        cancelAnimationFrame(animationFrame);
        animationFrame = null;
      }
      if(timer){
        clearTimeout(timer);
        timer = null;
      }
    }

    function setSplit(slide, value){
      value = Math.max(0, Math.min(100, Number(value)));
      var stage = slide.querySelector('[data-ba-stage]');
      var divider = slide.querySelector('[data-ba-divider]');

      if(stage){
        stage.style.setProperty('--split', value + '%');
      }

      if(divider){
        divider.style.left = value + '%';
        divider.setAttribute('aria-valuenow', String(Math.round(value)));
      }
    }

    function getSplit(slide){
      var stage = slide.querySelector('[data-ba-stage]');
      if(!stage) return 50;

      var value = parseFloat(stage.style.getPropertyValue('--split'));
      return isFinite(value) ? value : 50;
    }

    function animateSplit(slide, from, to, duration, token, done){
      var start = null;

      function step(timestamp){
        if(token !== runToken) return;

        if(start === null) start = timestamp;
        var progress = Math.min(1, (timestamp - start) / duration);

        // Smoothstep: slow start, smooth movement, slow finish.
        var eased = progress * progress * (3 - 2 * progress);
        var value = from + (to - from) * eased;

        setSplit(slide, value);

        if(progress < 1){
          animationFrame = requestAnimationFrame(step);
        }else{
          animationFrame = null;
          if(done) done();
        }
      }

      animationFrame = requestAnimationFrame(step);
    }

    function showSlide(index, autoPlay){
      clearResumeTimer();
      cancelPlayback();

      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function(slide, i){
        var active = i === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      var activeSlide = slides[activeIndex];

      Array.prototype.forEach.call(
        activeSlide.querySelectorAll('img'),
        function(img){
          img.loading = 'eager';
          if(img.decode){
            img.decode().catch(function(){});
          }
        }
      );

      setSplit(activeSlide, 100);

      if(autoPlay !== false){
        startPlayback(activeSlide);
      }
    }

    function startPlayback(slide, delayMs){
      if(!carouselVisible || document.hidden) return;

      var token = runToken;
      var initialDelay = typeof delayMs === 'number' ? delayMs : holdBeforeMs;

      timer = setTimeout(function(){
        if(token !== runToken) return;

        animateSplit(slide, 100, 0, revealMs, token, function(){
          if(token !== runToken) return;

          timer = setTimeout(function(){
            if(token !== runToken) return;
            showSlide(activeIndex + 1, true);
          }, holdAfterMs);
        });
      }, initialDelay);
    }

    function schedulePlaybackResume(){
      clearResumeTimer();

      resumeTimer = setTimeout(function(){
        resumeTimer = null;
        if(document.hidden || !carouselVisible || !slides.length) return;

        cancelPlayback();
        var activeSlide = slides[activeIndex];
        setSplit(activeSlide, 100);
        startPlayback(activeSlide, 0);
      }, idleResumeMs);
    }

    slides.forEach(function(slide){
      var stage = slide.querySelector('[data-ba-stage]');
      var divider = slide.querySelector('[data-ba-divider]');
      var pointerId = null;

      if(!stage || !divider) return;

      function setFromPointer(event){
        var rect = stage.getBoundingClientRect();
        if(!rect.width) return;
        setSplit(slide, ((event.clientX - rect.left) / rect.width) * 100);
      }

      function finishDrag(event){
        if(pointerId === null || event.pointerId !== pointerId) return;

        if(event.type === 'pointerup'){
          setFromPointer(event);
        }

        if(divider.hasPointerCapture && divider.hasPointerCapture(pointerId)){
          divider.releasePointerCapture(pointerId);
        }

        pointerId = null;
        stage.classList.remove('is-dragging');
        schedulePlaybackResume();
      }

      divider.addEventListener('pointerdown', function(event){
        if(event.pointerType === 'mouse' && event.button !== 0) return;

        clearResumeTimer();
        cancelPlayback();
        pointerId = event.pointerId;
        stage.classList.add('is-dragging');

        if(divider.setPointerCapture){
          divider.setPointerCapture(pointerId);
        }

        setFromPointer(event);
        event.preventDefault();
      });

      divider.addEventListener('pointermove', function(event){
        if(pointerId === null || event.pointerId !== pointerId) return;
        setFromPointer(event);
        event.preventDefault();
      });

      divider.addEventListener('pointerup', finishDrag);
      divider.addEventListener('pointercancel', finishDrag);

      divider.addEventListener('keydown', function(event){
        var value = getSplit(slide);
        var handled = true;

        if(event.key === 'ArrowLeft') value -= 5;
        else if(event.key === 'ArrowRight') value += 5;
        else if(event.key === 'Home') value = 0;
        else if(event.key === 'End') value = 100;
        else handled = false;

        if(!handled) return;

        clearResumeTimer();
        cancelPlayback();
        setSplit(slide, value);
        schedulePlaybackResume();
        event.preventDefault();
      });
    });

    nextButtons.forEach(function(button){
      button.addEventListener('click', function(){
        showSlide(activeIndex + 1, true);
      });
    });

    // Pause the loop when the browser tab is hidden; restart cleanly on return.
    document.addEventListener('visibilitychange', function(){
      if(document.hidden){
        clearResumeTimer();
        cancelPlayback();
      }else if(carouselVisible){
        showSlide(activeIndex, true);
      }
    });

    if(slides.length){
      showSlide(0, false);

      if('IntersectionObserver' in window){
        carouselVisible = false;
        new IntersectionObserver(function(entries){
          carouselVisible = entries[0].isIntersecting;
          if(carouselVisible && !document.hidden){
            showSlide(activeIndex, true);
          }else{
            clearResumeTimer();
            cancelPlayback();
          }
        },{rootMargin:'160px 0px'}).observe(carousel);
      }else{
        carouselVisible = true;
        showSlide(0, true);
      }
    }
  }

  // Mobile "More" menu.
  var moreButton = document.querySelector('[data-more]');
  var moreMenu = document.querySelector('[data-menu]');

  if(moreButton && moreMenu){
    moreButton.addEventListener('click', function(){
      if(moreMenu.hasAttribute('hidden')){
        moreMenu.removeAttribute('hidden');
        moreButton.setAttribute('aria-expanded','true');
      }else{
        moreMenu.setAttribute('hidden','');
        moreButton.setAttribute('aria-expanded','false');
      }
    });

    document.addEventListener('click', function(event){
      if(
        !moreMenu.hasAttribute('hidden') &&
        !moreMenu.contains(event.target) &&
        event.target !== moreButton
      ){
        moreMenu.setAttribute('hidden','');
        moreButton.setAttribute('aria-expanded','false');
      }
    });

    document.addEventListener('keydown', function(event){
      if(event.key === 'Escape' && !moreMenu.hasAttribute('hidden')){
        moreMenu.setAttribute('hidden','');
        moreButton.setAttribute('aria-expanded','false');
        moreButton.focus();
      }
    });
  }
})();


/* V29 responsive navigation */
(function(){
  var toggle = document.querySelector('[data-site-menu-toggle]');
  var menu = document.querySelector('[data-site-menu]');
  var close = document.querySelector('[data-site-menu-close]');
  var lastMenuFocus = null;

  if(!toggle || !menu) return;

  function openMenu(){
    lastMenuFocus = document.activeElement;
    menu.removeAttribute('hidden');
    toggle.setAttribute('aria-expanded','true');
    document.body.style.overflow='hidden';
    if(close) close.focus();
  }

  function closeMenu(returnFocus){
    menu.setAttribute('hidden','');
    toggle.setAttribute('aria-expanded','false');
    document.body.style.overflow='';
    if(returnFocus && lastMenuFocus && lastMenuFocus.focus){
      lastMenuFocus.focus();
    }
  }

  toggle.addEventListener('click', function(){
    if(menu.hasAttribute('hidden')) openMenu();
    else closeMenu(true);
  });

  if(close) close.addEventListener('click', function(){ closeMenu(true); });

  menu.addEventListener('click', function(event){
    if(event.target === menu) closeMenu(true);
  });

  Array.prototype.forEach.call(
    menu.querySelectorAll('a[href^="#"]'),
    function(link){
      link.addEventListener('click', function(){ closeMenu(false); });
    }
  );

  document.addEventListener('keydown', function(event){
    if(event.key === 'Escape' && !menu.hasAttribute('hidden')){
      closeMenu(true);
    }

    if(event.key === 'Tab' && !menu.hasAttribute('hidden')){
      var focusable = Array.prototype.slice.call(
        menu.querySelectorAll('a[href],button:not([disabled])')
      );
      if(!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if(event.shiftKey && document.activeElement === first){
        last.focus();
        event.preventDefault();
      }else if(!event.shiftKey && document.activeElement === last){
        first.focus();
        event.preventDefault();
      }
    }
  });
})();
