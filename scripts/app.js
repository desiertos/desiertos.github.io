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

        },

        patterns : {

            path1 : '../img/forests/',
            path2 : '../img/trees/',
            names : ['tipo1', 'tipo2', 'tipo3', 'tipo4']

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

        load_patterns : function() {

            const path = app.params.patterns.path1;
            const names = app.params.patterns.names;

            names.forEach(name => {

                app.map_obj.loadImage(
                    path + name + ".png",
                    function (err, image) {
                        // Throw an error if something went wrong
                        if (err) throw err;
                    
                        // Declare the image
                        app.map_obj.addImage(name, image);
                        
                        // Use it
    
                    }
                        
                );




            })

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
                          'fill-opacity': 0.5,
                          'fill-outline-color': 'ghostwhite'
                        }
                    }, 'road-label'); // puts behind road-label

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

            },

            fit_Argentina : function() {

                app.map_obj.fitBounds([
                    [-75, -21],
                    [-53, -56]]
                );

            },



        }



    },

    scroller : {

        steps : {

            list : null,

            get : function() {

                const steps_html = document.querySelector(".story-container").children;

                app.scroller.steps.list = Array.from(steps_html).map(d => d.dataset.step);

            }

        },

        config : function() {

            enterView({

                selector: '.story-step',

                enter: function(el) {

                    const step = el.dataset.step;

                    app.scroller.render[step]();

                },

                exit: function(el) {

                    const step = el.dataset.step;

                    const index_step = app.scroller.steps.list.indexOf(step);

                    const step_anterior = app.scroller.steps.list[index_step - 1];

                    app.scroller.render[step_anterior]();

                    console.log("saiu, ", step_anterior);
                },

                offset: 0.5, // enter at middle of viewport
                //once: true, // trigger just once
            });

        },

        render : {

            'abertura' : function() {

                app.map_obj.setPaintProperty('provinces', 'fill-pattern', null);
                app.map_obj.setPaintProperty('provinces', 'fill-color', 'tomato');
                app.map_obj.setPaintProperty('provinces', 'fill-outline-color', 'ghostwhite');
                app.map_obj.setPaintProperty('provinces', 'fill-opacity', .5)

            },

            'segundo' : function() {

                app.map_obj.setPaintProperty('provinces', 'fill-pattern', ['get', 'tipo']);
                app.map_obj.setPaintProperty('provinces', 'fill-opacity', 1)

            }



        }



    },

    ctrl : {

        init : function() {

            app.scroller.steps.get();
            app.utils.load_data();
            
        },

        begin : function(data) {

            console.log(data);

            app.data.provinces = data[0];
            app.data.mask = data[1];

            // pre-process provinces data
            app.data.provinces.features.forEach(el => {

                const id = el.properties.gid;
                const indice = ( (id - 1) % 4 );

                const tipo = app.params.patterns.names[indice];

                el.properties["tipo"] = tipo;

            })

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
                app.utils.map.fit_Argentina();

                // inicializa o scroller
                app.scroller.config();

                // image

                // Load images to use as patterns
                app.utils.load_patterns();

                       
            });

        }

    }

}

app.ctrl.init();