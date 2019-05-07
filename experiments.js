var gl =  snow_modules_opengl_web_GL.gl;
var gpu_fluid_main = window.gpu_fluid_main;

function deleteShaderProgram (shader) {
    gl.deleteProgram(shader._prog);
}

var tex = gl.createTexture();

gl.bindTexture(gl.TEXTURE_2D, tex);

//gltoolbox_shaders_Resample.instance._active

function reveal (xs) {
    var xs = Array.prototype.slice.call(xs);
    return xs.flat().flatMap((x)=>{
        if (typeof x == "function") return x();
        else return x;
    }).flat();
}

function findObjectsOfClass (root, className) {
    return findObjectsOfClassInner(root, className, []).flat();
}

function findObjectsOfClassInner(root, className, looked) {
    if (looked.indexOf(root) > -1) return []; //cycle detection
    looked.push(root);
    return Object.entries(root).map(([key,val]) => {
        if (val && typeof val === "object") {
            console.log(val.constructor.name);
            if (val.constructor.name == className)
                return [{val: val, parent: root}];
            else
                return ()=> findObjectsOfClassInner(val, className, looked);
        } else if (typeof val == className)
            return [{val: val, parent: root}];
        else return [];
    });
}

var xs = findObjectsOfClass(gpu_fluid_main, "Float32Array");
xs = reveal(xs);

gpu_fluid_main.fluid.advectShader.foo = new Float32Array([0,0,0]);


function randomArray (w, h) {
    var arr = [];
    for (var i=0; i < w; i++)
        for (var j = 0; j < h; j++)
            arr[Math.floor(i*h+j)] = Math.random() *256;
    return arr;
}

var advect = gpu_fluid_main.fluid.applyForcesShader;

var fvrt = {width:256,height:256};
tex.my_name = "hello";
gl.bindTexture(gl.TEXTURE_2D, tex);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fvrt.width, fvrt.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array.from(randomArray(fvrt.width, fvrt.height)));
gpu_fluid_main.fluid.divergenceRenderTarget.textureFactory = function (width, height) {
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(3553,10241,9728);
    gl.texParameteri(3553,10240,9728);
    gl.texParameteri(3553,10242,33071);
    gl.texParameteri(3553,10243,33071);
    gl.pixelStorei(3317,4);
    gl.pixelStorei(37440,true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, 5126, Float32Array.from(randomArray(width*3, height*3)));
    gl.bindTexture(gl.TEXTURE_2D, null);
    return tex;
};
gpu_fluid_main.fluid.pressureRenderTarget.resize(gpu_fluid_main.fluid.width,gpu_fluid_main.fluid.height);


gpu_fluid_main.mouseFluid.set(100,100);



gl.activeTexture(gl.TEXTURE0);

gl.uniform1i(divergence._uniforms[2].location, 0);


var resp = await fetch("shaders/glsl/mouseforceshader.frag");
gpu_fluid_main.mouseForceShader._fragSource = await resp.text();
gpu_fluid_main.mouseForceShader.create();
