const dash = {

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

            provincia : '../data/maps/arg_prov.json',
            localidad : '../data/maps/arg_localidads.geojson',
            mask : '../data/maps/arg_mask.json'

        },

        fopea_data : '../data/output_dash.json',

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
        fopea_data : null

    },

    map_obj : null,

    utils : {

        load_data : function() {

            Promise.all([

                fetch(dash.params.geojsons.localidad, {mode: 'cors'}).then( response => response.json()),
                fetch(dash.params.geojsons.mask, {mode: 'cors'}).then( response => response.json()),
                fetch(dash.params.geojsons.provincia, {mode: 'cors'}).then( response => response.json()),
                fetch(dash.params.fopea_data, {mode: 'cors'}).then( response => response.json())
        
            ])
              .then( data => dash.ctrl.begin(data))
              .catch( error => console.log( error ) );

            //   .catch( error => console.log( error ) );

            // fetch(dash.params.geojsons.mask, {mode: 'cors'})
            //   .then( response => response.json())
            //   .then( data => dash.ctrl.begin(data))
            //   .catch( error => console.log( error ) );

        },

        load_patterns : function() {

            const path = dash.params.patterns.path1;
            const names = dash.params.patterns.names;

            names.forEach(name => {

                dash.map_obj.loadImage(
                    path + name + ".png",
                    function (err, image) {
                        // Throw an error if something went wrong
                        if (err) throw err;
                    
                        // Declare the image
                        dash.map_obj.addImage(name, image);
                        
                        // Use it
    
                    }
                        
                );

            })

        },

        debounce : function(func, wait) {

            // taken from: https://levelup.gitconnected.com/debounce-in-javascript-improve-your-applications-performance-5b01855e086

            let timeout;
          
            // This is the function that is returned and will be executed many times
            // We spread (...args) to capture any number of parameters we want to pass

            return function executedFunction(...args) {
          
              // The callback function to be executed after 
              // the debounce time has elapsed
              const later = () => {
                // null timeout to indicate the debounce ended
                timeout = null;
                
                // Execute the callback
                func(...args);
              };
              // This will reset the waiting every function execution.
              // This is the step that prevents the function from
              // being executed because it will never reach the 
              // inside of the previous setTimeout  
              clearTimeout(timeout);
              
              // Restart the debounce waiting period.
              // setTimeout returns a truthy value (it differs in web vs Node)
              timeout = setTimeout(later, wait);
            };

        },

        colors : {

            get_from_css : function(color) {

                const style = getComputedStyle( document.documentElement );
                const value = style.getPropertyValue( '--color-' + color );
                return value;
    
            },

            populate : function() {

                Object.keys(dash.params.colors).forEach(color => {

                    dash.params.colors[color] = dash.utils.colors.get_from_css(color);
    
                });

            }

        },

        get_category_from_data : function(local, data) {

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

                const categories = dash.params.categories;

                location_category = categories[ data['categoria'] - 1 ];
                
            }

            return location_category;

        },

        generate_random_remaining_locations : function(remaining_categories) {

            const data = dash.data.fopea_data.cidade;
            const output = [];

            remaining_categories.forEach(category => {

                const cat_numeric = '' + (dash.params.categories.indexOf(category) + 1);

                console.log(cat_numeric);

                const available_cities = data
                  .filter(d => ['San Luis', 'Salta'].includes(d.provincia))
                  .filter(d => d.categoria == cat_numeric)
                  .map(d => d.local);

                const amount_available_cities = available_cities.length;

                console.log(available_cities);

                // get a random city

                const index_selected = Math.floor(Math.random() * amount_available_cities);

                output.push(available_cities[index_selected]);

            })

            return output;

        },

        format_value : function(x) {

            const locale = {

                "decimal": ",",
                "thousands": ".",
                "grouping": [3]
            }       
            
            return d3.formatDefaultLocale(locale).format(",.0f")(x)

        }

    },

    map : {

        localidad : {

            initialize : function() {

                dash.map_obj.addSource('localidad', {
                    type: 'geojson',
                    'data' : dash.data.localidad,
                    'promoteId' : 'link'
                });

                dash.map_obj.addLayer({
                    'id': 'localidad',
                    'type': 'circle',
                    'source': 'localidad',
                    'layout': {},
                    'paint': {
                      'circle-color': ['get', 'color_real'],
                      'circle-radius' : [
                          'case', [
                              'boolean', 
                              ['feature-state', 'hover'], 
                              false
                            ], 10,
                            2,
                        ],
                      'circle-stroke-width': [
                        'case', [
                            'boolean', 
                            ['feature-state', 'hover'], 
                            false
                          ], 2,
                          0,
                        ],
                      'circle-stroke-color': [
                        'case', [
                            'boolean', 
                            ['feature-state', 'hover'], 
                            false
                          ], '#ffffff',
                          'transparent',
                        ] 
                    }
                }); 

                dash.map_obj.addLayer({
                    'id': 'localidad-highlight',
                    'type': 'circle',
                    'source': 'localidad',
                    'layout': {},
                    'paint': {
                      'circle-color': 'transparent',
                      'circle-radius': 15,
                      'circle-stroke-width': 2,
                      'circle-stroke-color': 'black'
                    }, 'filter': ['==', 'localidad', '']
                }); 

            },

            toggle_highlight_circle : function(localidad) {

                dash.map_obj.setFilter(
                    'localidad-highlight', [
                        '==',
                        ['get', 'localidad'],
                        localidad
                ]);

            },
                
            popup: new mapboxgl.Popup(
                    {
                        closeButton: false,
                        loseOnClick: false
                    }),

            monitor_hover_event : function() {

                let hoveredStateId = null;

                dash.map_obj.on('mouseenter', 'localidad', function (e) {
                    // Change the cursor style as a UI indicator.
                    dash.map_obj.getCanvas().style.cursor = 'pointer';

                    console.log(e);
                     
                    let coordinates = e.features[0].geometry.coordinates.slice();
                    let name = e.features[0].properties.localidad;
                     
                    // Ensure that if the map is zoomed out such that multiple
                    // copies of the feature are visible, the popup appears
                    // over the copy being pointed to.
                    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                    }
                     
                    // Populate the popup and set its coordinates
                    // based on the feature found.
                    dash.map.localidad.popup.setLngLat(coordinates).setHTML(name).addTo(dash.map_obj);

                    ////////////
                    // highlight circle

                    if (hoveredStateId) {
                        dash.map_obj.setFeatureState(
                            { 
                                source: 'localidad',
                                id: hoveredStateId
                            },

                            { hover : false }
                        )

                        //console.log(' Quando eu venho aqui? ')
                    }

                    hoveredStateId = e.features[0].properties.link;

                    dash.map_obj.setFeatureState(
                        { 
                            source: 'localidad',
                            id: hoveredStateId
                        },

                        { hover : true }
                    )
                });
                     
                dash.map_obj.on('mouseleave', 'localidad', function () {

                    dash.map_obj.getCanvas().style.cursor = '';
                    dash.map.localidad.popup.remove();

                    // return circle to normal sizing and color
                    if (hoveredStateId) {
                        dash.map_obj.setFeatureState(
                            { source: 'localidad', id: hoveredStateId },
                            { hover: false }
                        );
                    }
                
                    hoveredStateId = null;

                });

            },

            click_event_handler : function(feature) {


                const localidad = feature.properties.localidad; //e.features[0].properties.localidad;
                const provincia = feature.properties.provincia // e.features[0].properties.provincia;

                const local = {

                    local : localidad,
                    tipo  : "localidad",
                    text  : localidad + '(' + provincia + ')',
                    provincia : provincia

                };

                console.log("Clicou em ", localidad, local, dash.vis.location_card.state.user_location_province);

                dash.vis.render_selected_place(local);

            }

        },

        province : {

            initialize : function() {

                dash.map_obj.addSource('provincia', {
                    type: 'geojson',
                    'data' : dash.data.provincia,
                    'promoteId' : 'nam'
                });

                dash.map_obj.addLayer({
                    'id': 'provincia',
                    'type': 'fill',
                    'source': 'provincia',
                    'layout': {},
                    'paint': {
                      'fill-color': 'hotpink',
                      'fill-opacity': [
                        'case',
                        [
                            'boolean', 
                            ['feature-state', 'hover'], 
                            false
                        ],
                        .1,
                        0
                    ]
                    }
                }); 

                dash.map_obj.addLayer({
                    'id': 'provincia-border-hover',
                    'type': 'line',
                    'source': 'provincia',
                    'layout': {},
                    'paint': {
                      'line-width': 4,
                      'line-color': [
                        'case',
                        [
                            'boolean', 
                            ['feature-state', 'hover'], 
                            false
                        ],
                        "hotpink",
                        "transparent"
                    ]
                    }
                }); 

                dash.map_obj.addLayer({
                    'id': 'provincia-border',
                    'type': 'line',
                    'source': 'provincia',
                    'layout': {},
                    'paint': {
                      'line-color': 'black',
                      'line-width': 5
                    },
                    'filter': ['==', 'provincia', '']}); // puts behind road-label

            },

            toggle_highlight_border_provincia : function(provincia) {

                dash.map_obj.setFilter(
                    'provincia-border', [
                        '==',
                        ['get', 'nam'],
                        provincia
                ]);

            },

            monitor_hover_event : function() {

                let hoveredStateId = null;

                function highlight_on_hover(e) {

                    // precisa desse if aqui para fazer tirar o estado de hover da provincia anterior quando passa para outra provincia

                    if (hoveredStateId) {
                        dash.map_obj.setFeatureState(
                            { 
                                source: 'provincia',
                                id: hoveredStateId
                            },

                            { hover : false }
                        )

                        //console.log(' Quando eu venho aqui? ')
                    }

                    hoveredStateId = e.features[0].properties.nam;

                    dash.map_obj.setFeatureState(
                        { 
                            source: 'provincia',
                            id: hoveredStateId
                        },

                        { hover : true }
                    )

                    //console.log('Hover no ', hoveredStateId)

                    // algo mais a fazer aqui

                };

                // function debounced(e) {
                //     dash.utils.debounce(highlight_on_hover(e), wait = 10000);
                // }

                dash.map_obj.on('mousemove', 'provincia', highlight_on_hover);

                dash.map_obj.on('mouseleave', 'provincia', function () {
    
                    if (hoveredStateId) {
                        dash.map_obj.setFeatureState(
                            { source: 'provincia', id: hoveredStateId },
                            { hover: false }
                        );
                    }
                
                    hoveredStateId = null;
                });

            },

            click_event_handler : function(feature) {

                const province_name = feature.properties.nam; //e.features[0].properties.nam;

                if (province_name != dash.vis.location_card.state.user_location_name) {

                    const local = {

                        local : province_name,
                        tipo  : "provincia",
                        text  : province_name

                    };

                    console.log("Clicou em ", province_name, local);

                    dash.vis.render_selected_place(local);

                } else console.log('Clicou na mesma provincia, nao precisa renderizar.')

            }

        },

        fog_of_war : {

            initialize : function() {

                dash.map_obj.addLayer({
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

                // dash.map_obj.addLayer({
                //     'id': 'fog_of_war_cidade',
                //     'type': 'fill',
                //     'source': 'cidade',
                //     'paint': {
                //       'fill-color': 'ghostwhite',
                //       'fill-opacity': 0,
                //       'fill-outline-color': '#555'
                //     },
                //     'filter': ['!=', 'cidade', '']
                // }); // puts behind road-label

            },

            toggle : function(location, type = 'provincia') {

                let opacity = 0;

                if (location != '') {

                    opacity = 1;

                    dash.map_obj.setFilter(
                        'fog_of_war_' + type, [
                            '!=',
                            ['get', 'nam'],
                            location
                        ]);


                }

                dash.map_obj.setPaintProperty('fog_of_war_' + type, 'fill-opacity', opacity);

            }

        },

        world_mask : {

            initialize : function() {

                dash.map_obj.addSource('mask', {
                    type: 'geojson',
                    'data' : dash.data.mask
                });

                dash.map_obj.addLayer({
                    'id': 'mask',
                    'type': 'fill',
                    'source': 'mask',
                    'layout': {},
                    'paint': {'fill-color': 'ghostwhite'},
                });

            }

        },

        fit_Argentina : function() {

            dash.map_obj.fitBounds([
                [-75, -21],
                [-53, -56]],

                { 
                    pitch: 0,
                    bearing : 0
                }
            );

        },

        set_initial_view : function() {

            dash.map_obj.flyTo(
                {
                    center: [
                        dash.params.mapbox.start.center.lng, 
                        dash.params.mapbox.start.center.lat
                    ], 
                    zoom: dash.params.mapbox.start.zoom,
                    bearing: 0,
                    pitch: 0
                }
            );

            //dash.map_obj.setCenter(dash.params.mapbox.start.center);
            //dash.map_obj.setZoom(dash.params.mapbox.start.zoom);

        },

        highlight_feature : function(location, type = 'provincia', pitch = 0, bearing = 0) {

            console.log(type, location, pitch, bearing);

            // type provincia, cidade

            //let locations = dash.map_obj.querySourceFeatures(type, {
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

            const location_data = dash.data.fopea_data[type].filter(d => d.local == location)[0];

            console.log(location_data);

            let bbox_highlighted = [
                location_data.xmin, location_data.ymin,
                location_data.xmax, location_data.ymax
            ];  
            
            console.log(bbox_highlighted);
        
            dash.map_obj.fitBounds(

                bbox_highlighted, 

                {
                    linear : false, // false means the map transitions using map.flyTo()
                    speed: 1, 
                    padding: {top: 30, bottom: 30, left: 30, right: 30},
                    pitch: pitch,
                    bearing: bearing
                }
            );

            // increases circle radius when zooming

            dash.map_obj.setPaintProperty(
                'localidad', 
                'circle-radius', 
                [
                    'case', [
                        'boolean', 
                        ['feature-state', 'hover'], 
                        false
                    ], 10,
                    5,
                ]
            );

        },

        monitor_click_event : function() {

            dash.map_obj.on('click', function(e) {
                let features = dash.map_obj.queryRenderedFeatures(e.point, { layers: ['localidad', 'provincia'] });

                if (features.length) {

                    let type = features[0].layer.id;

                    if (type == 'provincia') type = 'province';

                    console.log("Clicked on a", type, ". Detalhes: ", features, e);

                    dash.map[type].click_event_handler(features[0]);

                }

            });

        }

    },

    scroller : {

        steps : {

            list : null,

            get : function() {

                const steps_html = document.querySelector(".story-container").children;

                dash.scroller.steps.list = Array.from(steps_html).map(d => d.dataset.step);

            }

        },

        config : function() {

            enterView({

                selector: '.story-step',

                enter: function(el) {

                    const step = el.dataset.step;

                    console.log("Renderizando step... ", step);

                    dash.scroller.render[step]();

                },

                exit: function(el) {

                    const step = el.dataset.step;

                    const index_step = dash.scroller.steps.list.indexOf(step);

                    const step_anterior = dash.scroller.steps.list[index_step - 1];

                    dash.scroller.render[step_anterior]();

                    console.log("saiu, ", step_anterior);
                },

                offset: 0.5, // enter at middle of viewport
                //once: true, // trigger just once
            });

        },

        // por em outro lugar?

        render : {

            'abertura' : function() {

                dash.map_obj.setPaintProperty('cidade', 'fill-pattern', null);
                dash.map_obj.setPaintProperty('cidade', 'fill-color', ['get', 'color']);
                dash.map_obj.setPaintProperty('cidade', 'fill-outline-color', 'ghostwhite');
                dash.map_obj.setPaintProperty('cidade', 'fill-opacity', .5);
                dash.map.set_initial_view();
                dash.map.cidade.toggle_highlight_border('');

                //dash.interactions.story.toggle_visibility("dashboard_button");

            },

            'pesquisa' : function() {

                console.log('Pesquisando...');

                dash.map.set_initial_view();
                dash.map.fog_of_war.toggle('provincia', '');
                dash.map.fog_of_war.toggle('cidade', '');
                dash.map_obj.setPaintProperty('cidade', 'fill-color', ['get', 'color']);
                dash.map.cidade.toggle_highlight_border('');
                
            },

            'location-card' : function() {

                const type = dash.vis.location_card.state.user_location_type;
                const location = dash.vis.location_card.state.user_location_name

                dash.map.highlight_feature(type, location, pitch = 60, bearing = 30  );

                dash.map_obj.setPaintProperty('cidade', 'fill-color', ['get', 'color_real']);

                dash.map.cidade.toggle_highlight_border(location);

                dash.map.fog_of_war.toggle(type, location);

            },

            'story-no-map-interactions' : function() {},

            'segundo' : function() {

                dash.map.fit_Argentina();

                dash.map_obj.setPaintProperty('cidade', 'fill-pattern', ['get', 'tipo']);
                dash.map_obj.setPaintProperty('cidade', 'fill-opacity', 1);
                dash.map.fog_of_war.toggle('provincia', '');
                dash.map.fog_of_war.toggle('cidade', '');

            },

            'importancia-periodismo' : function() {

                // dash.map.highlight_feature(type, location, pitch = 60, bearing = 30  );

                // dash.map.cidade.toggle_highlight_border(location);

                // dash.map.fog_of_war.toggle(type, location);

            },

            'real-colors' : function() {

                dash.map.fit_Argentina();
                dash.map.fog_of_war.toggle('provincia', '');
                dash.map.fog_of_war.toggle('cidade', '');
                dash.map.cidade.toggle_highlight_border('');
                dash.map_obj.setPaintProperty('cidade', 'fill-color', ['get', 'color_real']);

            },

            'remaining-category1' : function() {

                const location = dash.vis.location_card.state.remaining_categories_locations[0];

                dash.map.highlight_feature('cidade', location);

                dash.map.fog_of_war.toggle('cidade', location);

                dash.map.cidade.toggle_highlight_border(location);

            },

            'remaining-category2' : function() {

                const location = dash.vis.location_card.state.remaining_categories_locations[1];

                dash.map.highlight_feature('cidade', location);

                dash.map.fog_of_war.toggle('cidade', location);

                dash.map.cidade.toggle_highlight_border(location);

            },

            'remaining-category3' : function() {

                const location = dash.vis.location_card.state.remaining_categories_locations[2];

                dash.map.highlight_feature('cidade', location);

                dash.map.fog_of_war.toggle('cidade', location);

                dash.map.cidade.toggle_highlight_border(location);

            },

            'blabla' : function() {

                dash.map.cidade.toggle_highlight_border('');

                dash.map.fit_Argentina();

            },

            'penultimo' : function() {

                dash.map.cidade.toggle_highlight_border('');
                dash.map.fog_of_war.toggle('cidade', '');
                dash.map.fit_Argentina();


            },

            'fecho' : function() {

                //dash.map.fit_Argentina();
                //dash.map.highlight_feature('provincia', 'Salta');


            }



        }

    },

    interactions : {

        story : {

            refs : {
    
                dashboard_button : 'a.go-to-dashboard',

    
            },
    
            toggle_visibility : function(name){
    
                const ref = dash.interactions.story.refs[name];
    
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

                    const ref = dash.interactions.story.search_bar.refs.datalist_search;
    
                    const parent = document.querySelector(ref);
    
                    const data = dash.data.fopea_data.lista_locais.filter(d => d.tipo == "cidade");
    
                    data.forEach(row => {
    
                        const new_option = document.createElement("option");
                        
    
                        new_option.value = row.text;
                        new_option.dataset.name = row.localidade;
                        new_option.dataset.tipoLocalidade = row.tipo;
    
                        parent.appendChild(new_option);
    
                    })
    
                },

                listen_search : function() {

                    const ref_btn = dash.interactions.story.search_bar.refs.search_button;
                    const ref_input = dash.interactions.story.search_bar.refs.input;

                    const btn = document.querySelector(ref_btn);
                    const input_el = document.querySelector(ref_input);

                    console.log(btn);

                    btn.addEventListener('click', function(e) {

                        //console.log("hi!")

                        const search_content = input_el.value;

                        //console.log(input_el.value);

                        if (
                            dash.data.fopea_data.lista_locais
                              .map(row => row.text)
                              .indexOf(search_content) > 0
                        ) {

                            console.log("valor detectado", search_content);

                            const local = dash.data.fopea_data.lista_locais.filter(row => row.text == search_content)[0];

                            console.log("tipo: ", local.tipo);
                            console.log("nome: ", local.local);

                            // const data = dash.data.fopea_data[local.tipo].filter(d => d.local == local.local)[0];

                            console.log("Dados: ", data);

                            dash.vis.render_selected_place(local);


                        } else {

                            console.log("Valor invalido, chico")

                            // fazer algo visível na página aqui

                        }


                    });

                }

            },

        },

        relato_periodista : {

            refs : {

                text : '.investigator-story',
                close_button : 'button.close-aside',
                toggle_button : 'button.relato'

            },

            open_close : function(e) {

                console.log('called', e);

                document.querySelector(dash.interactions.relato_periodista.refs.text).classList.toggle('folded');
                document.querySelector(dash.interactions.relato_periodista.refs.toggle_button).classList.toggle('clicked');
                document.documentElement.classList.toggle('aside-shown-no-overflow-here');

            },

            monitor : function(which_button) {

                const btn = document.querySelector(dash.interactions.relato_periodista.refs[which_button + '_button']);

                console.log('monitoring ', which_button, '...');

                btn.addEventListener('click', dash.interactions.relato_periodista.open_close);

            }

        }

    },

    vis : {

        render_selected_place : function(local) {

            // local has the form { text, local, tipo }

            console.log('Renderizando ', local.local, local.tipo);

            const data = dash.data.fopea_data[local.tipo].filter(d => d.local == local.local)[0];

            console.log(data);

            // if province, highlight on map

            if (local.tipo == 'provincia') {
                dash.map.highlight_feature(local.local, type = 'provincia');
                dash.map.province.toggle_highlight_border_provincia(local.local);
            } else if (local.tipo == 'localidad') {
                dash.map.localidad.toggle_highlight_circle(local.local);
            }

            //// seria o caso de levar isso para o render step do scroller?

            // check if new selection is another localidad in the same province, or if it is another province (in case a province was selected)

            console.log(local.provincia, dash.vis.location_card.state.user_location_province);

            let new_view = true;

            if (local.provincia) {

                new_view = local.provincia != dash.vis.location_card.state.user_location_province;

            }

            console.log('new view', new_view);
            

            // set vis state, calls vis render

            dash.vis.location_card.state.set(local, data);

            // populates fields

            //dash.vis.location_card.update_text_fields();
            dash.vis.location_card.text_field.update();
            dash.vis.location_card.other_fields.category_field.update();
            dash.vis.location_card.info_table.update();

            // update breadcrumb
            dash.vis.location_card.breadcrumbs.update(local.tipo);

            // with the fields updated, resize svg

            dash.vis.stripplot.dimensions.set_size();
            dash.vis.stripplot.scales.range.set();
            dash.vis.stripplot.scales.set(local.tipo);

            // render

            if (new_view) {

                dash.vis.stripplot.components.labels.render(local.tipo);
                dash.vis.stripplot.components.lines.render(local.tipo);
                dash.vis.stripplot.components.marks.render[local.tipo]();
                dash.vis.stripplot.components.label_selected.render(local.tipo);
                dash.vis.stripplot.components.min_max_labels.render(local.tipo);
                dash.vis.stripplot.components.separation_lines.render(local.tipo);

            } else {

                dash.vis.stripplot.components.marks.render_lite[local.tipo]();
                dash.vis.stripplot.components.label_selected.render(local.tipo);

            }



            // listeners

            dash.vis.stripplot.interactions.hover_on_strip.monitor();
            dash.vis.stripplot.interactions.click_on_strip.monitor();

            //updates maps

            // let type; 
            
            // if (local.type == "cidade") {

            //     type = 'cidade';

            // } else {

            //     if (local.type == "provincia") {
                    
            //         type = 'provincia';

            //     }

            // }
            
            // dash.map.highlight_feature(type = type, location = local.local);

            // scrolls to card

            //const destination_step = document.querySelector(
            //    dash.interactions.story.search_bar.refs.destination_step
            //);

            //destination_step.scrollIntoView({behavior: "smooth"});


        },

        location_card : {

            state : {

                user_location : null,
                user_location_name : null,
                user_location_type : null,
                user_location_category : null,
                user_location_province : null,
                remaining_categories : null,
                remaining_categories_locations : null,
                location_data : null,

                set : function(local, data) {

                    const state = dash.vis.location_card.state;

                    state.user_location = local.text;
                    state.user_location_name = local.local; //// mudar esse local.local :/
                    state.user_location_type = local.tipo;
                    state.user_location_province = local.provincia;

                    const category = local.tipo == "provincia" ? 'bosque' : dash.utils.get_category_from_data(local, data);

                    state.user_location_category = category

                    const remaining_categories = dash.params.categories.filter(d => d != category);

                    state.remaining_categories = remaining_categories;

                    // state.remaining_categories_locations = dash.utils.generate_random_remaining_locations(remaining_categories);

                    state.location_data = data;

                }

            },

            text_field : {

                ref: '.js--text-field',

                provincia : {

                    name : () => dash.vis.location_card.state.user_location_name,

                    category : () => dash.vis.location_card.state.user_location_category,

                    category_description : () => dash.vis.location_card.texts[dash.vis.location_card.state.user_location_category].first,

                    medio_prototipico : () => dash.vis.location_card.state.location_data['Descripción del medio prototípico']

                },

                localidad : {

                    name : () => dash.vis.location_card.state.user_location_name,

                    category : () => dash.vis.location_card.state.user_location_category,

                    category_description : () => dash.vis.location_card.texts[dash.vis.location_card.state.user_location_category].first,

                    medio_prototipico : () => ''

                },

                update : function() {

                    const text_fields = document.querySelectorAll(this.ref);

                    console.log('Atualizar textos de ', text_fields);

                    text_fields.forEach(field => {

                        console.log(field);

                        const location_type = dash.vis.location_card.state.user_location_type;

                        const field_type = field.dataset.text_field;

                        field.innerHTML = this[location_type][field_type]();

                    
                    })

                }

            },

            other_fields : {

                category_field : {
                    
                    ref : '[data-category]',
                    
                    update : function() {

                        const cat_field = document.querySelector(this.ref);

                        cat_field.dataset.category = dash.vis.location_card.state.user_location_category;

                    }

                }

            },

            info_table : {

                ref : '[data-infotable_field]',

                poblacion : () =>  dash.vis.location_card.state.location_data['pob'],

                medios : () =>  dash.vis.location_card.state.location_data['cant_medios'],
                
                periodistas : () =>  dash.vis.location_card.state.location_data['cant_periodistas'],

                update : function() {

                    const info_table_fields = document.querySelectorAll(this.ref);

                    console.log('Atualizar números de');

                    info_table_fields .forEach(field => {

                        const field_type = field.dataset.infotable_field;

                        field.innerHTML = this[field_type]();

                    })

                }

            },

            breadcrumbs : {

                ref : '[data-breadcrumbs-type]',

                activeName : 'dashboard--breadcrumbs-active',

                update : function(type) {

                    const crumbs = document.querySelectorAll(this.ref);

                    crumbs.forEach(crumb => {

                        if (crumb.dataset.breadcrumbsType == type) {

                            crumb.classList.add(this.activeName);

                        } else {
                            crumb.classList.remove(this.activeName);
                        }

                    });

                }

            },

            refs : {

                name : '.js--location-name',
                type : '.js--location-type',
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
                    
                    first : 'Estás en un <span data-category-highlight="bosque">bosque</span>. Esto significa que su ciudad está bien servida por un periodismo profesional de calidad, que permite a las personas estar bien informadas sobre los problemas locales y mejora la calidad de la vida pública.',

                    second: 'Un <span data-category-highlight="bosque">bosque</span> es una región bien servida por un periodismo profesional de calidad, que permite a las personas estar bien informadas sobre los problemas locales. La ciudad de <span class="js--random-location-bosque"></span> es un ejemplo de este tipo de región.'

                },

                semibosque : {
                    
                    first : 'Estás en un <span data-category-highlight="semibosque">semibosque</span>. Esto significa que su ciudad tiene un buen acceso al periodismo profesional, pero con algunos problemas graves. Si bien es posible obtener información a través de los periódicos locales, existen fallas en la cobertura que pueden dañar la calidad de la vida pública.',

                    second : 'Un <span data-category-highlight="semibosque">semibosque</span> es una región que tiene acceso al periodismo profesional, pero con algunos problemas serios. Si bien es posible obtener información a través de los periódicos locales, existen fallas en la cobertura. La ciudad de <span class="js--random-location-semibosque"></span> es un ejemplo de este tipo de región.'

                },

 
                semidesierto : {
                    
                    first : 'Estás en un <span data-category-highlight="semidesierto">semidesierto</span>. Esto significa que su ciudad tiene serios problemas para acceder a un periodismo de calidad, aunque la prensa profesional esté presente. Esto causa problemas considerables en la calidad de la vida pública.',

                    second : 'Un <span data-category-highlight="semidesierto">semidesierto</span> es una región que tiene serios problemas para acceder a un periodismo de calidad, a pesar de que la prensa profesional está presente, como en la ciudad de <span class="js--random-location-semidesierto"></span>.'

                },

                desierto : {
                    
                    first : 'Estás en un <span data-category-highlight="desierto">desierto</span>. Esto significa que, en la práctica, casi no hay periodismo profesional de calidad en tu ciudad. Esto afecta gravemente a la calidad de la vida pública.',

                    second : 'En un <span data-category-highlight="desierto">desierto</span>, en la práctica, casi no hay periodismo profesional de calidad. Este es el caso de <span class="js--random-location-desierto"></span>.'

                }

            },

            // update_text_fields : function() {

            //     const refs = dash.vis.location_card.refs;
            //     const state = dash.vis.location_card.state;
            //     const user_category = state.user_location_category;

            //     // helper function

            //     function populate_field(ref, origin_of_information, dataset = null) {

            //         const field = document.querySelector(refs[ref]);

            //         console.log(ref, field, refs[ref], origin_of_information);

            //         field.innerHTML = (ref == 'type' & origin_of_information == 'cidade') ?
            //         ('departamento de ' + state.user_location_province) :
            //         origin_of_information;

            //         if (dataset) field.dataset[dataset] = origin_of_information;

            //     }

            //     // name

            //     populate_field('name', state.user_location_name);

            //     // type

            //     populate_field('type', state.user_location_type);

            //     // main category field

            //     populate_field('main_category', user_category, dataset = 'category');

            //     // description field

            //     populate_field('category_description', dash.vis.location_card.texts[user_category].first);

            //     // category field in second page

            //     populate_field('category', user_category, dataset = 'categoryHighlight');

            //     // remaining categories fields

            //     populate_field('remaining_category1', state.remaining_categories[0], dataset = 'categoryHighlight');
            //     populate_field('remaining_category2', state.remaining_categories[1], dataset = 'categoryHighlight');
            //     populate_field('remaining_category3', state.remaining_categories[2], dataset = 'categoryHighlight');

            //     let remain_cat1 = state.remaining_categories[0];

            //     console.log('Remain cat1', remain_cat1);

            //     populate_field(
            //         'text_remaining_category1', 
            //         dash.vis.location_card.texts[remain_cat1].second
            //         );

            //     populate_field(
            //         'random_location_' + remain_cat1, 
            //         state.remaining_categories_locations[0]
            //         );


            //     let remain_cat2 = state.remaining_categories[1];

            //     console.log('Remain cat2', remain_cat2);

            //     populate_field(
            //         'text_remaining_category2', 
            //         dash.vis.location_card.texts[remain_cat2].second
            //         );

            //     populate_field(
            //         'random_location_' + remain_cat2, 
            //         state.remaining_categories_locations[1]
            //         );


            //     let remain_cat3 = state.remaining_categories[2];

            //     console.log('Remain cat3', remain_cat3);

            //     populate_field(
            //         'text_remaining_category3', 
            //         dash.vis.location_card.texts[remain_cat3].second
            //         );

            //     populate_field(
            //         'random_location_' + remain_cat3, 
            //         state.remaining_categories_locations[2]
            //         );

            // }

        },

        stripplot : {

            refs : {

                svg : '.vis-dash-stripplot',
                container : 'div.vis-dash-container'

            },
        
            sels : {
        
                d3 : {

                    svg : null,
                    container : null,

                    strips : null,

                    set : function() {

                        Object.keys(dash.vis.stripplot.refs).forEach(ref_name => {

                            dash.vis.stripplot.sels.d3[ref_name] = d3.select(dash.vis.stripplot.refs[ref_name]);

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

                separation_line : {

                    width : 1,
                    bottom: 7

                },

                rect : {

                    highlight: {
                        
                        height: 30,
                        width: 6

                    },

                    other : {
                        
                        height: 15,
                        width: 3

                    }

                },

                lateral_margins : 20,

                strip_height : null,

                strip_line_relative : null,

                svg_width : null,

                set_size : function() {

                    const svg = document.querySelector(dash.vis.stripplot.refs.svg);

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

                    // if (height_svg_new > 0) { 

                    //     svg.style.height = height_svg_new ;

                    // }

                    dash.vis.stripplot.dimensions.svg_width = svg.getBoundingClientRect().width;

                    const dimensions = dash.vis.stripplot.dimensions;

                    const height = 
                      dimensions.variable_label.top +
                      dimensions.variable_label.height + 
                      dimensions.location_label.top + 
                      dimensions.location_label.height +
                      dimensions.axis_line.top +
                      dimensions.axis_line.width +
                      dimensions.axis_line.bottom +
                      dimensions.separation_line.width +
                      dimensions.separation_line.bottom;

                    dash.vis.stripplot.dimensions.strip_height = height;
                    dash.vis.stripplot.dimensions.strip_line_relative = height - dimensions.axis_line.bottom;

                    const nof_variables = dash.vis.stripplot.variables[
                        dash.vis.location_card.state.user_location_type
                    ].length;

                    svg.style.height = nof_variables * height;
                    
                }

            },

            variables : {

                localidad : [ 

                    'pobXmedios', 
                    'pobXperiodistas' 

                ],

                provincia : [ 
                    'Relación de periodistas por medio', 
                    'Incidencia de la agenda de noticias locales', 
                    'Impacto de la publicidad oficial'
                ],

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

                        const dimensions = dash.vis.stripplot.dimensions;

                        dash.vis.stripplot.scales.range.value = [

                            dimensions.lateral_margins,
                            dimensions.svg_width - dimensions.lateral_margins

                        ];

                    }

                },

                x : {},
                y : {},

                set : function(type) {

                    const variables = dash.vis.stripplot.variables[type];
                    const dimensions = dash.vis.stripplot.dimensions;
                    const scales = dash.vis.stripplot.scales;

                    console.log("setting scales...", type, variables);

                    // resets scales
                    scales.y = {};
                    scales.x = {};

                    variables.forEach((variable,i) => {

                        // y

                        scales.y[variable] = i * dimensions.strip_height + dimensions.strip_line_relative;

                        // x

                        let data;

                        if (type == 'provincia') {

                            data = dash.data.fopea_data[type];

                        } else {

                            const provincia = dash.vis.location_card.state.user_location_province;

                            data = dash.data.fopea_data[type].filter(d => d.provincia == provincia);

                            console.log('dominio', type, provincia, variable, data);

                        }

                        let domain = d3.extent(
                            data, 
                            d => d[variable]
                        )

                        // if (variable == 'cat_media') {

                        //     domain = [1,4]

                        // } else if (variable == 'Impacto de la publicidad oficial' | 'Incidencia de la agenda de noticias locales') {

                        //     domain = [0, 1]

                        // } else {

                            // let key, location_stats;

                            // if (type == 'cidade') {

                            //     key = 'provincias';

                            //     location_stats = dash.data.fopea_data.stats[key].filter(
                            //         d => d.provincia == dash.vis.location_card.state.user_location_province)[0]

                            //     console.log("Location stats", location_stats)

                            // } else {

                            //     key = 'nacional';

                            //     location_stats = dash.data.fopea_data.stats[key][0]

                            // }

                            // domain = [

                            //     location_stats[variable + '_min'],
                            //     location_stats[variable + '_max']

                            // ];

                        //}


                        scales.x[variable] = d3.scaleLinear()
                          .range(scales.range.value)
                          .domain(domain);

                    })



                },

            },

            components : {

                labels : {

                    render : function(type) {

                        const variables = dash.vis.stripplot.variables[type];

                        console.log(variables);

                        dash.vis.stripplot.sels.d3.container
                          .selectAll("p.vis-dash-stripplot-labels-variables")
                          .data(variables)
                          .join("p")
                          .classed("vis-dash-stripplot-labels-variables", true)
                          .style("left", 0)
                          .style("top", (d,i) => dash.vis.stripplot.dimensions.strip_height*i + "px")
                          .text((d,i) => dash.vis.stripplot.variables[type][i]);

                    }

                },

                min_max_labels : {

                    render : function(type) {

                        const variables = dash.vis.stripplot.variables[type];

                        labels = [];

                        variables.forEach(variable => {

                            labels.push(

                                {
                                    type : 'min',
                                    top : dash.vis.stripplot.scales.y[variable],
                                    left : dash.vis.stripplot.scales.x[variable].range()[0],
                                    value : dash.utils.format_value(
                                        dash.vis.stripplot.scales.x[variable].domain()[0]
                                    )

                                },

                                {
                                    type : 'max',
                                    top : dash.vis.stripplot.scales.y[variable],
                                    left : dash.vis.stripplot.scales.x[variable].range()[1],
                                    value : dash.utils.format_value(
                                        dash.vis.stripplot.scales.x[variable].domain()[1]
                                    )

                                }

                            );
                        });

                        dash.vis.stripplot.sels.d3.container
                            .selectAll("span.vis-dash-stripplot-labels-minmax")
                            .data(labels)
                            .join("span")
                            .classed("vis-dash-stripplot-labels-minmax", true)
                            .attr("data-label-minmax", d => d.type)
                            .style("left", d => d.left + 'px')
                            .style("top", d => d.top + "px")
                            .text(d => d.value)
                        ;

                    }

                },

                lines : {

                    render : function(type) {

                        const variables = dash.vis.stripplot.variables[type];

                        dash.vis.stripplot.sels.d3.svg
                          .selectAll("line.vis-dash-stripplot-axis")
                          .data(variables)
                          .join("line")
                          .classed("vis-dash-stripplot-axis", true)
                          .attr("x1", 0)
                          .attr("x2", dash.vis.stripplot.dimensions.svg_width)
                          .attr("y1", d => dash.vis.stripplot.scales.y[d])
                          .attr("y2", d => dash.vis.stripplot.scales.y[d]);

                    }

                },

                marks : {

                    render : {
                        
                        provincia : function() {

                            const type = 'provincia';

                            const variables = dash.vis.stripplot.variables[type];
                                
                            const data = dash.data.fopea_data.provincia;

                            const variables_not_present = dash.vis.stripplot.variables.localidad;

                            // removes marks from other levels

                            variables_not_present.forEach(variable => {

                                dash.vis.stripplot.sels.d3.svg
                                .selectAll("circle.vis-dash-stripplot-marks[data-variable='" + variable + "']")
                                .transition()
                                .duration(500)
                                .attr('r', 0)
                                .remove();

                            });

                            variables.forEach(variable => {





                                console.log('circulos da variavel... ', variable);

                                const marks = dash.vis.stripplot.sels.d3.svg
                                .selectAll("rect.vis-dash-stripplot-marks[data-variable='" + variable + "']")
                                .data(data, d => d.local)
                                .join('rect')
                                .classed('vis-dash-stripplot-marks', true)
                                .classed('marks-na', d => !dash.vis.stripplot.scales.x[variable](d[variable])) // se der undefined vai dar true
                                .classed('marks-location-highlighted', d => d.local == dash.vis.location_card.state.user_location_name)
                                .attr('data-variable', variable)
                                .attr('data-location', d => d.local)
                                .attr('fill', function(d) {

                                    if (type == 'provincia') return 'hotpink'
                                    else {
                                        const cat = Math.ceil(+d.categoria);

                                        const categoria = dash.params.categories[cat-1]

                                        return dash.params.colors[categoria];

                                    }
                                    
                                });

                                marks.enter().attr('y', d => 
                                dash.vis.stripplot.scales.y[variable]);

                                marks
                                .transition()
                                .duration(500)
                                .attr('x', d => {

                                    console.log(d.variable);

                                    if (dash.vis.stripplot.scales.x[variable](d[variable])) {

                                        return dash.vis.stripplot.scales.x[variable](d[variable])
                                        -
                                        (d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.width : dash.vis.stripplot.dimensions.rect.other.width)/2
                                
                                    } else {

                                        return 0

                                    }
                                })
                                .attr('y', d => 
                                dash.vis.stripplot.scales.y[variable]
                                -
                                (d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.height : dash.vis.stripplot.dimensions.rect.other.height))
                                .attr('height', d => d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.height : dash.vis.stripplot.dimensions.rect.other.height)
                                .attr('width', d => d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.width : dash.vis.stripplot.dimensions.rect.other.width)
                                ;

                            })

                        },

                        localidad : function() {

                            const type = 'localidad';

                            const variables = dash.vis.stripplot.variables[type];

                            const provincia = dash.vis.location_card.state.user_location_province;

                            // gets departments that belong to the current province

                            data = dash.data.fopea_data.localidad.filter(d => d.provincia == provincia);

                            // to clean rects
                            variables_not_present = dash.vis.stripplot.variables.provincia;

                            // removes marks from other levels

                            variables_not_present.forEach(variable => {

                                dash.vis.stripplot.sels.d3.svg
                                .selectAll("rect.vis-dash-stripplot-marks[data-variable='" + variable + "']")
                                .transition()
                                .duration(500)
                                .attr('width', 0)
                                .remove();

                            });

                            let data_complete = [];

                            variables.forEach(variable => {

                                // cria um dataset para o force_layout

                                //let data_variable = [...data]; 
                                data.forEach(d => {
                                    
                                    copy = {...d}
                                    copy['variable'] = variable;
                                    copy['highlighted'] = d.local == dash.vis.location_card.state.user_location_name;

                                    data_complete.push(copy);

                                })

                            })

                                /// done.

                                //console.log('circulos da variavel... ', variable);

                                const marks = dash.vis.stripplot.sels.d3.svg
                                .selectAll("circle.vis-dash-stripplot-marks")
                                .data(data_complete, d => d.variable + d.local)
                                .join('circle')
                                .classed('vis-dash-stripplot-marks', true)
                                .classed('marks-na', d => !dash.vis.stripplot.scales.x[d.variable](d[d.variable])) // se der undefined vai dar true
                                .classed('marks-location-highlighted', d => d.local == dash.vis.location_card.state.user_location_name)
                                .attr('data-variable', d => d.variable)
                                .attr('data-location', d => d.local)
                                .attr('fill', function(d) {

                                    //console.log(this.dataset.variable);

                                    if (type == 'provincia') return 'hotpink'
                                    else {
                                        const cat = Math.ceil(+d.categoria);

                                        const categoria = dash.params.categories[cat-1]

                                        return dash.params.colors[categoria];

                                    }
                                    
                                })
                                .attr('cy', d => 
                                dash.vis.stripplot.scales.y[d.variable])
                                .attr('cx', d => {
                                    //console.log(d.variable);

                                    const variable = d.variable;

                                    if (dash.vis.stripplot.scales.x[variable](d[variable])) {

                                        console.log(dash.vis.stripplot.scales.x[variable](d[variable]));

                                        return dash.vis.stripplot.scales.x[variable](d[variable])
                                        //-
                                        //(d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.width : dash.vis.stripplot.dimensions.rect.other.width)/2
                                
                                    } else {

                                        console.log(dash.vis.stripplot.scales.x[variable](d[variable]));

                                        return 0

                                    }
                                })
                                .attr('r', 0);

                                marks
                                .transition()
                                .duration(1000)
                                .attr('r', d => 
                                d.local == dash.vis.location_card.state.user_location_name ?
                                dash.vis.stripplot.dimensions.rect.highlight.height/4 :
                                dash.vis.stripplot.dimensions.rect.other.height/4)
                                ;

                            //})

                            // simulation

                            const force = dash.vis.stripplot.force;
                            const sim = force.simulation;

                            console.log(data_complete);

                            sim.nodes(data_complete);

                            //sim
                            //   .force('x', d3.forceX().strength(force.config.strength).x(function(d) {

                            //     const variable = d.variable;
                            //     console.log(variable, d.local, dash.vis.stripplot.scales.x[variable](d[variable]), dash.vis.stripplot.scales.y[d.variable])

                            //     return dash.vis.stripplot.scales.x[variable](d[variable])

                            //   }))
                            //   .force('y', d3.forceY().strength(force.config.strength).y(d => dash.vis.stripplot.scales.y[d.variable]))
                              //.force('charge', d3.forceManyBody().strength(force.config.charge()))
                            //  .force('collision',d3.forceCollide().radius(dash.vis.stripplot.dimensions.rect.other.height/4))

                            sim.velocityDecay(0.2).alpha(1).restart();


                        }

                    },

                    render_lite : {

                        localidad : function(local = dash.vis.location_card.state.user_location_name) {

                            dash.vis.stripplot.sels.d3.svg
                                .selectAll("circle.vis-dash-stripplot-marks")
                                .classed('marks-location-highlighted', d => d.local == local)
                                .transition()
                                .duration(250)
                                .attr('r', d => 
                                d.local == local ?
                                dash.vis.stripplot.dimensions.rect.highlight.height/4 :
                                dash.vis.stripplot.dimensions.rect.other.height/4);

                            dash.vis.stripplot.force.simulation.nodes().forEach(d =>
                                d.highlighted = d.local == local
                            )

                            // pq preciso passar novamente a bixiga da força?

                            const strength = dash.vis.stripplot.force.config.strength;

                            dash.vis.stripplot.force.simulation.force('collision', d3.forceCollide().radius(function(d) {
                            
                                if (d.highlighted) { console.log("esse é o destacado. ", d.local, )}
    
                                return d.highlighted ? dash.vis.stripplot.dimensions.rect.highlight.height/4 : dash.vis.stripplot.dimensions.rect.other.height/4}))
                                .force('x', d3.forceX().strength(strength).x(function(d) {

                                    const variable = d.variable;
        
                                    if (dash.vis.stripplot.scales.x[variable](d[variable])) {
        
                                       // console.log(dash.vis.stripplot.scales.x[variable](d[variable]));
        
                                        return dash.vis.stripplot.scales.x[variable](d[variable])
                                        //-
                                        //(d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.width : dash.vis.stripplot.dimensions.rect.other.width)/2
                                
                                    } else {
        
                                        //console.log(dash.vis.stripplot.scales.x[variable](d[variable]));
        
                                        return 0
        
                                    }
                                    //return dash.vis.stripplot.scales.x[variable](d[variable])
        
                                }))
                                .force('y', d3.forceY().strength(strength).y(d => dash.vis.stripplot.scales.y[d.variable]))
                            .velocityDecay(0.1).alpha(.5).restart();

                        }

                    }

                },

                label_selected : {

                    render : function(type) {

                        const datum = dash.data.fopea_data[type].filter(d => d.local == dash.vis.location_card.state.user_location_name)[0];

                        const variables = dash.vis.stripplot.variables[type];

                        let label = dash.vis.stripplot.sels.d3.container
                            .selectAll("p.label-location-selected")
                            .data(variables)
                            .join('p')
                            .classed('label-location-selected', true)
                            .style('top', variable => {

                                return (dash.vis.stripplot.scales.y[variable]
                                -
                                dash.vis.stripplot.dimensions.rect.highlight.height) + 'px'

                            })
                            .style('left', 0)
                            .text(datum.local);

                            label
                              .style('left', function(variable) {

                                let label_width = +d3.select(this).style('width').slice(0,-2);

                                let pos_left = dash.vis.stripplot.scales.x[variable]( datum[variable] ) - dash.vis.stripplot.dimensions.rect.highlight.width/2;

                                if (pos_left - label_width < 0) {
                                    return (pos_left + dash.vis.stripplot.dimensions.rect.highlight.width) + 'px'
                                } else {
                                    return pos_left - label_width + 'px'
                                }

                              }
                              )
                            ;

                    }

                },

                separation_lines : {

                    render : function(type) {

                        const variables = dash.vis.stripplot.variables[type];

                        const adj = dash.vis.stripplot.dimensions.axis_line.bottom - 1;

                        dash.vis.stripplot.sels.d3.svg
                          .selectAll("line.vis-dash-stripplot-separation")
                          .data(variables)
                          .join("line")
                          .classed("vis-dash-stripplot-separation", true)
                          .attr("x1", 0)
                          .attr("x2", dash.vis.stripplot.dimensions.svg_width)
                          .attr("y1", d => dash.vis.stripplot.scales.y[d] + adj)
                          .attr("y2", d => dash.vis.stripplot.scales.y[d] + adj);

                    }

                },

                connecting_lines : {

                    render : function() {}

                },

                tooltips : {

                    render : function() {}

                }

            },

            force : {

                simulation : null,

                config : {

                    strength : 0.04,

                    charge : () => -Math.pow(dash.vis.stripplot.dimensions.rect.other.height/4, 2) * dash.vis.stripplot.force.config.strength

                },

                init : function() {

                    const charge = dash.vis.stripplot.force.config.charge();
                    const strength = dash.vis.stripplot.force.config.strength;

                    dash.vis.stripplot.force.simulation = d3.forceSimulation()
                        .velocityDecay(0.2)

                        .force('x', d3.forceX().strength(strength).x(function(d) {

                            const variable = d.variable;

                            if (dash.vis.stripplot.scales.x[variable](d[variable])) {

                               // console.log(dash.vis.stripplot.scales.x[variable](d[variable]));

                                return dash.vis.stripplot.scales.x[variable](d[variable])
                                //-
                                //(d.local == dash.vis.location_card.state.user_location_name ? dash.vis.stripplot.dimensions.rect.highlight.width : dash.vis.stripplot.dimensions.rect.other.width)/2
                        
                            } else {

                                //console.log(dash.vis.stripplot.scales.x[variable](d[variable]));

                                return 0

                            }
                            //return dash.vis.stripplot.scales.x[variable](d[variable])

                        }))
                        .force('y', d3.forceY().strength(strength).y(d => dash.vis.stripplot.scales.y[d.variable]))
                        //.force('charge', d3.forceManyBody().strength(charge))
                        .force('collision', d3.forceCollide().radius(function(d) {
                            
                            if (d.highlighted) { console.log("esse é o destacado. ", d.local, )}

                            return d.highlighted ? dash.vis.stripplot.dimensions.rect.highlight.height/4 : dash.vis.stripplot.dimensions.rect.other.height/4}))
                        .alphaMin(0.25)
                        .on('tick', dash.vis.stripplot.force.tick_update);

                        // quando faz o dataset data_complete, poderia usar um d.tipo_highlight = other/highlight, e aí usar um dash...rect[d.tipo_highlight].height

                    dash.vis.stripplot.force.simulation.stop();

                },

                tick_update : () => {
                    d3.selectAll('circle.vis-dash-stripplot-marks')
                      .attr('cx', d => d.x)
                      .attr('cy', d => d.y)
                }

            },

            interactions : {

                hover_on_strip : {

                    monitor : function() {

                        const strips = dash.vis.stripplot.sels.d3.svg
                        .selectAll('.vis-dash-stripplot-marks');
                      
                      strips.on('mouseover', this.showTooltip);
                      strips.on('mouseout', this.hideTooltip);


                    },

                    showTooltip : function(e) {

                        let datum = d3.select(this).datum();

                        const type =  dash.vis.location_card.state.user_location_type;

                        console.log(datum);

                        const local_hovered = datum.local;

                        let this_strip = d3.select(this);

                        const variable = this_strip.node().dataset.variable;

                        const strips = dash.vis.stripplot.sels.d3.svg
                        .selectAll('.vis-dash-stripplot-marks');

                        //console.log('pra ver quantas vezes dispara');

                        strips.classed('vis-dash-stripplot-marks-hovered', d => d.local == local_hovered);

                        //console.log(local_hovered, dash.vis.location_card.state.user_location_name);

                        if (local_hovered != dash.vis.location_card.state.user_location_name) {

                            let tt = dash.vis.stripplot.sels.d3.container.select('p.dash-stripplot-tooltip');

                            tt
                              .text(local_hovered)
                              .style('top', (dash.vis.stripplot.scales.y[variable] - dash.vis.stripplot.dimensions.rect.other.height) + 'px');

                            tt
                              .style('left', function() {

                                let label_width = +d3.select(this).style('width').slice(0,-2);

                                let pos_left = dash.vis.stripplot.scales.x[variable]( datum[variable] ) - dash.vis.stripplot.dimensions.rect.other.width/2 ;

                                if (pos_left - label_width < 0) {
                                    return (pos_left + dash.vis.stripplot.dimensions.rect.other.width + 5) + 'px'
                                } else {
                                    return (pos_left - label_width - 5) + 'px'
                                }
                            });

                            tt.classed('dash-stripplot-tooltip-visible', true);

                        }

                        if (type == 'localidad') {
                            dash.vis.stripplot.components.marks.render_lite.localidad(local_hovered);
                        }



                    },

                    hideTooltip : function(e) {

                        dash.vis.stripplot.sels.d3.svg
                        .selectAll('.vis-dash-stripplot-marks').classed('vis-dash-stripplot-marks-hovered', false);

                        dash.vis.stripplot.sels.d3.container.select('p.dash-stripplot-tooltip').classed('dash-stripplot-tooltip-visible', false);

                    }
                },

                click_on_strip : {

                    monitor : function() {
                        
                        const strips = dash.vis.stripplot.sels.d3.svg
                          .selectAll('.vis-dash-stripplot-marks')
                        ;
                          
                          
                        strips.on('click', this.clicked);

                    },

                    clicked : function(e) {

                        let datum = d3.select(this).datum();

                        const type =  dash.vis.location_card.state.user_location_type;

                        const local = {

                            local : datum.local,
                            tipo : type,
                            text : datum.local,
                            provincia : datum.provincia

                        }

                        dash.vis.render_selected_place(local);


                    }                     

                }
            }


        }

    },

    ctrl : {

        init : function() {

            dash.utils.colors.populate();
            //dash.scroller.steps.get();
            dash.vis.stripplot.sels.d3.set(); // sets up d3 selections;
            dash.vis.stripplot.force.init();
            dash.interactions.relato_periodista.monitor('close');
            dash.interactions.relato_periodista.monitor('toggle');
            dash.utils.load_data();
            
        },

        monitors : function() {

            dash.interactions.story.search_bar.listen_search();

        },

        begin : function(data) {

            console.log(data);

            dash.data.localidad = data[0];
            dash.data.mask = data[1];
            dash.data.provincia = data[2];
            dash.data.fopea_data = data[3];

            // pre-process localidad data
            dash.data.localidad.features.forEach(el => {

                const types = Object.keys(dash.params.colors);

                const categoria = el.properties.categoria;

                el.properties['color_real'] = categoria ?
                  dash.params.colors[dash.params.categories[+categoria-1]] :
                  'lightgray';

            })

            mapboxgl.accessToken = dash.params.mapbox.token;

            dash.map_obj = new mapboxgl.Map({
                container: 'map', // container id
                style: dash.params.mapbox.style, // style URL
                center: [
                    dash.params.mapbox.start.center.lng, 
                    dash.params.mapbox.start.center.lat
                ], // starting position [lng, lat]
                zoom: dash.params.mapbox.start.zoom // starting zoom
            });

            dash.map_obj.on('load', function() {

                // initialize map

                dash.map.world_mask.initialize();
                dash.map.province.initialize();
                dash.map.localidad.initialize();
                dash.map.fog_of_war.initialize(); 

                // monitor hover and click events on provinces

                dash.map.province.monitor_hover_event();
                  //dash.map.province.monitor_click_event();

                // monitor hover and click events on localidads

                dash.map.localidad.monitor_hover_event();
                  //dash.map.localidad.monitor_click_event();

                // monitor click events on localidad or provincia
                dash.map.monitor_click_event();

                //fit map to continental Argentina
                dash.map.fit_Argentina();

                // inicializa o scroller
                //dash.scroller.config();

                // image

                // Load images to use as patterns
                dash.utils.load_patterns();
              
            });

            dash.interactions.story.search_bar.populate_datalist();
            dash.ctrl.monitors();

        },

    }

}

dash.ctrl.init();