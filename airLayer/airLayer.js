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
var mask;

function get_air_data(density) {
    return new Promise((resolve, reject) => {
        lat_unit = 170 / density;
        lon_unit = 360 / density;
        let promises = [];
        for (let i = 0; i < density; i++) {
            for (let j = 0; j < density; j++) {
                let tmp_lat = -85 + lat_unit * i;
                let tmp_lon = -180 + lon_unit * j;
                promises.push(
                    new Promise((resolve, reject) => {
                        $.getJSON(`https://api.waqi.info/map/bounds/?latlng=${-85 + lat_unit * i},${-180 + lon_unit * j},${-85 + lat_unit * (i + 1)},${-180 + lon_unit * (j + 1)}&token=${token}`, function (data) {
                            resolve(data)
                        }, function (err) {
                            reject(err)
                        })
                    })
                );
            }
        }
        Promise.all(promises).then(function (data) {
            let result = [];
            data.forEach(part => {
                result.push(...part.data)
            });
            resolve(result);

        }, function (err) {
            reject(err);
        });
    })
}


get_air_data(2).then(data => {
    let vertices = [];
    let filteredGeoData = filterTheSameGeoCoordinates(data);
    filteredGeoData.forEach((station)=> {
        // console.log(station.aqi);
        if (station.aqi != '-') {
            vertices.push(new delaunay.Vertex(station.lon, station.lat, station.aqi));
        }
    });
    let expanded_vertices = get_3d_verticies(vertices);
    let mask = prepare_expanded_filled_mask(expanded_vertices, aqi_gradient);
    ctx.putImageData(mask.imageData, 0, 0);
    // triangles.forEach(function (triangle) {
    // // //     // ctx.fillStyle= "black";
    // // //     // ctx.fillRect(triangle.v0.x,triangle.v0.y,2,2);
    // // //     // ctx.fillRect(triangle.v1.x,triangle.v1.y,2,2);
    // // //     // ctx.fillRect(triangle.v2.x,triangle.v2.y,2,2);
    //     ctx.beginPath();
    //     ctx.moveTo(triangle.v0.x, triangle.v0.y);
    //     ctx.lineTo(triangle.v1.x, triangle.v1.y);
    //     ctx.lineTo(triangle.v2.x, triangle.v2.y);
    //     ctx.closePath();
    //     ctx.strokeStyle = "#ddd";
    //     ctx.stroke();
    // //
    // });
    // let filteredData = filterTheSameCoordinates(data.data);
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


function createMask(width = view.width, height = view.height) {

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
    // var w = window;
    // var d = document && document.documentElement;
    // var b = document && document.getElementsByTagName("body")[0];
    // var x = w.innerWidth || d.clientWidth || b.clientWidth;
    // var y = w.innerHeight || d.clientHeight || b.clientHeight;
    var x = 360 * 2;
    var y = 170 * 2;
    return {width: x, height: y};
}

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
    [0, [0, 50, 200]],
    [50, [150, 243, 0]],
    [100, [255, 124, 0]],
    [150, [174, 0, 60]],
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

// Bresenham algorithm, returning array of vertices. Every vertcies with different y coordinates
function bline(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    var dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    var err = (dx > dy ? dx : -dy) / 2;
    var result = [];
    result.push([x0, y0]);
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

function sort_vertex_by_y(vertices) {
    return vertices.sort(function (a, b) {
        if (a.y < b.y)
            return -1;
        if (a.y > b.y)
            return 1;
        return 0;
    })
}

// fills canvas between three points with given gradient, it uses Bresenham algorithm to find edges
function fill_triangle(v0, v1, v2, mask, gradient) {
    let sorted = sort_vertex_by_y([v0, v1, v2]);
    let points1 = bline(sorted[0].x, sorted[0].y, sorted[1].x, sorted[1].y);
    let points2 = bline(sorted[0].x, sorted[0].y, sorted[2].x, sorted[2].y);
    let min_points = points1.length <= points2.length ? points1 : points2;
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


function rotate_180(vertices) {
    let new_vertices = [];
    vertices.forEach(vertex => {
        let tmp = Object.assign({}, vertex);
        tmp.x = view.width - vertex.x;
        tmp.y = view.height - vertex.y;
        new_vertices.push(tmp);
    });
    return new_vertices
}
function get_vertices(vertices, from, to) {
    return vertices.filter(function (item) {
        return !!(item.x >= from.x && item.y >= from.y && item.x <= to.x && item.y <= to.y);

    })
}

function get_3d_verticies(vertices) {
    let result = [];
    vertices.forEach(station => {
        let tmp = Object.assign({}, station);
        tmp.x += view.width / 2;
        tmp.y += view.height / 2;
        result.push(tmp);
    });
    let left_vertices = get_vertices(vertices, {x: view.width / 2, y: 0}, {x: view.width, y: view.height});
    left_vertices.forEach(station => {
        let tmp = Object.assign({}, station);
        tmp.x -= view.width / 2;
        tmp.y += view.height / 2;
        result.push(tmp);

    });
    let right_vertices = get_vertices(vertices, {x: 0, y: 0}, {x: view.width / 2 - 1, y: view.height});
    right_vertices.forEach(station => {
        let tmp = Object.assign({}, station);
        tmp.x += view.width * 3 / 2;
        tmp.y += view.height / 2;
        result.push(tmp);

    });

    let up_vertices = rotate_180(vertices);
    up_vertices = get_vertices(up_vertices, {x: 0, y: view.height / 2}, {x: view.width - 1, y: view.height});
    up_vertices.forEach(station => {
        station.x += view.width / 2;
        station.y -= view.height / 2;
        result.push(station);
    });
    let down_vertices = rotate_180(vertices);
    down_vertices = get_vertices(down_vertices, {x: 0, y: 0}, {x: view.width - 1, y: view.height / 2 - 1});
    down_vertices.forEach(station => {
        let tmp = Object.assign({}, station);
        tmp.x += view.width / 2;
        tmp.y += view.height * 3 / 2;
        result.push(tmp);
    });
    return result;
}

function prepare_expanded_filled_mask(expanded_vertices, gradient) {
    let expanded_mask = createMask(2 * view.width, 2 * view.height);
    let triangles = delaunay.triangulate(expanded_vertices);
    triangles.forEach(function (triangle) {
        fill_triangle(triangle.v0, triangle.v1, triangle.v2, expanded_mask, gradient);
    });
    return expanded_mask;
}
