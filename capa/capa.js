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
                .selectAll("path.vis-provinces")
                .data(feats)
                .join("path")
                .classed('vis-provinces', true)
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

                svg.selectAll("circle.vis-cities")
                    .data(feats)
                    .join("circle")
                    .classed('vis-cities', true)
                    .attr("fill", d => capa.vis.scales.colors(d.properties.categoria))
                    //.attr("stroke", 'dodgerblue')
                    .attr("cx", d => d.geometry ? proj(d.geometry.coordinates)[0] : 0)
                    .attr("cy", d => d.geometry ? proj(d.geometry.coordinates)[1] : 0)
                    .attr("r", capa.vis.params.radius)
                ;

            }
            
        }

    },

    vis : {

        aux_data : {


        },

        params : {

            radius: 2,

            space_between_dots :  1

        },

        scales : {

            colors : (cat) => Object.values(capa.utils.colors.categories)[+cat-1]

        },

        dotplot : {

            render : function() {

                const h = capa.utils.dims.height;
                const w = capa.utils.dims.width;
                const r = capa.vis.params.radius;
                const spacing = capa.vis.params.space_between_dots;
                
                const data = capa.map.data.mun.features;

                const nof_dots_side = Math.ceil(Math.sqrt(data.length));

                //console.log(nof_dots_side);

                // each dot occupies : 2r + spacing

                const grid_size = nof_dots_side * (2*r + spacing) - spacing; // minus the last spacing

                // margins

                const lesser_dim = w > h ? w : h;

                const margin = (lesser_dim - grid_size) / 2;

                console.log(grid_size, lesser_dim, margin);

                function get_x(index) {

                    const x_index = index % nof_dots_side;

                    return x_index * (2*r + spacing);

                }

                function get_y(index) {

                    const y_index = Math.floor( index / nof_dots_side);

                    return y_index * (2*r + spacing);

                }

                const svg = d3.select("svg#vis-capa");

                svg.selectAll('circle.vis-cities')
                .transition()
                .duration(1000)
                .attr('cx', (d,i) => margin + get_x(i))
                .attr('cy', (d,i) => margin + get_y(i));



            }

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

        orders_muns : function() {

            const feats = capa.map.data.mun.features;

            feats.sort( (a, b) => a.properties.categoria - b.properties.categoria )

            capa.map.data.mun = {

                type: "FeatureCollection",
                features : feats

            }

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


            capa.utils.orders_muns();
            capa.utils.dims.get();
            capa.map.render.prov();
            capa.map.render.mun();

        }

    }

}

capa.ctrl.init();