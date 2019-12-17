/**
 * @author : 엄성범 (umbum.dev)
 * @since  : 2019-12-16
 */
"use strict";

function main()
{
	let canvas = document.getElementById('webgl');
	let gl = canvas.getContext("webgl2");

	gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.2, 0.2, 0.2, 1.0);
    
	let V = new Matrix4();
    V.setLookAt(6, 4, 6, 0, 0, 0, 0, 1, 0);

	let P = new Matrix4();
    P.setPerspective(60, (canvas.width / canvas.height) * 2, 1, 100); 
    const P_lower = new Matrix4();
    P_lower.setPerspective(60, (canvas.width / canvas.height), 1, 100);
    
	let list_shaders = [];

	// initializes shaders (reflection models)
	for(let model of ["Blinn-Gouraud", "Phong-Gouraud", "Blinn-Phong", "Phong-Phong"])
	{
		list_shaders[model] = new Shader(gl, 
			document.getElementById("vert-" + model).text,
			document.getElementById("frag-" + model).text,
			{aPosition:0, aNormal:1});
	}

	// initializes the material combobox
	let combo_mat = document.getElementById("materials");
	for(let matname in __js_materials)
	{
		let opt = document.createElement("option");
		opt.value = matname;
		opt.text = matname;
		combo_mat.add(opt, null);
	}
	combo_mat.selectedIndex = 10;

	// initializes two lights
	let list_lights = 
	[
		new Light
		(
			gl,
			[1.5, 1.5, 0, 1.0],		// position
			[0.1, 0.1, 0.1, 1.0],	// ambient
			[1.0, 1.0, 1.0, 1.0],	// diffusive
			[1.0, 1.0, 1.0, 1.0],	// specular
			false
		),
		new Light
		(
			gl,
			[, 1.5, 1.5, 1.0],
			[0.1, 0.1, 0.1, 1.0],
			[1.0, 1.0, 1.0, 1.0],
			[1.0, 1.0, 1.0, 1.0],
			false
		)
	];

	// initializes the meshes
	let list_meshes = [];
    let sun = create_mesh_sphere(gl, 100);
    sun.M.setScale(0.7, 0.7, 0.7);
    let earth = create_mesh_sphere(gl, 100);
    let moon = create_mesh_sphere(gl, 100);
    

	let axes = new Axes(gl);

	let t_last = Date.now();

	const ANGLE_STEP_LIGHT = 30.0;
	const ANGLE_STEP_MESH = 30.0;
	let tick = function()
	{
		let now = Date.now();
		let elapsed = now - t_last;
        t_last = now;
        
		list_lights[0].M.rotate(( (ANGLE_STEP_LIGHT * elapsed) / 1000.0) % 360.0, 0, 1, 0);
		if(document.getElementById("mesh-rotating").checked)
			list_meshes[document.getElementById("objects").value].M.rotate(
				-((ANGLE_STEP_MESH * elapsed) / 1000.0) % 360.0, 0, 1, 0);

		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        
        gl.viewport(0, canvas.height/2, canvas.width, canvas.height/2);

		axes.render(gl, V, P);
        
		for(let i in list_lights)
		{
			// for light state and render it
			list_lights[i].turn_on(document.getElementById('light' + i).checked);
			list_lights[i].set_type(document.getElementById('light' + i + "-type").value == "positional");
			list_lights[i].render(gl, V, P);
        }
        
		sun.render(gl, 
			list_shaders[document.getElementById("shading-models").value],
			list_lights,
			__js_materials["ruby"], V, P);
        
        earth.M.setScale(0.8, 0.8, 0.8);
        /**
         * rotate 후 translate : 공전
         * translate 후 rotate : 자전
         */
        earth.M.rotate((now*0.05) % 360.0, 0, 1, 0);
        earth.M.translate(6, 0, 0);
        
        // moon에서 earth를 기반으로 공전하기 위해 저장
        let earth_base = new Matrix4(earth.M);

        earth.M.rotate((now*0.1) % 360.0, 0, 1, 0);
        earth.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["gold"], V, P);
        
        moon.M = earth_base;
        moon.M.scale(0.6, 0.6, 0.6);
        moon.M.rotate((now*0.05) % 360.0, 0, 1, 0);
        moon.M.translate(3.5, 0, 0);
        moon.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["emerald"], V, P);

        // lower-left viewport
        gl.viewport(0, 0, canvas.width/2, canvas.height/2);
        earth.M.setScale(2, 2, 2);
        earth.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["gold"], V, P_lower);
        
        // lower-right viewport
        gl.viewport(canvas.width/2, 0, canvas.width/2, canvas.height/2)
        moon.M.setScale(2, 2 ,2);
        moon.render(gl, 
            list_shaders[document.getElementById("shading-models").value],
            list_lights,
            __js_materials["emerald"], V, P_lower);

		requestAnimationFrame(tick, canvas); // Request that the browser calls tick
	};
	tick();
}


