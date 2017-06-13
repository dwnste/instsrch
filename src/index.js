import style from './style.scss'
import moment from 'moment'
import ymaps from 'ymaps'
import { getPhotos, createPlacemark, updateMyPlacemark } from '../lib';

moment.locale('ru');


const MAP_CENTER = [55.753994, 37.622093];


let myPlacemark,
    myMap,
    photoWrapper;

const state = {
    coords: [],
    photosAvailable: 0,
    offset: 0,
};


const renderContent = photos =>
    photos
        .map(element => `
            <div class="image">
                <img src="${element.src}"/>
                <a href="${element.src_big}" target="_blank">
                    ${moment(element.created * 1000).format('L')}
                </a>
            </div>`,
        )
        .join('');


const updatePhotoWrapper = (content) => {
    photoWrapper.innerHTML = content ? photoWrapper.innerHTML + content : '';
};


const update = ({ coords = state.coords, count = 50, radius = 1000, offset = state.offset }) => {
    if (offset === 0) {
        updatePhotoWrapper('');
        state.offset = 0;
        updateMyPlacemark(coords, myPlacemark);
    }

    if (state.offset <= state.photosAvailable) {
        getPhotos({ ...state, coords, count, radius, offset }).then((photoResponse) => {
            state.photosAvailable = photoResponse.photosAvailable;
            updatePhotoWrapper(renderContent(photoResponse.photos));

            state.offset += count;
            state.coords = coords;

            if (photoWrapper.scrollHeight <= photoWrapper.clientHeight) {
                update({});
            }
        });
    }
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
    myPlacemark = createPlacemark(MAP_CENTER);
    myMap.geoObjects.add(myPlacemark);
    update({ coords: MAP_CENTER });


    // обработчики событий
    myMap.events.add('click', (e) => {
        update({ coords: e.get('coords'), offset: 0 });
    });


    myPlacemark.events.add('dragend', () => {
        update({ coords: myPlacemark.geometry.getCoordinates(), offset: 0 });
    });


    photoWrapper.addEventListener('scroll', () => {
        if (photoWrapper.scrollTop + photoWrapper.clientHeight >= photoWrapper.scrollHeight) {
            update({});
        }
    });
};


ymaps.ready(init);
