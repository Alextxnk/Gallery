'use strict';


const GalleryClassName = 'gallery';
const GalleryDraggableClassName = 'gallery-draggable';
const GalleryLineClassName = 'gallery-line';
const GallerySlideClassName = 'gallery-slide';

// т.к. галерея может быть на странице не одна, а множество, то удобнее всего написать библиотеку через класс  
// 1. создаем класс Gallery 
// 2. объявляем конструктор, передаем в него элемент(обертку) и опции в виде пустого объекта 
class Gallery {
   constructor(element, options = {}) {
      // задаем параметры
      this.containerNode = element; // сюда сохраняем наш элемент 
      this.size = element.childElementCount; // размер - количество слайдов в нашей галерее
      this.currentSlide = 0; // слайд, который будет активен на момент запуска галереи (0 индекс)
      this.currentSlideWasChanged = false;
      this.settings = {
         margin: options.margin || 0 // по умолчанию отступ будет равен 0 
      };

      // чтобы при вызове методов не слетали контексты, например, если методы вызываются в событиях, 
      // переопределяем метод и добавляем bind(this), тем самым методы всегда будут точно вызываться контекстом this 
      this.manageHTML = this.manageHTML.bind(this);
      this.setParameters = this.setParameters.bind(this);
      this.setEvents = this.setEvents.bind(this);
      this.resizeGallery = this.resizeGallery.bind(this);
      this.startDrag = this.startDrag.bind(this);
      this.stopDrag = this.stopDrag.bind(this);
      this.dragging = this.dragging.bind(this);
      this.setStylePosiion = this.setStylePosiion.bind(this);

      // вызвываем функции
      this.manageHTML();
      this.setParameters();
      this.setEvents();
   }

   // в этой функции мы сделаем все необходимые обертки для нашего HTML, чтобы оформить галерею
   manageHTML() {
      this.containerNode.classList.add(GalleryClassName); // добаляем класс gallery
      // добавляем div с классом gallery-line
      this.containerNode.innerHTML = `
         <div class="${GalleryLineClassName}">
            ${this.containerNode.innerHTML}
         </div>
      `;
      // получаем объект по классу gallery-line
      this.lineNode = this.containerNode.querySelector(`.${GalleryLineClassName}`);

      this.slideNodes = Array.from(this.lineNode.children).map((childNode) =>
         wrapElementByDiv({
            element: childNode,
            className: GallerySlideClassName
         })
      );
   }

   setParameters() {
      // получаем координаты нашего элемента (нам нужна только ширина)
      const coordsContainer = this.containerNode.getBoundingClientRect(); 
      this.width = coordsContainer.width;
      // чтоб в обратную сторону слайд тянулся с трудом 
      this.maximumX = -(this.size - 1) * (this.width + this.settings.margin); 
      this.x = -this.currentSlide * (this.width + this.settings.margin);
      this.resetStyleTransition(); // сбрасываем стиль с анимацией 
      // количество элементов умножить на ширину
      this.lineNode.style.width = `${this.size * (this.width + this.settings.margin)}px`;  
      this.setStylePosiion();

      // slideNodes у нас не массив, поэтому для того чтобы использовать методы массива, например forEach,
      // мы должны сделать сначала Array.from
      Array.from(this.slideNodes).forEach((slideNode) => {
         // пробегаемся и задаем ширину каждому слайду 
         slideNode.style.width = `${this.width}px`;
         slideNode.style.marginRight = `${this.settings.margin}px`; // устанавливаем отступы между слайдами 
      });
   }

   setEvents() {
      // меняем размер в зависимости от пользовательского размера 
      // добавляем функцию-хелпер debounce, чтоб слишком часто не вызывалась функция setEvents
      this.debouncedResizeGallery = debounce(this.resizeGallery);
      window.addEventListener('resize', this.debouncedResizeGallery); 
      this.lineNode.addEventListener('pointerdown', this.startDrag);
      window.addEventListener('pointerup', this.stopDrag);
      window.addEventListener('pointercancel', this.stopDrag);
   }

   destroyEvents() {
      window.removeEventListener('resize', this.debouncedResizeGallery);
      this.lineNode.removeEventListener('pointerdown', this.startDrag);
      window.removeEventListener('pointerup', this.stopDrag);
      window.removeEventListener('pointercancel', this.stopDrag);
   }

   resizeGallery() {
      this.setParameters(); // пересчитываем размеры 
   }

   startDrag(evt) {
      this.currentSlideWasChanged = false;
      this.clickX = evt.pageX; 
      this.startX = this.x; // первоначальный сдвиг слайда 
      this.resetStyleTransition();
      this.containerNode.classList.add(GalleryDraggableClassName); // добавляем класс 
      window.addEventListener('pointermove', this.dragging); 
      // в функции dragging будут производиться все основные расчеты
   }

   stopDrag() {
      window.removeEventListener('pointermove', this.dragging);
      this.containerNode.classList.remove(GalleryDraggableClassName); // удаляем класс 
      this.x = -this.currentSlide * (this.width + this.settings.margin);
      this.setStylePosiion();
      this.setStyleTransition(); 
   }

   dragging(evt) {
      this.dragX = evt.pageX; 
      const dragShift = this.dragX - this.clickX;
      const easing = dragShift / 5; // чтоб 1 и последний слайды с трудом тянулись в противоположную сторону, 
      // в данном случае слайд  будет тянуться в 5 раз меньше  
      this.x = Math.max(Math.min(this.startX + dragShift, easing), this.maximumX + easing);
      this.setStylePosiion();

      // change active slide 
      // перетягивание слайда вперед
      if (
         dragShift > 20 && 
         dragShift > 0 && 
         !this.currentSlideWasChanged &&
         this.currentSlide > 0
      ) {
         this.currentSlideWasChanged = true;
         this.currentSlide = this.currentSlide - 1;
      }

      // перетягивание в обратную сторону 
      if (
         dragShift < - 20 && 
         dragShift < 0 &&
         !this.currentSlideWasChanged &&
         this.currentSlide < this.size - 1 
      ) {
         this.currentSlideWasChanged = true;
         this.currentSlide = this.currentSlide + 1;
      }
   }

   // смена слайдов 
   setStylePosiion() {
      this.lineNode.style.transform = `translate3d(${this.x}px, 0, 0)`;
   }

   // подключаем анимацию, чтоб плавно сменялись слайды 
   setStyleTransition() {
      this.lineNode.style.transition = `all 0.25s ease 0s`;
   }

   // сброс стиля анимации, когда перешли на новый слайд 
   resetStyleTransition() {
      this.lineNode.style.transition = `all 0s ease 0s`;
   }
}

// Helpers 
function wrapElementByDiv({
   element,
   className
}) {
   const wrapperNode = document.createElement('div');
   wrapperNode.classList.add(className);

   element.parentNode.insertBefore(wrapperNode, element);
   wrapperNode.appendChild(element);

   return wrapperNode;
}

function debounce(func, time = 100) {
   let timer;
   return function (event) {
      clearTimeout(timer);
      timer = setTimeout(func, time, event);
   };
}
