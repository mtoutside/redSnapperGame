#ifdef GL_ES
precision highp float;
precision highp sampler2D;
#endif

#define PRESSURE_BOUNDARY
#define VELOCITY_BOUNDARY

uniform vec2 invresolution;
uniform float aspectRatio;

vec2 clipToAspectSpace(vec2 p){
  return vec2(p.x * aspectRatio, p.y);
}

vec2 aspectToTexelSpace(vec2 p){
  return vec2(p.x / aspectRatio + 1.0 , p.y + 1.0)*.5;
}

float samplePressue(sampler2D pressure, vec2 coord){
  vec2 cellOffset = vec2(0.0, 0.0);

#ifdef PRESSURE_BOUNDARY
  if(coord.x < 0.0)      cellOffset.x = 1.0;
  else if(coord.x > 1.0) cellOffset.x = -1.0;
  if(coord.y < 0.0)      cellOffset.y = 1.0;
  else if(coord.y > 1.0) cellOffset.y = -1.0;
#endif

  return texture2D(pressure, coord + cellOffset * invresolution).x;
}


vec2 sampleVelocity(sampler2D velocity, vec2 coord){
  vec2 cellOffset = vec2(0.0, 0.0);
  vec2 multiplier = vec2(1.0, 1.0);

#ifdef VELOCITY_BOUNDARY
  if(coord.x<0.0){
    cellOffset.x = 1.0;
    multiplier.x = -1.0;
  }else if(coord.x>1.0){
    cellOffset.x = -1.0;
    multiplier.x = -1.0;
  }
  if(coord.y<0.0){
    cellOffset.y = 1.0;
    multiplier.y = -1.0;
  }else if(coord.y>1.0){
    cellOffset.y = -1.0;
    multiplier.y = -1.0;
  }
#endif

  return multiplier * texture2D(velocity, coord + cellOffset * invresolution).xy;
}

uniform sampler2D velocity;
uniform float dt;
uniform float dx;

varying vec2 texelCoord;
varying vec2 p;


float distanceToSegment(vec2 a, vec2 b, vec2 p, out float fp){
  vec2 d = p - a;
  vec2 x = b - a;

  fp = 0.0;
  float lx = length(x);

  if(lx <= 0.0001) return length(d);

  float projection = dot(d, x / lx);

  fp = projection / lx;

  if(projection < 0.0)            return length(d);
  else if(projection > length(x)) return length(p - b);
  return sqrt(abs(dot(d,d) - projection*projection));
}
float distanceToSegment(vec2 a, vec2 b, vec2 p){
  float fp;
  return distanceToSegment(a, b, p, fp);
}
uniform bool isMouseDown;
uniform vec2 mouse;
uniform vec2 lastMouse;
void main(){
  vec2 v = texture2D(velocity, texelCoord).xy;
  if (texelCoord.y > 0.2 && texelCoord.y < 0.22
      || texelCoord.y > 0.8 && texelCoord.y < 0.82){
    v += vec2(0.2,0);
  }
  v.xy *= 0.999;
  if(isMouseDown){
    vec2 mouseVelocity = -(lastMouse - mouse)/dt;



    float projection;
    float l = distanceToSegment(mouse, lastMouse, p, projection);
    float taperFactor = 0.6;
    float projectedFraction = 1.0 - clamp(projection, 0.0, 1.0)*taperFactor;
    float R = 0.015;
    float m = exp(-l/R);
    m *= projectedFraction * projectedFraction;
    vec2 targetVelocity = mouseVelocity * dx * 1.4;
    v += (targetVelocity - v)*m;
  }
  gl_FragColor = vec4(v, 0, 1.);
}
