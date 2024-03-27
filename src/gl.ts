import { FRAGMENT_SHADER_SOURCE, VERTEX_SHADER_SOURCE } from './shaders';

const cubeSize = 5;

const cubeVertices = [
  // Front face
  0.0,
  0.0,
  0.0,
  cubeSize,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,

  0.0,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  0.0,
  cubeSize,
  0.0,

  // Left face
  0.0,
  0.0,
  0.0,
  0.0,
  cubeSize,
  0.0,
  0.0,
  cubeSize,
  cubeSize,

  0.0,
  0.0,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  0.0,
  cubeSize,

  // Bottom face
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,

  0.0,
  0.0,
  0.0,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  0.0,

  // Right face
  cubeSize,
  0.0,
  0.0,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,
  cubeSize,
  cubeSize,

  cubeSize,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  cubeSize,
  cubeSize,
  cubeSize,
  0.0,

  // Top face
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,

  cubeSize,
  cubeSize,
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,
  0.0,

  // Back face
  0.0,
  0.0,
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,
  cubeSize,
  cubeSize,

  0.0,
  0.0,
  cubeSize,
  cubeSize,
  cubeSize,
  cubeSize,
  0.0,
  cubeSize,
  cubeSize,
];

const cubeTextureCoordinates = [
  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,

  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,

  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,

  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,

  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,

  0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0,
];

export function initWebGl(canvas: HTMLCanvasElement) {
  let gl: WebGLRenderingContext | null = null;

  try {
    gl = canvas.getContext('webgl');
  } catch (e) {}

  if (!gl) {
    return null;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  return gl;
}

export function initShaders(gl: WebGLRenderingContext) {
  const shaderProgram = gl.createProgram();

  if (!shaderProgram) {
    return null;
  }

  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

  if (!vertexShader || !fragmentShader) {
    return null;
  }

  gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error(
      'An error occurred compiling the shaders: ' +
        gl.getShaderInfoLog(vertexShader)
    );
    return null;
  }

  gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error(
      'An error occurred compiling the shaders: ' +
        gl.getShaderInfoLog(fragmentShader)
    );
    return null;
  }

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error('Could not initialize shaders');
    return null;
  }

  gl.useProgram(shaderProgram);
  glCheck(gl);

  const vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    'aVertexPosition'
  );
  gl.enableVertexAttribArray(vertexPositionAttribute);
  const textureCoordAttribute = gl.getAttribLocation(
    shaderProgram,
    'aTextureCoord'
  );
  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.enableVertexAttribArray(textureCoordAttribute);
  glCheck(gl);
  return { shaderProgram, vertexPositionAttribute, textureCoordAttribute };
}

export function createVBO(gl: WebGLRenderingContext) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  glCheck(gl);

  const concatedVertices: number[] = [];
  let tt = 0;

  for (let i = 0; i < cubeVertices.length; i += 3) {
    concatedVertices.push(cubeVertices[i]);
    concatedVertices.push(cubeVertices[i + 1]);
    concatedVertices.push(cubeVertices[i + 2]);
    concatedVertices.push(cubeTextureCoordinates[tt]);
    concatedVertices.push(cubeTextureCoordinates[tt + 1]);
    tt += 2;
  }

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(concatedVertices),
    gl.STATIC_DRAW
  );
  glCheck(gl);
  return buffer;
}

export interface SceneMatrices {
  modelMatrix: Float32Array;
  viewMatrix: Float32Array;
  projectionMatrix: Float32Array;
}

export function setMatrixUniform(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  name: string,
  matrix: Float32Array
) {
  const pUniform = gl.getUniformLocation(program, name);
  if (pUniform) gl.uniformMatrix4fv(pUniform, false, matrix);
  glCheck(gl);
}

export function drawScene(
  gl: WebGLRenderingContext,
  shaderProgram: WebGLProgram,
  vertexPositionAttribute: number,
  buffer: WebGLBuffer,
  matrices: SceneMatrices,
  texture?: WebGLTexture
) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);

  const stride = 4 * 5;

  console.log(matrices);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  glCheck(gl);
  gl.vertexAttribPointer(
    vertexPositionAttribute,
    3,
    gl.FLOAT,
    false,
    stride,
    0
  );
  gl.enableVertexAttribArray(vertexPositionAttribute);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * 4);
  gl.enableVertexAttribArray(1);
  glCheck(gl);
  gl.useProgram(shaderProgram);
  setMatrixUniform(gl, shaderProgram, 'uMMatrix', matrices.modelMatrix);
  setMatrixUniform(gl, shaderProgram, 'uVMatrix', matrices.viewMatrix);
  setMatrixUniform(gl, shaderProgram, 'uPMatrix', matrices.projectionMatrix);
  glCheck(gl);

  if (texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  gl.drawArrays(gl.TRIANGLES, 0, cubeVertices.length / 3);
  glCheck(gl);
}

function glCheck(gl: WebGLRenderingContext) {
  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error('GL error: ' + error);
  }
}

export async function createTexture(gl: WebGLRenderingContext, url: string) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(
    gl.TEXTURE_2D,
    level,
    internalFormat,
    width,
    height,
    border,
    srcFormat,
    srcType,
    pixel
  );

  return new Promise((resolve) => {
    const image = new Image();
    image.onload = function () {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        srcFormat,
        srcType,
        image
      );

      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      resolve(texture);
    };
    image.src = url;
  });
}
