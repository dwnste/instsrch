import fetchJsonp from 'fetch-jsonp'

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

const getData = (id) => {
    const url = `//api.vk.com/method/users.get?user_ids=${id}&fields=photo_200&name_case=nom`
    return fetchJsonp(url)
            .then( response => response.json())
            .then( ({ response }) => {
                        const [data, ...length] = response;
                        return {data, length};
                    })
            .catch( ex => console.log('parsing failed', ex) );
};

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


const updateMyPlacemark = (coords, placemark) => {
    placemark.geometry
        .setCoordinates(coords);
    placemark.properties
        .set('iconCaption', 'поиск...');
    getGeoObject(coords)
        .then(firstGeoObject =>
            placemark.properties
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
                    balloonContent: firstGeoObject.getAddressLine(),
                }),
    );
};


export { getPhotos, getData, createPlacemark, updateMyPlacemark };

