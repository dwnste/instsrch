import React from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import {getPhotos, createPlacemark, getGeoObject} from '../lib';

moment.locale('ru');

const MAP_CENTER = [55.753994, 37.622093];

let myPlacemark,
        myMap,
        photoWrapper

// Обновление позиции и текста метки
const updateMyPlacemark = (coords) => {
    myPlacemark.geometry
        .setCoordinates(coords);
    myPlacemark.properties
        .set('iconCaption', 'поиск...');
    getGeoObject(coords)
        .then(firstGeoObject =>
            myPlacemark.properties
                .set({
                    // Формируем строку с данными об объекте.
                    iconCaption: [
                        /* Название населенного пункта или
                        вышестоящее административно-территориальное образование. */
                        firstGeoObject.getLocalities().length
                            ? firstGeoObject.getLocalities()
                            : firstGeoObject.getAdministrativeAreas(),
                        /* Получаем путь до топонима, если метод вернул null,
                         запрашиваем наименование здания. */
                        firstGeoObject.getThoroughfare()
                        || firstGeoObject.getPremise(),
                    ].filter(Boolean)
                     .join(', '),
                    // В качестве контента балуна задаем строку с адресом объекта.
                    balloonContent: firstGeoObject.getAddressLine()
                }),
    );
};


const update = ({ coords, count = 50, radius = 1000, offset = 0 }) => {
    getPhotos({});
};

const init = () => {
    photoWrapper = document.getElementById('photoWrap');

    // инициализация карты
    myMap = new ymaps.Map('map', {
        center: MAP_CENTER,
        zoom: 9,
    }, {
        searchControlProvider: 'yandex#search',
    });


    // ставим метку и грузим фотографии, когда карта загрузилась
    const coords = MAP_CENTER;
    myPlacemark = createPlacemark(coords);
    myMap.geoObjects.add(myPlacemark);
    updateMyPlacemark(coords);


    myMap.events.add('click', (e) => {
        const coords = e.get('coords');
        updateMyPlacemark(coords);
    });


    myPlacemark.events.add('dragend', () => {
        const coords = myPlacemark.geometry.getCoordinates();
        updateMyPlacemark(coords);
    });

    photoWrapper.addEventListener('scroll', () => {
        if (photoWrapper.scrollTop + photoWrapper.clientHeight >= photoWrapper.scrollHeight) {
            update({});
        }
    });
};

ymaps.ready(init);
