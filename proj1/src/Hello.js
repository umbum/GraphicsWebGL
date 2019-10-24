"use strict";    // use strict는 써주는 것이 좋겠지.
function main()
{
    let canvas = document.getElementById('webgl');
    let gl = canvas.getContext("webgl2");
    // context는 항상 소문자 gl로 한다.
    
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL'); return;
    }
    else {
        // WebGL에서는 0.0 ~ 1.0 까지의 실수 값으로 지정한다.
        gl.clearColor(1.0, 1.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        // buffer는 총 3개이고, 아래처럼 한 번에 clear할 수 있다.
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);  
    }
}