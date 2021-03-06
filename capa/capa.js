const capa = {

    map : {

        files : [
            
            'provv.geojson',
            'mun2.json'

        ],

        data : {

            prov : null,
            mun : null
    
        },

        scales : {

            colors : (cat) => Object.values(capa.utils.colors.categories)[+cat-1],

            radius : d3.scaleSqrt().range([2, 10]),

            set_radius_domain : () => {

                const data = capa.map.data.mun.features;

                const domain = d3.extent(data, d => +d.properties.pob);

                console.log(domain);

                capa.map.scales.radius.domain(domain);

            } 

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

            prepare_muns : function() {

                // orders and saves initial x/y value to be used in the force simulation

                let proj = capa.map.proj();
    
                const feats = capa.map.data.mun.features;
    
                feats.sort( (a, b) => a.properties.categoria - b.properties.categoria )
    
                feats.forEach(d => {
    
                    if (d.geometry) {
                        
                        d.x0 = proj(d.geometry.coordinates)[0];
                        d.x  = proj(d.geometry.coordinates)[0];
                        d.y0 = proj(d.geometry.coordinates)[1];
                        d.y  = proj(d.geometry.coordinates)[1];
    
                    } else {
    
                        d.no_geom = true;
                        d.x = 0;
                        d.y = 0;
                        d.x0 = 0;
                        d.y0 = 0;
    
                    }
    
                })

                console.log(feats);
    
                capa.map.data.mun = {
    
                    type: "FeatureCollection",
                    features : feats
    
                }
    
            },
            
            render : function() {

                let data = capa.map.data.mun;

                let feats = data.features;
                //   topojson.feature(
                //     topodata, 
                //     topodata.objects.provincia)
                //   .features;

                //let proj = capa.map.proj();

                let svg = d3.select("svg#vis-capa");

                // to help remember its structure
                console.log(feats[0]);

                svg.selectAll("circle.vis-cities")
                    .data(feats)
                    .join("circle")
                    .classed('vis-cities', true)
                    .classed('no-geom', d => d.no_geom)
                    .attr("fill", d => capa.map.scales.colors(d.properties.categoria))
                    //.attr("data-coords", d => d.geometry ? proj(d.geometry.coordinates) : 'na')
                    //.attr("stroke", 'dodgerblue')
                    .attr("cx", d => d.x0)
                    .attr("cy", d => d.y0)
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

            },

            pop_bubbles : function() {

                const strength = capa.map.force.config.strength;

                d3.selectAll("circle.vis-cities")
                  .transition()
                  .duration(1000)
                  .attr("r", d => capa.map.scales.radius(+d.properties.pob));

                capa.map.force.simulation.force(
                    'collision', 
                    d3.forceCollide().strength(strength*1.5).radius(
                        d => capa.map.scales.radius(+d.properties.pob) + 1
                    )
                );

                capa.map.force.simulation.alpha(1).restart();

            }
            
        },

        force :  {

            simulation : null,

            config : {

                strength : 0.04,

                charge : () => -Math.pow(capa.vis.params.radius, 2) * capa.map.force.config.strength

            },

            init : function() {

                const charge = capa.map.force.config.charge();
                const strength = capa.map.force.config.strength;
                const data = capa.map.data.mun;
                const feats = data.features;
                const proj = capa.map.proj();

                capa.map.force.simulation = d3.forceSimulation()
                    .velocityDecay(0.2)
                    .force(
                        'x', 
                        d3.forceX().strength(strength).x(
                            d => d.geometry ? proj(d.geometry.coordinates)[0] : 0
                        )
                    )
                    .force(
                        'y', 
                        d3.forceY().strength(strength).y(
                            d => d.geometry ? proj(d.geometry.coordinates)[1] : 0
                        )
                    )
                    //.force('charge', d3.forceManyBody().strength(charge))
                    .force('collision', d3.forceCollide().strength(strength*1.5).radius(capa.vis.params.radius))
                    .alphaMin(0.01)
                    .on('tick', capa.map.force.tick_update);

                    // quando faz o dataset data_complete, poderia usar um d.tipo_highlight = other/highlight, e a?? usar um dash...rect[d.tipo_highlight].height

                capa.map.force.simulation.stop();
                capa.map.force.simulation.nodes(feats);

            },

            tick_update : () => {
                d3.selectAll('circle.vis-cities')
                  .attr('cx', d => d.x)
                  .attr('cy', d => d.y)
            },

            fire : () => {

                const sim = capa.map.force.simulation;
                sim.alpha(1).restart();

            }

        }

    },

    vis : {

        aux_data : {


        },

        params : {

            radius: 2,
            after_radius : 4,

            space_between_dots :  1,

            margin : 40,

            calc : {

                margin : null

            }

        },

        calc_margin : function() {

            const h = capa.utils.dims.height;
            const w = capa.utils.dims.width;
            const r = capa.vis.params.after_radius;
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

                const r = capa.vis.params.after_radius;
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
                .attr('r', capa.vis.params.after_radius)
                .attr('cx', (d,i) => margin + get_x(i))
                .attr('cy', (d,i) => margin + get_y(i))
                .style('stroke', 'none');



            }

        },

        scatterplot : {

            scales : {

                x : d3.scaleLinear(),
                y : d3.scaleLinear(),
                x_log : d3.scaleLog(),

                set : function() {

                    const h = capa.utils.dims.height;
                    const w = capa.utils.dims.width;
                    const base_margin = capa.vis.params.margin;

                    console.log(base_margin);

                    capa.vis.scatterplot.scales.x.range([base_margin, w-base_margin]);
                    capa.vis.scatterplot.scales.x_log.range([base_margin, w-base_margin]);
                    capa.vis.scatterplot.scales.y.range([h-base_margin, base_margin]);

                    // domains

                    const data = capa.map.data.mun.features;

                    capa.vis.scatterplot.scales.y.domain(d3.extent(data, d => +d.properties.cant_medios));
                    capa.vis.scatterplot.scales.x.domain(d3.extent(data, d => +d.properties.pob));
                    capa.vis.scatterplot.scales.x_log.domain(d3.extent(data, d => +d.properties.pob));
                    
                }

            },

            axis : {

                x : null,
                x_log : null,
                y : null,

                set : function() {

                    capa.vis.scatterplot.axis.x = d3.axisBottom(capa.vis.scatterplot.scales.x);
                    capa.vis.scatterplot.axis.x_log = d3.axisBottom(capa.vis.scatterplot.scales.x_log);
                    capa.vis.scatterplot.axis.y = d3.axisLeft(capa.vis.scatterplot.scales.y)

                },

                render : function() {

                    const margin = capa.vis.params.margin;

                    d3.select('svg#vis-capa')
                      .append('g')
                      .classed('axis', true)
                      .classed('x-axis', true)
                      .style('transform', 'translate( 0px, ' + (capa.utils.dims.height - margin) + 'px )')
                      .call(capa.vis.scatterplot.axis.x);

                    d3.select('svg#vis-capa')
                      .append('g')
                      .classed('axis', true)
                      .classed('y-axis', true)
                      .style('transform', 'translate( ' + margin + 'px, 0px )')
                      .call(capa.vis.scatterplot.axis.y);  

                },

                change_to_log : function() {

                    d3.select('.x-axis').transition().duration(1000).call(capa.vis.scatterplot.axis.x_log);

                }

            },

            render : function() {

                const x = capa.vis.scatterplot.scales.x;
                const y = capa.vis.scatterplot.scales.y;


                d3.selectAll('circle.vis-cities')
                .transition()
                .duration(1000)
                .attr('cy', d => y(+d.properties.cant_medios))
                .attr('cx', d => x(+d.properties.pob));

                capa.vis.scatterplot.axis.render();

            },

            change_to_log : function() {

                const x = capa.vis.scatterplot.scales.x_log;

                d3.selectAll('circle.vis-cities')
                .transition()
                .duration(1000)
                .attr('cx', d => x(+d.properties.pob));

                capa.vis.scatterplot.axis.change_to_log();


            }

            
        },

        bar_chart : {

            scales : {

                x : d3.scaleLinear(),
                y : d3.scaleBand(),
                w : d3.scaleLinear(),

                set : function() {



                }

            },

            set_positions : {

            },







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
        },

        'scatter_log' : {

            play : function() {

                capa.vis.scatterplot.change_to_log();

            }
        }
        
    },

    scroller : {

        steps : {

            list : null,

            get : function() {

                const steps_html = document.querySelector(".story-container").children;

                capa.scroller.steps.list = Array.from(steps_html).map(d => d.dataset.step);

            }

        },

        config : function() {

            enterView({

                selector: '.story-step',

                enter: function(el) {

                    const step = el.dataset.step;

                    console.log("Renderizando step... ", step);

                    capa.scroller.render[step].play();

                },

                exit: function(el) {

                    const step = el.dataset.step;

                    console.log('voltando, ', step, capa.scroller.steps.list);

                    const index_step = capa.scroller.steps.list.indexOf(step);

                    const step_anterior = capa.scroller.steps.list[index_step - 1];

                    capa.scroller.render[step].reverse();

                    //capa.scroller.render[step_anterior]();

                    console.log("saiu, ", step_anterior);
                },

                offset: 0.5, // enter at middle of viewport
                //once: true, // trigger just once
            });

        },

        // por em outro lugar?

        render : {

            'abertura' : {

                play : function() {

                    console.log('nada')
                },

                reverse : function() {


                }
                
            },

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
            },
    
            'scatter_log' : {
    
                play : function() {
    
                    capa.vis.scatterplot.change_to_log();
    
                }
            }

        },

    },

    ctrl : {

        init : function() {

            capa.utils.colors.populate();

            // inicializa o scroller
            capa.scroller.steps.get();
            capa.scroller.config();

            capa.utils.read_data();

        },

        begin : function() {

            // after data is loaded

            capa.utils.dims.get();
            capa.map.prov.render();
            capa.map.mun.prepare_muns();
            capa.map.scales.set_radius_domain();
            capa.map.mun.render();
            capa.map.force.init();

            capa.vis.calc_margin();
            capa.vis.scatterplot.scales.set();
            capa.vis.scatterplot.axis.set();

            capa.ctrl.monitor_buttons();

            

        },

        monitor_buttons : function() {

            console.log('monitoring');

            const btns = document.querySelector(".btns-proto");

            btns.addEventListener('click', function(e) {

                console.log(e.target);

                if (e.target.dataset.btn == 'force') capa.map.force.fire();
                if (e.target.dataset.btn == 'force-bubble') capa.map.mun.pop_bubbles();

            })

        }

    }

}

capa.ctrl.init();