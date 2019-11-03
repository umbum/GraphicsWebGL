/**
 * @author : 엄성범 (umbum.tistory.com)
 * @since  : 2019-11-04
 * 
 * 역시 이렇게 무리해서 효율적으로 짜는 것 보다는 퍼포먼스가 조금 안나오더라도 layer를 나눠서 가독성과 유지보수성을 확보하는게 좋아 보인다. 
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
};
out vec4 vColor;
void main() {
    gl_Position = uMatT[gl_InstanceID] * uMatR[gl_InstanceID] * uMatS[gl_InstanceID] * starVertex;
    vColor = aColor;
}`;

const FSHADER_SOURCE =
    `#version 300 es
precision mediump float;
in vec4 vColor;
out vec4 fColor;
void main() {
    fColor = vColor;
}`;

let g_angle = 0.0;
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
    const { buffer, stars, BUF_SIZE } = initStarBuffer();
    const ubo = initUBO(gl, BUF_SIZE);
    
    stars.forEach((star) => star.T.setTranslate(100, 100, 0)); // 모두 화면 밖으로 초기화

    const starQueue = new StarQueue(MAX_STAR_COUNT, stars);

    canvas.onmousedown = function (ev) {
        try {
            const coord = calcPointCoord(ev, canvas);
            starQueue.enqueue(coord, 0.5, g_angle);
        } catch (e) {
            console.log(`한 번에 최대 ${MAX_STAR_COUNT}개만 그릴 수 있습니다.`);
        }
    }

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    let tick = function () {
        draw(gl, vao, ubo, buffer, StarRepr.VERTICES.length / 2, MAX_STAR_COUNT);
        updateStarMatrices(starQueue.data);
        if (starQueue.get(starQueue.front).scale < 0) {
            try {
                starQueue.dequeue();
            } catch (e) {}
        }
        
        requestAnimationFrame(tick);
    };
    tick();
}

function updateStarMatrices(stars) {
    const angle = calcAngle();
    const SCALE_DELTA = 0.003;
    for (let star of stars) {
        star.scale -= SCALE_DELTA;
        star.S.setScale(star.scale, star.scale, star.scale);
        star.R.setRotate(angle, 0, 0, 1);
    }
}


function initVAO(gl) {
    const TYPE_SIZE = Float32Array.BYTES_PER_ELEMENT
    const colors = Array.from({length:MAX_STAR_COUNT*3}, ()=> Math.random());
    const vertices = [...StarRepr.VERTICES, ...colors];
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create a buffer object
    const vertexBuffer = gl.createBuffer();
    if (!vertexBuffer) {
        console.log('Failed to create the buffer object');
        return -1;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    // Write date into the buffer object
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    // Assign the buffer object to VS's location variable
    gl.vertexAttribPointer(loc_starVertex, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc_starVertex);

    gl.vertexAttribPointer(loc_aColor, 3, gl.FLOAT, false, 0, TYPE_SIZE*StarRepr.VERTICES.length);
    gl.enableVertexAttribArray(loc_aColor);
    gl.vertexAttribDivisor(loc_aColor, 1);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);

    return vao;
}

function initUBO(gl, buf_size) {
    const binding_matrices = 7;

    const ubo = gl.createBuffer();
    gl.bindBufferBase(gl.UNIFORM_BUFFER, binding_matrices, ubo);

    // 서로 다른 shader program의 uniform들을 하나의 ubo에 연결할 수도 있음.
    const idx_uniform_block = gl.getUniformBlockIndex(gl.program, 'matrices');   // uniform block index
    gl.uniformBlockBinding(gl.program, idx_uniform_block, binding_matrices);

    gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
    gl.bufferData(gl.UNIFORM_BUFFER, buf_size, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    return ubo;
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

class StarQueue {
    constructor(size, stars) {
        this.data = stars;
        this.front = 0;
        this.rear = 0;
        this.size = size;
        this.length = 0;
    }

    enqueue(coord, scale, angle) {
        if (this.isFull) {
            throw "Queue is full";
        }
        length++;

        this.data[this.rear].R.setRotate(angle, 0, 0, 1);
        this.data[this.rear].S.setScale(scale, scale, scale);
        this.data[this.rear].T.setTranslate(coord.x, coord.y, 0);
        this.data[this.rear].scale = scale;

        this.rear = (this.rear + 1) % this.size;
    }

    dequeue() {
        if (this.isEmpty) {
            throw "Queue is empty";
        }
        length--;

        this.data[this.front].T.setTranslate(100, 100, 0);
        this.front = (this.front + 1) % this.size;
    }

    get isEmpty() {
        return (length === 0) ? true : false;
    }

    get isFull() {
        return (length === this.size) ? true : false;
    }
    
    get(i) {
        return this.data[i];
    }
}


class StarRepr {
    constructor() {
        this.R = new Matrix4();
        this.T = new Matrix4();
        this.S = new Matrix4();
        this.scale = 0.5;
    }

    /**
     * 중앙에서 위쪽 꼭지점까지의 거리가 1인 star 도형의 Triangle fan 표현 (12개 꼭지점)
     */
    static get VERTICES() {
        return [
            0, 0, 0, 1, 0.22, 0.31, 0.95, 0.31, 0.36, -0.12, 0.59, -0.81,
            0, -0.38, -0.59, -0.81, -0.36, -0.12, -0.95, 0.31, -0.22, 0.31, 0, 1,
        ];
    }
}


function initStarBuffer() {
    const TYPE_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const MAT4_LEN = 16;
    const MAT4_SIZE = TYPE_SIZE * MAT4_LEN;
    const BUF_SIZE = (MAT4_SIZE * 3) * MAX_STAR_COUNT;

    // Buffer & Pre-chunks
    const buffer = new ArrayBuffer(BUF_SIZE);

    const stars = Array.from({ length: MAX_STAR_COUNT }, () => new StarRepr());
    // link buffer and chunks
    for (let i = 0; i < MAX_STAR_COUNT; i++) {
        stars[i].R.elements = new Float32Array(buffer, MAT4_SIZE * i, MAT4_LEN);
        stars[i].T.elements = new Float32Array(buffer, MAT4_SIZE * (MAX_STAR_COUNT + i), MAT4_LEN);
        stars[i].S.elements = new Float32Array(buffer, MAT4_SIZE * (MAX_STAR_COUNT * 2 + i), MAT4_LEN);
    }
    return { buffer, stars, BUF_SIZE };
}

function calcPointCoord(ev, canvas) {
    const x = ev.clientX; // x coordinate of a mouse pointer
    const y = ev.clientY; // y coordinate of a mouse pointer
    const rect = ev.target.getBoundingClientRect();

    return {
        x: ((x - rect.left) - canvas.width / 2) / (canvas.width / 2),
        y: (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)
    };
}

// closure로 가둘 수 있을 듯.
const g_ANGLE_STEP = 60.0;  // Rotation angle (degrees/second)
let g_lastAngleCall = Date.now();  // Last time that angle function was called
function calcAngle() {
    // Calculate the elapsed time
    const now = Date.now();
    const elapsed = now - g_lastAngleCall;
    g_lastAngleCall = now;
    // Update the current rotation angle (adjusted by the elapsed time)
    g_angle = (g_angle + (g_ANGLE_STEP * elapsed) / 1000.0) % 360;
    return g_angle;
}
