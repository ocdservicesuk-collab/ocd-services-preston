(function(){
  function pad(n){
    return String(n).padStart(2,'0');
  }

  var carousel = document.querySelector('[data-ba-carousel]');

  if(carousel){
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('[data-ba-slide]'));
    var next = carousel.querySelector('[data-ba-next]');
    var current = carousel.querySelector('[data-ba-current]');
    var total = carousel.querySelector('[data-ba-total]');
    var activeIndex = 0;

    function setSplit(slide, value){
      value = Math.max(0, Math.min(100, Number(value)));
      var stage = slide.querySelector('[data-ba-stage]');
      var divider = slide.querySelector('[data-ba-divider]');

      if(stage) stage.style.setProperty('--split', value + '%');
      if(divider){
        divider.style.left = value + '%';
        divider.setAttribute('aria-valuenow', String(Math.round(value)));
      }
    }

    function splitFromPointer(slide, clientX){
      var stage = slide.querySelector('[data-ba-stage]');
      if(!stage) return;
      var rect = stage.getBoundingClientRect();
      var value = ((clientX - rect.left) / rect.width) * 100;
      setSplit(slide, value);
    }

    function setupSlide(slide){
      var stage = slide.querySelector('[data-ba-stage]');
      var divider = slide.querySelector('[data-ba-divider]');
      if(!stage || !divider) return;

      var dragging = false;

      function beginDrag(event){
        dragging = true;
        if(divider.setPointerCapture && event.pointerId !== undefined){
          try{ divider.setPointerCapture(event.pointerId); }catch(e){}
        }
        splitFromPointer(slide, event.clientX);
        event.preventDefault();
      }

      function moveDrag(event){
        if(!dragging) return;
        splitFromPointer(slide, event.clientX);
        event.preventDefault();
      }

      function endDrag(){
        dragging = false;
      }

      divider.addEventListener('pointerdown', beginDrag);
      divider.addEventListener('pointermove', moveDrag);
      divider.addEventListener('pointerup', endDrag);
      divider.addEventListener('pointercancel', endDrag);

      // Clicking or tapping anywhere on the image moves the comparison button there.
      stage.addEventListener('pointerdown', function(event){
        if(event.target === divider || divider.contains(event.target)) return;
        splitFromPointer(slide, event.clientX);
      });

      divider.addEventListener('keydown', function(event){
        var now = Number(divider.getAttribute('aria-valuenow') || 50);
        if(event.key === 'ArrowLeft'){
          setSplit(slide, now - 5);
          event.preventDefault();
        }else if(event.key === 'ArrowRight'){
          setSplit(slide, now + 5);
          event.preventDefault();
        }else if(event.key === 'Home'){
          setSplit(slide, 0);
          event.preventDefault();
        }else if(event.key === 'End'){
          setSplit(slide, 100);
          event.preventDefault();
        }
      });

      setSplit(slide, 50);
    }

    function show(index){
      if(!slides.length) return;

      activeIndex = (index + slides.length) % slides.length;

      slides.forEach(function(slide, i){
        var active = i === activeIndex;
        slide.classList.toggle('is-active', active);
        slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      });

      if(current) current.textContent = pad(activeIndex + 1);
      if(total) total.textContent = pad(slides.length);

      setSplit(slides[activeIndex], 50);

      Array.prototype.forEach.call(
        slides[activeIndex].querySelectorAll('img'),
        function(img){
          img.loading = 'eager';
          if(img.decode){ img.decode().catch(function(){}); }
        }
      );
    }

    slides.forEach(setupSlide);

    if(next){
      next.addEventListener('click', function(){
        show(activeIndex + 1);
      });
    }

    show(0);
  }

  // Mobile "More" menu
  var moreButton = document.querySelector('[data-more]');
  var moreMenu = document.querySelector('[data-menu]');

  if(moreButton && moreMenu){
    moreButton.addEventListener('click', function(){
      if(moreMenu.hasAttribute('hidden')){
        moreMenu.removeAttribute('hidden');
      }else{
        moreMenu.setAttribute('hidden','');
      }
    });

    document.addEventListener('click', function(event){
      if(
        !moreMenu.hasAttribute('hidden') &&
        !moreMenu.contains(event.target) &&
        event.target !== moreButton
      ){
        moreMenu.setAttribute('hidden','');
      }
    });
  }
})();
