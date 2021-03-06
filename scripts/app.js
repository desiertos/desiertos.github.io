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
            style : 'mapbox://styles/tiagombp/ckpkfql7g27qy18qveuf6wx1m?optimize=true',
            start : {

                center : {

                    lng  : -64.5529,
                    lat  : -33.9968

                },

                zoom : 5.24

            }

        },

        geojsons : {

            provincia : 'mapbox://tiagombp.4fk72g1y',
            localidad : 'mapbox://tiagombp.d8u3a43g'
            //mask : '../data/maps/arg_mask.json'

        },

        fopea_data : '../data/output_dash.json', 
        //place_names : '../data/places.json',

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

    mobile : false,
    for_the_first_time_in_forever : true,

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

                //fetch(app.params.geojsons.localidad, {mode: 'cors'}).then( response => response.json()),
                //fetch(app.params.geojsons.mask, {mode: 'cors'}).then( response => response.json()),
                //fetch(app.params.geojsons.provincia, {mode: 'cors'}).then( response => response.json()),
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

        get_category_from_data : function(local, data) {

            //console.log(local, data);

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

                location_category = categories[ +data['categoria'] - 1 ];
                
            }

            return location_category;

        },

        generate_random_remaining_locations : function(remaining_categories) {

            const data = app.data.fopea_data.localidad;
            const state = app.vis.location_card.state;
            const output = [];

            remaining_categories.forEach(category => {

                const cat_numeric = '' + (app.params.categories.indexOf(category) + 1);

                let available_cities = data
                  .filter(d => d.provincia == state.user_location_province)
                  .filter(d => d.categoria == cat_numeric)
                  .map(d => (
                      {
                          local : d.local,
                          text  : d.nam
                      })
                    );

                if (available_cities.length == 0) {

                    // if there's no location in the province of the desired category, search the entire country.

                    available_cities = data
                        .filter(d => d.categoria == cat_numeric)
                        .map(d => (
                            {
                                local : d.local,
                                text  : d.nam.trim()
                            })
                        );
                }
                
                //console.log('available cities for category ', cat_numeric, available_cities)

                const amount_available_cities = available_cities.length;

                //console.log(available_cities);

                // get a random city

                const index_selected = Math.floor(Math.random() * amount_available_cities);

                let city = available_cities[index_selected];

                /*if (!city.text.includes("Capital")) {

                    city.text = "localidad de " + city.text;

                }*/
                
                output.push(city);

            })

            return output;

        },

        detect_mobile : function() {

            app.mobile = window.innerWidth <= 620;
            //if (app.mobile) app.utils.resize.resize();

        },

        debounce : function(func, wait, immediate) {
            // https://davidwalsh.name/function-debounce
            var timeout;
            return function() {
                var context = this, args = arguments;
                var later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                var callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        },

        // resize : {

        //     monitor : function() {

        //         console.log('monitoring resize');

        //         window.addEventListener('resize', app.utils.debounce(app.utils.resize.resize, 500));

        //     },

        //     resize : function() {

        //         if (app.mobile) {

        //             console.log('fired resize');

        //             const ref = ".story-step";

        //             const height = window.innerHeight;
        //             const story_steps = document.querySelectorAll(ref)

        //             const root_styles = getComputedStyle( document.documentElement );

        //             const story_height = +d3.select(ref).style("height").slice(0,-2);
        //             const google_bar_height = +d3.select('footer').style("height").slice(0,-2);


        //             if (story_height + google_bar_height > height) {

        //                 const new_height = height - google_bar_height;

        //                 document.documentElement.style.setProperty('--story-height-mobile', new_height + 'px');

        //             }

        //         }

        //     }

        // }

    },

    map : {

        current_popups : {
            
            user_location : null, 
            remaining : [],

        },

        localidad : {

            initialize : function() {

                app.map_obj.addSource('localidad', {
                    type: 'vector',
                    url : app.params.geojsons.localidad
                });

                app.map_obj.addLayer({
                    'id': 'localidad',
                    'type': 'fill',
                    'source': 'localidad',
                    'source-layer' : 'localidad',
                    'layout': {},
                    'paint': {
                      'fill-color': ['get', 'color_real'],
                      'fill-outline-color' : 'transparent',
                      'fill-opacity' : 1
                    }
                }); 

                app.map_obj.addLayer({
                    'id': 'localidad-border',
                    'type': 'line',
                    'source': 'localidad',
                    'source-layer' : 'localidad',
                    'layout': {},
                    'paint': {
                      'line-color': '#666',
                      'line-width': 0,
                    }
                }); 

                app.map_obj.addLayer({
                    'id': 'localidad-highlight',
                    'type': 'line',
                    'source': 'localidad',
                    'source-layer' : 'localidad',
                    'layout': {},
                    'paint': {
                      'line-color': 'black',
                      'line-width': 3,
                    }, 'filter': ['==', 'local', '']
                }); 

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

                if (localidad != '') {

                    app.map_obj.setPaintProperty(
                    
                        'localidad', 
                        'fill-opacity',
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
                    );
    
                    app.map_obj.setPaintProperty(
                        
                        'localidad-border', 
                        'line-width',
                        1
                    );

                } else {

                    app.map_obj.setPaintProperty(
                    
                        'localidad', 
                        'fill-opacity',
                        1
                    );
    
                    app.map_obj.setPaintProperty(
                        
                        'localidad-border', 
                        'line-width',
                        0
                    );

                }



                // toggle highlight border?

            }

        },

        province : {

            initialize : function() {

                app.map_obj.addSource('provincia', {
                    type: 'vector',
                    url : app.params.geojsons.provincia
                });

                app.map_obj.addLayer({
                    'id': 'provincia',
                    'type': 'fill',
                    'source': 'provincia',
                    'source-layer' : 'provincia',
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
                    'source-layer' : 'provincia',
                    'layout': {},
                    'paint': {
                      'line-color': '#666',
                      'line-width': 1
                    }
                });

                app.map_obj.addLayer({
                    'id': 'provincia-highlight',
                    'type': 'line',
                    'source': 'provincia',
                    'source-layer' : 'provincia',
                    'layout': {},
                    'paint': {
                      'line-color': '#666',
                      'line-width': 3
                    },
                    'filter': ['==', 'provincia', '']});

            },

            toggle_highlight_border_provincia : function(provincia) {

                app.map_obj.setFilter(
                    'provincia-highlight', [
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
                    'source-layer' : 'provincia',
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
                    'source-layer' : 'localidad',
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

        // world_mask : {

        //     initialize : function() {

        //         app.map_obj.addSource('mask', {
        //             type: 'geojson',
        //             'data' : app.data.mask
        //         });

        //         app.map_obj.addLayer({
        //             'id': 'mask',
        //             'type': 'fill',
        //             'source': 'mask',
        //             'layout': {},
        //             'paint': {'fill-color': '#F4F0EC'},
        //         }, 'provincia');

        //     }

        // },

        popup: (name) => new mapboxgl.Popup(
            {
                closeButton: false,
                loseOnClick: false,
                anchor: 'bottom-left'
            }),

        add_popup : function(location, name) {

            const type = 'localidad';

            const location_data = app.data.fopea_data[type].filter(d => d.local == location)[0];

            const categoria = location_data.categoria;

            location_data.color_real =
            app.params.colors[app.params.categories[+categoria-1]];

            // const location_feature = app.data.localidad.features
            // .filter(d => d.properties.local == location)
            // [0]//.geometry.coordinates;

            let location_coordinates = [
                location_data.xc,
                location_data.yc
            ];

            //console.log('Location Data for', name, location_data);

            const new_popup = app.map.popup(name);

            if (name != 'user-location') app.map.current_popups.remaining.push(new_popup)
            else app.map.current_popups.user_location = new_popup;

            new_popup
              .setLngLat(location_coordinates)
              .setHTML(location_data.nam)
              .addTo(app.map_obj)
              .addClassName(name);

            const popup_tip = document.querySelector('.' + name + ' .mapboxgl-popup-tip');
            //popup_tip.style.borderTopColor = location_data.color_real;

            const popup_content = document.querySelector('.' + name + ' .mapboxgl-popup-content');
            popup_content.style.backgroundColor = location_data.color_real;


        },

        clear_pop_ups : function() {

            if (app.map.current_popups.remaining.length > 0) {
                
                app.map.current_popups.remaining.forEach(popup => popup.remove());
                app.map.current_popups.remaining = [];

            }

        },

        clear_user_location_popup : function() {

            if (app.map.current_popups.user_location) {
                
                app.map.current_popups.user_location.remove();
                app.map.current_popups.user_location = null;

            }

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

            //console.log(type, location);

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

            //console.log(location_data);

            let bbox_highlighted = [
                location_data.xmin, location_data.ymin,
                location_data.xmax, location_data.ymax
            ];  
            
            //console.log(bbox_highlighted);
        
            app.map_obj.fitBounds(
                bbox_highlighted, 
                {
                    linear : false, // false means the map transitions using map.flyTo()
                    speed: 1, 
                    padding: {top: 30, bottom: app.mobile ? 210 : 30, left: 30, right: 30},
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
                'fill-opacity',
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

            // app.map_obj.setPaintProperty(
                    
            //     'localidad', 
            //     'circle-stroke-opacity',
            //     category == 'all' ? 
            //     1 :
            //     [
            //         'case',
            //         [
            //             '==',
            //             ['get', 'categoria'],
            //             category
            //         ],
            //         1,
            //         0
            //     ]
            // );

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

                selector: '.scroller-step',

                enter: function(el) {

                    const step = el.dataset.step;

                    console.log("Renderizando step... ", step);

                    app.scroller.render[step]();

                },

                exit: function(el) {

                    const step = el.dataset.step;

                    const index_step = app.scroller.steps.list.indexOf(step);

                    const step_anterior = app.scroller.steps.list[index_step - 1];

                    app.scroller.render[step_anterior]('back');

                    //console.log("saiu, ", step_anterior);
                },

                offset: 0.5, // enter at middle of viewport
                //once: true, // trigger just once
            });

        },

        // por em outro lugar?

        render : {

            'abertura' : function(direction = null) {

                //app.map_obj.setPaintProperty('localidad', 'fill-pattern', null);
                //app.map_obj.setPaintProperty('localidad', 'fill-color', ['get', 'color']);
                //app.map_obj.setPaintProperty('localidad', 'fill-outline-color', 'ghostwhite');
                //app.map_obj.setPaintProperty('localidad', 'fill-opacity', .5);
               // app.map.set_initial_view();
               //app.ctrl.prevents_scroll_on_opening(true);

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

            // no scroller
            'search-step' : function(direction = null) {

                if (direction == 'back') { 
                    app.interactions.story.search_bar.reset();
                 }
 
                app.map.clear_highlights_and_popups();
                app.map.fit_Argentina();
                app.map.localidad.toggle_highlight_border('');
                if (document.querySelector('div.mapboxgl-popup')) document.querySelector('div.mapboxgl-popup').remove();
 
            },

            // no scroll
            'location-card' : function() {

                //app.ctrl.prevents_scroll_on_opening(false);

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

                if (!app.map.current_popups.user_location) {

                    // this is the case when the user is returning in the story

                    app.map.add_popup(app.vis.location_card.state.user_location_name, name = 'user-location');

                }

                //app.map.fog_of_war.toggle('localidad', location);

                //app.map.localidad.toggle_highlight_border(location);

            },

            'argentina-bosques' : function() {

                app.map.fit_Argentina();
                app.map.clear_highlights_and_popups();
                app.map.localidad.style_selected_city('');
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
                    destination_step : '#location-card',
                    destination_focus : '.next-focus',
                    form : 'form'

                },

                populate_datalist : function() {

                    const ref = app.interactions.story.search_bar.refs.datalist_search;
    
                    const parent = document.querySelector(ref);
    
                    const data = app.data.fopea_data.lista_locais
                      .filter(d => d.tipo == "localidad")
                      .sort((a,b) => a.local - b.local);

                    //console.log(data);
    
                    data.forEach(row => {
    
                        const new_option = document.createElement("option");
                        
                        new_option.value = row.text.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                        //new_option.value = row.text;
                        //new_option.dataset.tipoLocalidade = row.tipo;
    
                        parent.appendChild(new_option);
    
                    })

                    //const input = document.querySelector('#location-search');

                    // new Awesomplete(input, {
                    //     list: 'datalist',
                    //     maxItems: 15,
                    //     minChars: 1
                    // });
    
                },

                submit : function(e, search_content) {

                    //console.log("hi!")

                    //const search_content = input_el.value;

                    //console.log(input_el.value);

                    console.log(e, search_content);

                    if (
                        app.data.fopea_data.lista_locais
                          .map(row => row.text)
                          .indexOf(search_content) > 0
                    ) {

                        console.log("valor detectado", search_content);

                        const local = app.data.fopea_data.lista_locais.filter(row => row.text == search_content)[0];

                        console.log("Local do valor", local);

                        local.text = local.name;

                        const data = app.data.fopea_data[local.tipo].filter(d => d.local == local.local)[0];

                        console.log("Local e Dados do resultado da pesquisa: ", local, data);

                        app.interactions.story.search_bar.successful_result_action(local, data);


                    } else {

                        console.log("Valor invalido, chico")

                        // fazer algo vis??vel na p??gina aqui

                    }


                },

                reset : function() {

                    const ref_form = app.interactions.story.search_bar.refs.form;
                    const form = document.querySelector(ref_form);
                    form.reset();

                },

                listen_search : function() {

                    const ref_btn = app.interactions.story.search_bar.refs.search_button;
                    const ref_input = app.interactions.story.search_bar.refs.input;
                    const ref_form = app.interactions.story.search_bar.refs.form;

                    const btn = document.querySelector(ref_btn);
                    const input_el = document.querySelector(ref_input);
                    const form = document.querySelector(ref_form);

                    //console.log(btn);

                    // btn.addEventListener('click', function(e) {

                    //     const search_content = input_el.value;

                    //     app.interactions.story.search_bar.submit(e, search_content);
                        
                    // });

                    form.addEventListener('submit', function(e) {

                        const search_content = input_el.value;

                        console.log('SUBMITED', search_content);
                        
                        if (search_content) app.interactions.story.search_bar.submit(e, search_content);

                        e.preventDefault();

                    });

                    form.addEventListener('reset', function(e) {

                        console.log('RESET!', input_el.value);
 
                    });

                    input_el.addEventListener('change', function(e){

                        console.log(e);
                        console.log(input_el);

                        const search_content = e.target.value;

                        app.interactions.story.search_bar.submit(e, search_content);

                    });

                    // //substitutes accents as user types
                    // input_el.addEventListener('input',function(){
                    //     //console.log('fire INPUT')
                    //     this.value = this.value.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
                    // });

                    // input_el.addEventListener('keydown', function (e) {

                    //     if (e.code === 'Enter') {  //checks whether the pressed key is "Enter"

                    //         //console.log(e);
                    //         const search_content = input_el.value;
                    //         app.interactions.story.search_bar.submit(e, search_content);
                    //     }
                    // });

                },

                successful_result_action : function(local, data) {

                    //// seria o caso de levar isso para o render step do scroller?

                    // set vis state, calls vis render

                    if (app.for_the_first_time_in_forever) {

                        app.for_the_first_time_in_forever = false;

                    } else {

                        app.scroller.render['search-step'](direction = 'back');

                    }

                    app.vis.location_card.state.set(local, data);

                    // populates fields

                    app.vis.location_card.update_text_fields();

                    app.scroller.render['location-card']();

                    app.ctrl.prevents_scroll_on_opening(false);

                    const destination_step = document.querySelector(
                        app.interactions.story.search_bar.refs.destination_step
                    );

                    //const scroll = destination_step.getBoundingClientRect().height;//window.innerHeight; //destination_step.scrollHeight;
                    //window.scrollTo(0, scroll, {behavior: "smooth"});

                    destination_step.scrollIntoView({behavior: "smooth"});

                    // function focus() {

                    //     const destination_focus = document.querySelector(
                    //         app.interactions.story.search_bar.refs.destination_focus
                    //     );
        
                    //     destination_focus.focus({ preventScroll: true });

                    // }

                    // setTimeout(focus, 1000);

                }

            }

        },

        menu : {

            ref : {

                button : 'button.menu-toggle',
                menu : 'ul.menu',
                backdrop : '.menu-backdrop'

            },

            monitor_click : function() {

                const btn = document.querySelector(this.ref.button);
                const menu = document.querySelector(this.ref.menu);
                const bkdrop = document.querySelector(this.ref.backdrop);

                btn.addEventListener('click', function(e) {

                    menu.classList.toggle('is-open');
                    btn.classList.toggle('clicked');
                    bkdrop.classList.toggle('activated');

                })


            }

        },

        backdrop : {

            ref : '.menu-backdrop',

            monitor_click : function() {

                const btn_menu = document.querySelector(app.interactions.menu.ref.button);
                const menu = document.querySelector(app.interactions.menu.ref.menu);
                const bkdrop = document.querySelector(this.ref);

                bkdrop.addEventListener('click', function(e) {

                    btn_menu.classList.remove('clicked');
                    menu.classList.remove('is-open');
                    bkdrop.classList.remove('activated');


                })

            }

        }

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
                    
                    first : 'Est??s en un <span data-category-highlight="bosque" data-category-highlight-text="bosque informativo"></span>. Esto significa que en tu comunidad hay condiciones razonables para el ejercicio de un periodismo profesional, que permite a las personas informarse sobre los problemas de su entorno y mejorar la calidad de la vida p??blica local.',

                    second: 'Un <span data-category-highlight="bosque" data-category-highlight-text="bosque informativo"></span> es una zona donde hay condiciones razonables para el ejercicio del periodismo profesional, que es el que est?? al servicio de la comunidad. En este lugar es posible saber lo que pasa y, eventualmente, o??r voces cr??ticas, aunque ello no implique que no haya amenazas para medios y periodistas. <span class="js--random-location-bosque"></span> es un ejemplo de este tipo de regi??n.'

                },

                semibosque : {
                    
                    first : 'Est??s en un <span data-category-highlight="semibosque" data-category-highlight-text="semibosque informativo"></span>. Esto significa que en tu comunidad hay condiciones para el ejercicio del periodismo profesional, pero que este enfrenta limitaciones y riesgos que podr??an ser graves.',

                    second : 'Un <span data-category-highlight="semibosque" data-category-highlight-text="semibosque informativo"></span> es una zona donde hay condiciones para el ejercicio del periodismo profesional, pero este enfrenta limitaciones y riesgos que podr??an ser graves. Si bien es posible que los habitantes reciban noticias sobre su entorno, existen d??ficits capaces de afectar la diversidad y profundidad de la cobertura, en especial de la informaci??n sensible para la calidad de la vida p??blica local. <span class="js--random-location-semibosque"></span> es un ejemplo de este tipo de regi??n.'

                },

 
                semidesierto : {
                    
                    first : 'Est??s en un <span data-category-highlight="semidesierto" data-category-highlight-text="semidesierto informativo"></span>. Esto significa que en tu comunidad hay condiciones escasas para el ejercicio del periodismo profesional',

                    second : 'Un <span data-category-highlight="semidesierto" data-category-highlight-text="semidesierto informativo"></span> es una zona donde hay condiciones escasas para el ejercicio del periodismo profesional. Existen medios y periodistas, pero la producci??n de noticias locales presenta dificultades serias, en especial cuando se trata de la difusi??n de informaci??n sensible para la calidad de la vida p??blica local. Es posible que en este lugar sea m??s sencillo saber qu?? pasa afuera que adentro, como en <span class="js--random-location-semidesierto"></span>.'

                },

                desierto : {
                    
                    first : 'Est??s en un <span data-category-highlight="desierto" data-category-highlight-text="desierto informativo"></span>. Esto significa que en tu comunidad hay condiciones sumamente d??biles para el ejercicio del periodismo profesional, o que este est?? restringido o no ha conseguido desarrollarse de un modo estable.',

                    second : 'En un <span data-category-highlight="desierto" data-category-highlight-text="desierto informativo"></span>, en la pr??ctica, casi no hay condiciones para el ejercicio del periodismo profesional, o este est?? restringido o no ha conseguido desarrollarse de un modo estable. Puede que existan medios y periodistas, pero que estos tiendan a contar lo que pasa en otros ??mbitos o est??n acotados al discurso oficial. En este lugar faltan las noticias locales verificadas o resulta muy dif??cil acceder a ellas. Este es el caso de <span class="js--random-location-desierto"></span>.'

                }

            },

            update_text_fields : function() {

                const refs = app.vis.location_card.refs;
                const state = app.vis.location_card.state;
                const user_category = state.user_location_category;

                // helper function

                function populate_field(ref, origin_of_information, dataset = null) {

                    const field = document.querySelector(refs[ref]);

                    //console.log('Populating field... ', ref, field, refs[ref], origin_of_information);

                    field.innerHTML = 
                      (ref == 'type' & origin_of_information == 'localidad') ?
                      ('departamento de ' + state.user_location_province) :
                      ref.slice(0,-1) == "remaining_category" | ref == "category"? 
                      "" :
                      origin_of_information;

                    if (dataset) field.dataset[dataset] = origin_of_information;
                    if (dataset == 'categoryHighlight') field.dataset.categoryHighlightText = origin_of_information;

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

                //console.log('Remain cat1', remain_cat1);

                populate_field(
                    'text_remaining_category1', 
                    app.vis.location_card.texts[remain_cat1].second
                    );

                populate_field(
                    'random_location_' + remain_cat1, 
                    state.remaining_categories_locations[0].text
                    );


                let remain_cat2 = state.remaining_categories[1];

                //console.log('Remain cat2', remain_cat2);

                populate_field(
                    'text_remaining_category2', 
                    app.vis.location_card.texts[remain_cat2].second
                    );

                populate_field(
                    'random_location_' + remain_cat2, 
                    state.remaining_categories_locations[1].text
                    );


                let remain_cat3 = state.remaining_categories[2];

                //console.log('Remain cat3', remain_cat3);

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

    },

    ctrl : {

        init : function() {

            app.utils.detect_mobile();
            app.utils.colors.populate();
            app.scroller.steps.get();
            app.utils.load_data();
            app.ctrl.prevents_scroll_on_opening(true);
            app.interactions.menu.monitor_click();
            app.interactions.backdrop.monitor_click();
            //app.utils.resize.monitor();
            
        },

        monitors : function() {

            app.interactions.story.search_bar.listen_search();

        },

        prevents_scroll_on_opening : function(option) {

            const method = option ? 'add' : 'remove';

            document.documentElement.classList[method]('prevent-scrolling');

        },

        begin : function(data) {

            //console.log(data);

            //app.data.localidad = data[0];
            //app.data.mask = data[1];
            //app.data.provincia = data[1];
            app.data.fopea_data = data[0];
            // {
            //     localidad : data[0].features.map(d => d.properties),
            //     provincia : data[2].features.map(d => d.properties),
            //     lista_locais : data[3]
            // };

            //const pobs = data[0].features.map(d => d.properties.pob);

            //console.log(pobs);

            //app.data.max_pob = Math.max(...pobs);
            //app.data.min_pob = Math.min(...pobs);
            


            // pre-process list
            app.data.fopea_data.lista_locais.forEach(
                row => {
                    row.text = row.text.normalize('NFD').replace(/[\u0300-\u036f]/g, "")
                }
            );

            // pre-process localidad data
            // app.data.localidad.features.forEach(el => {

            //     const types = Object.keys(app.params.colors);

            //     const categoria = el.properties.categoria;

            //     //const id = el.properties.gid;
            //     //const indice = ( (id - 1) % 4 );


            //     //const tipo = app.params.patterns.names[indice];
            //     //const type = types[indice];
            //     //const color = app.params.colors[type];

            //     //el.properties["tipo"] = tipo;
            //     //el.properties["color"] = color;
            //     el.properties['color_real'] = categoria ?
            //       app.params.colors[app.params.categories[+categoria-1]] :
            //       'lightgray';

            // })

            mapboxgl.accessToken = app.params.mapbox.token;

            app.map_obj = new mapboxgl.Map({
                container: 'map', // container id
                style: app.params.mapbox.style, // style URL
                center: [
                    app.params.mapbox.start.center.lng, 
                    app.params.mapbox.start.center.lat
                ], // starting position [lng, lat]
                zoom: app.params.mapbox.start.zoom, // starting zoom
                interactive: false
            });

            app.map_obj.on('load', function() {

                app.map.localidad.initialize();
                app.map.province.initialize();
                //app.map.world_mask.initialize();
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