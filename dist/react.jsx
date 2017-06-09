import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import ymaps from 'ymaps';
import { getPhotos, createPlacemark, getGeoObject } from '../lib';

moment.locale('ru');

const MAP_CENTER = [55.753994, 37.622093];

class App extends Component {
    constructor(props) {
        super(props);

        this.state = {
            photos: [],
            hasMoreItems: true,
            nextHref: null,
            coords: MAP_CENTER,
        };

        let myPlacemark,
            myMap;

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
                            balloonContent: firstGeoObject.getAddressLine(),
                        }),
            );
        };

        const init = () => {
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
                this.setState({
                    coords,
                });
            });


            myPlacemark.events.add('dragend', () => {
                const coords = myPlacemark.geometry.getCoordinates();
                updateMyPlacemark(coords);
                this.setState({
                    coords,
                });
            });
        };

        ymaps.ready(init);
    }

    loadItems(page) {
        const self = this;

        getPhotos({ coords: MAP_CENTER, count: 50, radius: 1000, offset: 0 })
            .then((resp) => {
                if (resp.photos) {
                    const photos = self.state.photos;
                    resp.photos.map((photo) => {

                        photos.push(photo);
                    });
                }
            });
    }

    render() {
        const loader = <div className="loader">Loading ...</div>;
        const items = this.state.photos.map((photo, i) =>
                <div className="image" key={i}>
                    <img src={photo.src} />
                    <a href={photo.src_big} target="_blank">
                        {moment(photo.created * 1000).format('L')}
                    </a>
                </div>,
        );
        console.log(items)
        return (
            <InfiniteScroll
                pageStart={0}
                loadMore={this.loadItems.bind(this)}
                hasMore={this.state.hasMoreItems}
                loader={loader}>

                
                {items}
            </InfiniteScroll>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('content'),
    );
