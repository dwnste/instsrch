import style from './style.scss'
import fetchJsonp from 'fetch-jsonp'
import moment from 'moment'

moment.locale('ru');

let myPlacemark,
        myMap,
        photoWrapper,
        previousQueryArgs,
        morePhotosButton,
        count;


const cleanPhotoWrapper = () => {
    photoWrapper.innerHTML = '';
}

const morePhotosButtonClick = () => {
    if (previousQueryArgs && count > photoWrapper.childElementCount) {
        getPhotos(previousQueryArgs.lat, previousQueryArgs.long, undefined, undefined, photoWrapper.childElementCount);
    }
}

const getPhotos = (lat, long, radius = 1000, count = 50, offset = 0) => {
    const url = `//api.vk.com/method/photos.search?lat=${lat}&long=${long}&radius=${radius}&count=${count}&offset=${offset}`;
    fetchJsonp(url)
    .then(function(response) {
        return response.json()
    }).then(function(json) {
        renderContent(json);
    }).catch(function(ex) {
        console.log('parsing failed', ex)
    })
}


// Создание метки.
const createPlacemark = (coords) => {
    return new ymaps.Placemark(coords, {
        iconCaption: 'поиск...'
    }, {
        preset: 'islands#violetDotIconWithCaption',
        draggable: true
    });
}


const renderContent = (result) => {
    let photos;
    [count, ...photos] = result.response;
    for (let element of photos) {
        const date = moment(element.created*1000).format('L')
        photoWrapper.innerHTML+=`<div class="image"><img src="${element.src}"><a href="${element.src_big}" target="_blank"><h2><span>${date}</span></h2></a></div>`
    }
}

// Определяем адрес по координатам (обратное геокодирование).
const getAddress = (coords) => {
    myPlacemark.properties.set('iconCaption', 'поиск...');
    ymaps.geocode(coords).then(function (res) {
        var firstGeoObject = res.geoObjects.get(0);
        myPlacemark.properties
            .set({
                // Формируем строку с данными об объекте.
                iconCaption: [
                    // Название населенного пункта или вышестоящее административно-территориальное образование.
                    firstGeoObject.getLocalities().length ? firstGeoObject.getLocalities() : firstGeoObject.getAdministrativeAreas(),
                    // Получаем путь до топонима, если метод вернул null, запрашиваем наименование здания.
                    firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()
                ].filter(Boolean).join(', '),
                // В качестве контента балуна задаем строку с адресом объекта.
                balloonContent: firstGeoObject.getAddressLine()
            });
    });
}


const init = () => {
    photoWrapper = document.getElementById('photoWrap');
    morePhotosButton = document.getElementById('morePhotosButton');
    myMap = new ymaps.Map('map', {
        center: [55.753994, 37.622093],
        zoom: 9
    }, {
        searchControlProvider: 'yandex#search'
    });
    // Слушаем клик на карте.
    morePhotosButton.addEventListener('click', morePhotosButtonClick);
    myMap.events.add('click', (e) => {
        const coords = e.get('coords');
        const [lat, long] = coords;
        cleanPhotoWrapper();
        getPhotos(lat, long);
        previousQueryArgs = {lat, long};
        // Если метка уже создана – просто передвигаем ее.
        if (myPlacemark) {
            myPlacemark.geometry.setCoordinates(coords);
        }
        // Если нет – создаем.
        else {
            myPlacemark = createPlacemark(coords);
            myMap.geoObjects.add(myPlacemark);
            // Слушаем событие окончания перетаскивания на метке.
            myPlacemark.events.add('dragend', function () {
                getAddress(myPlacemark.geometry.getCoordinates());
            });
        }
        getAddress(coords);
    });
}

ymaps.ready(init);