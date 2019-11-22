/**
 * @author : 엄성범 (umbum.dev)
 * @since  : 2019-11-15
 */
"use strict";
const loc_aPosition = 3;
const loc_aTexCoord = 7;
const loc_aColor = 8;
const shaders = {
    cube : { // shader for texture rendered cube
        vertex : `#version 300 es
        layout(location=${loc_aPosition}) in vec4 aPosition;
        layout(location=${loc_aTexCoord}) in vec2 aTexCoord;
        uniform mat4 uMvpMatrix;
        out vec2 vTexCoord;
        void main() {
          gl_Position = uMvpMatrix * aPosition;
          vTexCoord = aTexCoord;
        }`,
        fragment : `#version 300 es
        precision mediump float;
        uniform sampler2D uSampler;
        in vec2 vTexCoord;
        out vec4 fColor;
        void main() {
          fColor = texture(uSampler, vTexCoord);
        }`
    },
    line : { // shader for solid colored line
        vertex : `#version 300 es
        layout(location=${loc_aPosition}) in vec4 aPosition;
        layout(location=${loc_aColor}) in vec4 aColor;
        uniform mat4 uMVP;
        out vec4 vColor;
        void main() {
            gl_Position = uMVP * aPosition;
            vColor = aColor;
        }`,
        fragment : `#version 300 es
        precision mediump float;
        in vec4 vColor;
        out vec4 fColor;
        void main() {
            fColor = vColor;
        }`
    }
}

class CameraStatus {
    constructor() {
        this._longitudeDOM = document.getElementById("longitude");
        this._latitudeDOM  = document.getElementById("latitude");
    }

    get longitude() {
        return parseInt(this._longitudeDOM.value);
    }

    get latitude() {
        return parseInt(this._latitudeDOM.value);
    }

    increaseLongitude() {
        this._longitudeDOM.value = this.longitude + 1;
    }
    decreaseLongitude() {
        this._longitudeDOM.value = this.longitude - 1;
    }
    increaseLatitude() {
        this._latitudeDOM.value = this.latitude + 1;
    }
    decreaseLatitude() {
        this._latitudeDOM.value = this.latitude - 1;
    }
}

const cameraStatus = new CameraStatus();

function main() {
    // Retrieve <canvas> element
    var canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    var gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    // Initialize shaders
    if (!initShaders(gl, shaders.cube.vertex, shaders.cube.fragment)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // Set the vertex information
    const {vao, n} = initVertexBuffers(gl);
    if (n < 0) {
        console.log('Failed to set the vertex information');
        return;
    }

    // Set the clear color and enable the depth test
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    // Set texture
    if (!initTextures(gl)) {
        console.log('Failed to intialize the texture.');
        return;
    }

    // Get the storage locations of uniform variables
    var loc_uMvpMatrix  = gl.getUniformLocation(gl.program, 'uMvpMatrix');
    if (!loc_uMvpMatrix ) {
        console.log('Failed to get the storage location of uniform variable');
        return;
    }

    document.onkeydown = function(ev){ keydown(ev, gl); };

    var tick = function () {   // Start drawing
        draw(gl, vao, canvas, n, loc_uMvpMatrix);
        requestAnimationFrame(tick, canvas);
    };
    tick();
}

function keydown(ev) {
    switch (ev.keyCode) {
        case 39:  // →
            cameraStatus.increaseLongitude();
            break;
        case 37:  // ←
            cameraStatus.decreaseLongitude();
            break;
        case 38:  // ↑
            cameraStatus.increaseLatitude();
            break;
        case 40:  // ↓
            cameraStatus.decreaseLatitude();
            break;
    }
}

function draw(gl, vao, canvas, n, loc_uMvpMatrix) {
    // Calculate The model view projection matrix and pass it to loc_uMvpMatrix 
    const mvpMatrix = new Matrix4();
    mvpMatrix.setPerspective(30.0, canvas.width / canvas.height, 1.0, 100.0);
    mvpMatrix.translate(0, 0, -10);
    mvpMatrix.rotate(cameraStatus.latitude, 1.0, 0.0, 0.0); // Rotation around x-axis
    mvpMatrix.rotate(-cameraStatus.longitude, 0.0, 1.0, 0.0); // Rotation around y-axis
    gl.uniformMatrix4fv(loc_uMvpMatrix , false, mvpMatrix.elements);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);     // Clear buffers

    gl.bindVertexArray(vao);
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_BYTE, 0);   // Draw the cube
    gl.bindVertexArray(null);
}

