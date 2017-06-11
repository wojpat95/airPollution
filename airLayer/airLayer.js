var token = 'bef68d317745ed249dd46507da11fe9178241121';
var lat1, lng1, lat2, lng2;
var view = getView();

var canv = document.createElement('canvas');
canv.id = 'station';

drawOverlay(canv);


var canvas = document.getElementById("station");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var ctx = canvas.getContext("2d");
//
// var unit = ctx.createImageData(view.width, view.height); // only do this once per page
// // for (var i=0;i<unit.data.length;i+=4)
// // {
// //     unit.data[i]=255;
// //     unit.data[i+1]=0;
// //     unit.data[i+2]=0;
// //     unit.data[i+3]=255;
// // }
// var dataUnit = unit.data;
// console.log(dataUnit);
var mask;

$.getJSON(`https://api.waqi.info/map/bounds/?latlng=-85.0,-180.0,85.0,180.0&token=${token}`, function (data) {
    if (!data || (data.status != "ok")) {
        console.log('DATA ERROR');
        return;
    }

    //
    let vertices = [];
    let filteredGeoData = filterTheSameGeoCoordinates(data.data);
    filteredGeoData.forEach((station)=> {
        console.log(station.aqi);
        if(station.aqi != '-'){
            vertices.push(new delaunay.Vertex(station.lon, station.lat, station.aqi));
        }
    });
    let triangles = delaunay.triangulate(vertices);
    console.log(triangles);
    let apiData = [];
    mask = createMask();
    console.log(data.data.length);
    triangles.forEach(function (triangle) {
        fill_triangle(triangle.v0, triangle.v1, triangle.v2, mask, aqi_gradient);
        // ctx.beginPath();
        // ctx.moveTo(triangle.v0.x, triangle.v0.y);
        // ctx.lineTo(triangle.v1.x, triangle.v1.y);
        // ctx.lineTo(triangle.v2.x, triangle.v2.y);
        // ctx.closePath();
        // ctx.strokeStyle = "black";
        // ctx.stroke();
        //
        // // Display circumcircles
        // ctx.beginPath();
        // ctx.arc( triangle.center.x, triangle.center.y, triangle.radius, 0, Math.PI*2, true );
        // ctx.closePath();
        // ctx.strokeStyle= "#ddd";
        // ctx.stroke();
    });
    ctx.putImageData(mask.imageData, 0, 0);
    triangles.forEach(function (triangle) {
        // ctx.fillStyle= "black";
        // ctx.fillRect(triangle.v0.x,triangle.v0.y,2,2);
        // ctx.fillRect(triangle.v1.x,triangle.v1.y,2,2);
        // ctx.fillRect(triangle.v2.x,triangle.v2.y,2,2);
        ctx.beginPath();
        ctx.moveTo(triangle.v0.x, triangle.v0.y);
        ctx.lineTo(triangle.v1.x, triangle.v1.y);
        ctx.lineTo(triangle.v2.x, triangle.v2.y);
        ctx.closePath();
        ctx.strokeStyle = "#ddd";
        ctx.stroke();
        // ctx.fillStyle = "#FFCC00";
        // ctx.fill();
        // ctx.beginPath();
        // ctx.arc( triangle.center.x, triangle.center.y, triangle.radius, 0, Math.PI*2, true );
        // ctx.closePath();
        // ctx.strokeStyle= "#ddd";
        // ctx.stroke();

    });
    // let filteredData = filterTheSameCoordinates(data.data);

    // filteredData.forEach((station) => {
    //     $.getJSON(`https://api.waqi.info/feed/geo:${station.lat};${station.lon}/?token=${token}`, function (result) {
    //         apiData.push({value: result.data.aqi, coord: [getCoordinateX(station.lon), getCoordinateY(station.lat)]});
    //         // let rgba = aqi_gradient(result.data.aqi, 1);
    //         // ctx.fillStyle = "rgba(" + rgba[0] + ',' + rgba[1] + ',' + rgba[2] + ',' + rgba[3] + ')';
    //         // ctx.fillRect(getCoordinateX(station.lon), getCoordinateY(station.lat), 1, 1);
    //         if (apiData.length == filteredData.length - 1) {
    //             console.log("interpolate fields");
    //             interpolate_fields(apiData, mask);
    //             clearCanvas(canvas);
    //             // console.log(mask.imageData);
    //             // for (var i=0;i<mask.imageData.data.length;i+=4)
    //             // {
    //             //     mask.imageData.data[i]=255;
    //             //     mask.imageData.data[i+1]=0;
    //             //     mask.imageData.data[i+2]=0;
    //             //     mask.imageData.data[i+3]=255;
    //             // }
    //             for (var i=0;i<mask.imageData.data.length;i++)
    //             {
    //                 if(isNaN(mask.imageData.data[i])){
    //                     console.log(i);
    //                 }
    //             }
    //             ctx.putImageData(mask.imageData, 0, 0);
    //         }
    //         console.log(apiData.length);
    //     }, function (error) {
    //         console.log(error);
    //     });
    //     // dataUnit[0] = 255;
    //     // dataUnit[1] = 0;
    //     // dataUnit[2] = 0;
    //     // dataUnit[3] = 1;
    //     // console.log(Math.round(getCoordinateX(station.lon)*2) + " " + Math.round(getCoordinateY(station.lat)*2));
    //     // ctx.putImageData(unit, Math.round(getCoordinateX(station.lon)*2), Math.round(getCoordinateY(station.lat)*2));
    // });
    console.log(data);
});

