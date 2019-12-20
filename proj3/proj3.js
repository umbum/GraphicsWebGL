/**
 * @author : 엄성범 (umbum.dev)
 * @since  : 2019-12-16
 */
"use strict";

/////////////////////////////////////////////////////////////////////////
////////////////////////////// Classes //////////////////////////////////
/////////////////////////////////////////////////////////////////////////

class Shader
{
	constructor(gl, src_vert, src_frag)
	{
		initShaders(gl, src_vert, src_frag);
		this.h_prog = gl.program;
	}
}

class Material
{
	constructor(ambient, diffusive, specular, shininess)
	{
		this.ambient = new Vector3(ambient);
		this.diffusive = new Vector3(diffusive);
		this.specular = new Vector3(specular);
		this.shininess = shininess;
	}
}

var __js_materials = 
{
	moon	  		: new Material([0.0215,0.1745,0.0215],		[0.07568,0.61424,0.07568],		[0.633,0.727811,0.633],				0.6),
	sun  			: new Material([0.1745,0.01175,0.01175],	[0.61424,0.04136,0.04136],		[0.727811,0.626959,0.626959],		0.6),
	earth  			: new Material([0.24725,0.1995,0.0745],		[0.75164,0.60648,0.22648],		[0.628281,0.555802,0.366065],		0.4),
};


class Axes
{
	constructor(gl, length=2)
	{
		this.MVP = new Matrix4();
		if(!Axes.shader)
			Axes.shader = new Shader(gl, Axes.src_shader_vert, Axes.src_shader_frag,);
		this.init_vbo(gl,length);
	}
	init_vbo(gl,l)
	{
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

		var vertices = new Float32Array([
			0,0,0, 1,0,0,
			l,0,0, 1,0,0,
			0,0,0, 0,1,0,
			0,l,0, 0,1,0,
			0,0,0, 0,0,1,
			0,0,l, 0,0,1,
		]);
		var vbo = gl.createBuffer();  
		gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
		gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

		var SZ = vertices.BYTES_PER_ELEMENT;

        gl.vertexAttribPointer(Axes.loc_aPosition, 3, gl.FLOAT, false, SZ*6, 0);
        gl.enableVertexAttribArray(Axes.loc_aPosition);

        gl.vertexAttribPointer(Axes.loc_aColor, 3, gl.FLOAT, false, SZ*6, SZ*3);
        gl.enableVertexAttribArray(Axes.loc_aColor);


        gl.bindVertexArray(null);
		gl.bindBuffer(gl.ARRAY_BUFFER, null);
	}
	set_uniform_matrices(gl, h_prog, V, P)
	{
		this.MVP.set(P);
		this.MVP.multiply(V);
		gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP.elements);
	}
	render(gl, V, P)
	{
		gl.useProgram(Axes.shader.h_prog);
        gl.bindVertexArray(this.vao);
		this.set_uniform_matrices(gl, Axes.shader.h_prog, V, P);

		gl.drawArrays(gl.LINES, 0, 6);
        gl.bindVertexArray(null);
		gl.useProgram(null);
	}
}

Axes.loc_aPosition = 5;
Axes.loc_aColor = 9;

Axes.src_shader_vert = 
`#version 300 es
layout(location=${Axes.loc_aPosition}) in vec4 aPosition;
layout(location=${Axes.loc_aColor}) in vec4 aColor;
uniform mat4 MVP;
out vec4 vColor;
void main()
{
    gl_Position = MVP * aPosition;
    vColor = aColor;
}
`;
Axes.src_shader_frag = 
`#version 300 es
#ifdef GL_ES
precision mediump float;
#endif
in vec4 vColor;
out vec4 fColor;
void main()
{
    fColor = vColor;
}
`;

Axes.shader = null;

