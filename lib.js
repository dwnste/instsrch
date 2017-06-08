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




export {getPhotos, createPlacemark, getGeoObject}