(() => {
  const COURSES = [
    {
      year: '2020',
      items: [{ title: 'Направленная костная регенерация', author: 'Евгений Барисов' }],
    },
    {
      year: '2021',
      items: [
        {
          title: 'Ошибки и алгоритмы обнаружения дополнительных корневых каналов',
          author: 'Ирина Завьялова',
        },
        { title: 'Особенности изоляции при сильно разрушенных зубах', author: 'Иван Казадаев' },
        { title: 'Керамические реставрации', author: 'Багир Мехтиев' },
        { title: 'Дентальная фотография', author: 'Андрей Швецов' },
        {
          title: 'Важность точного воспроизведения в прямой реставрации фронтальной группы зубов',
          author: 'Мария Бессонова',
        },
        { title: 'Удаление зубов: просто о сложном', author: 'Дадаш Омаров' },
        { title: 'Антисептическая обработка каналов', author: 'Андрей Афанютин' },
      ],
    },
    {
      year: '2022',
      items: [
        {
          title:
            'Современные решения для эффективного выполнения реставрации зубов после эндодонтического лечения',
          author: 'Евгения Дорофеева',
        },
        { title: 'Керамические виниры: от планирования до фиксации', author: 'Артур Лукьяненко' },
        { title: 'Открытый синус-лифтинг без графта', author: 'Роман Юркевич' },
        {
          title: 'Различные методы устранения рецессий десны в области зубов',
          author: 'Максим Лебедев',
        },
        { title: 'Пародонтальная карта', author: 'Раиса Обухова' },
      ],
    },
    {
      year: '2023',
      items: [
        { title: 'Протоколы костных аугментаций', author: 'Татьяна Ковалёва' },
        { title: 'Направленная костная регенерация', author: 'Дильмурат Мирбакиев' },
        { title: 'День INIBSA', author: 'Татьяна Бояркина' },
        { title: 'Цифровая окклюзия и сплит-терапия', author: 'Пулат Кучкаров' },
      ],
    },
    {
      year: '2024',
      items: [
        {
          title: 'Цифровое планирование. От фотографии до примерки mock-up',
          author: 'Bend Stomatology',
        },
        { title: 'Ключи к успешной эндодонтии', author: 'Юлия Матухна' },
        { title: 'Выдвигать или не выдвигать', author: 'Владимир Косолапов' },
        { title: 'День Ivoclar', author: 'Алексей Бошмаков' },
      ],
    },
    {
      year: '2025',
      items: [
        { title: 'Эволюция дизайна препарирования', author: 'Константин Верзилов' },
        { title: 'Базовый курс по имплантации', author: 'Александр Пагалин' },
      ],
    },
  ];
  const GALLERY_GAP = 28;
  const DRAG_THRESHOLD = 6;
  const DOCK_HIDE_AFTER_SCROLL = 200;
  const DOCK_IDLE_MS = 3000;
  const DOCK_TAP_LOCK_MS = 2200;
  const DOCK_SCROLL_LOCK_MS = 1200;
  const DOCK_SECTION_IDS = ['top', 'works', 'education', 'technology', 'contact'];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderCourses() {
    $('#courses').innerHTML = COURSES.map(
      ({ year, items }) => `
        <div>
          <h4>${year}</h4>
          <ul>${items.map(({ title, author }) => `<li><b>«${title}»</b>${author}</li>`).join('')}</ul>
        </div>`,
    ).join('');
    $('#courses-count').dataset.countTo = COURSES.reduce(
      (total, { items }) => total + items.length,
      0,
    );
  }

  function splitIntoWords() {
    return $$('.word-light').flatMap((element) => {
      element.innerHTML = element.textContent
        .split(' ')
        .map((word) => `<span class="word">${word}</span>`)
        .join(' ');
      return $$('.word', element);
    });
  }

  function animateCount(element) {
    const target = Number(element.dataset.countTo);
    const duration = 1800;
    const start = performance.now();
    const step = (now) => {
      const progress = clamp((now - start) / duration);
      element.textContent = Math.round(target * (1 - (1 - progress) ** 4));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initReveal() {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
          if (entry.target.dataset.countTo) animateCount(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    );
    $$(
      '[data-reveal], [data-reveal-lines], [data-reveal-slide], .image-frame, [data-count-to]',
    ).forEach((element) => observer.observe(element));
    setTimeout(() => {
      $$('.hero [data-reveal], .hero [data-reveal-lines]').forEach((element) => {
        element.classList.add('is-visible');
        observer.unobserve(element);
      });
    }, 60);
    if (prefersReducedMotion) {
      $$('[data-count-to]').forEach((element) => {
        element.textContent = element.dataset.countTo;
      });
    }
  }

  function initStagesScroller() {
    const scroller = $('#stages-scroller');
    const progressBar = $('#stages-progress');
    const previousButton = $('#stages-prev');
    const nextButton = $('#stages-next');
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let dragDistance = 0;

    const updateControls = () => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      const visibleShare = (scroller.scrollLeft + scroller.clientWidth) / scroller.scrollWidth;
      progressBar.style.transform = `scaleX(${clamp(visibleShare, 0.08)})`;
      previousButton.disabled = scroller.scrollLeft < 4;
      nextButton.disabled = scroller.scrollLeft > maxScroll - 4;
    };
    const stepWidth = () => $('figure', scroller).offsetWidth + GALLERY_GAP;
    const scrollByStep = (direction) =>
      scroller.scrollBy({ left: direction * stepWidth(), behavior: 'smooth' });

    scroller.addEventListener('scroll', updateControls, { passive: true });
    addEventListener('resize', updateControls);
    addEventListener('load', updateControls);
    previousButton.addEventListener('click', () => scrollByStep(-1));
    nextButton.addEventListener('click', () => scrollByStep(1));

    scroller.addEventListener('pointerdown', (event) => {
      dragDistance = 0;
      if (event.pointerType !== 'mouse' || event.button) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = scroller.scrollLeft;
      scroller.setPointerCapture(event.pointerId);
      scroller.classList.add('is-dragging');
    });
    scroller.addEventListener('pointermove', (event) => {
      if (!isDragging) return;
      dragDistance = Math.max(dragDistance, Math.abs(event.clientX - dragStartX));
      scroller.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });
    const stopDragging = () => {
      isDragging = false;
      scroller.classList.remove('is-dragging');
    };
    scroller.addEventListener('pointerup', stopDragging);
    scroller.addEventListener('pointercancel', stopDragging);

    updateControls();
    return { scroller, wasDragged: () => dragDistance > DRAG_THRESHOLD };
  }

  function initLightbox({ scroller, wasDragged }) {
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Закрыть">×</button>
      <button class="lightbox-prev" aria-label="Назад">←</button>
      <button class="lightbox-next" aria-label="Вперёд">→</button>
      <img alt="">
      <p></p>`;
    document.body.appendChild(lightbox);

    const figures = $$('figure', scroller);
    const picture = $('img', lightbox);
    const caption = $('p', lightbox);
    let index = 0;

    const open = (nextIndex) => {
      index = (nextIndex + figures.length) % figures.length;
      const source = $('img', figures[index]);
      picture.src = source.getAttribute('src');
      picture.alt = source.alt;
      caption.textContent = $('figcaption', figures[index]).textContent;
      lightbox.classList.add('is-active');
      document.body.style.overflow = 'hidden';
    };
    const close = () => {
      lightbox.classList.remove('is-active');
      document.body.style.overflow = '';
    };

    scroller.addEventListener('click', (event) => {
      if (wasDragged()) return;
      const hit = document.elementFromPoint(event.clientX, event.clientY);
      const figure = hit && hit.closest('figure');
      if (figure && scroller.contains(figure)) open(figures.indexOf(figure));
    });
    lightbox.addEventListener('click', (event) => {
      const { classList } = event.target;
      if (event.target === lightbox || classList.contains('lightbox-close')) close();
      else if (classList.contains('lightbox-prev')) open(index - 1);
      else if (classList.contains('lightbox-next')) open(index + 1);
    });
    addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-active')) return;
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') open(index - 1);
      if (event.key === 'ArrowRight') open(index + 1);
    });
  }

  function initCompareSliders() {
    $$('.compare').forEach((compare) => {
      const input = $('input', compare);
      const frame = $('.compare-frame', compare);
      let target = Number(input.value);
      let current = target;
      let isAnimating = false;
      let isDragging = false;

      const animate = () => {
        current += (target - current) * 0.16;
        compare.style.setProperty('--progress', (current / 100).toFixed(4));
        if (Math.abs(target - current) > 0.05) requestAnimationFrame(animate);
        else isAnimating = false;
      };
      const setPosition = (percent) => {
        target = clamp(percent, 0, 100);
        input.value = target;
        if (!isAnimating) {
          isAnimating = true;
          requestAnimationFrame(animate);
        }
      };
      const followPointer = (event) => {
        const box = frame.getBoundingClientRect();
        setPosition(((event.clientX - box.left) / box.width) * 100);
      };

      input.addEventListener('input', () => setPosition(Number(input.value)));
      frame.addEventListener('pointerdown', (event) => {
        isDragging = true;
        frame.setPointerCapture(event.pointerId);
        followPointer(event);
      });
      frame.addEventListener('pointermove', (event) => {
        if (isDragging) followPointer(event);
      });
      ['pointerup', 'pointercancel'].forEach((type) =>
        frame.addEventListener(type, () => (isDragging = false)),
      );

      new IntersectionObserver(
        (entries, observer) => {
          if (!entries[0].isIntersecting) return;
          observer.disconnect();
          if (prefersReducedMotion) return;
          setTimeout(() => setPosition(84), 500);
          setTimeout(() => setPosition(18), 1300);
          setTimeout(() => setPosition(50), 2100);
        },
        { threshold: 0.6 },
      ).observe(frame);
    });
  }

  function initMobileDock() {
    const dock = $('#mobile-dock');
    const links = $$('a', dock);
    const sections = DOCK_SECTION_IDS.map((id) => document.getElementById(id));
    let isLocked = false;
    let lockTimer = 0;
    let idleTimer = 0;

    const setActive = (index) => {
      links.forEach((link, linkIndex) => link.classList.toggle('is-active', linkIndex === index));
      dock.style.setProperty('--index', index);
    };
    const scheduleIdleHide = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (scrollY > DOCK_HIDE_AFTER_SCROLL) dock.classList.add('is-hidden');
      }, DOCK_IDLE_MS);
    };
    const unlock = () => {
      isLocked = false;
      scheduleIdleHide();
    };

    links.forEach((link, index) =>
      link.addEventListener('click', () => {
        isLocked = true;
        setActive(index);
        dock.classList.remove('is-hidden');
        clearTimeout(idleTimer);
        clearTimeout(lockTimer);
        lockTimer = setTimeout(unlock, DOCK_TAP_LOCK_MS);
      }),
    );

    return function update(scrollTop, previousScrollTop) {
      if (isLocked) {
        clearTimeout(lockTimer);
        lockTimer = setTimeout(unlock, DOCK_SCROLL_LOCK_MS);
        return;
      }
      if (scrollTop > previousScrollTop + 3 && scrollTop > DOCK_HIDE_AFTER_SCROLL) {
        dock.classList.add('is-hidden');
      } else if (scrollTop < previousScrollTop - 3 || scrollTop < DOCK_HIDE_AFTER_SCROLL) {
        dock.classList.remove('is-hidden');
        if (scrollTop >= DOCK_HIDE_AFTER_SCROLL) scheduleIdleHide();
      }
      const activeIndex = sections.reduce(
        (found, section, index) =>
          section.getBoundingClientRect().top < innerHeight * 0.45 ? index : found,
        0,
      );
      setActive(activeIndex);
    };
  }

  function initScrollEffects(words) {
    const progressBar = $('#scroll-progress');
    const header = $('#site-header');
    const hero = $('.hero');
    const pinnedStatement = $('.pinned-statement');
    const parallaxElements = $$('[data-parallax]');
    const updateDock = initMobileDock();
    let previousScrollTop = 0;
    let isFramePending = false;

    const updateWordLight = () => {
      const box = pinnedStatement.getBoundingClientRect();
      const progress = clamp(-box.top / (box.height - innerHeight || 1));
      const litCount = Math.round(progress * 1.15 * words.length);
      words.forEach((word, index) => word.classList.toggle('is-active', index < litCount));
    };
    const updateParallax = () => {
      parallaxElements.forEach((element) => {
        const box = element.parentNode.getBoundingClientRect();
        if (box.bottom < -100 || box.top > innerHeight + 100) return;
        const offset = (box.top + box.height / 2 - innerHeight / 2) * -element.dataset.parallax;
        element.style.transform = `translate3d(0, ${offset}px, 0)`;
      });
    };
    const renderFrame = () => {
      isFramePending = false;
      const scrollTop = scrollY;
      const pageHeight = document.documentElement.scrollHeight - innerHeight || 1;
      progressBar.style.transform = `scaleX(${scrollTop / pageHeight})`;
      header.classList.toggle('is-scrolled', scrollTop > 40);
      header.classList.toggle('is-hidden', scrollTop > previousScrollTop && scrollTop > 500);
      if (scrollTop < innerHeight * 1.3) hero.style.setProperty('--scroll-y', scrollTop);
      updateDock(scrollTop, previousScrollTop);
      if (prefersReducedMotion) {
        words.forEach((word) => word.classList.add('is-active'));
      } else {
        updateWordLight();
        updateParallax();
      }
      previousScrollTop = scrollTop;
    };
    const requestFrame = () => {
      if (isFramePending) return;
      isFramePending = true;
      requestAnimationFrame(renderFrame);
    };

    addEventListener('scroll', requestFrame, { passive: true });
    addEventListener('resize', requestFrame);
    renderFrame();
  }

  function initPointerEffects() {
    const glow = $('#cursor-glow');
    const hero = $('.hero');
    let glowX = innerWidth / 2;
    let glowY = innerHeight / 2;
    let targetX = glowX;
    let targetY = glowY;

    addEventListener(
      'pointermove',
      (event) => {
        targetX = event.clientX;
        targetY = event.clientY;
        hero.style.setProperty('--mouse-x', (event.clientX / innerWidth - 0.5).toFixed(3));
      },
      { passive: true },
    );
    if (!prefersReducedMotion) {
      const followCursor = () => {
        glowX += (targetX - glowX) * 0.08;
        glowY += (targetY - glowY) * 0.08;
        glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0)`;
        requestAnimationFrame(followCursor);
      };
      followCursor();
    }

    $$('.magnetic').forEach((button) => {
      button.addEventListener('pointermove', (event) => {
        if (prefersReducedMotion) return;
        const box = button.getBoundingClientRect();
        const dx = (event.clientX - box.left - box.width / 2) * 0.22;
        const dy = (event.clientY - box.top - box.height / 2) * 0.35;
        button.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      button.addEventListener('pointerleave', () => {
        button.style.transform = '';
      });
    });
  }

  function initHalftone() {
    const canvas = $('#halftone-canvas');
    const card = canvas.parentNode;
    const source = new Image();
    const pointer = { x: -999, y: -999 };
    const REPEL_RADIUS = 130;
    const DOT_COLOR = '#eadfcb';
    let context;
    let ratio;
    let dots = [];
    let isVisible = false;
    let time = 0;

    const buildDots = () => {
      const box = canvas.getBoundingClientRect();
      ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = box.width * ratio;
      canvas.height = box.height * ratio;
      const spacing = Math.max(6, Math.round(canvas.width / 150));
      const columns = Math.ceil(canvas.width / spacing);
      const rows = Math.ceil(canvas.height / spacing);
      const sampler = document.createElement('canvas');
      sampler.width = columns;
      sampler.height = rows;
      const samplerContext = sampler.getContext('2d');
      const scale = Math.min(columns / source.width, rows / source.height) * 1.02;
      const width = source.width * scale;
      const height = source.height * scale;
      samplerContext.fillStyle = '#fff';
      samplerContext.fillRect(0, 0, columns, rows);
      samplerContext.drawImage(source, (columns - width) / 2, (rows - height) * 0.3, width, height);
      const pixels = samplerContext.getImageData(0, 0, columns, rows).data;

      dots = [];
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const darkness = 1 - pixels[(row * columns + column) * 4] / 255;
          if (darkness <= 0.05) continue;
          const x = (column + 0.5) * spacing;
          const y = (row + 0.5) * spacing;
          dots.push({ x, y, homeX: x, homeY: y, radius: darkness * spacing * 0.56, vx: 0, vy: 0 });
        }
      }
    };

    const draw = () => {
      if (!isVisible) return;
      time += 0.02;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = DOT_COLOR;
      const radius = REPEL_RADIUS * ratio;
      dots.forEach((dot) => {
        const dx = dot.x - pointer.x;
        const dy = dot.y - pointer.y;
        const distanceSquared = dx * dx + dy * dy;
        if (distanceSquared < radius * radius) {
          const force = (1 - Math.sqrt(distanceSquared) / radius) * 5;
          const angle = Math.atan2(dy, dx);
          dot.vx += Math.cos(angle) * force;
          dot.vy += Math.sin(angle) * force;
        }
        dot.vx += (dot.homeX - dot.x) * 0.06;
        dot.vy += (dot.homeY - dot.y) * 0.06;
        dot.vx *= 0.82;
        dot.vy *= 0.82;
        dot.x += dot.vx;
        dot.y += dot.vy;
        const pulse = 1 + 0.12 * Math.sin(time + dot.homeX * 0.02 + dot.homeY * 0.015);
        context.beginPath();
        context.arc(dot.x, dot.y, dot.radius * pulse, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(draw);
    };

    source.onerror = () => card.classList.add('no-canvas');
    source.onload = () => {
      try {
        context = canvas.getContext('2d');
        buildDots();
        addEventListener('resize', buildDots);
        card.addEventListener('pointermove', (event) => {
          const box = canvas.getBoundingClientRect();
          pointer.x = (event.clientX - box.left) * ratio;
          pointer.y = (event.clientY - box.top) * ratio;
        });
        card.addEventListener('pointerleave', () => {
          pointer.x = -999;
          pointer.y = -999;
        });
        new IntersectionObserver((entries) => {
          isVisible = entries[0].isIntersecting;
          if (isVisible) draw();
        }).observe(card);
      } catch {
        card.classList.add('no-canvas');
      }
    };
    source.src = 'assets/halftone.webp';
  }

  renderCourses();
  const words = splitIntoWords();
  initReveal();
  initScrollEffects(words);
  initPointerEffects();
  initCompareSliders();
  initLightbox(initStagesScroller());
  initHalftone();
})();
