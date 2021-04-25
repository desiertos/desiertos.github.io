const app = {

    refs : {

    },

    sels : {

        d3 : {},
        js : {}

    },

    params : {

        mapbox : {

            token : 'pk.eyJ1IjoidGlhZ29tYnAiLCJhIjoiY2thdjJmajYzMHR1YzJ5b2huM2pscjdreCJ9.oT7nAiasQnIMjhUB-VFvmw',
            style : 'mapbox://styles/tiagombp/ckn87x7w014i517qodqof85bi',
            start : {

                center : {

                    lng  : -64.5529,
                    lat  : -33.9968

                },

                zoom : 5.24

            }

        },

        geojsons : {

            provinces : '../data/maps/arg.json',
            departments : '../data/maps/arg_dept.json',
            mask : '../data/maps/arg_mask.json'

        },

        fopea_data : '../data/output.json',

        layers : {

        },

        patterns : {

            path1 : '../img/forests/',
            path2 : '../img/trees/',
            names : ['tipo1', 'tipo2', 'tipo3', 'tipo4']

        },

        colors : {

            desierto : null,
            semidesierto : null,
            semibosque : null,
            bosque : null

        }

    },

    data : {

        provinces : null,
        departaments : null,
        mask : null,
        fopea_data : null

    },

    map_obj : null,

    utils : {

        load_data : function() {

            Promise.all([

                fetch(app.params.geojsons.departments, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.mask, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.provinces, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.fopea_data, {mode: 'cors'}).then( response => response.json())
        
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

        colors : {

            get_from_css : function(color) {

                const style = getComputedStyle( document.documentElement );
                const value = style.getPropertyValue( '--color-' + color );
                return value;
    
            },

            populate : function() {

                Object.keys(app.params.colors).forEach(color => {

                    app.params.colors[color] = app.utils.colors.get_from_css(color);
    
                });

            }

        },

        map : {

            departments : {

                initialize : function() {

                    app.map_obj.addSource('departments', {
                        type: 'geojson',
                        'data' : app.data.departments
                    });

                    app.map_obj.addLayer({
                        'id': 'departments',
                        'type': 'fill',
                        'source': 'departments',
                        'layout': {},
                        'paint': {
                          'fill-color': 'transparent',
                          'fill-opacity': 0.5,
                          'fill-outline-color': 'ghostwhite'
                        }
                    }, 'road-label'); // puts behind road-label

                }

            },

            province : {

                initialize : function() {

                    app.map_obj.addSource('provinces', {
                        type: 'geojson',
                        'data' : app.data.provinces
                    });

                    app.map_obj.addLayer({
                        'id': 'provinces',
                        'type': 'line',
                        'source': 'provinces',
                        'layout': {},
                        'paint': {
                          'line-width': 0,
                          'line-color': 'black'
                        }
                    }, 'road-label'); // puts behind road-label

                }

            },

            fog_of_war : {

                initialize : function() {

                    app.map_obj.addLayer({
                        'id': 'fog_of_war',
                        'type': 'fill',
                        'source': 'provinces',
                        'paint': {
                          'fill-color': 'ghostwhite',
                          'fill-opacity': 0,
                          'fill-outline-color': '#555'
                        },
                        'filter': ['!=', 'province', '']
                    }); // puts behind road-label

                },

                toggle : function(department) {

                    let opacity = 0;

                    if (department != '') {

                        opacity = 1;

                        app.map_obj.setFilter(
                            'fog_of_war', [
                                '!=',
                                ['get', 'nam'],
                                department
                            ]);


                    }

                    app.map_obj.setPaintProperty('fog_of_war', 'fill-opacity', opacity);



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
                    [-53, -56]],

                    { 
                        pitch: 0,
                        bearing : 0
                    }
                );

            },

            set_initial_view : function() {

                app.map_obj.flyTo(
                    {
                        center: [
                            app.params.mapbox.start.center.lng, 
                            app.params.mapbox.start.center.lat
                        ], 
                        zoom: app.params.mapbox.start.zoom,
                        bearing: 0,
                        pitch: 0
                    }
                );

                //app.map_obj.setCenter(app.params.mapbox.start.center);
                //app.map_obj.setZoom(app.params.mapbox.start.zoom);

            },

            highlight_feature : function(province) {


                let provinces = app.map_obj.querySourceFeatures('provinces', {
                    sourceLayer: 'provinces'});

                
            
                let desired_features = provinces.filter(d => d.properties.nam == province)[0];

                // make them into a feature collection and then combine, in case the feature spans more than one tileset(it will appear more than one time in the filter results above);

                //let collection = turf.featureCollection(desired_features);
                //let combined = turf.combine(collection);

            
                // let bbox_highlighted = [
                //     [highlighted.properties.xmin, highlighted.properties.ymin], 
                //     [highlighted.properties.xmax, highlighted.properties.ymax]
                // ];
            
                // or we could have used 
                let bbox_highlighted = turf.bbox(desired_features);//combined);


                
                console.log(bbox_highlighted);
            
                app.map_obj.fitBounds(
                    bbox_highlighted, 
                    {
                        linear : false, // false means the map transitions using map.flyTo()
                        speed: 1, 
                        padding: {top: 30, bottom: 30, left: 30, right: 30},
                        pitch: 60,
                        bearing: 30
                    });

            }

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

        // por em outro lugar?

        render : {

            'abertura' : function() {

                app.map_obj.setPaintProperty('departments', 'fill-pattern', null);
                app.map_obj.setPaintProperty('departments', 'fill-color', ['get', 'color']);
                app.map_obj.setPaintProperty('departments', 'fill-outline-color', 'ghostwhite');
                app.map_obj.setPaintProperty('departments', 'fill-opacity', .5);
                app.utils.map.set_initial_view();

                app.interactions.story.toggle_visibility("dashboard_button");

            },

            'segundo' : function() {

                app.utils.map.fit_Argentina();

                app.map_obj.setPaintProperty('departments', 'fill-pattern', ['get', 'tipo']);
                app.map_obj.setPaintProperty('departments', 'fill-opacity', 1);
                app.utils.map.fog_of_war.toggle('')
                app.map_obj.setPaintProperty('provinces', 'line-width', 0);

                app.interactions.story.toggle_visibility("dashboard_button");

            },

            'destaque' : function() {

                app.map_obj.setPaintProperty('provinces', 'line-width', 5);
                app.utils.map.highlight_feature('Salta');
                app.utils.map.fog_of_war.toggle('Salta')

            }



        }

    },

    interactions : {

        story : {

            refs : {
    
                dashboard_button : 'a.go-to-dashboard',

    
            },
    
            toggle_visibility : function(name){
    
                const ref = app.interactions.story.refs[name];
    
                const elem = document.querySelector(ref);
                elem.classList.toggle('hidden');
    
            },

            search_bar : {

                refs : {

                    datalist_search : 'datalist#locations',
                    input : '#location-search',
                    search_button : '#story-search-place',
                    destination_step : '#location-card'

                },

                populate_datalist : function() {

                    const ref = app.interactions.story.search_bar.refs.datalist_search;
    
                    const parent = document.querySelector(ref);
    
                    const data = app.data.fopea_data.lista_locais;
    
                    data.forEach(row => {
    
                        const new_option = document.createElement("option");
    
                        new_option.value = row.text;
                        new_option.dataset.name = row.localidade;
                        new_option.dataset.tipoLocalidade = row.tipo;
    
                        parent.appendChild(new_option);
    
                    })
    
                },

                listen_search : function() {

                    const ref_btn = app.interactions.story.search_bar.refs.search_button;
                    const ref_input = app.interactions.story.search_bar.refs.input;

                    const btn = document.querySelector(ref_btn);
                    const input_el = document.querySelector(ref_input);

                    console.log(btn);

                    btn.addEventListener('click', function(e) {

                        //console.log("hi!")

                        const search_content = input_el.value;

                        //console.log(input_el.value);

                        if (
                            app.data.fopea_data.lista_locais
                              .map(row => row.text)
                              .indexOf(search_content) > 0
                        ) {

                            console.log("valor detectado", search_content);

                            const local = app.data.fopea_data.lista_locais.filter(row => row.text == search_content)[0];

                            console.log("tipo: ", local.tipo);
                            console.log("nome: ", local.local);

                            const data = app.data.fopea_data[local.tipo].filter(d => d.local == local.local)

                            console.log("Dados: ", data);

                            const destination_step = document.querySelector(
                                app.interactions.story.search_bar.refs.destination_step
                            );

                            destination_step.scrollIntoView({behavior: "smooth"});


                        } else {

                            console.log("Valor invalido, chico")

                        }


                    });

                },





            }

        },

    },

    vis : {

        refs : {

            svg : '',
            container : ''
        },
    
        sels : {
    
            d3 : {},
            js : {}
    
        },

    },

    ctrl : {

        init : function() {

            app.utils.colors.populate();
            app.scroller.steps.get();
            app.utils.load_data();
            
        },

        monitors : function() {

            app.interactions.story.search_bar.listen_search();

        },

        begin : function(data) {

            console.log(data);

            app.data.departments = data[0];
            app.data.mask = data[1];
            app.data.provinces = data[2];
            app.data.fopea_data = data[3];

            // pre-process departments data
            app.data.departments.features.forEach(el => {

                const types = Object.keys(app.params.colors);

                const id = el.properties.gid;
                const indice = ( (id - 1) % 4 );

                const tipo = app.params.patterns.names[indice];
                const type = types[indice];
                const color = app.params.colors[type];

                el.properties["tipo"] = tipo;
                el.properties["color"] = color;

            })

            mapboxgl.accessToken = app.params.mapbox.token;

            app.map_obj = new mapboxgl.Map({
                container: 'map', // container id
                style: app.params.mapbox.style, // style URL
                center: [
                    app.params.mapbox.start.center.lng, 
                    app.params.mapbox.start.center.lat
                ], // starting position [lng, lat]
                zoom: app.params.mapbox.start.zoom // starting zoom
            });

            app.map_obj.on('load', function() {

                app.utils.map.departments.initialize();
                app.utils.map.province.initialize();
                app.utils.map.world_mask.initialize();
                app.utils.map.fog_of_war.initialize(); 

                //fit map to continental Argentina
                app.utils.map.fit_Argentina();

                // inicializa o scroller
                app.scroller.config();

                // image

                // Load images to use as patterns
                app.utils.load_patterns();
              
            });

            app.interactions.story.search_bar.populate_datalist();
            app.ctrl.monitors();

        },

        interactions : {

            story : {},

            vis : {}

        }

    }

}

app.ctrl.init();