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
out vec4 fColor;
void main() {
    fColor = vec4(1.0, 0.0, 0.0, 1.0);
}`;


class PointDrawer {
    constructor(gl, canvas) {
        this.gl = gl;
        this.canvas = canvas;
        this.points = [];  // The array for the position of a mouse press
    }

    draw() {
        // Clear <canvas>
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        var len = this.points.length;
        for (var i = 0; i < len; i++) {
            // Pass the position of a point to aPosition variable
            this.gl.vertexAttrib3f(loc_aPosition, this.points[i].x, this.points[i].y, 0.0);

            // Draw
            this.gl.drawArrays(this.gl.POINTS, 0, 1);
        }
    }

    addNewPoint(ev) {
        // Store the coordinates to this.points array
        const newPoint = this.getPointCoord(ev)
        this.points.push(newPoint);
    }

    getPointCoord(ev) {
        const ex = ev.clientX; // x coordinate of a mouse pointer
        const ey = ev.clientY; // y coordinate of a mouse pointer
        const rect = ev.target.getBoundingClientRect();
    
        return { 
            x: ((ex - rect.left) - this.canvas.width / 2) / (this.canvas.width / 2), 
            y: (this.canvas.height / 2 - (ey - rect.top)) / (this.canvas.height / 2)
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

    const pointDrawer = new PointDrawer(gl, canvas);
    canvas.onmousedown = function (ev) { 
        pointDrawer.addNewPoint(ev);
        pointDrawer.draw();
    };

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);
}