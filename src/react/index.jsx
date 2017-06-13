import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import ymaps from 'ymaps';
import { getPhotos, createPlacemark, updateMyPlacemark } from 'lib';

moment.locale('ru');

const MAP_CENTER = [55.753994, 37.622093];


function Photo(props) {
    return <div className="image">
                <img src={props.photo.src} />
                <a href={props.photo.src_big} target="_blank">
                    {moment(props.photo.created * 1000).format('L')}
                </a>
            </div>;
}


function Loader() {
    return <div className="loader">Loading ...</div>;
}


class App extends Component {
    state = {
        available: 0,
        photos: [],
        coords: MAP_CENTER,
        offset: 0,
        count: 50,
        radius: 1000,
    }

    update = (coords) => {
        updateMyPlacemark(coords, this.myPlacemark);
        this.setState({
            coords, offset: 0, photos: []
        });
    }

    myPlacemark;

    mapClickHandler = (e) => {
        this.update(e.get('coords'));
    };

    componentDidMount() {
        ymaps.ready(() => {
            // инициализация карты
            this.myMap = new ymaps.Map('map', {
                center: MAP_CENTER,
                zoom: 9,
            }, {
                searchControlProvider: 'yandex#search',
            });

            this.myMap.events.add('click', this.mapClickHandler);
            // ставим метку и грузим фотографии, когда карта загрузилась
            this.myPlacemark = createPlacemark(MAP_CENTER); // создаем метку
            this.myMap.geoObjects.add(this.myPlacemark); // добавляем на карту
            updateMyPlacemark(MAP_CENTER, this.myPlacemark); // обновляем текст метки

            this.myPlacemark.events.add('dragend', () => {
                this.update(this.myPlacemark.geometry.getCoordinates());
            });
        });
    }

    componentWillUnmount() {
        this.myMap.events.remove('click', this.mapClickHandler);
        this.myMap.destroy();
    }

    loadItems() {
        getPhotos({ ...this.state })
            .then((resp) => {
                if (resp.photos) {
                    resp.photos.map((photo) => {
                        this.state.photos.push(photo);
                    });

                    this.setState({
                        offset: this.state.offset + this.state.count,
                        available: resp.photosAvailable,
                    });
                }
            });
    }

    render() {
        return <InfiniteScroll
            pageStart={0}
            loadMore={this.loadItems.bind(this)}
            hasMore={this.state.offset <= this.state.available}
            loader={<Loader />}
            useWindow={false}>
                <div className="scroll_container">
                    {this.state.photos.map((photo, i) => <Photo photo={photo} key={i} />)}
                </div>
        </InfiniteScroll>;
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('content'),
);