function initVertexBuffers(gl) {
    // Create a cube
    //    v6----- v5
    //   /|      /|
    //  v1------v0|
    //  | |     | |
    //  | |v7---|-|v4
    //  |/      |/
    //  v2------v3
    var vertices = new Float32Array([   // Vertex coordinates
        1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0,    // v0-v1-v2-v3 front
        1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0,    // v0-v3-v4-v5 right
        1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0,    // v0-v5-v6-v1 up
       -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0,    // v1-v6-v7-v2 left
       -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0,    // v7-v4-v3-v2 down
        1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0     // v4-v7-v6-v5 back
    ]);

    var texCoords = new Float32Array([   // Texture coordinates
        1, 0.5,   0.75, 0.5,   0.75, 0.25,   1, 0.25,    // v0-v1-v2-v3 front
        0.5, 0.25,   0.5, 0.0,   0.75, 0.0,  0.75, 0.25,    // v0-v3-v4-v5 right
        0.25, 0.25,   0.25, 0.5,   0.0, 0.5,   0.0, 0.25,    // v0-v5-v6-v1 up
        0.25, 0.5,   0.5, 0.5,   0.5, 0.25,   0.25, 0.25,    // v1-v6-v7-v2 left
        0.5, 0.75,   0.75, 0.75,   0.75, 0.5,   0.5, 0.5,    // v7-v4-v3-v2 down
        0.75, 0.25,   0.5, 0.25,   0.5, 0.5,   0.75, 0.5     // v4-v7-v6-v5 back
    ]);

    // Indices of the vertices
    var indices = new Uint8Array([
        0, 1, 2,   0, 2, 3,    // front
        4, 5, 6,   4, 6, 7,    // right
        8, 9,10,   8,10,11,    // up
       12,13,14,  12,14,15,    // left
       16,17,18,  16,18,19,    // down
       20,21,22,  20,22,23     // back
    ]);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    // Create a buffer object
    var indexBuffer = gl.createBuffer();
    if (!indexBuffer) {
        return -1;
    }

    // Write vertex information to buffer object
    if (!initArrayBuffer(gl, vertices, 3, gl.FLOAT, loc_aPosition)) return -1; // Vertex coordinates
    if (!initArrayBuffer(gl, texCoords, 2, gl.FLOAT, loc_aTexCoord)) return -1;// Texture coordinates

    // Unbind the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // Write the indices to the buffer object
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.bindVertexArray(null);

    return {vao, n:indices.length};
}

function initArrayBuffer(gl, data, num, type, loc_attribute) {
    // Create a buffer object
    var buffer = gl.createBuffer();
    if (!buffer) {
        console.log('Failed to create the buffer object');
        return false;
    }
    // Write date into the buffer object
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
    // Assign the buffer object to the attribute variable
    gl.vertexAttribPointer(loc_attribute, num, type, false, 0, 0);
    // Enable the assignment to a_attribute variable
    gl.enableVertexAttribArray(loc_attribute);

    return true;
}

function initTextures(gl) {
    // Create a texture object
    var texture = gl.createTexture();
    if (!texture) {
        console.log('Failed to create the texture object');
        return false;
    }

    // Get the storage location of loc_uSampler
    var loc_uSampler = gl.getUniformLocation(gl.program, 'uSampler');
    if (!loc_uSampler) {
        console.log('Failed to get the storage location of uSampler');
        return false;
    }

    // Create the image object
    var image = new Image();
    if (!image) {
        console.log('Failed to create the image object');
        return false;
    }
    // Register the event handler to be called when image loading is completed
    image.onload = function () { loadTexture(gl, texture, loc_uSampler, image); };
    // Tell the browser to load an Image
    image.src = '../resources/dice.png';

    return true;
}

function loadTexture(gl, texture, loc_uSampler, image) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);  // Flip the image Y coordinate
    // Activate texture unit0
    gl.activeTexture(gl.TEXTURE0);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);

    // Pass the texure unit 0 to loc_uSampler
    gl.uniform1i(loc_uSampler, 0);
}