class Mesh
{
    constructor(gl, vao, draw_call, draw_mode, n, index_buffer_type)
    {
        this.vao = vao;
        this.name = "";
        this.draw_call = draw_call;
        this.draw_mode = draw_mode;
        this.n = n;
        this.index_buffer_type = index_buffer_type;
        this.M = new Matrix4();
        this.MV = new Matrix4();
        this.MVP = new Matrix4();
        this.N = new Matrix4();
        this.id = -1;
        if(!Mesh.shader_id)
            Mesh.shader_id = new Shader(gl, Mesh.src_shader_id_vert, Mesh.src_shader_id_frag);
    }
    init_from_json_js(gl, json_obj)
    {
        const loc_aPosition = 0;
        const loc_aNormal = 1;
        const loc_aTexCoord = 2;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        let attributes = json_obj.data.attributes;
        
        let buf_position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes.position.array), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(loc_aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(loc_aPosition);
        
        let buf_normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf_normal);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(attributes.normal.array), gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(loc_aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(loc_aNormal);
        
        let buf_index = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_index);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(json_obj.data.index.array), gl.STATIC_DRAW);
        
        this.draw_call = "drawElements";
        this.draw_mode = gl.TRIANGLES;
        this.n = json_obj.data.index.array.length;
        this.index_buffer_type = gl.UNSIGNED_SHORT;
        
        gl.bindVertexArray(null);
    }
    init_from_THREE_geometry(gl, geom)
    {
        const loc_aPosition = 0;
        const loc_aNormal = 1;
        const loc_aTexCoord = 2;

        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);
        
        let position = geom.attributes.position;
        let normal = geom.attributes.normal;
        
        let buf_normal = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf_normal);
        gl.bufferData(gl.ARRAY_BUFFER, normal.array, gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(loc_aNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(loc_aNormal);
        
        let buf_position = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
        gl.bufferData(gl.ARRAY_BUFFER, position.array, gl.STATIC_DRAW);
        
        gl.vertexAttribPointer(loc_aPosition, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(loc_aPosition);
        
        if(geom.attributes.uv != undefined)
        {
            let buf_texcoord = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, buf_texcoord);
            gl.bufferData(gl.ARRAY_BUFFER, geom.attributes.uv.array, gl.STATIC_DRAW);
            gl.vertexAttribPointer(loc_aTexCoord, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(loc_aTexCoord);
        }
        if(geom.index)
        {
            this.draw_call = "drawElements";
            let buf_index = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_index);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geom.index.array, gl.STATIC_DRAW);
            this.n = geom.index.array.length;
            this.index_buffer_type = gl.UNSIGNED_SHORT;
        }
        else
        {
            this.draw_call = "drawArrays";
            this.n = geom.attributes.position.count;
        }
        this.draw_mode = gl.TRIANGLES;
        
        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    set_uniform_matrices(gl, h_prog, V, P)
    {
        this.MV.set(V);
        this.MV.multiply(this.M);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MV"), false, this.MV.elements);
        this.MVP.set(P);
        this.MVP.multiply(this.MV);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP.elements);
        this.MVP.set(V);
        this.MVP.multiply(this.M);
        this.N.setInverseOf(this.MVP);
        this.N.transpose();
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "matNormal"), false, this.N.elements);
    }
    set_uniform_lights(gl, h_prog, lights, V)
    {
        let MV = new Matrix4();
        let i = 0;
        for(let name in lights)
        {
            let light = lights[name];
            MV.set(V);
            MV.multiply(light.M);
            gl.uniform4fv(gl.getUniformLocation(h_prog, "light[" + i + "].position"), 
                (MV.multiplyVector4(light.position)).elements);
            gl.uniform3fv(gl.getUniformLocation(h_prog, "light[" + i + "].ambient"), light.ambient.elements);
            gl.uniform3fv(gl.getUniformLocation(h_prog, "light[" + i + "].diffuse"), light.diffusive.elements);
            gl.uniform3fv(gl.getUniformLocation(h_prog, "light[" + i + "].specular"), light.specular.elements);
            gl.uniform1i(gl.getUniformLocation(h_prog, "light[" + i + "].enabled"), light.enabled);
            gl.uniform4fv(gl.getUniformLocation(h_prog, "light[" + i + "].direction"), MV.multiplyVector4(light.direction).elements);
            gl.uniform1f(gl.getUniformLocation(h_prog, "light[" + i + "].cutoff_angle"), Math.cos(light.cutoff_angle*Math.PI/180.0));
            i++;
        }
    }
    set_uniform_material(gl, h_prog, mat)
    {
        gl.uniform3fv(gl.getUniformLocation(h_prog, "material.ambient"), mat.ambient.elements);
        gl.uniform3fv(gl.getUniformLocation(h_prog, "material.diffuse"), mat.diffusive.elements);
        gl.uniform3fv(gl.getUniformLocation(h_prog, "material.specular"), mat.specular.elements);
        gl.uniform1f(gl.getUniformLocation(h_prog, "material.shininess"), mat.shininess*128.0);
    }
    set_uniform_texture(gl, h_prog, textures)
    {
        let i=0;
        for(let texname in textures)
        {
            gl.activeTexture(gl.TEXTURE0 + i);
            gl.bindTexture(gl.TEXTURE_2D, textures[texname]);
            // gl.bindTexture(gl.TEXTURE_2D, textures[texname].texid);
            gl.uniform1i(gl.getUniformLocation(h_prog, texname), i);
            i++;
        }
    }
    render(gl, shader, lights, material, V, P, textures = null)
    {
        gl.useProgram(shader.h_prog);
        gl.bindVertexArray(this.vao);
        
        this.set_uniform_matrices(gl, shader.h_prog, V, P);
        if(lights)	this.set_uniform_lights(gl, shader.h_prog, lights, V);
        if(material)	this.set_uniform_material(gl, shader.h_prog, material);
        if(textures)	this.set_uniform_texture(gl, shader.h_prog, textures);
        if(this.draw_call == "drawArrays") gl.drawArrays(this.draw_mode, 0, this.n);
        else if(this.draw_call == "drawElements") gl.drawElements(this.draw_mode, this.n, this.index_buffer_type, 0);
        
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
    
    render_id(gl, V, P)
    {
        let	h_prog = Mesh.shader_id.h_prog;
        gl.useProgram(h_prog);
        gl.bindVertexArray(this.vao);
        
        this.MVP.set(P);
        this.MVP.multiply(V);
        this.MVP.multiply(this.M);
        gl.uniformMatrix4fv(gl.getUniformLocation(h_prog, "MVP"), false, this.MVP.elements);
        
        gl.uniform1i(gl.getUniformLocation(h_prog, "u_id"), this.id);
        
        if(this.draw_call == "drawArrays") gl.drawArrays(this.draw_mode, 0, this.n);
        else if(this.draw_call == "drawElements") gl.drawElements(this.draw_mode, this.n, this.index_buffer_type, 0);
        
        gl.bindVertexArray(null);
        gl.useProgram(null);
    }
}

