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
    gl_PointSize = 10.0;
}`;

const FSHADER_SOURCE =
    `#version 300 es
precision mediump float;
uniform vec4 uFragColor;
out vec4 fColor;
void main() {
    fColor = uFragColor;
}`;

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
        gl.clear(gl.COLOR_BUFFER_BIT);

        pointContainer.addNewPoint(ev);
        
        // Draw
        draw();
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    const draw = function () {
        const points = pointContainer.points;
        for (let i = 0; i < points.length; i++) {
            // Pass the position of a point to aPosition variable
            const pointCoord = points[i].coord;
            const rgba = points[i].color;

            gl.vertexAttrib3f(loc_aPosition, pointCoord.x, pointCoord.y, 0.0);
            gl.uniform4f(loc_uFragColor, rgba[0], rgba[1], rgba[2], rgba[3]);

            gl.drawArrays(gl.POINTS, 0, 1);
        }
    }
}