/**
 * @author : 엄성범 (umbum.tistory.com)
 * @since  : 2019-10-24
 */
"use strict";
const loc_starVertex = 3;
const loc_aColor = 4;
const MAX_STAR_COUNT = 30;
const VSHADER_SOURCE =
    `#version 300 es
layout(location=${loc_starVertex}) in vec4 starVertex;
layout(location=${loc_aColor}) in vec4 aColor;
uniform matrices
{
    mat4 uMatR[${MAX_STAR_COUNT}];
    mat4 uMatT[${MAX_STAR_COUNT}];
    mat4 uMatS[${MAX_STAR_COUNT}];
    vec4 color[${MAX_STAR_COUNT}];
};
out vec4 vColor;
void main() {
    gl_Position = uMatT[gl_InstanceID] * uMatR[gl_InstanceID] * uMatS[gl_InstanceID] * starVertex;
    vColor = color[gl_InstanceID];
}`;

const FSHADER_SOURCE =
    `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fColor;
void main() {
    fColor = vColor;
}`;

// 중앙에서 위쪽 꼭지점까지의 거리가 1인 star 도형의 Triangle fan 표현 (12개 꼭지점)
const STAR_REPR = [
    0, 0, 0, 1, 0.22, 0.31, 0.95, 0.31, 0.36, -0.12, 0.59, -0.81,
    0, -0.38, -0.59, -0.81, -0.36, -0.12, -0.95, 0.31, -0.22, 0.31, 0, 1,
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
            color: newPointColor,
            scale: 0.5
        });
    }

    getPointColor() {
        return [Math.random(), Math.random(), Math.random(), 1.0];
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

    const vao = initVAO(gl);
    const {buffer, stars, BUF_SIZE} = initStarBuffer();
    const ubo = initUBO(gl, BUF_SIZE);
    
    const pointContainer = new PointContainer(canvas);
    canvas.onmousedown = function (ev) {
        if (pointContainer.points.length < MAX_STAR_COUNT) {
            pointContainer.addNewPoint(ev);
        }
        else {
            console.log(`한 번에 최대 ${MAX_STAR_COUNT}개만 그릴 수 있습니다.`);
        }
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let tick = function () {
        setStarMatrices(pointContainer.points, stars);
        draw(gl, vao, ubo, buffer, STAR_REPR.length / 2, pointContainer.points.length);
        pointContainer.points = pointContainer.points.filter(p => p.scale > 0);
        requestAnimationFrame(tick);
    };
    tick();
}

/**
 * input output이 잘 안보인다. refac할 것.
 */
let angle = 0.0;
const SCALE_DELTA = 0.003;
function setStarMatrices(points, stars) {
    angle = getCurrentAngle(angle);  // Update the rotation angle
    for (let i = 0; i < points.length; i++) {
        let p = points[i];
        p.scale -= SCALE_DELTA;
        
        stars[i].R.setRotate(angle, 0, 0, 1);
        stars[i].S.setScale(p.scale, p.scale, p.scale);
        stars[i].T.setTranslate(p.coord.x, p.coord.y, 0);
        stars[i].color[0] = p.color[0];
        stars[i].color[1] = p.color[1];
        stars[i].color[2] = p.color[2];
        stars[i].color[3] = p.color[3];
    }
}


function draw(gl, vao, ubo, buffer, vertexCount, instanceCount) {
    // Update uniform matrices
    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferSubData(gl.UNIFORM_BUFFER, 0, buffer); 
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindVertexArray(vao);
    gl.drawArraysInstanced(gl.TRIANGLE_FAN, 0, vertexCount, instanceCount);
    gl.bindVertexArray(null);
}

function initVAO(gl) {
    // const colors = Array.from({length: 3*30}, () => Math.random());
    // const vertices = new Float32Array([...STAR_REPR, ...colors]);
    // const TYPE_SIZE = vertices.BYTES_PER_ELEMENT;

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    // Create a buffer object
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    // Bind the buffer object to target
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(STAR_REPR), gl.STATIC_DRAW);

    // Assign the buffer object to VS's location variable
    gl.vertexAttribPointer(loc_starVertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc_starVertex);

    // gl.vertexAttribPointer(loc_aColor, 3, gl.FLOAT, false, 0, TYPE_SIZE*STAR_REPR.length);
    // gl.enableVertexAttribArray(loc_aColor);
    // gl.vertexAttribDivisor(loc_aColor, 1);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, null); // Unbind
    gl.bindVertexArray(null);

    return vao;
}


function initUBO(gl, buf_size) {

    const binding_matrices = 7;

    let ubo = gl.createBuffer();
    gl.bindBufferBase(gl.UNIFORM_BUFFER, binding_matrices, ubo);

    // 서로 다른 shader program의 uniform들을 하나의 ubo에 연결할 수도 있다.
    let idx_uniform_block = gl.getUniformBlockIndex(gl.program, 'matrices');   // uniform block index
    gl.uniformBlockBinding(gl.program, idx_uniform_block, binding_matrices);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, buf_size, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return ubo;
}

class Star {
    constructor() {
        this.R = new Matrix4();
        this.T = new Matrix4();
        this.S = new Matrix4();
        this.color = null;
    }
}

/**
 * Vertex Shader와 종속성.
 */
function initStarBuffer() {
    const TYPE_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const MAT4_LEN = 16;
    const MAT4_SIZE = TYPE_SIZE * MAT4_LEN;
    const VEC4_LEN = 4;
    const VEC4_SIZE = TYPE_SIZE * VEC4_LEN;
    const BUF_SIZE = (MAT4_SIZE*3 + VEC4_SIZE) * MAX_STAR_COUNT;
    
    // Buffer & Pre-chunks
    let buffer = new ArrayBuffer(BUF_SIZE);
    
    const stars = Array.from({length:MAX_STAR_COUNT}, () => new Star());
    // link buffer and chunks
    for (let i = 0; i < MAX_STAR_COUNT; i++) {
        stars[i].R.elements = new Float32Array(buffer, MAT4_SIZE*i, MAT4_LEN);
        stars[i].T.elements = new Float32Array(buffer, MAT4_SIZE*(MAX_STAR_COUNT + i), MAT4_LEN);
        stars[i].S.elements = new Float32Array(buffer, MAT4_SIZE*(MAX_STAR_COUNT*2 + i), MAT4_LEN);
        stars[i].color = new Float32Array(buffer, MAT4_SIZE*(MAX_STAR_COUNT*3) + VEC4_SIZE*i, VEC4_LEN);
    }
    return {buffer, stars, BUF_SIZE};
}

// Rotation angle (degrees/second)
const ANGLE_STEP = 60.0;
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


