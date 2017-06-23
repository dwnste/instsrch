import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import { withRouter } from 'react-router';
import { BrowserRouter as Router, Link, Route, IndexRoute } from 'react-router-dom';
import { PropTypes } from 'prop-types';
import { Map, Marker } from 'yandex-map-react';
import InfiniteScroll from 'react-infinite-scroller';

import moment from 'moment';
import * as qs from 'query-string';

import { getPhotos } from 'lib';


moment.locale('ru');

const MAP_CENTER = [55.753994, 37.622093];


function Photo(props) {
    return <div className="image">
                <img src={props.photo.src} />
                <Router>
                    <Link to={`/photo/${props.photo.pid}`}>
                        {moment(props.photo.created * 1000).format('L')}
                    </Link>
                </Router>
            </div>;
}


function Loader() {
    return <div className="loader">Loading ...</div>;
}


class App extends Component {
    static propTypes = {
        match: PropTypes.object.isRequired,
        location: PropTypes.object.isRequired,
        history: PropTypes.object.isRequired
    }
    
    defaultCoordinates = (
        ('lat' in (qs.parse(this.props.location.search)) &&
        'lng' in (qs.parse(this.props.location.search)))
        ?
        [
            parseFloat(qs.parse(this.props.location.search).lat),
            parseFloat(qs.parse(this.props.location.search).lng)
        ]
        :
        MAP_CENTER
    );

    state = {
        available: 0,
        photos: [],
        coords: this.defaultCoordinates,
        mapCoords: this.defaultCoordinates,
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
                    firstGeoObject.getThoroughfare() || firstGeoObject.getPremise()]
                .filter(Boolean)
                .join(', ');

                const balloonContent = firstGeoObject.getAddressLine();
                return { balloonContent, iconCaption };
            });
    }

    updatePlacemark(coords) {
        this.getPlacemarkContent()
            .then((content) => {
                if (this.state.coords === coords) {
                    this.setState({
                        ...content,
                    });
                } else {
                    this.props.history.push(`/react/?lat=${coords[0]}&lng=${coords[1]}`)
                    this.setState({
                        photos: [],
                        coords,
                        offset: 0,
                        ...content,
                    });
                }
            });
    }

    loadItems() {
        getPhotos({ ...this.state })
            .then((resp) => {
                if (resp.photos) {
                    this.setState({
                        photos: this.state.photos.concat(resp.photos),
                        offset: this.state.offset + this.state.count,
                        available: resp.photosAvailable,
                    });
                }
            });
    }

    render() {
        const { match, location, history } = this.props
        return <div>
            <div id="map">
                <Map
                    center={ this.state.mapCoords } width='100%' height='350px' zoom={10}
                    state={{ controls: ['default'] }}
                    onClick={ e => this.updatePlacemark(e.get('coords')) }
                    onAPIAvailable={
                        api => {
                            this.setState({ api });
                            this.updatePlacemark(this.state.coords);
                        }
                    }>
                    <Marker
                        onDragend={
                            e => this.updatePlacemark(e.originalEvent.target.geometry.getCoordinates())
                        }
                        lat={ this.state.coords[0] }
                        lon={ this.state.coords[1] }
                        properties={{
                            iconCaption: this.state.iconCaption,
                            balloonContent: this.state.balloonContent }}
                            options={{
                                draggable: true,
                                preset: 'islands#blackDotIconWithCaption'
                            }}
                        />
                </Map>
            </div>
            <div id="content">
                <InfiniteScroll
                    pageStart={0}
                    loadMore={ ::this.loadItems }
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
        <Router>
            <Route path='/' component={ App }></Route>
        </Router>,
    document.getElementById('root'),
);
