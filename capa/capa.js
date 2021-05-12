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

        scales : {

            colors : (cat) => Object.values(capa.utils.colors.categories)[+cat-1]

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

        prov : {
            
            render : function() {

                let data = capa.map.data.prov;

                let feats = data.features;
                //   topojson.feature(
                //     topodata, 
                //     topodata.objects.provincia)
                //   .features;

                let proj = capa.map.proj();

                //console.log(proj)

                let svg = d3.select("svg#vis-capa");

                svg.append("g")
                .classed('container-provinces', true)
                .selectAll("path.vis-provinces")
                .data(feats)
                .join("path")
                .classed('vis-provinces', true)
                .attr("fill", 'white')
                .attr("stroke", 'khaki')
                .attr("d", d3.geoPath().projection(proj))
                ;

            },

            fade : function() {

                document.querySelector('g.container-provinces').classList.toggle('fade');

            }

        },

        mun : {
            
            render : function() {

                let data = capa.map.data.mun;

                let feats = data.features;
                //   topojson.feature(
                //     topodata, 
                //     topodata.objects.provincia)
                //   .features;

                let proj = capa.map.proj();

                let svg = d3.select("svg#vis-capa");

                // to help remember its structure
                console.log(feats[0]);

                svg.selectAll("circle.vis-cities")
                    .data(feats)
                    .join("circle")
                    .classed('vis-cities', true)
                    .attr("fill", d => capa.map.scales.colors(d.properties.categoria))
                    //.attr("stroke", 'dodgerblue')
                    .attr("cx", d => d.geometry ? proj(d.geometry.coordinates)[0] : 0)
                    .attr("cy", d => d.geometry ? proj(d.geometry.coordinates)[1] : 0)
                    .attr("r", capa.vis.params.radius)
                ;

            },

            return : function() {

                let proj = capa.map.proj();

                d3.selectAll("circle.vis-cities")
                  .transition()
                  .duration(1000)
                  .attr("cx", d => d.geometry ? proj(d.geometry.coordinates)[0] : 0)
                  .attr("cy", d => d.geometry ? proj(d.geometry.coordinates)[1] : 0)
                ;

            }
            
        }

    },

    vis : {

        aux_data : {


        },

        params : {

            radius: 2,

            space_between_dots :  1,

            calc : {

                margin : null

            }

        },

        calc_margin : function() {

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

            capa.vis.params.calc.margin = margin;
            capa.vis.params.calc.nofs_dots_side = nof_dots_side;

        },

        dotplot : {

            render : function() {

               // const h = capa.utils.dims.height;
               // const w = capa.utils.dims.width;

                const r = capa.vis.params.radius;
                const spacing = capa.vis.params.space_between_dots;
                
                // const data = capa.map.data.mun.features;

                const nof_dots_side = capa.vis.params.calc.nofs_dots_side;
                const margin = capa.vis.params.calc.margin;

                // //console.log(nof_dots_side);

                // // each dot occupies : 2r + spacing

                // const grid_size = nof_dots_side * (2*r + spacing) - spacing; // minus the last spacing

                // // margins

                // const lesser_dim = w > h ? w : h;

                // const margin = (lesser_dim - grid_size) / 2;

                // capa.vis.params.calc.margin = margin;

                // console.log(grid_size, lesser_dim, margin);

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

        },

        scatterplot : {

            scales : {

                x : d3.scaleLinear(),
                y : d3.scaleLinear(),

                set : function() {

                    const h = capa.utils.dims.height;
                    const w = capa.utils.dims.width;
                    const base_margin = capa.vis.params.calc.margin;

                    console.log(base_margin);

                    capa.vis.scatterplot.scales.x.range([base_margin, w-base_margin]);
                    capa.vis.scatterplot.scales.y.range([h-base_margin, base_margin]);

                    // domains

                    const data = capa.map.data.mun.features;

                    capa.vis.scatterplot.scales.y.domain(d3.extent(data, d => +d.properties.cantidad_de_medios));
                    capa.vis.scatterplot.scales.x.domain(d3.extent(data, d => +d.properties.poblacion_residente));
                    
                }

            },

            render : function() {

                const x = capa.vis.scatterplot.scales.x;
                const y = capa.vis.scatterplot.scales.y;


                d3.selectAll('circle.vis-cities')
                .transition()
                .duration(1000)
                .attr('cy', d => y(+d.properties.cantidad_de_medios))
                .attr('cx', d => x(+d.properties.poblacion_residente));

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

    interactions : {

        // timelines gsap?

        'dotplot' : {

            play : function() {

                capa.map.prov.fade();
                capa.vis.dotplot.render();
    
            },

            reverse : function() {

                capa.map.prov.fade();
                capa.map.mun.return();

            }
        },

        'scatterplot' : {

            play : function() {

                capa.vis.scatterplot.render();

            }
        }
        
    },

    ctrl : {

        init : function() {

            capa.utils.colors.populate();

            capa.utils.read_data();

        },

        begin : function() {

            // after data is loaded


            capa.utils.orders_muns();
            capa.utils.dims.get();
            capa.map.prov.render();
            capa.map.mun.render();

            capa.vis.calc_margin();
            capa.vis.scatterplot.scales.set();

        }

    }

}

capa.ctrl.init();