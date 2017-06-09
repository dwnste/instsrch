import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import ymaps from 'ymaps';
import { getPhotos, createPlacemark, updateMyPlacemark } from '../lib';

moment.locale('ru');

let myPlacemark;

const MAP_CENTER = [55.753994, 37.622093];


class Photo extends Component {
    render() {
        return <div className="image">
                    <img src={this.props.photo.src} />
                    <a href={this.props.photo.src_big} target="_blank">
                        {moment(this.props.photo.created * 1000).format('L')}
                    </a>
                </div>;
    }
}

class Loader extends Component {
    render() {
        return <div className="loader">Loading ...</div>;
    }
}


class App extends Component {
    constructor(...props) {
        super(...props);

        this.state = {
            available: 0,
            photos: [],
            coords: MAP_CENTER,
            offset: 0,
            count: 50,
            radius: 1000,
        };
    }

    loadItems(page) {
        const self = this;
            getPhotos({ ...this.state })
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
    }

    render() {
        return <InfiniteScroll
            pageStart={0}
            loadMore={this.loadItems.bind(this)}
            hasMore={this.state.offset <= this.state.available}
            loader={<Loader />}
            useWindow={false}>
            <div style={{ overflowAnchor: 'none' }, {overflow: 'auto'}}>
                {this.state.photos.map((photo, i) => <Photo photo={photo} key={i} />)}
            </div>
        </InfiniteScroll>;
    }
    componentDidMount() {
        ymaps.ready(() => {
            // инициализация карты
            this.myMap = new ymaps.Map('map', {
                center: MAP_CENTER,
                zoom: 9,
            }, {
                searchControlProvider: 'yandex#search',
            });

            this.mapClickHandler = (e) => {
                const coords = e.get('coords');
                updateMyPlacemark(coords, myPlacemark);
                this.setState({
                    coords, offset: 0, photos: []
                });
            };

            this.myMap.events.add('click', this.mapClickHandler);
            // ставим метку и грузим фотографии, когда карта загрузилась
            const coords = MAP_CENTER;
            myPlacemark = createPlacemark(coords);
            this.myMap.geoObjects.add(myPlacemark);
            updateMyPlacemark(coords, myPlacemark);


            myPlacemark.events.add('dragend', () => {
                const coords = myPlacemark.geometry.getCoordinates();
                updateMyPlacemark(coords, myPlacemark);
                this.setState({
                    coords, offset: 0, photos: [],
                });
            });
        });
    }
    componentWillUnmount() {
        this.myMap.events.remove('click', this.mapClickHandler);
        this.myMap.destroy();
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('content'),
    );
