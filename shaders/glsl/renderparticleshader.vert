#ifdef GL_ES
precision highp float;
precision highp sampler2D;
#endif

uniform sampler2D particleData;
attribute vec2 particleUV;
varying vec4 color;


float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}


const float POINT_SIZE = -10.0;
void main(){
  vec2 p = texture2D(particleData, particleUV).xy;
  vec2 v = texture2D(particleData, particleUV).zw;
  gl_PointSize = max(1.4, POINT_SIZE - p.y * 10.0) * rand(particleUV.xy)*2.0;
  float speed = length(v);
  float x = clamp(speed * 2.0, 0., 1.);
  gl_Position = vec4(p.x + (rand(particleUV.xy)-0.5)*(x*x/50.),
                     p.y + (rand(particleUV.yx)-0.5)*(x*x/50.), 0, 1.0);
    // color.rgb = (
    //            mix(vec3(0.4, 60.0, 35.0) / 300.0,
    //                vec3(0.2, 47.8, 100) / 100.0,
    //                x)
    //            + (vec3(63.1, 92.5, 100) / 100.)
    //            * x*x*x * .2);

    color.rgb = ( mix(vec3(30.0, 50.0, 30.0) / 300.0, vec3(60.0, 90.0, 160.0) / 100.0, x) + (vec3(63.1, 92.5, 100) / 100.)  * x*x*x   * .2 );
    color.a = 1.0;
  /* color = vec4(1., 1., 1., x*x*x); */
}
