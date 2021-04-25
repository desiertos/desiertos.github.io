const app = {

    refs : {

    },

    sels : {

        d3 : {},
        js : {}

    },

    params : {

        categories : ['bosque', 'semibosque', 'semidesierto', 'desierto'],

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

            provincia : '../data/maps/arg.json',
            cidade : '../data/maps/arg_dept.json',
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

        provincia : null,
        cidade : null,
        mask : null,
        fopea_data : null

    },

    map_obj : null,

    utils : {

        load_data : function() {

            Promise.all([

                fetch(app.params.geojsons.cidade, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.mask, {mode: 'cors'}).then( response => response.json()),
                fetch(app.params.geojsons.provincia, {mode: 'cors'}).then( response => response.json()),
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

                const categories = ['desierto', 'semidesierto', 'semibosque', 'bosque'];

                location_category = categories[ data['categoria'] ];
                
            }

            return location_category;

        }

    },

    map : {

        cidade : {

            initialize : function() {

                app.map_obj.addSource('cidade', {
                    type: 'geojson',
                    'data' : app.data.cidade
                });

                app.map_obj.addLayer({
                    'id': 'cidade',
                    'type': 'fill',
                    'source': 'cidade',
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

                app.map_obj.addSource('provincia', {
                    type: 'geojson',
                    'data' : app.data.provincia
                });

                app.map_obj.addLayer({
                    'id': 'provincia',
                    'type': 'line',
                    'source': 'provincia',
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
                    'source': 'provincia',
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

        highlight_feature : function(type, location) {

            console.log(type, location);

            // type provincia, cidade

            let locations = app.map_obj.querySourceFeatures(type, {
                sourceLayer: type});

            
        
            let desired_features = locations.filter(d => d.properties.nam == location)[0];

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

                app.map_obj.setPaintProperty('cidade', 'fill-pattern', null);
                app.map_obj.setPaintProperty('cidade', 'fill-color', ['get', 'color']);
                app.map_obj.setPaintProperty('cidade', 'fill-outline-color', 'ghostwhite');
                app.map_obj.setPaintProperty('cidade', 'fill-opacity', .5);
                app.map.set_initial_view();

                app.interactions.story.toggle_visibility("dashboard_button");

            },

            'pesquisa' : function() {

                console.log('Pesquisando...');

            },

            'location-card' : function() {

                app.map.highlight_feature(
                    app.vis.location_card.state.user_location_type, 
                    app.vis.location_card.state.user_location_name);

            },

            'segundo' : function() {

                app.map.fit_Argentina();

                app.map_obj.setPaintProperty('cidade', 'fill-pattern', ['get', 'tipo']);
                app.map_obj.setPaintProperty('cidade', 'fill-opacity', 1);
                app.map.fog_of_war.toggle('')
                app.map_obj.setPaintProperty('provincia', 'line-width', 0);

                app.interactions.story.toggle_visibility("dashboard_button");

            },

            'destaque' : function() {

                app.map_obj.setPaintProperty('provincia', 'line-width', 5);
                app.map.highlight_feature('provincia', 'Salta');
                app.map.fog_of_war.toggle('Salta')

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

                    //updates maps

                    // let type; 
                    
                    // if (local.type == "cidade") {

                    //     type = 'cidade';

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

        refs : {

            svg : '',
            container : ''
        },
    
        sels : {
    
            d3 : {},
            js : {}
    
        },

        location_card : {

            state : {

                user_location : null,
                user_location_name : null,
                user_location_type : null,
                user_location_category : null,
                remaining_categories : null,

                set : function(local, data) {

                    const state = app.vis.location_card.state;

                    state.user_location = local.text;
                    state.user_location_name = local.local; //// mudar esse local.local :/
                    state.user_location_type = local.tipo;

                    const category = app.utils.get_category_from_data(local, data);

                    state.user_location_category = category

                    state.remaining_categories = app.params.categories.filter(d => d != category);

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

                category : '.js--location-category' // multiple

            },

            texts : {

                bosque : {
                    
                    first : 'Estás en un <span data-category-highlight="bosque">bosque</span>. Esto significa que su ciudad está bien servida por un periodismo profesional de calidad, que permite a las personas estar bien informadas sobre los problemas locales y mejora la calidad de la vida pública.'

                },

                semibosque : {
                    
                    first : 'Estás en un <span data-category-highlight="semibosque">semibosque</span>. Esto significa que su ciudad tiene un buen acceso al periodismo profesional, pero con algunos problemas graves. Si bien es posible obtener información a través de los periódicos locales, existen fallas en la cobertura que pueden dañar la calidad de la vida pública.'

                },

 
                semidesierto : {
                    
                    first : 'Estás en un <span data-category-highlight="semidesierto">semidesierto</span>. Esto significa que su ciudad tiene serios problemas para acceder a un periodismo de calidad, aunque la prensa profesional esté presente. Esto causa problemas considerables en la calidad de la vida pública.'

                },

                desierto : {
                    
                    first : 'Estás en un <span data-category-highlight="desierto">desierto</span>. Esto significa que, en la práctica, casi no hay periodismo profesional de calidad en tu ciudad. Esto afecta gravemente a la calidad de la vida pública.'

                }

            },

            update_text_fields : function() {

                const refs = app.vis.location_card.refs;
                const state = app.vis.location_card.state;
                const user_category = state.user_location_category;

                // helper function

                function populate_field(ref, origin_of_information, dataset = null) {

                    const field = document.querySelector(refs[ref]);

                    console.log(field, refs[ref], origin_of_information);

                    field.innerHTML = origin_of_information;

                    if (dataset) field.dataset[dataset] = origin_of_information;

                }

                // name

                populate_field('name', state.user_location_name);

                // type

                populate_field('type', state.user_location_type);

                // main category field

                populate_field('main_category', user_category, dataset = 'category');

                // description field

                populate_field('category_description', app.vis.location_card.texts[user_category].first);

                // category field in second page

                populate_field('category', user_category, dataset = 'categoryHighlight');

                // remaining categories fields

                populate_field('remaining_category1', state.remaining_categories[0], dataset = 'categoryHighlight');
                populate_field('remaining_category2', state.remaining_categories[1], dataset = 'categoryHighlight');
                populate_field('remaining_category3', state.remaining_categories[2], dataset = 'categoryHighlight');

            }

        }

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

            app.data.cidade = data[0];
            app.data.mask = data[1];
            app.data.provincia = data[2];
            app.data.fopea_data = data[3];

            // pre-process cidade data
            app.data.cidade.features.forEach(el => {

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

                app.map.cidade.initialize();
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