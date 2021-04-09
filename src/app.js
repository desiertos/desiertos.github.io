const app = {

    refs : {},

    sels : {

        d3 : {},
        js : {}

    },

    params : {

        mapbox : {

            token : 'pk.eyJ1IjoidGlhZ29tYnAiLCJhIjoiY2thdjJmajYzMHR1YzJ5b2huM2pscjdreCJ9.oT7nAiasQnIMjhUB-VFvmw',
            style : 'mapbox://styles/tiagombp/ckn87x7w014i517qodqof85bi'

        },

        geojsons : {

            mask : '../data/maps/arg.json'

        },

        layers : {

        }

    },

    data : {},

    map_obj : null,

    utils : {

        load_data : function() {

            fetch(app.params.geojsons.mask, {mode: 'cors'})
              .then( response => response.json())
              .then( data => app.ctrl.begin(data))
              .catch( error => console.log( error ) );

        },

        map : {

            provinces : {

                initialize : function() {

                    app.map_obj.addSource('provinces', {
                        type: 'geojson',
                        'data' : app.data.provinces
                    });

                    app.map_obj.addLayer({
                        'id': 'provinces',
                        'type': 'fill',
                        'source': 'provinces',
                        'layout': {},
                        'paint': {
                          'fill-color': 'tomato',
                          'fill-opacity': 0.5
                        }
                    });

                }

            },

            world_mask : {

                initialize : function() {

                    app.map_obj.addSource('mask', {
                        type: 'geojson',
                        'data' : app.data.mask
                    });

                    app.map_obj.addLayer({
                        'id': 'mask',
                        'type': 'fill',
                        'source': 'mask',
                        'layout': {},
                        'paint': {
                          'fill-color': 'ghostwhite',
                          'fill-opacity': 1
                        }
                    });

                }

            }



        }



    },

    ctrl : {

        init : function() {

            app.utils.load_data();
            
        },

        begin : function(data) {

            console.log(data);

            app.data = data;

            mapboxgl.accessToken = app.params.mapbox.token;

            app.map_obj = new mapboxgl.Map({
                container: 'map', // container id
                style: app.params.mapbox.style, // style URL
                center: [-40.678, -54.409], // starting position [lng, lat]
                zoom: 3 // starting zoom
            });

            app.map_obj.on('load', function() {

                app.utils.map.provinces.initialize();

            });

        }

    }

}

app.ctrl.init();