'use strict';


const GalleryClassName = 'gallery';
const GalleryLineClassName = 'gallery-line';
const GallerySlideClassName = 'gallery-slide';

// т.к. галерея может быть на странице не одна, а множество,
// то удобнее всего написать библиотеку через класс  
// 1. создаем класс Gallery 
// 2. объявляем конструктор, передаем в него элемент(обертку) и опции в виде пустого объекта 
class Gallery {
   constructor(element, options = {}) {
      // задаем параметры
      this.containerNode = element; // сюда сохраняем наш элемент 
      this.size = element.childElementCount; // размер - количество слайдов в нашей галерее
      this.currentSlide = 0; // слайд, который будет активен на момент запуска галереи (0 индекс)

      // чтобы при вызове методов не слетали контексты, например, 
      // если методы вызываются в событиях, переопределяем метод и добавляем bind(this), 
      // тем самым методы всегда будут точно вызываться контекстом this 
      this.manageHTML = this.manageHTML.bind(this);
      this.manageHTML(); // вызвываем функцию
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
      console.log(this.slideNodes);
   }
}

// Helpers 
function wrapElementByDiv({element, className}) {
   const wrapperNode = document.createElement('div');
   wrapperNode.classList.add(className);

   element.parentNode.insertBefore(wrapperNode, element);
   wrapperNode.appendChild(element);

   return wrapperNode;
}