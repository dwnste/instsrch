import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import moment from 'moment';
import { Map, Marker } from 'yandex-map-react';
import { getPhotos } from 'lib';

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
        iconCaption: 'ищем...',
    }

    getPlacemarkContent() {
        return this.state.api.geocode(this.state.coords)
            .then(res => res.geoObjects.get(0))
            .then((firstGeoObject) => {
                const iconCaption = [
                    firstGeoObject.getLocalities().length
                        ? firstGeoObject.getLocalities()
                        : firstGeoObject.getAdministrativeAreas(),
                    firstGeoObject.getThoroughfare()
                    || firstGeoObject.getPremise(),
                ].filter(Boolean)
                .join(', ');
                const balloonContent = firstGeoObject.getAddressLine();
                return { balloonContent, iconCaption };
            });
    }

    updatePlacemark(coords) {
        this.getPlacemarkContent()
            .then((content) => {
                this.setState({
                    photos: [],
                    coords,
                    offset: 0,
                    ...content,
                });
            });
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

    onMapClick(e) {
        this.updatePlacemark(e.get('coords'));
    }

    onPlacemarkDragend(e) {
        this.updatePlacemark(e.originalEvent.target.geometry.getCoordinates());
    }

    render() {
        return <div>
            <div id="map">
                <Map onAPIAvailable={ (api) => { this.setState({ api }); this.updatePlacemark(MAP_CENTER); }}onClick={ e => this.onMapClick(e) } center={MAP_CENTER} width={'100%'} height={'270px'} zoom={10} state={{ controls: ['default'] }}>
                    <Marker onDragend={ e => this.onPlacemarkDragend(e) } lat={ this.state.coords[0] } lon={ this.state.coords[1] } properties={{ iconCaption: this.state.iconCaption, balloonContent: this.state.balloonContent }} options={{ draggable: true, preset: 'islands#blackDotIconWithCaption' }} balloonState={this.state.balloonState} />
                </Map>
            </div>
            <div id="content">
                <InfiniteScroll
                    pageStart={0}
                    loadMore={this.loadItems.bind(this)}
                    hasMore={this.state.offset <= this.state.available}
                    loader={<Loader />}
                    useWindow={false}>
                        <div className="scroll_container">
                            {this.state.photos.map((photo, i) => <Photo photo={photo} key={i} />)}
                        </div>
                </InfiniteScroll>
            </div>
        </div>;
    }
}

ReactDOM.render(
    <App />,
    document.getElementById('root'),
);