// static properties
Mesh.src_shader_id_vert =
`#version 300 es
layout(location=0) in vec4 aPosition;
uniform mat4 MVP;
uniform int  u_id;
out vec4 v_Color;
void main()
{
    gl_Position = MVP * aPosition;
    v_Color = vec4(float(u_id)/256.0, 0.0, 0.0, 1.0);
}
`;

Mesh.src_shader_id_frag =
`#version 300 es
#ifdef GL_ES
precision mediump float;
#endif
in vec4 v_Color;
out vec4 fColor;
void main() {
    fColor = v_Color;
}
`;

Mesh.shader_id = null;

class Light
{
	constructor(gl, position, ambient, diffusive, specular, enabled, cutoff_angle = 180, direction = [0,0,0])
	{
		this.position = new Vector4(position);
		this.ambient = new Vector3(ambient);
		this.diffusive = new Vector3(diffusive);
		this.specular = new Vector3(specular);
		this.enabled = enabled;
		this.M = new Matrix4();
		this.MVP = new Matrix4();
		this.direction = new Vector4([direction[0], direction[1], direction[2], 0.0]);
		this.cutoff_angle = cutoff_angle;

		if(!Light.shader)
			Light.shader = new Shader(gl, Light.src_shader_vert, Light.src_shader_frag);
	}
	set_type(positional)
	{
		if(positional)	this.position.elements[3] = 1.0;
		else			this.position.elements[3] = 0.0;
	}
	turn_on(enabled)
	{
		this.enabled = enabled;
	}
	render(gl, V, P)
	{

		gl.useProgram(Light.shader.h_prog);
		this.MVP.set(P); this.MVP.multiply(V);
		gl.uniformMatrix4fv(gl.getUniformLocation(Light.shader.h_prog, "MVP"), false, this.MVP.elements);
		gl.vertexAttrib4fv(Light.loc_aPosition, this.M.multiplyVector4(this.position).elements);
		if(this.enabled)	gl.vertexAttrib3f(Light.loc_aColor, 1, 1, 1);
		else				gl.vertexAttrib3f(Light.loc_aColor, .1, .1, .1);
		gl.drawArrays(gl.POINTS, 0, 1);
		gl.useProgram(null);
	}
}

