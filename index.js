import style from './style.scss'
import fetchJsonp from 'fetch-jsonp'
import moment from 'moment'
import ymaps from 'ymaps'

moment.locale('ru');


const MAP_CENTER = [55.753994, 37.622093];


let myPlacemark,
        myMap,
        photoWrapper

let state = {
    coords: [],
    photosAvailable: 0,
    offset: 0
};


const getPhotos = ({coords, radius, count, offset}) => {
    const [lat, long] = coords;
    const url = `//api.vk.com/method/photos.search?lat=${lat}&long=${long}&radius=${radius}&count=${count}&offset=${offset}`;

    return fetchJsonp(url)
                .then( response => response.json())
                .then( ({ response }) => {
                            let [photosAvailable, ...photos] = response;
                            return {photosAvailable, photos};
                        })
                .catch( ex => console.log('parsing failed', ex) );
}



const renderContent = (photos) =>
    photos
        .map(element=>`
            <div class="image">
                <img src="${element.src}"/>
                <a href="${element.src_big}" target="_blank">
                    ${moment(element.created*1000).format('L')}
                </a>
            </div>`
        )
        .join('');



const updatePhotoWrapper = (content) => {
    photoWrapper.innerHTML = content ? photoWrapper.innerHTML + content : '';
}


// Создание метки.
const createPlacemark = coords =>
    new ymaps.Placemark(
        coords,
        { iconCaption: 'поиск...' },
        { preset: 'islands#blackDotIconWithCaption',
          draggable: true }
    );



// Определяем адрес по координатам (обратное геокодирование).
const getGeoObject = coords =>
    ymaps.geocode(coords)
         .then(res=>res.geoObjects.get(0));



// Обновление позиции и текста метки
const updateMyPlacemark = (coords) => {
    myPlacemark.geometry
        .setCoordinates(coords);
    myPlacemark.properties
        .set('iconCaption', 'поиск...');
    getGeoObject(coords)
        .then( firstGeoObject =>
            myPlacemark.properties
                .set({
                    // Формируем строку с данными об объекте.
                    iconCaption: [
                        // Название населенного пункта или вышестоящее административно-территориальное образование.
                        firstGeoObject.getLocalities().length
                            ? firstGeoObject.getLocalities()
                            : firstGeoObject.getAdministrativeAreas(),
                        // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
                        firstGeoObject.getThoroughfare()
                        || firstGeoObject.getPremise()
                    ].filter(Boolean)
                     .join(', '),
                    // В качестве контента балуна задаем строку с адресом объекта.
                    balloonContent: firstGeoObject.getAddressLine()
                })
    );
}


const update = ({coords = state.coords, count = 50, radius = 1000, offset = state.offset}) => {

    state.offset = offset === 0 ? 0 : state.offset;

    if (state.offset <= state.photosAvailable) {

        getPhotos({...state, coords, count, radius, offset}).then(photoResponse=>{
            state.photosAvailable = photoResponse.photosAvailable;
            updatePhotoWrapper(renderContent(photoResponse.photos));

            state.offset += count;
            state.coords = coords;

            if (photoWrapper.scrollHeight <= photoWrapper.clientHeight) {
                update({});
            }
        });
    }
}


const init = () => {
    photoWrapper = document.getElementById('photoWrap');

    // инициализация карты
    myMap = new ymaps.Map('map', {
        center: MAP_CENTER,
        zoom: 9
    }, {
        searchControlProvider: 'yandex#search'
    });


    // ставим метку и грузим фотографии, когда карта загрузилась
    const coords = MAP_CENTER;
    myPlacemark = createPlacemark(coords);
    myMap.geoObjects.add(myPlacemark);
    updateMyPlacemark(coords);
    update({coords});


    myMap.events.add('click', (e) => {
        const coords = e.get('coords');
        updateMyPlacemark(coords);
        updatePhotoWrapper('');

        const offset = 0;
        update({coords, offset});

    });


    myPlacemark.events.add('dragend', () => {
        const coords = myPlacemark.geometry.getCoordinates();
        updateMyPlacemark(coords);
        updatePhotoWrapper('');

        const offset = 0;
        update({coords, offset});

    });

    photoWrapper.addEventListener('scroll', () => {
        if (photoWrapper.scrollTop + photoWrapper.clientHeight >= photoWrapper.scrollHeight) {
            update({});
        }
    });


}


ymaps.ready(init);