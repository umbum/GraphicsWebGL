/**
 * @author : 엄성범 (umbum.tistory.com)
 * @since  : 2019-10-24
 */
"use strict";
const loc_starVertex = 3;
const VSHADER_SOURCE =
    `#version 300 es
layout(location=${loc_starVertex}) in vec4 starVertex;
uniform mat4 uMatT;
uniform mat4 uMatR;
uniform mat4 uMatS;
void main() {
    gl_Position = uMatT * uMatR * uMatS * starVertex;
}`;
/**
 * matT를 uniform으로 하는게 맞다. 왜냐면,
 * starVertex : star를 이루는 12개의 점 각각이 들어옴
 * uMatT      : star 1개(=12개의 점)에 대해서 모두 같은 양으로 Translate. 
 *              한 번의 draw에 12개가 들어오는데 이들에 대해서 모두 같은 uMatT를 적용 할 것이므로.
 * uMatR      : 모든 star(12*n)에 대해서 모두 같은 양으로 회전
 * 
 * 그니까 말하자면 uMatT가 원래 uniform이고 uMatR은 uniform-uniform 이다.
 */


const FSHADER_SOURCE =
    `#version 300 es
precision mediump float;
uniform vec4 uFragColor;
out vec4 fColor;
void main() {
    fColor = uFragColor;
}`;

// 중앙에서 위쪽 꼭지점까지의 거리가 1인 star 도형의 Triangle fan 표현 (12개 꼭지점)
const STAR_REPR = new Float32Array([
    0, 0, 0, 1, 0.22, 0.31, 0.95, 0.31, 0.36, -0.12, 0.59, -0.81,
    0, -0.38, -0.59, -0.81, -0.36, -0.12, -0.95, 0.31, -0.22, 0.31, 0, 1
]);

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

    const getUniformLocation = function (locName) {
        const locVariable = gl.getUniformLocation(gl.program, locName);
        if (!locVariable) {
            throw `Failed to get the storage location of ${locName}`;
        }
        return locVariable;
    }

    let loc_uFragColor, loc_uMatT, loc_uMatR, loc_uMatS;
    try {
        loc_uFragColor = getUniformLocation('uFragColor');
        loc_uMatT = getUniformLocation('uMatT');
        loc_uMatR = getUniformLocation('uMatR');
        loc_uMatS = getUniformLocation('uMatS');
    } catch (e) {
        console.log(e);
        return;
    }
    
    const pointContainer = new PointContainer(canvas);
    canvas.onmousedown = (ev) => pointContainer.addNewPoint(ev);

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let angle = 0.0;
    // 짧은 시간 마다 계속 호출됨.
    let tick = function () {
        angle = getCurrentAngle(angle);  // Update the rotation angle
        draw(gl, pointContainer.points, angle, loc_uMatT, loc_uMatR, loc_uMatS, loc_uFragColor);
        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };
    tick()
}

function draw(gl, points, angle, loc_uMatT, loc_uMatR, loc_uMatS, loc_uFragColor) {
    gl.clear(gl.COLOR_BUFFER_BIT);

    let matT = new Matrix4();
    let matR = new Matrix4();
    let matS = new Matrix4();
    matT.translate(0.3, 0, 0);
    matR.rotate(angle, 0, 0, 1);
    matS.setScale(0.5, 0.5, 0.5);
    
    gl.uniformMatrix4fv(loc_uMatT, false, matT.elements);
    gl.uniformMatrix4fv(loc_uMatR, false, matR.elements);
    gl.uniformMatrix4fv(loc_uMatS, false, matS.elements);

    let { vao, n } = initVAO(gl, points);
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

function initVAO(gl, points) {

    const n = STAR_REPR.length / 2; // The number of vertices

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const transferDataToShader = function (location, data, size) {
        // Create a buffer object
        const buffer = gl.createBuffer();
        if (!buffer) {
            console.log('Failed to create the buffer object');
            return -1;
        }

        // Bind the buffer object to target
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        // Write date into the buffer object
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        // Assign the buffer object to VS's location variable
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind

        // Enable the assignment to VS's location variable
        gl.enableVertexAttribArray(location);
    }
    transferDataToShader(loc_starVertex, STAR_REPR, 2);
    
    gl.bindVertexArray(null);
    gl.disableVertexAttribArray(loc_starVertex);

    return { vao, n };
}

// Rotation angle (degrees/second)
const ANGLE_STEP = 45.0;
// Last time that this function was called
let g_last = Date.now();
function getCurrentAngle(angle) {
    // Calculate the elapsed time
    let now = Date.now();
    let elapsed = now - g_last;
    g_last = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    let newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
    return newAngle %= 360;
}


