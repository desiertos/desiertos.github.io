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

            provinces : '../data/maps/arg.json',
            mask : '../data/maps/arg_mask.json'

        },

        layers : {

        }

    },

    data : {

        provinces : null,
        mask : null
    },

    map_obj : null,

    utils : {

        load_data : function() {

            Promise.all([

                fetch(app.params.geojsons.provinces, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.mask, {mode: 'cors'}).then( response => response.json())
        
            ])
              .then( data => app.ctrl.begin(data))
              .catch( error => console.log( error ) );

            //   .catch( error => console.log( error ) );

            // fetch(app.params.geojsons.mask, {mode: 'cors'})
            //   .then( response => response.json())
            //   .then( data => app.ctrl.begin(data))
            //   .catch( error => console.log( error ) );

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
                          'fill-color': 'transparent',
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
                        'paint': {'fill-color': 'ghostwhite'},
                    });

                }

            }



        }



    },

    scroller : {

        config : function() {

            enterView({

                selector: '.story-step',

                enter: function(el) {

                    const step = el.dataset.step;

                    app.scroller.render[step]();

                },

                exit: function(el) {
                    console.log("saiu, ", el.dataset.step);
                },

                offset: 0.5, // enter at middle of viewport
                //once: true, // trigger just once
            });

        },

        render : {

            'abertura' : function() {

                app.map_obj.setPaintProperty('provinces', 'fill-color', 'tomato');

            },

            'segundo' : function() {

                app.map_obj.setPaintProperty('provinces', 'fill-pattern', 'pattern');

            }



        }



    },

    ctrl : {

        init : function() {

            app.utils.load_data();
            
        },

        begin : function(data) {

            console.log(data);

            app.data.provinces = data[0];
            app.data.mask = data[1];

            mapboxgl.accessToken = app.params.mapbox.token;

            app.map_obj = new mapboxgl.Map({
                container: 'map', // container id
                style: app.params.mapbox.style, // style URL
                center: [-40.74735, -64], // starting position [lng, lat]
                zoom: 3 // starting zoom
            });

            app.map_obj.on('load', function() {

                app.utils.map.provinces.initialize();
                app.utils.map.world_mask.initialize();

                //fit map to continental Argentina
                app.map_obj.fitBounds([
                    [-75, -21],
                    [-53, -56]]
                );

                app.scroller.config();


                // image

                // Load an image to use as the pattern
                app.map_obj.loadImage(
                    '../img/semi_bosque.PNG',
                    function (err, image) {
                        // Throw an error if something went wrong
                        if (err) throw err;
                    
                        // Declare the image
                        app.map_obj.addImage('pattern', image);
                        
                        // Use it

                    }
                        
                );
                       
            });

        }

    }

}

app.ctrl.init();