function getCoordinateX(lon) {
    if (lon) {
        return Math.round((lon + 180) * view.width / 360);
    }
    return 0;
}

function getCoordinateY(lat) {
    if (lat) {
        return Math.round((170 - (lat + 85)) * view.height / 170);
    }
    return 0;
}

function filterTheSameGeoCoordinates(data) {
    let dataHash = {};
    data.forEach(station => {
        let coordiantes = [getCoordinateX(station.lon), getCoordinateY(station.lat)];
        if (!(coordiantes.toString() in dataHash)) {
            station.lon = getCoordinateX(station.lon);
            station.lat = getCoordinateY(station.lat);
            dataHash[coordiantes] = station
        }
    });
    let result = [];
    for (let key in dataHash) {
        result.push(dataHash[key]);
    }
    return result;


}
function segmentedColorScale(segments) {
    var points = [], interpolators = [], ranges = [];
    for (var i = 0; i < segments.length - 1; i++) {
        points.push(segments[i + 1][0]);
        interpolators.push(colorInterpolator(segments[i][1], segments[i + 1][1]));
        ranges.push([segments[i][0], segments[i + 1][0]]);
    }

    return function (point, alpha) {
        var i;
        for (i = 0; i < points.length - 1; i++) {
            if (point <= points[i]) {
                break;
            }
        }
        var range = ranges[i];
        return interpolators[i](proportion(point, range[0], range[1]), alpha);
    };
}

function colorInterpolator(start, end) {
    var r = start[0], g = start[1], b = start[2];
    var deltaR = end[0] - r, deltaG = end[1] - g, deltaB = end[2] - b;
    return function (i, a) {
        return [Math.floor(r + i * deltaR), Math.floor(g + i * deltaG), Math.floor(b + i * deltaB), a];
    };
}

function proportion(x, low, high) {
    return (clamp(x, low, high) - low) / (high - low);
}

function clamp(x, low, high) {
    return Math.max(low, Math.min(x, high));
}


function createMask(width=view.width, height = view.height) {

    // Create a detached canvas, ask the model to define the mask polygon, then fill with an opaque color.
    var imageData = ctx.createImageData(width, height);
    var data = imageData.data;  // layout: [r, g, b, a, r, g, b, a, ...]
    return {
        imageData: imageData,
        isVisible: function (x, y) {
            var i = (y * width + x) * 4;
            return data[i + 3] > 0;  // non-zero alpha means pixel is visible
        },
        set: function (x, y, rgba) {
            var i = (y * width + x) * 4;
            data[i] = rgba[0];
            data[i + 1] = rgba[1];
            data[i + 2] = rgba[2];
            data[i + 3] = rgba[3];
            return this;
        }
    };
}

function getView() {
    var w = window;
    var d = document && document.documentElement;
    var b = document && document.getElementsByTagName("body")[0];
    var x = w.innerWidth || d.clientWidth || b.clientWidth;
    var y = w.innerHeight || d.clientHeight || b.clientHeight;
    // var x = 360*2;
    // var y = 170* 2;
    return {width: x, height: y};
}


// function interpolate_fields(apiData, mask) {
//     for (let i = 0; i < view.width; i++) {
//         for (let j = 0; j < view.height; j++) {
//             let triangle = findClosestTriangle([i, j], apiData);
//             if (triangle.length < 3) {
//                 console.log('there is no triangle')
//             } else {
//                 console.log('triangle found');
//                 if (is_point_inside_triangle([i, j], triangle[0].station.coord, triangle[1].station.coord, triangle[2].station.coord)) {
//                     let value = interpolate_triangle([i, j], triangle[0].station, triangle[1].station, triangle[2].station);
//                     console.log('test value: ' + value);
//                     if (!isNaN(value)) {
//                         mask.set(i, j, aqi_gradient(value, 255))
//                     } else {
//                         console.log()
//                     }
//                 } else {
//                     interpolate_linear();
//                 }
//             }
//         }
//     }
// }
//
// function interpolate_linear(point, x, y) {
//
// }

function interpolate_triangle(point, x, y, z) {
    let xyzArea = area(x, y, z);
    let pxyArea = area(point, x, y);
    let pyzArea = area(point, y, z);
    let pxzArea = area(point, x, z);
    return (pxyArea * z.value + pyzArea * x.value + pxzArea * y.value) / xyzArea;

}


