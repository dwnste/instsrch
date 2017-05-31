const init = () => {
    let myPlacemark,
        myMap = new ymaps.Map('map', {
            center: [55.753994, 37.622093],
            zoom: 9
        }, {
            searchControlProvider: 'yandex#search'
        });
    // Слушаем клик на карте.
    myMap.events.add('click', (e) => {
        const coords = e.get('coords');
        const [lat, long] = coords;
        getPhotos(lat, long);
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
    // Определяем адрес по координатам (обратное геокодирование).
    getAddress = (coords) => {
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
}

const getPhotos = (lat, long, radius = 5000, count = 100) => {
    const script = document.createElement('script');
    script.src = `//api.vk.com/method/photos.search?lat=${lat}&long=${long}&count=${count}&radius=${radius}&callback=renderContent`;
    document.getElementsByTagName("head")[0].appendChild(script);
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
    const photoWrapper = document.getElementById('photoWrap');
    photoWrapper.innerHTML = '';

    for (let element of result.response) {
        if (element.src_big) {
            const newLink = document.createElement('a');
            newLink.setAttribute('href', element.src_big)
            newLink.setAttribute('target', '_blank');
            const img = new Image();
            img.src = element.src;
            newLink.appendChild(img);
            photoWrapper.appendChild(newLink);
        }
    }
}

ymaps.ready(init);