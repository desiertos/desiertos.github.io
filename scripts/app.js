const app = {

    refs : {

    },

    sels : {

        d3 : {},
        js : {}

    },

    params : {

        categories : ['desierto', 'semidesierto', 'semibosque', 'bosque'],

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

            provincia : '../data/maps/prov2.json',
            localidad : '../data/maps/mun2.json',
            mask : '../data/maps/arg_mask.json'

        },

        //fopea_data : '../data/output.json',
        place_names : '../data/places.json',

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

        provincia : null,
        localidad : null,
        mask : null,
        fopea_data : null,
        max_pob : null,
        min_pob : null

    },

    map_obj : null,

    utils : {

        load_data : function() {

            Promise.all([

                fetch(app.params.geojsons.localidad, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.mask, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.provincia, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.place_names, {mode: 'cors'}).then( response => response.json())
        
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

        get_category_from_data : function(local, data) {

            console.log(local, data);

            let location_category;

            if (local.tipo == 'provincia') {

                const cat = data['cat_media'];

                if (cat == 1) {

                    location_category = 'desierto';

                } else if (cat <= 2) {

                    location_category = 'semidesierto';

                } else if (cat <= 3) {

                    location_category = 'semibosque';

                } else location_category = 'bosque'

            } else {

                const categories = app.params.categories;

                location_category = categories[ data['categoria'] - 1 ];
                
            }

            return location_category;

        },

        generate_random_remaining_locations : function(remaining_categories) {

            const data = app.data.fopea_data.localidad;
            const state = app.vis.location_card.state;
            const output = [];

            remaining_categories.forEach(category => {

                const cat_numeric = '' + (app.params.categories.indexOf(category) + 1);

                console.log(cat_numeric);

                const available_cities = data
                  .filter(d => d.provincia == state.user_location_province)
                  .filter(d => d.categoria == cat_numeric)
                  .map(d => (
                      {
                          local : d.local,
                          text  : d.nam
                      })
                    );

                const amount_available_cities = available_cities.length;

                console.log(available_cities);

                // get a random city

                const index_selected = Math.floor(Math.random() * amount_available_cities);

                output.push(available_cities[index_selected]);

            })

            return output;

        }

    },

    map : {

        current_popups : {
            
            user_location : null, 
            remaining : [],

        },

        localidad : {

            initialize : function() {

                app.map_obj.addSource('localidad', {
                    type: 'geojson',
                    'data' : app.data.localidad
                });

                app.map_obj.addLayer({
                    'id': 'localidad',
                    'type': 'circle',
                    'source': 'localidad',
                    'layout': {},
                    'paint': {
                      'circle-color': ['get', 'color_real'],
                      'circle-opacity': 0.5,
                      'circle-stroke-color' : ['get', 'color_real'],
                      'circle-stroke-width' : 1,
                      'circle-stroke-opacity' : 1,
                      'circle-radius' : [
                            'let',
                            'sqrt_pob',
                            ['sqrt', ['to-number', ['get', 'pob'] ] ],

                            [
                                'interpolate', ['linear'], ['zoom'],

                                3, [
                                    'interpolate', ['linear'],
                                    ['var', 'sqrt_pob'],
                                    //0, 0,
                                    Math.sqrt(app.data.min_pob), 2,
                                    Math.sqrt(app.data.max_pob), 15
                                ],

                                12, [
                                    'interpolate', ['linear'],
                                    ['var', 'sqrt_pob'],
                                    //0, 0,
                                    Math.sqrt(app.data.min_pob), 6,
                                    Math.sqrt(app.data.max_pob), 45
                                ]
                                
                            ]
                        ]
                    }
                }, 'road-label'); // puts behind road-label

                app.map_obj.addLayer({
                    'id': 'localidad-highlight',
                    'type': 'circle',
                    'source': 'localidad',
                    'layout': {},
                    'paint': {
                      'circle-color': 'transparent',
                      'circle-stroke-color' : '#999',
                      'circle-stroke-width' : 1,
                      'circle-radius' : [
                            'let',
                            'sqrt_pob',
                            ['sqrt', ['to-number', ['get', 'pob'] ] ],

                            [
                                'interpolate', ['linear'], ['zoom'],

                                3, [
                                    'interpolate', ['linear'],
                                    ['var', 'sqrt_pob'],
                                    //0, 0,
                                    Math.sqrt(app.data.min_pob), 2 + 4,
                                    Math.sqrt(app.data.max_pob), 15 + 4
                                ],

                                12, [
                                    'interpolate', ['linear'],
                                    ['var', 'sqrt_pob'],
                                    //0, 0,
                                    Math.sqrt(app.data.min_pob), 6 + 4,
                                    Math.sqrt(app.data.max_pob), 45 + 4
                                ]
                                
                            ]
                        ]
                    },
                    'filter': ['==', 'localidad', '']
                }, 'road-label'); // puts behind road-label

            },

            toggle_highlight_border : function(localidad) {

                app.map_obj.setFilter(
                    'localidad-highlight', [
                        '==',
                        ['get', 'local'],
                        localidad
                ]);

            },

            style_selected_city : function(localidad) {

                app.map_obj.setPaintProperty(
                    
                    'localidad', 
                    'circle-opacity',
                    [
                        'case',
                        [
                            '==',
                            ['get', 'local'],
                            localidad
                        ],
                        1,
                        .5
                    ]
                )

                app.map_obj.setPaintProperty(
                    
                    'localidad', 
                    'circle-stroke-color',
                    [
                        'case',
                        [
                            '==',
                            ['get', 'local'],
                            localidad
                        ],
                        '#212121',
                        ['get', 'color_real']
                        
                    ]
                )

                app.map_obj.setPaintProperty(
                    
                    'localidad', 
                    'circle-stroke-width',
                    [
                        'case',
                        [
                            '==',
                            ['get', 'local'],
                            localidad
                        ],
                        2,
                        1
                    ]
                )

            }

        },

        province : {

            initialize : function() {

                app.map_obj.addSource('provincia', {
                    type: 'geojson',
                    'data' : app.data.provincia
                });

                app.map_obj.addLayer({
                    'id': 'provincia',
                    'type': 'fill',
                    'source': 'provincia',
                    'layout': {},
                    'paint': {
                      'fill-outline-color': '#AAA',
                      'fill-color': '#F0E9DF'
                    }
                }, 'localidad'); 

                app.map_obj.addLayer({
                    'id': 'provincia-border',
                    'type': 'line',
                    'source': 'provincia',
                    'layout': {},
                    'paint': {
                      'line-color': '#666',
                      'line-width': 2
                    },
                    'filter': ['==', 'provincia', '']}); // puts behind road-label

            },

            toggle_highlight_border_provincia : function(provincia) {

                app.map_obj.setFilter(
                    'provincia-border', [
                        '==',
                        ['get', 'nam'],
                        provincia
                ]);

            }

        },

        fog_of_war : {

            initialize : function() {

                app.map_obj.addLayer({
                    'id': 'fog_of_war_provincia',
                    'type': 'fill',
                    'source': 'provincia',
                    'paint': {
                      'fill-color': 'ghostwhite',
                      'fill-opacity': 0,
                      'fill-outline-color': '#555'
                    },
                    'filter': ['!=', 'province', '']
                }); // puts behind road-label

                app.map_obj.addLayer({
                    'id': 'fog_of_war_localidad',
                    'type': 'fill',
                    'source': 'localidad',
                    'paint': {
                      'fill-color': 'ghostwhite',
                      'fill-opacity': 0,
                      'fill-outline-color': '#555'
                    },
                    'filter': ['!=', 'localidad', '']
                }); // puts behind road-label

            },

            toggle : function(type, location) {

                let opacity = 0;

                if (location != '') {

                    opacity = 1;

                    app.map_obj.setFilter(
                        'fog_of_war_' + type, [
                            '!=',
                            ['get', 'nam'],
                            location
                        ]);


                }

                app.map_obj.setPaintProperty('fog_of_war_' + type, 'fill-opacity', opacity);

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
                    'paint': {'fill-color': '#F4F0EC'},
                }, 'provincia');

            }

        },

        popup: (name) => new mapboxgl.Popup(
            {
                closeButton: false,
                loseOnClick: false,
                anchor: 'bottom-left'
            }),

        add_popup : function(location, name) {

            const type = 'localidad';

            const location_data = app.data.fopea_data[type].filter(d => d.local == location)[0];

            const location_coordinates = app.data.localidad.features
            .filter(d => d.properties.local == location)
            [0].geometry.coordinates;

            console.log('Location Data for', name, location_data);

            const new_popup = app.map.popup(name);

            if (name != 'user-location') app.map.current_popups.remaining.push(new_popup)
            else app.map.current_popups.user_location = new_popup;

            new_popup
              .setLngLat(location_coordinates)
              .setHTML(location_data.nam)
              .addTo(app.map_obj)
              .addClassName(name);

            const popup_tip = document.querySelector('.' + name + ' .mapboxgl-popup-tip');
            popup_tip.style.borderTopColor = location_data.color_real;

            const popup_content = document.querySelector('.' + name + ' .mapboxgl-popup-content');
            popup_content.style.backgroundColor = location_data.color_real;


        },

        clear_pop_ups : function() {

            app.map.current_popups.remaining.forEach(popup => popup.remove());

        },

        clear_user_location_popup : function() {

            app.map.current_popups.user_location.remove();

        },

        clear_highlights_and_popups : function() {

            app.map.localidad.toggle_highlight_border('');
            app.map.province.toggle_highlight_border_provincia('');
            app.map.localidad.style_selected_city('');
            app.map.clear_pop_ups();
            app.map.clear_user_location_popup();

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

        highlight_feature : function(type, location, name = 'user-location', pitch = 0, bearing = 0) {

            // this 'name' will be used by the add_popup

            console.log(type, location);

            // type provincia, localidad

            //let locations = app.map_obj.querySourceFeatures(type, {
            //    sourceLayer: type});
        
            //let desired_features = locations.filter(d => d.properties.nam == location)[0];

            //console.log(desired_features);

            // make them into a feature collection and then combine, in case the feature spans more than one tileset(it will appear more than one time in the filter results above);

            //let collection = turf.featureCollection(desired_features);
            //let combined = turf.combine(collection);

        
            // let bbox_highlighted = [
            //     [highlighted.properties.xmin, highlighted.properties.ymin], 
            //     [highlighted.properties.xmax, highlighted.properties.ymax]
            // ];
        
            // or we could have used 
            //let bbox_highlighted = turf.bbox(desired_features);//combined);

            const location_data = app.data.fopea_data[type].filter(d => d.local == location)[0];

            console.log(location_data);

            let bbox_highlighted = [
                location_data.xmin, location_data.ymin,
                location_data.xmax, location_data.ymax
            ];  
            
            console.log(bbox_highlighted);
        
            app.map_obj.fitBounds(
                bbox_highlighted, 
                {
                    linear : false, // false means the map transitions using map.flyTo()
                    speed: 1, 
                    padding: {top: 30, bottom: 30, left: 30, right: 30},
                    pitch: pitch,
                    bearing: bearing
                }
            );

            const provincia = location_data.provincia;

            app.map.province.toggle_highlight_border_provincia(provincia);
            app.map.localidad.toggle_highlight_border(location);
            app.map.localidad.style_selected_city(location);

            app.map.add_popup(location, name);

        },

        highlight_category : function(category) {

            app.map_obj.setPaintProperty(
                    
                'localidad', 
                'circle-opacity',
                category == 'all' ? 
                .5 :
                [
                    'case',
                    [
                        '==',
                        ['get', 'categoria'],
                        category
                    ],
                    .5,
                    0
                ]
            );

            app.map_obj.setPaintProperty(
                    
                'localidad', 
                'circle-stroke-opacity',
                category == 'all' ? 
                1 :
                [
                    'case',
                    [
                        '==',
                        ['get', 'categoria'],
                        category
                    ],
                    1,
                    0
                ]
            );

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

                    console.log("Renderizando step... ", step);

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

                //app.map_obj.setPaintProperty('localidad', 'fill-pattern', null);
                //app.map_obj.setPaintProperty('localidad', 'fill-color', ['get', 'color']);
                //app.map_obj.setPaintProperty('localidad', 'fill-outline-color', 'ghostwhite');
                //app.map_obj.setPaintProperty('localidad', 'fill-opacity', .5);
               // app.map.set_initial_view();
                app.map.fit_Argentina();
                app.map.localidad.toggle_highlight_border('');

                //app.interactions.story.toggle_visibility("dashboard_button");

            },

            // 'pesquisa' : function() {

            //     console.log('Pesquisando...');

            //     app.map.set_initial_view();
            //     app.map.fog_of_war.toggle('provincia', '');
            //     app.map.fog_of_war.toggle('localidad', '');
            //     app.map_obj.setPaintProperty('localidad', 'fill-color', ['get', 'color']);
            //     app.map.localidad.toggle_highlight_border('');
                
            // },

            'location-card' : function() {

                const type = app.vis.location_card.state.user_location_type;
                const location = app.vis.location_card.state.user_location_name

                app.map.highlight_feature(type, location, name = 'user-location', pitch = 0, bearing = 0  );

                //app.map_obj.setPaintProperty('localidad', 'circle-opacity', 1);

                //app.map.localidad.toggle_highlight_border(location);

                //app.map.fog_of_war.toggle(type, location);

            },

            // 'story-no-map-interactions' : function() {},

            // 'segundo' : function() {

            //     app.map.fit_Argentina();

            //     app.map_obj.setPaintProperty('localidad', 'fill-pattern', ['get', 'tipo']);
            //     app.map_obj.setPaintProperty('localidad', 'fill-opacity', 1);
            //     app.map.fog_of_war.toggle('provincia', '');
            //     app.map.fog_of_war.toggle('localidad', '');

            // },

            // 'importancia-periodismo' : function() {

            //     // app.map.highlight_feature(type, location, pitch = 60, bearing = 30  );

            //     // app.map.localidad.toggle_highlight_border(location);

            //     // app.map.fog_of_war.toggle(type, location);

            // },

            'other-categories' : function() {

                app.vis.location_card.state.remaining_categories_locations.forEach((location, i) => {

                    app.map.add_popup(location.local, 'remaining-' + i);

                })

                //app.map.fit_Argentina();
                //app.map.fog_of_war.toggle('provincia', '');
                //app.map.fog_of_war.toggle('localidad', '');
                //app.map.localidad.toggle_highlight_border('');
                //app.map_obj.setPaintProperty('localidad', 'fill-color', ['get', 'color_real']);

            },

            'remaining-category1' : function() {

                app.map.clear_pop_ups();

                const location = app.vis.location_card.state.remaining_categories_locations[0];

                //console.log('Remaining 1', location.local)

                app.map.highlight_feature('localidad', location.local, name = 'remaining1');

                //app.map.fog_of_war.toggle('localidad', location);

                //app.map.localidad.toggle_highlight_border(location);

            },

            'remaining-category2' : function() {

                app.map.clear_pop_ups();

                const location = app.vis.location_card.state.remaining_categories_locations[1];

                app.map.highlight_feature('localidad', location.local, name = 'remaining2');

                //app.map.fog_of_war.toggle('localidad', location);

                //app.map.localidad.toggle_highlight_border(location);

            },

            'remaining-category3' : function() {

                app.map.clear_pop_ups();

                const location = app.vis.location_card.state.remaining_categories_locations[2];

                app.map.highlight_feature('localidad', location.local, name = 'remaining3');

                //app.map.fog_of_war.toggle('localidad', location);

                //app.map.localidad.toggle_highlight_border(location);

            },

            'argentina-bosques' : function() {

                app.map.fit_Argentina();
                app.map.clear_highlights_and_popups();
                app.map.highlight_category("4");

            },

            'argentina-semibosques' : function() {

                //app.map.fit_Argentina();
                //app.map.clear_highlights_and_popups();
                app.map.highlight_category("3");

            },   
            
            'argentina-semidesiertos' : function() {

                //app.map.fit_Argentina();
                //app.map.clear_highlights_and_popups();
                app.map.highlight_category("2");

            }, 
            
            'argentina-desiertos' : function() {

                //app.map.fit_Argentina();
                //app.map.clear_highlights_and_popups();
                app.map.highlight_category("1");

            },              

            'penultimo' : function() {

                app.map.highlight_category("all");


            },

            'fecho' : function() {

                //app.map.fit_Argentina();
                //app.map.highlight_feature('provincia', 'Salta');


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
    
                    const data = app.data.fopea_data.lista_locais
                      .filter(d => d.tipo == "localidad")
                      .sort((a,b) => a.local - b.local);

                    console.log(data);
    
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

                            const data = app.data.fopea_data[local.tipo].filter(d => d.local == local.local)[0];

                            console.log("Dados: ", data);

                            app.interactions.story.search_bar.successful_result_action(local, data);


                        } else {

                            console.log("Valor invalido, chico")

                            // fazer algo visível na página aqui

                        }


                    });

                },

                successful_result_action : function(local, data) {

                    //// seria o caso de levar isso para o render step do scroller?

                    // set vis state, calls vis render

                    app.vis.location_card.state.set(local, data);

                    // populates fields

                    app.vis.location_card.update_text_fields();

                    // with the fields updated, resize svg

                    //app.vis.stripplot.dimensions.set_size();
                    //app.vis.stripplot.scales.range.set();
                    //app.vis.stripplot.scales.set(local.tipo);
                    //app.vis.stripplot.components.labels.render(local.tipo);
                    //app.vis.stripplot.components.lines.render(local.tipo);
                    //app.vis.stripplot.components.marks.render(local.tipo);

                    //updates maps

                    // let type; 
                    
                    // if (local.type == "localidad") {

                    //     type = 'localidad';

                    // } else {

                    //     if (local.type == "provincia") {
                            
                    //         type = 'provincia';

                    //     }

                    // }
                    
                    // app.map.highlight_feature(type = type, location = local.local);

                    // scrolls to card

                    const destination_step = document.querySelector(
                        app.interactions.story.search_bar.refs.destination_step
                    );

                    destination_step.scrollIntoView({behavior: "smooth"});


                }

            }

        },

    },

    vis : {

        location_card : {

            state : {

                user_location : null,
                user_location_name : null,
                user_location_type : null,
                user_location_category : null,
                user_location_province : null,
                remaining_categories : null,
                remaining_categories_locations : null,

                set : function(local, data) {

                    const state = app.vis.location_card.state;

                    state.user_location = local.text;
                    state.user_location_name = local.local; //// mudar esse local.local :/
                    state.user_location_type = local.tipo;
                    state.user_location_province = local.provincia;

                    const category = app.utils.get_category_from_data(local, data);

                    state.user_location_category = category

                    const remaining_categories = app.params.categories.filter(d => d != category);

                    state.remaining_categories = remaining_categories;

                    state.remaining_categories_locations = app.utils.generate_random_remaining_locations(remaining_categories);

                }

            },

            refs : {

                //name : '.js--location-name',
                //type : '.js--location-type',
                category_description : '.js--location-category-description',
                remaining_category1 : '.js--remaining-category1',
                remaining_category2 : '.js--remaining-category2',
                remaining_category3 : '.js--remaining-category3',
                main_category : '.js--location-category-main',

                text_remaining_category1 : '.js--location-remaining-category1-text',
                text_remaining_category2 : '.js--location-remaining-category2-text',
                text_remaining_category3 : '.js--location-remaining-category3-text',

                random_location_bosque : '.js--random-location-bosque', 
                random_location_semibosque : '.js--random-location-semibosque', 
                random_location_semidesierto: '.js--random-location-semidesierto', 
                random_location_desierto : '.js--random-location-desierto', 

                category : '.js--location-category' // multiple

            },

            texts : {

                bosque : {
                    
                    first : 'Estás en un <span data-category-highlight="bosque">bosque</span>. Esto significa que su localidad está bien servida por un periodismo profesional de calidad, que permite a las personas estar bien informadas sobre los problemas locales y mejora la calidad de la vida pública.',

                    second: 'Un <span data-category-highlight="bosque">bosque</span> es una región bien servida por un periodismo profesional de calidad, que permite a las personas estar bien informadas sobre los problemas locales. La localidad de <span class="js--random-location-bosque"></span> es un ejemplo de este tipo de región.'

                },

                semibosque : {
                    
                    first : 'Estás en un <span data-category-highlight="semibosque">semibosque</span>. Esto significa que su localidad tiene un buen acceso al periodismo profesional, pero con algunos problemas graves. Si bien es posible obtener información a través de los periódicos locales, existen fallas en la cobertura que pueden dañar la calidad de la vida pública.',

                    second : 'Un <span data-category-highlight="semibosque">semibosque</span> es una región que tiene acceso al periodismo profesional, pero con algunos problemas serios. Si bien es posible obtener información a través de los periódicos locales, existen fallas en la cobertura. La localidad de <span class="js--random-location-semibosque"></span> es un ejemplo de este tipo de región.'

                },

 
                semidesierto : {
                    
                    first : 'Estás en un <span data-category-highlight="semidesierto">semidesierto</span>. Esto significa que su localidad tiene serios problemas para acceder a un periodismo de calidad, aunque la prensa profesional esté presente. Esto causa problemas considerables en la calidad de la vida pública.',

                    second : 'Un <span data-category-highlight="semidesierto">semidesierto</span> es una región que tiene serios problemas para acceder a un periodismo de calidad, a pesar de que la prensa profesional está presente, como en la localidad de <span class="js--random-location-semidesierto"></span>.'

                },

                desierto : {
                    
                    first : 'Estás en un <span data-category-highlight="desierto">desierto</span>. Esto significa que, en la práctica, casi no hay periodismo profesional de calidad en tu localidad. Esto afecta gravemente a la calidad de la vida pública.',

                    second : 'En un <span data-category-highlight="desierto">desierto</span>, en la práctica, casi no hay periodismo profesional de calidad. Este es el caso de <span class="js--random-location-desierto"></span>.'

                }

            },

            update_text_fields : function() {

                const refs = app.vis.location_card.refs;
                const state = app.vis.location_card.state;
                const user_category = state.user_location_category;

                // helper function

                function populate_field(ref, origin_of_information, dataset = null) {

                    const field = document.querySelector(refs[ref]);

                    console.log(ref, field, refs[ref], origin_of_information);

                    field.innerHTML = (ref == 'type' & origin_of_information == 'localidad') ?
                    ('departamento de ' + state.user_location_province) :
                    origin_of_information;

                    if (dataset) field.dataset[dataset] = origin_of_information;

                }

                // name

                //populate_field('name', state.user_location_name);

                // type

                //populate_field('type', state.user_location_type);

                // main category field

                //populate_field('main_category', user_category, dataset = 'category');

                // description field

                populate_field('category_description', app.vis.location_card.texts[user_category].first);

                // category field in second page

                populate_field('category', user_category, dataset = 'categoryHighlight');

                // remaining categories fields

                populate_field('remaining_category1', state.remaining_categories[0], dataset = 'categoryHighlight');
                populate_field('remaining_category2', state.remaining_categories[1], dataset = 'categoryHighlight');
                populate_field('remaining_category3', state.remaining_categories[2], dataset = 'categoryHighlight');

                let remain_cat1 = state.remaining_categories[0];

                console.log('Remain cat1', remain_cat1);

                populate_field(
                    'text_remaining_category1', 
                    app.vis.location_card.texts[remain_cat1].second
                    );

                populate_field(
                    'random_location_' + remain_cat1, 
                    state.remaining_categories_locations[0].text
                    );


                let remain_cat2 = state.remaining_categories[1];

                console.log('Remain cat2', remain_cat2);

                populate_field(
                    'text_remaining_category2', 
                    app.vis.location_card.texts[remain_cat2].second
                    );

                populate_field(
                    'random_location_' + remain_cat2, 
                    state.remaining_categories_locations[1].text
                    );


                let remain_cat3 = state.remaining_categories[2];

                console.log('Remain cat3', remain_cat3);

                populate_field(
                    'text_remaining_category3', 
                    app.vis.location_card.texts[remain_cat3].second
                    );

                populate_field(
                    'random_location_' + remain_cat3, 
                    state.remaining_categories_locations[2].text
                    );

            }

        },

        stripplot : {

            refs : {

                svg : '.vis-story-stripplot',
                container : 'div.vis-story-container'

            },
        
            sels : {
        
                d3 : {

                    svg : null,
                    container : null,

                    set : function() {

                        Object.keys(app.vis.stripplot.refs).forEach(ref_name => {

                            app.vis.stripplot.sels.d3[ref_name] = d3.select(app.vis.stripplot.refs[ref_name]);

                        })

                    }

                },

                js : {}
        
            },

            dimensions : {

                variable_label : {

                    top : 10,
                    height : 15,

                },

                location_label : {

                    top : 10,
                    height : 15

                },

                axis_line : {

                    top : 20,
                    width : 1,
                    bottom : 20

                },

                dots_radius : {

                    highlight: 14,
                    other : 4

                },

                lateral_margins : 20,

                strip_height : null,

                strip_line_relative : null,

                svg_width : null,

                set_size : function() {

                    const svg = document.querySelector(app.vis.stripplot.refs.svg);

                    const height_step = document
                      .querySelector('[data-step="location-card"]')
                      .getBoundingClientRect()
                      .height;

                    const height_inner_step = document
                      .querySelector('[data-step="location-card"] .story-step-inner')
                      .getBoundingClientRect()
                      .height;

                    const height_header = document
                      .querySelector('header')
                      .getBoundingClientRect()
                      .height;

                    const height_svg_initial = svg
                      .getBoundingClientRect()
                      .height;

                    let height_svg_new = height_step - height_header - ( height_inner_step - height_svg_initial ) - 2*height_header; // usando height_header como margem;

                    if (height_svg_new > 0) { 

                        svg.style.height = height_svg_new ;

                    }

                    app.vis.stripplot.dimensions.svg_width = svg.getBoundingClientRect().width;

                    const dimensions = app.vis.stripplot.dimensions;

                    const height = 
                      dimensions.variable_label.top +
                      dimensions.variable_label.height + 
                      dimensions.location_label.top + 
                      dimensions.location_label.height +
                      dimensions.axis_line.top +
                      dimensions.axis_line.bottom;

                    app.vis.stripplot.dimensions.strip_height = height;
                    app.vis.stripplot.dimensions.strip_line_relative = height - dimensions.axis_line.bottom;
                    
                }

            },

            variables : {

                localidad : [ 'pobXmedios', 'pobXperiodistas' ],

                provincia : [ 'pobXmedios', 'pobXperiodistas', 'cat_media', 'Impacto de la publicidad oficial'],

                names : {

                    pobXmedios : 'Poblatión x Medios',
                    pobXperiodistas : 'Poblatión x Periodistas',
                    cat_media : 'Categoria Promedia',
                    'Impacto de la publicidad oficial' : 'Impacto de la publicidad oficial'

                }

            },

            scales : {

                range : {

                    value : null,

                    set : function() {

                        const dimensions = app.vis.stripplot.dimensions;

                        app.vis.stripplot.scales.range.value = [

                            dimensions.lateral_margins,
                            dimensions.svg_width - dimensions.lateral_margins

                        ];

                    }

                },

                x : {},
                y : {},

                set : function(type) {

                    const variables = app.vis.stripplot.variables[type];
                    const dimensions = app.vis.stripplot.dimensions;
                    const scales = app.vis.stripplot.scales;

                    console.log("setting scales...", type, variables)

                    variables.forEach((variable,i) => {

                        // y

                        scales.y[variable] = i * dimensions.strip_height + dimensions.strip_line_relative;

                        // x

                        let domain;

                        if (variable == 'cat_media') {

                            domain = [1,4]

                        } else if (variable == 'Impacto de la publicidad oficial') {

                            domain = [0, 1]

                        } else {

                            let key, location_stats;

                            if (type == 'localidad') {

                                key = 'provincias';

                                location_stats = app.data.fopea_data.stats[key].filter(
                                    d => d.provincia == app.vis.location_card.state.user_location_province)[0]

                                console.log("Location stats", location_stats)

                            } else {

                                key = 'nacional';

                                location_stats = app.data.fopea_data.stats[key][0]

                            }

                            domain = [

                                location_stats[variable + '_min'],
                                location_stats[variable + '_max']

                            ];

                        }


                        scales.x[variable] = d3.scaleLinear()
                          .range(scales.range.value)
                          .domain(domain);

                    })



                },

            },

            components : {

                labels : {

                    render : function(type) {

                        const variables = app.vis.stripplot.variables[type];

                        console.log(variables);

                        app.vis.stripplot.sels.d3.container
                          .selectAll("p.vis-story-stripplot-labels-variables")
                          .data(variables)
                          .join("p")
                          .classed("vis-story-stripplot-labels-variables", true)
                          .style("left", 0)
                          .style("top", (d,i) => app.vis.stripplot.dimensions.strip_height*i + "px")
                          .text(d => app.vis.stripplot.variables.names[d]);

                    }

                },

                lines : {

                    render : function(type) {

                        const variables = app.vis.stripplot.variables[type];

                        app.vis.stripplot.sels.d3.svg
                          .selectAll("line.vis-story-stripplot-axis")
                          .data(variables)
                          .join("line")
                          .classed("vis-story-stripplot-axis", true)
                          .attr("x1", 0)
                          .attr("x2", app.vis.stripplot.dimensions.svg_width)
                          .attr("y1", d => app.vis.stripplot.scales.y[d])
                          .attr("y2", d => app.vis.stripplot.scales.y[d]);

                    }

                },

                marks : {

                    render : function(type) {

                        const variables = app.vis.stripplot.variables[type];

                        let data;

                        if (type == 'localidad') {

                            const provincia = app.vis.location_card.state.user_location_province;

                            // gets departments that belong to the current province

                            data = app.data.fopea_data.localidad.filter(d => d.provincia == provincia);

                        } else data = app.data.fopea_data.provincia;

                        variables.forEach(variable => {

                            console.log('circulos da variavel... ', variable);

                            app.vis.stripplot.sels.d3.svg
                              .selectAll("circle.vis-story-stripplot-marks[data-variable='" + variable + "']")
                              .data(data)
                              .join('circle')
                              .classed('vis-story-stripplot-marks', true)
                              .classed('marks-na', d => !app.vis.stripplot.scales.x[variable](d[variable])) // se der undefined vai dar true
                              .classed('marks-location-highlighted', d => d.local == app.vis.location_card.state.user_location_name)
                              .attr('data-variable', variable)
                              .attr('data-location', d => d.local)
                              .attr('cx', d => app.vis.stripplot.scales.x[variable](d[variable]))
                              .attr('cy', app.vis.stripplot.scales.y[variable])
                              .attr('r', d => d.local == app.vis.location_card.state.user_location_name ? app.vis.stripplot.dimensions.dots_radius.highlight : app.vis.stripplot.dimensions.dots_radius.other)
                              .attr('fill', function(d) {

                                //console.log(d.local, d.categoria);

                                const cat = Math.ceil(+d.categoria);

                                const categoria = app.params.categories[cat-1]

                                return app.params.colors[categoria];
                                  
                              });

                        })

                    }

                },

                connecting_lines : {

                    render : function() {}

                },

                tooltips : {

                    render : function() {}

                }

            }


        }

    },

    ctrl : {

        init : function() {

            app.utils.colors.populate();
            app.scroller.steps.get();
            app.vis.stripplot.sels.d3.set(); // sets up d3 selections;
            app.utils.load_data();
            
        },

        monitors : function() {

            app.interactions.story.search_bar.listen_search();

        },

        begin : function(data) {

            console.log(data);

            app.data.localidad = data[0];
            app.data.mask = data[1];
            app.data.provincia = data[2];
            app.data.fopea_data = {
                localidad : data[0].features.map(d => d.properties),
                provincia : data[2].features.map(d => d.properties),
                lista_locais : data[3]
            };

            const pobs = data[0].features.map(d => d.properties.pob);

            console.log(pobs);

            app.data.max_pob = Math.max(...pobs);
            app.data.min_pob = Math.min(...pobs);
            



            // pre-process localidad data
            app.data.localidad.features.forEach(el => {

                const types = Object.keys(app.params.colors);

                const categoria = el.properties.categoria;

                //const id = el.properties.gid;
                //const indice = ( (id - 1) % 4 );


                //const tipo = app.params.patterns.names[indice];
                //const type = types[indice];
                //const color = app.params.colors[type];

                //el.properties["tipo"] = tipo;
                //el.properties["color"] = color;
                el.properties['color_real'] = categoria ?
                  app.params.colors[app.params.categories[+categoria-1]] :
                  'lightgray';

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

                app.map.localidad.initialize();
                app.map.province.initialize();
                app.map.world_mask.initialize();
                app.map.fog_of_war.initialize(); 

                //fit map to continental Argentina
                app.map.fit_Argentina();

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