Light.loc_aPosition = 3;
Light.loc_aColor = 8;

Light.src_shader_vert = 
`#version 300 es
	layout(location=${Light.loc_aPosition}) in vec4 aPosition;
	layout(location=${Light.loc_aColor}) in vec4 aColor;
	uniform mat4 MVP;
	out vec4 vColor;
	void main()
	{
		gl_Position = MVP * vec4(aPosition.xyz, 1);
		gl_PointSize = 10.0;
		vColor = aColor;
	}
`;
Light.src_shader_frag = 
`#version 300 es
	#ifdef GL_ES
	precision mediump float;
	#endif
	in vec4 vColor;
    out vec4 fColor;
	void main()
	{
		fColor = vColor;
	}
`;


Light.shader = null;

// http://rodger.global-linguist.com/webgl/ch08/PointLightedSphere.js
// modifies to follow the notations in http://mathworld.wolfram.com/SphericalCoordinates.html
"use strict";
function create_mesh_sphere(gl, SPHERE_DIV, loc_aPosition=0, loc_aNormal=1, loc_aTexCoord=2) 
{ // Create a sphere
    let vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    let i;
    let j;
    let phi, sin_phi, cos_phi;
    let theta, sin_theta, cos_theta;
    let u, v;
    let p1, p2;
    
    let positions = [];
    let texcoords = [];
    let indices = [];
    
    // Generate coordinates
    for (j = 0; j <= SPHERE_DIV; j++)
    {
        v = 1.0 - j/SPHERE_DIV;
        phi = (1.0-v) * Math.PI;
        sin_phi = Math.sin(phi);
        cos_phi = Math.cos(phi);
        for (i = 0; i <= SPHERE_DIV; i++)
        {
            u = i/SPHERE_DIV;
            theta = u * 2 * Math.PI;
            sin_theta = Math.sin(theta);
            cos_theta = Math.cos(theta);
            
            positions.push(cos_theta * sin_phi);  // x
            positions.push(sin_theta * sin_phi);  // y
            positions.push(cos_phi);       // z

            texcoords.push(u);
            texcoords.push(v);
        }
    }
    
    // Generate indices
    for (j = 0; j < SPHERE_DIV; j++)
    {
        for (i = 0; i < SPHERE_DIV; i++)
        {
            p1 = j * (SPHERE_DIV+1) + i;
            p2 = p1 + (SPHERE_DIV+1);
            
            indices.push(p1);
            indices.push(p2);
            indices.push(p1 + 1);
            
            indices.push(p1 + 1);
            indices.push(p2);
            indices.push(p2 + 1);
        }
    }
    
    let buf_position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf_position);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(loc_aPosition, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc_aPosition);

    let buf_texcoord = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf_texcoord);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
 
    gl.vertexAttribPointer(loc_aTexCoord, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc_aTexCoord);
    
    let buf_normal = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf_normal);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    
    gl.vertexAttribPointer(loc_aNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(loc_aNormal);

    let buf_index = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buf_index);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    
    gl.bindVertexArray(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    
    return new Mesh(gl, vao, "drawElements", gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT); 
}


//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////


