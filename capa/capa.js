const capa = {

    map : {

        file : 'provincias_simp.json',

        render : function() {

            let data = capa.data;

            let feats = data.features;
            //   topojson.feature(
            //     topodata, 
            //     topodata.objects.provincia)
            //   .features;

            let geodata = {

                type:"FeatureCollection",
                "features": feats

            };

            let h = capa.utils.dims.height;
            let w = capa.utils.dims.width;

            // let proj = d3.geoTransverseMercator()
            //   .center([2.5, -38.5])
            //   .rotate([66, 0])
            //   .scale((h * 56.5) / 33).translate([(w / 2), (h / 2)]);

            let proj = d3
              .geoConicEqualArea()
              .parallels([-56, -21])
              .rotate([40, 0])
              .fitSize([h, w], geodata)


            let svg = d3.select("svg#vis-capa");


            svg.append("g")
              .selectAll("path")
              .data(feats)
              .join("path")
              .attr("fill", 'hotpink')
              .attr("stroke", 'khaki')
              .attr("d", d3.geoPath().projection(proj))
            ;


        }

    },

    data : {

        map : null

    },

    utils : {

        read_data : function() {

            d3.json(capa.map.file).then(file => {

                capa.data = file;

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

                capa.dims.width  = svg.getBoundingClientRect().width;
                capa.dims.height = svg.getBoundingClientRect().height;

            }


        }
 
    },

    ctrl : {

        init : function() {


            capa.utils.read_data();

        },

        begin : function() {

            capa.map.render();

        }

    }

}

capa.ctrl.init();