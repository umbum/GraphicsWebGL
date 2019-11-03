/**
 * @author : 엄성범 (umbum.tistory.com)
 * @since  : 2019-10-24
 */
"use strict";

//////////////////////////////////////////////////////////////////////////
////////////////////////// Presentation Layer ////////////////////////////
//////////////////////////////////////////////////////////////////////////

const loc_starVertex = 3;
const MAX_STAR_COUNT = 30;
const VSHADER_SOURCE =
    `#version 300 es
layout(location=${loc_starVertex}) in vec4 starVertex;
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

    const vao = initVAO(gl, StarRepr.VERTICES);
    const { buffer, stars, BUF_SIZE } = initStarBuffer();
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
        updateStarMatrices(pointContainer, stars);
        draw(gl, vao, ubo, buffer, StarRepr.VERTICES.length / 2, pointContainer.points.length);
        pointContainer.points = pointContainer.points.filter(p => p.scale > 0);
        requestAnimationFrame(tick);
    };
    tick();
}

function initVAO(gl, vertices) {
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

class StarRepr {
    constructor() {
        this.R = new Matrix4();
        this.T = new Matrix4();
        this.S = new Matrix4();
        this.color = null;
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

/**
 * business layer <> presentation layer 간 interface
 */
function updateStarMatrices(pointContainer, stars) {
    const points = pointContainer.points;
    const angle = pointContainer.angle;
    const SCALE_DELTA = 0.003;
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

function initStarBuffer() {
    const TYPE_SIZE = Float32Array.BYTES_PER_ELEMENT;
    const MAT4_LEN = 16;
    const MAT4_SIZE = TYPE_SIZE * MAT4_LEN;
    const VEC4_LEN = 4;
    const VEC4_SIZE = TYPE_SIZE * VEC4_LEN;
    const BUF_SIZE = (MAT4_SIZE * 3 + VEC4_SIZE) * MAX_STAR_COUNT;

    // Buffer & Pre-chunks
    const buffer = new ArrayBuffer(BUF_SIZE);

    const stars = Array.from({ length: MAX_STAR_COUNT }, () => new StarRepr());
    // link buffer and chunks
    for (let i = 0; i < MAX_STAR_COUNT; i++) {
        stars[i].R.elements = new Float32Array(buffer, MAT4_SIZE * i, MAT4_LEN);
        stars[i].T.elements = new Float32Array(buffer, MAT4_SIZE * (MAX_STAR_COUNT + i), MAT4_LEN);
        stars[i].S.elements = new Float32Array(buffer, MAT4_SIZE * (MAX_STAR_COUNT * 2 + i), MAT4_LEN);
        stars[i].color = new Float32Array(buffer, MAT4_SIZE * (MAX_STAR_COUNT * 3) + VEC4_SIZE * i, VEC4_LEN);
    }
    return { buffer, stars, BUF_SIZE };
}


//////////////////////////////////////////////////////////////////////////
////////////////////////// Business Layer ////////////////////////////////
//////////////////////////////////////////////////////////////////////////
class PointContainer {
    constructor(canvas) {
        this.canvas = canvas;
        this.points = [];  // The array for the position of a mouse press
        this._angle = 0.0;
        this._ANGLE_STEP = 60.0;  // Rotation angle (degrees/second)
        this._lastAngleCall = Date.now();  // Last time that angle function was called
    }

    addNewPoint(ev) {
        // Store the coordinates to this.points array
        const newPointCoord = this._getPointCoord(ev, this.canvas)
        const newPointColor = this._getPointColor();
        this.points.push({
            coord: newPointCoord,
            color: newPointColor,
            scale: 0.5
        });
    }

    get angle() {
        // Calculate the elapsed time
        const now = Date.now();
        const elapsed = now - this._lastAngleCall;
        this._lastAngleCall = now;
        // Update the current rotation angle (adjusted by the elapsed time)
        this._angle = (this._angle + (this._ANGLE_STEP * elapsed) / 1000.0) % 360;
        return this._angle;
    }
    
    _getPointColor() {
        return [Math.random(), Math.random(), Math.random(), 1.0];
    }

    /**
     * 이건 presentation이냐 business냐 좀 애매하긴 한데,
     * 매번 coord 계산하는게 조금 그래서 그냥 여기 둔다.
     */
    _getPointCoord(ev, canvas) {
        const x = ev.clientX; // x coordinate of a mouse pointer
        const y = ev.clientY; // y coordinate of a mouse pointer
        const rect = ev.target.getBoundingClientRect();

        return {
            x: ((x - rect.left) - canvas.width / 2) / (canvas.width / 2),
            y: (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2)
        };
    }
}