function area(x, y, z) {
    return Math.abs((x.x * y.y + y.x * z.y + z.x * x.y - y.x * x.y - z.x * y.y - x.x * z.y)) / 2
}

function findClosestTriangle(point, apiData) {
    let result = [];
    apiData.forEach(station => {
        if (!(point[0] == station.coord[0] && point[1] == station.coord[1])) {
            let distance = Math.sqrt(Math.pow(point[1] - station.coord[1], 2) + Math.pow(point[0] - station.coord[0], 2));
            if (result.length < 3) {
                result.push({station: station, distance: distance});
            } else {
                //TODO fix
                for (let i in result) {
                    if (result[i].distance > distance) {
                        result[i].distance = distance;
                        result[i].station = station;
                        break;
                    }
                }
            }
        }
    });
    return result
}

function sign(p1, p2, p3) {
    return (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
}

function is_point_inside_triangle(pt, v1, v2, v3) {

    let b1 = sign(pt, v1, v2) < 0;
    let b2 = sign(pt, v2, v3) < 0;
    let b3 = sign(pt, v3, v1) < 0;

    return ((b1 == b2) && (b2 == b3));
}

function clearCanvas(canvas) {
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    return canvas;
}

function drawOverlay(canvas) {
    document.body.appendChild(canvas);
}

aqi_gradient = segmentedColorScale([
    [50, [0, 50, 200]],
    [100, [150, 243, 0]],
    [150, [255, 124, 0]],
    [200, [174, 0, 60]],
    [300, [140, 0, 57]],
]);
pm25_gradient = segmentedColorScale([
    [0, [0, 150, 0]],
    [30, [255, 255, 0]],
    [70, [255, 153, 0]],
    [90, [255, 0, 0]],
    [121, [214, 0, 147]],
]);
pm10_gradient = segmentedColorScale([
    [0, [0, 150, 0]],
    [50, [255, 255, 0]],
    [100, [255, 153, 0]],
    [251, [255, 0, 0]],
    [351, [214, 0, 147]],
]);


function bline(x0, y0, x1, y1) {

    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = (dx > dy ? dx : -dy) / 2;
    var result = [];
    result.push([x0, y0])
    while (true) {
        if (x0 === x1 && y0 === y1) break;
        var e2 = err;
        if (e2 > -dx) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dy) {
            err += dx;
            y0 += sy;
            result.push([x0, y0])

        }
    }
    return result;
}
function sort_vertex_by_y(vertices){
    return vertices.sort(function (a,b) {
        if (a.y < b.y)
            return -1;
        if (a.y > b.y)
            return 1;
        return 0;
    })
}
function fill_triangle(v0, v1, v2, mask, gradient) {
    let sorted = sort_vertex_by_y([v0, v1, v2]);
    let points1 = bline(sorted[0].x, sorted[0].y, sorted[1].x, sorted[1].y);
    let points2 = bline(sorted[0].x, sorted[0].y, sorted[2].x, sorted[2].y);
    let range = Math.min(points1.length, points2.length);
    let min_points = points1.length < points2.length ? points1 : points2;
    let max_points = points1.length > points2.length ? points1 : points2;
    for (let i = 0; i < min_points.length; i++) {
        let min_x, max_x;

        min_x = min_points[i][0] < max_points[i][0] ? min_points[i][0] : max_points[i][0];
        max_x = min_points[i][0] > max_points[i][0] ? min_points[i][0] : max_points[i][0];

        for (let j = min_x; j <= max_x; j++) {
            let value = interpolate_triangle({x: j, y: max_points[i][1]}, v0, v1, v2);
            mask.set(j, max_points[i][1], gradient(value, 255));
        }
    }
    let last_points;
    if (min_points == points1) {
        last_points = bline(sorted[1].x, sorted[1].y, sorted[2].x, sorted[2].y);
    } else {
        last_points = bline(sorted[2].x, sorted[2].y, sorted[1].x, sorted[1].y);
    }
    for (let i = min_points.length; i < max_points.length; i++) {
        let min_x, max_x;
        min_x = last_points[i - min_points.length][0] < max_points[i][0] ? last_points[i - min_points.length][0] : max_points[i][0];
        max_x = last_points[i - min_points.length][0] > max_points[i][0] ? last_points[i - min_points.length][0] : max_points[i][0];
        for (let j = min_x; j <= max_x; j++) {
            let value = interpolate_triangle({x: j, y: max_points[i][1]}, v0, v1, v2);
            mask.set(j, max_points[i][1], gradient(value, 255));
        }
    }

}


function rotate_180(vertices){
    vertices.forEach(vertex => {
        vertex.x = view.width - vertex.x;
        vertex.y = getView.height - vertex.y
    })
}
function get_vertices(vertices, from, to) {
    return vertices.filter(function (item) {
        return !!(item.x >= from.x && item.y >= from.y && item.x <= to.x && item.y <= to.y);

    })
}

function prepare_3d_mask(){
    let mask = createMask();
}
