export const FRAGMENT_SHADER_SOURCE = `
varying highp vec2 vTextureCoord;

uniform sampler2D uSampler;

void main(void) {
    gl_FragColor = texture2D(uSampler, vTextureCoord) * vec4(1.0, 1.0, 1.0, 1.0);
}`;

export const VERTEX_SHADER_SOURCE = `
  attribute vec3 aVertexPosition;
  attribute vec2 aTextureCoord;

  uniform mat4 uMMatrix;
  uniform mat4 uPMatrix;
  uniform mat4 uVMatrix;

  varying highp vec2 vTextureCoord;

  void main(void) {
    gl_Position = uPMatrix * uVMatrix * uMMatrix * vec4(aVertexPosition, 1.0);
    vTextureCoord = aTextureCoord;
  }`;
