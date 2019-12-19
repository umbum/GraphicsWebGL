/**
 * @author : 엄성범 (umbum.dev)
 * @since  : 2019-12-16
 */
"use strict";

class RotationStatus {
    constructor(name) {
        this._rotating_speed_DOM  = document.getElementById(`${name}-rotating`);
        this._revolving_speed_DOM = document.getElementById(`${name}-revolving`);
        // set initial value
        this._rotating_angle  = this.rotating_speed;  
        this._revolving_angle = this.revolving_speed;
    }

    get rotating_speed() {
        return parseInt(this._rotating_speed_DOM.value);
    }

    get revolving_speed() {
        return parseInt(this._revolving_speed_DOM.value);
    }

    get rotating_angle() {
        return this._rotating_angle;
    }

    get revolving_angle() {
        return this._revolving_angle;
    }
    
    update_angle(elapsed) {
        this._rotating_angle  = (this._rotating_angle + (this.rotating_speed*elapsed)/1000.0) % 360.0;
        this._revolving_angle = (this._revolving_angle + (this.revolving_speed*elapsed)/1000.0) % 360.0;
    }
}

function degree_to_rad(degree) {
    return degree * Math.PI / 180;
}

function main() {
    let canvas = document.getElementById('webgl');
    let gl = canvas.getContext("webgl2");

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    
    let V = new Matrix4();
    V.setLookAt(6, 6, 4, 0, 0, 0, 0, 0, 1);

    let P = new Matrix4();
    P.setPerspective(60, (canvas.width / canvas.height) * 2, 1, 100); 
    
    const V_lower = new Matrix4();
    V_lower.setLookAt(0, 0, 0, 0, -1, 0, 0, 0, 1);
    const P_lower = new Matrix4();
    P_lower.setPerspective(60, (canvas.width / canvas.height), 1, 100);
    
    let list_shaders = [];

    // initializes shaders (reflection models)
    for(let model of ["Blinn-Phong"]) {
        list_shaders[model] = new Shader(gl, 
            document.getElementById("vert-" + model).text,
            document.getElementById("frag-" + model).text,
            {aPosition:0, aNormal:1});
    }

    // initializes the material combobox
    let combo_mat = document.getElementById("materials");
    for(let matname in __js_materials) {
        let opt = document.createElement("option");
        opt.value = matname;
        opt.text = matname;
        combo_mat.add(opt, null);
    }
    combo_mat.selectedIndex = 10;

    // initializes light
    const list_lights = [
        new Light(  // sun light
            gl,
            [  0,   0,   0, 1.0],    // position
            [0.1, 0.1, 0.1, 1.0],    // ambient
            [1.0, 1.0, 1.0, 1.0],    // diffusive
            [1.0, 1.0, 1.0, 1.0],    // specular
            false
        )];

    // initializes the meshes
    let sun = create_mesh_sphere(gl, 100);
    sun.M.setScale(0.7, 0.7, 0.7);
    let earth = create_mesh_sphere(gl, 100);
    let moon = create_mesh_sphere(gl, 100);
    
    let axes = new Axes(gl);
    
    const earth_stat = new RotationStatus("earth");
    const moon_stat  = new RotationStatus("moon");

    
    const sun_textures = {
        "uSampler": initTextures(gl, '../resources/2k_sun.jpg', 0)
    };

    const earth_textures = {
        "uSampler": initTextures(gl, '../resources/earthmap1k.jpg', 0)
    };

    const moon_textures = {
        "uSampler": initTextures(gl, '../resources/moonmap1k.jpg', 0)
    }
    

    let t_last = Date.now();

    let tick = function() {
        let now = Date.now();
        let elapsed = now - t_last;
        t_last = now;
        
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.viewport(0, canvas.height/2, canvas.width, canvas.height/2);

        axes.render(gl, V, P);
        
        for(let i in list_lights) {
            // for light state and render it
            list_lights[i].turn_on(true);
            list_lights[i].set_type(true);
            list_lights[i].render(gl, V, P);
        }
        
        sun.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["ruby"], V, P, sun_textures);
        
        earth.M.setScale(0.8, 0.8, 0.8);
        /**
         * rotate 후 translate : 공전
         * translate 후 rotate : 자전
         */
        earth.M.rotate(earth_stat.revolving_angle, 0, 0, 1);
        earth.M.translate(6, 0, 0);
        
        // moon에서 earth를 기반으로 공전하기 위해 저장
        let earth_base = new Matrix4(earth.M);

        earth.M.rotate(earth_stat.rotating_angle,
                     -Math.sin(degree_to_rad(23.5)), 
                     0, Math.cos(degree_to_rad(23.5)));
        earth.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["gold"], V, P, earth_textures);
        
        moon.M = earth_base;
        moon.M.scale(0.6, 0.6, 0.6);
        moon.M.rotate(moon_stat.revolving_angle, 0, 0, 1);
        moon.M.translate(3.5, 0, 0);
        moon.M.rotate(moon_stat.rotating_angle, 0, 0, 1);
        moon.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["emerald"], V, P, moon_textures);

        // lower-left viewport
        gl.viewport(0, 0, canvas.width/2, canvas.height/2);
        earth.M.setTranslate(0, -4, 0);
        earth.M.rotate(earth_stat.rotating_angle, 
                    -Math.sin(degree_to_rad(23.5)), 
                    0, Math.cos(degree_to_rad(23.5)));
        earth.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["gold"], V_lower, P_lower, earth_textures);
        
        // lower-right viewport
        gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height/2)
        moon.M.setTranslate(0, -4, 0);
        moon.M.rotate(moon_stat.rotating_angle, 0, 0, 1);
        moon.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["emerald"], V_lower, P_lower, moon_textures);

        earth_stat.update_angle(elapsed);
        moon_stat.update_angle(elapsed);

        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };
    tick();
}

function initTextures(gl, img_src, tex_unit = 0) {
    // Create a texture object
    var texture = gl.createTexture();
    // Create the image object
    var image = new Image();

    // Register the event handler to be called when image loading is completed
    image.onload = function () { loadTexture(gl, texture, image, tex_unit); };
    // Tell the browser to load an Image
    image.src = img_src;

    return texture;
}

/**
 * texture_unit -> texture object를 가리키고 texture object는 image data를 가지고 있다.
 * 
 * 여기서 texture object에 미리 image 데이터를 올려두고, (bind 필요)
 * 각 행성에서 render 시 texture_unit이 해당 texture object를 선택하는 방식 (bind 필요)
 */
function loadTexture(gl, texture, image, tex_unit) {
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);  // Flip the image Y coordinate
    // Activate texture unit i
    gl.activeTexture(gl.TEXTURE0 + tex_unit);
    // Bind the texture object to the target
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    // Set the image data to texture object (memory -> VRAM)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
}