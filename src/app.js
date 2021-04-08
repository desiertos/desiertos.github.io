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

    },

    ctrl : {

        init : function() {
        
            mapboxgl.accessToken = app.params.mapbox.token;

            const map = new mapboxgl.Map({
                container: 'map', // container id
                style: app.params.mapbox.style, // style URL
                center: [-40.678, -54.409], // starting position [lng, lat]
                zoom: 3 // starting zoom
                });
            
        }

    }

}

app.ctrl.init();