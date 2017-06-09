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
            available: 0,
            photos: [],
            hasMoreItems: true,
            coords: MAP_CENTER,
            offset: 0,
            count: 50,
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
                    coords, offset: 0, photos: [],
                });
            });


            myPlacemark.events.add('dragend', () => {
                const coords = myPlacemark.geometry.getCoordinates();
                updateMyPlacemark(coords);
                this.setState({
                    coords, offset: 0, photos: [],
                });
            });
        };

        ymaps.ready(init);
    }

    loadItems(page) {
        const self = this;
        if (this.state.offset <= this.state.available) {
            getPhotos({
                coords: this.state.coords,
                count: this.state.count,
                radius: 1000,
                offset: this.state.offset })
                .then((resp) => {
                    if (resp.photos) {
                        const photos = self.state.photos;
                        resp.photos.map((photo) => {
                            photos.push(photo);
                        });
                        this.setState({
                            offset: this.state.offset + this.state.count,
                            available: resp.photosAvailable,
                        });
                    }
                });
        } else {
            this.setState({
                hasMoreItems: false,
            });
        }
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
        return (
            <InfiniteScroll
                pageStart={0}
                loadMore={this.loadItems.bind(this)}
                hasMore={this.state.hasMoreItems}
                loader={loader}
                useWindow={false}>

                
                {items}
            </InfiniteScroll>
        );
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('content'),
    );
