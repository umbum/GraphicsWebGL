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


