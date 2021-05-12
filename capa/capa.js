const capa = {

    map : {

        files : [
            
            'provv.geojson',
            'mun_.geojson'

        ],

        data : {

            prov : null,
            mun : null
    
        },

        proj : () => {

            let h = capa.utils.dims.height;
            let w = capa.utils.dims.width;
            
            return d3.geoTransverseMercator()
              .center([0, -38.5])
              .rotate([60, 0])
              .scale(750)
              .translate([w / 2, h / 2])
        },

        render : {
            
            prov : function() {

                let data = capa.map.data.prov;

                console.log(data);

                let feats = data.features;
                //   topojson.feature(
                //     topodata, 
                //     topodata.objects.provincia)
                //   .features;

                let proj = capa.map.proj();

                //console.log(proj)

                let svg = d3.select("svg#vis-capa");

                svg.append("g")
                .selectAll("path")
                .data(feats)
                .join("path")
                .attr("fill", 'white')
                .attr("stroke", 'khaki')
                .attr("d", d3.geoPath().projection(proj))
                ;

            },

            mun : function() {

                let data = capa.map.data.mun;

                let feats = data.features;
                //   topojson.feature(
                //     topodata, 
                //     topodata.objects.provincia)
                //   .features;

                let proj = capa.map.proj();

                let svg = d3.select("svg#vis-capa");

                //console.log(feats[0], proj(feats[0].geometry.coordinates));

                svg.selectAll("circle")
                    .data(feats)
                    .join("circle")
                    .attr("fill", d => capa.vis.scales.colors(d.properties.categoria))
                    //.attr("stroke", 'dodgerblue')
                    .attr("cx", d => d.geometry ? proj(d.geometry.coordinates)[0] : 0)
                    .attr("cy", d => d.geometry ? proj(d.geometry.coordinates)[1] : 0)
                    .attr("r", 2)
                ;

            }
            
        }

    },

    vis : {

        scales : {

            colors : (cat) => Object.values(capa.utils.colors.categories)[+cat-1]

        }
    },

    utils : {

        read_data : function() {

            Promise.all(capa.map.files.map(filename => d3.json(filename)))
              .then(files => {

                capa.map.data.prov = files[0];
                capa.map.data.mun  = files[1];

                capa.ctrl.begin();

            });

        },

        dims : {

            height : null,
            width : null,

            margins : {

                all : 40

            },

            get : function() {

                const svg = document.querySelector("svg#vis-capa");

                capa.utils.dims.width  = svg.getBoundingClientRect().width;
                capa.utils.dims.height = svg.getBoundingClientRect().height;

            }


        },

        colors : {

            categories : {

                desierto : null,
                semidesierto : null,
                semibosque : null,
                bosque : null
    
            },

            get_from_css : function(color) {

                const style = getComputedStyle( document.documentElement );
                const value = style.getPropertyValue( '--color-' + color );
                return value;
    
            },

            populate : function() {

                Object.keys(capa.utils.colors.categories).forEach(color => {

                    capa.utils.colors.categories[color] = capa.utils.colors.get_from_css(color);
    
                });

            }
    
        }
 
    },

    ctrl : {

        init : function() {

            capa.utils.colors.populate();

            capa.utils.read_data();

        },

        begin : function() {


            capa.utils.dims.get();
            capa.map.render.prov();
            capa.map.render.mun();

        }

    }

}

capa.ctrl.init();