/**
 * @author : 엄성범 (umbum.tistory.com)
 * @since  : 2019-10-24
 */
"use strict";
const loc_aPosition = 3;
const VSHADER_SOURCE =
    `#version 300 es
layout(location=${loc_aPosition}) in vec4 aPosition;
void main() {
    gl_Position = aPosition;
}`;

const FSHADER_SOURCE =
    `#version 300 es
precision mediump float;
uniform vec4 uFragColor;
out vec4 fColor;
void main() {
    fColor = uFragColor;
}`;

// 중앙에서 위쪽 꼭지점까지의 거리가 1인 star 도형의 꼭지점들의 좌표 Triangle fan 표현
const STAR_REPR = [
    0, 0, 0, 1, 0.22, 0.31, 0.95, 0.31, 0.36, -0.12, 0.59, -0.81,
    0, -0.38, -0.59, -0.81, -0.36, -0.12, -0.95, 0.31, -0.22, 0.31, 0, 1
];

class PointContainer {
    constructor(canvas) {
        this.canvas = canvas;
        this.points = [];  // The array for the position of a mouse press
    }

    addNewPoint(ev) {
        // Store the coordinates to this.points array
        const newPointCoord = this.getPointCoord(ev, this.canvas)
        const newPointColor = this.getPointColor(newPointCoord);
        this.points.push({
            coord: newPointCoord,
            color: newPointColor
        });
    }

    getPointColor(p) {
        if (p.x >= 0.0 && p.y >= 0.0) {      // First quadrant
            return [1.0, 0.0, 0.0, 1.0];  // Red
        } else if (p.x < 0.0 && p.y < 0.0) { // Third quadrant
            return [0.0, 1.0, 0.0, 1.0];  // Green
        } else {                          // Others
            return [1.0, 1.0, 1.0, 1.0];  // White
        }
    }

    getPointCoord(ev, canvas) {
        const x = ev.clientX; // x coordinate of a mouse pointer
        const y = ev.clientY; // y coordinate of a mouse pointer
        const rect = ev.target.getBoundingClientRect();

        return {
            x: ((x - rect.left) - canvas.width / 2) / (canvas.width / 2),
            y: (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)
        };
    }
}

function main() {
    const canvas = document.getElementById('webgl');

    const gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Get the storage location of u_FragColor
    const loc_uFragColor = gl.getUniformLocation(gl.program, 'uFragColor');
    if (!loc_uFragColor) {
        console.log('Failed to get the storage location of uFragColor');
        return;
    }

    const pointContainer = new PointContainer(canvas);
    canvas.onmousedown = function (ev) {
        pointContainer.addNewPoint(ev);
        draw(gl, pointContainer.points, loc_uFragColor);
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}

function draw(gl, points, loc_uFragColor) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let { vao, n } = initVertexBuffers(gl, points);
    if (n < 0) {
        console.log('Failed to set the positions of the vertices');
        return;
    }

    gl.bindVertexArray(vao);
    // Draw the rectangle
    const starLen = STAR_REPR.length / 2
    for (let i = 0; i < n; i += starLen) {
        gl.drawArrays(gl.TRIANGLE_FAN, i, starLen);
    }
    gl.bindVertexArray(null);
}

function initVertexBuffers(gl, points) {
    const starScale = 0.2
    const starRepr = STAR_REPR.map(a => a * starScale);

    const vertices = points.map(point => point.coord)
        .flatMap(({ x, y }) =>
            starRepr.map((a, i) => (i % 2) ? y + a : x + a)
        );

    const n = vertices.length / 2; // The number of vertices

    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    // Create a buffer object
    let vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Assign the buffer object to aPosition variable
    gl.vertexAttribPointer(loc_aPosition, 2, gl.FLOAT, false, 0, 0);

    // Enable the assignment to aPosition variable
    gl.enableVertexAttribArray(loc_aPosition);

    gl.bindVertexArray(null);

    return { vao, n };
}