class PlanetStatus {
    constructor(name) {
        this._rotating_speed_DOM  = document.getElementById(`${name}-rotating`);
        this._revolving_speed_DOM = document.getElementById(`${name}-revolving`);
        this._height_DOM = document.getElementById(`${name}-height`);
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

    get height() {
        return parseInt(this._height_DOM.value) / 100;
    }
    
    update_angle(elapsed) {
        this._rotating_angle  = (this._rotating_angle + (this.rotating_speed*elapsed)/1000.0) % 360.0;
        this._revolving_angle = (this._revolving_angle + (this.revolving_speed*elapsed)/1000.0) % 360.0;
    }
}

function degree_to_rad(degree) {
    return degree * Math.PI / 180;
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
    
    // initializes shaders (reflection models)
    const shader = new Shader(gl, 
        document.getElementById("vert-Blinn-Phong").text,
        document.getElementById("frag-Blinn-Phong").text,
        {aPosition:0, aNormal:1});

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
    
    const earth_stat = new PlanetStatus("earth");
    const moon_stat  = new PlanetStatus("moon");

    const sun_textures = {
        "tex_color": initTextures(gl, '../resources/2k_sun.jpg', 0)
    };

    const earth_textures = {
        "tex_color": initTextures(gl, '../resources/earthmap1k.jpg', 0),
        "tex_disp": initTextures(gl, '../resources/earthbump1k.jpg', 1),
        "tex_specular": initTextures(gl, '../resources/earthspec1k.jpg', 2),
    };

    const moon_textures = {
        "tex_color": initTextures(gl, '../resources/moonmap1k.jpg', 0),
        "tex_disp": initTextures(gl, '../resources/moonbump1k.jpg', 1),
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
        
        gl.useProgram(shader.h_prog);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "shading"), false);
        sun.render(gl, 
            shader,
            list_lights,
            __js_materials["sun"], V, P, sun_textures);
        
        gl.useProgram(shader.h_prog);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "shading"), true);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "specular_map"), true);
        gl.uniform1f(gl.getUniformLocation(shader.h_prog, "disp_scale"), earth_stat.height);
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
            shader,
            list_lights,
            __js_materials["earth"], V, P, earth_textures);
        
        gl.useProgram(shader.h_prog);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "specular_map"), false);
        gl.uniform1f(gl.getUniformLocation(shader.h_prog, "disp_scale"), moon_stat.height);
        moon.M = earth_base;
        moon.M.scale(0.6, 0.6, 0.6);
        moon.M.rotate(moon_stat.revolving_angle, 0, 0, 1);
        moon.M.translate(3.5, 0, 0);
        moon.M.rotate(moon_stat.rotating_angle, 0, 0, 1);
        moon.render(gl, 
            shader,
            list_lights,
            __js_materials["moon"], V, P, moon_textures);


        // lower-left viewport
        gl.viewport(0, 0, canvas.width/2, canvas.height/2);
        gl.useProgram(shader.h_prog);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "specular_map"), true);
        gl.uniform1f(gl.getUniformLocation(shader.h_prog, "disp_scale"), earth_stat.height);
        earth.M.setTranslate(0, -4, 0);
        earth.M.rotate(earth_stat.rotating_angle, 
                    -Math.sin(degree_to_rad(23.5)), 
                    0, Math.cos(degree_to_rad(23.5)));
        earth.render(gl, 
            shader,
            list_lights,
            __js_materials["earth"], V_lower, P_lower, earth_textures);
        
        // lower-right viewport
        gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height/2)
        gl.useProgram(shader.h_prog);
        gl.uniform1i(gl.getUniformLocation(shader.h_prog, "specular_map"), false);
        gl.uniform1f(gl.getUniformLocation(shader.h_prog, "disp_scale"), moon_stat.height);
        moon.M.setTranslate(0, -4, 0);
        moon.M.rotate(moon_stat.rotating_angle, 0, 0, 1);
        moon.render(gl, 
            shader,
            list_lights,
            __js_materials["moon"], V_lower, P_lower, moon_textures);

        earth_stat.update_angle(elapsed);
        moon_stat.update_angle(elapsed);

        requestAnimationFrame(tick, canvas); // Request that the browser calls tick
    };
    tick();
}