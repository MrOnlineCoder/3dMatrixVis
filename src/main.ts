import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  createTexture,
  createVBO,
  drawScene,
  initShaders,
  initWebGl,
} from './gl';
import { Matrix4, Vector3 } from './math';

import hljs from 'highlight.js/lib/core';
import cppHljs from 'highlight.js/lib/languages/cpp';
import {
  createMatrixForm,
  createModelForm,
  createProjectionForm,
  createViewForm,
} from './ui';

hljs.registerLanguage('cpp', cppHljs);
hljs.configure({ languages: ['cpp'] });

let gl: WebGLRenderingContext | null;
let shaderProgram: WebGLProgram | null;
let modelBuffer: WebGLBuffer | null;
let vertexAttribute: number | null;

export const buildCppCode = (options: {
  translation: Vector3;
  scaling: Vector3;
  rotation: Vector3;
  order: string[];

  fov: number;
  near: number;
  far: number;

  eye: Vector3;
  center: Vector3;
  up: Vector3;
}) => {
  options.order.reverse();
  const multiplications = options.order.join(' * ');

  return `// Model Matrix
glm::vec3 rotation = {${options.rotation.x}, ${options.rotation.y}, ${options.rotation.z}};
glm::vec3 scale = {${options.scaling.x}, ${options.scaling.y}, ${options.scaling.z}};
glm::vec3 position = {${options.translation.x}, ${options.translation.y}, ${options.translation.z}};

glm::mat4 identity(1.0f);
glm::mat4 rotationX = glm::rotate(identity, glm::radians(rotation.x), Vector3(1.0f, 0.0f, 0.0f));
glm::mat4 rotationY = glm::rotate(identity, glm::radians(rotation.y), Vector3(0.0f, 1.0f, 0.0f));
glm::mat4 rotationZ = glm::rotate(identity, glm::radians(rotation.z), Vector3(0.0f, 0.0f, 1.0f));

glm::mat4 rotation = rotationZ * rotationY * rotationX;

glm::mat4 scaling = glm::scale(identity, scale);

glm::mat4 translation = glm::translate(identity, position);

glm::mat4 ModelMatrix = ${multiplications} * identity;

// View Matrix
glm::vec3 eye = {${options.eye.x}, ${options.eye.y}, ${options.eye.z}};
glm::vec3 center = {${options.center.x}, ${options.center.y}, ${options.center.z}};
glm::vec3 up = {${options.up.x}, ${options.up.y}, ${options.up.z}};
glm::mat4 ViewMatrix = glm::lookAt(
  eye, center, up
);

//Projection
float windowWidth = ${CANVAS_WIDTH}; // adjust this to your window size
float windowHeight = ${CANVAS_HEIGHT}; // adjust this to your window size
float aspectRatio = windowWidth / windowHeight; 
float zNear = ${options.near};
float zFar = ${options.far};
float fov = ${options.fov};
glm::mat4 ProjectionMatrix = glm::perspective(
  glm::radians(fov),
  aspectRation,
  zNear,
  zFar
);

// MVP
glm::mat4 MVP = ProjectionMatrix * ViewMatrix * ModelMatrix;`;
};

async function init() {
  const canvasElement = document.getElementById('gl');

  gl = initWebGl(canvasElement as HTMLCanvasElement);

  if (!gl) {
    alert('Unable to initialize WebGL. Your browser may not support it.');
    return;
  }

  const shadersResult = initShaders(gl);
  if (!shadersResult) {
    console.error('Could not initialize shaders');
    return;
  }

  const vectorTransformOutput = document.getElementById('vectorTransform');
  const cppCodeOutput = document.getElementById('cppCode');

  shaderProgram = shadersResult?.shaderProgram;
  vertexAttribute = shadersResult?.vertexPositionAttribute;
  modelBuffer = createVBO(gl);

  const projectionForm = createMatrixForm(
    document.getElementById('projectionForm')!,
    Matrix4.perspective(45, 800 / 600, 0.1, 100)
  );
  const viewForm = createMatrixForm(
    document.getElementById('viewForm')!,
    Matrix4.lookAt(new Vector3(0, 0, -5), new Vector3(), new Vector3(0, 1, 0))
  );
  const modelForm = createMatrixForm(
    document.getElementById('modelForm')!,
    Matrix4.translation(-5 / 2, -5 / 2, 0)
  );

  const modelResetButton = document.getElementById(
    'modelReset'
  ) as HTMLButtonElement;

  modelResetButton.onclick = () => {
    modelForm.setMatrix(Matrix4.translation(-5 / 2, -5 / 2, 0));
    modelEditForm.reset();
    renderVisualization();
  };

  const viewResetButton = document.getElementById(
    'viewReset'
  ) as HTMLButtonElement;

  viewResetButton.onclick = () => {
    viewForm.setMatrix(
      Matrix4.lookAt(new Vector3(0, 0, -5), new Vector3(), new Vector3(0, 1, 0))
    );
    viewEditForm.reset();
    renderVisualization();
  };

  const projectionResetButton = document.getElementById(
    'projectionReset'
  ) as HTMLButtonElement;

  projectionResetButton.onclick = () => {
    projectionForm.setMatrix(Matrix4.perspective(45, 800 / 600, 0.1, 100));
    projectionEditForm.reset();
    renderVisualization();
  };

  const texture = await createTexture(gl, './cube.png');

  const renderVisualization = () => {
    drawScene(
      gl!,
      shaderProgram!,
      vertexAttribute!,
      modelBuffer!,
      {
        modelMatrix: modelForm.getMatrix().toFloatArray(),
        viewMatrix: viewForm.getMatrix().toFloatArray(),
        projectionMatrix: projectionForm.getMatrix().toFloatArray(),
      },
      texture!
    );

    const origin = new Vector3(0, 0, 0);
    const unitVector = new Vector3(1, 1, 1);
    const MVP = projectionForm
      .getMatrix()
      .multiply(viewForm.getMatrix())
      .multiply(modelForm.getMatrix());
    const transformedOrigin = MVP.multiplyVector(origin);
    const transformedUnitVector = MVP.multiplyVector(unitVector);

    vectorTransformOutput!.innerHTML = `(0, 0, 0) ➡️ ${transformedOrigin.toString()}<br>(1, 1, 1) ➡️ ${transformedUnitVector.toString()}`;

    const cppCode = buildCppCode({
      center: viewEditForm.getCenter(),
      eye: viewEditForm.getEye(),
      far: projectionEditForm.getFar(),
      fov: projectionEditForm.getFov(),
      near: projectionEditForm.getNear(),
      order: modelEditForm.getOrder(),
      rotation: modelEditForm.getRotation(),
      scaling: modelEditForm.getScaling(),
      translation: modelEditForm.getTranslation(),
      up: viewEditForm.getUp(),
    });

    const highlighedCode = hljs.highlight(cppCode, {
      language: 'cpp',
    });

    cppCodeOutput!.innerHTML = highlighedCode.value;
  };

  projectionForm.onMatrixChange(renderVisualization);
  viewForm.onMatrixChange(renderVisualization);
  modelForm.onMatrixChange(renderVisualization);

  const projectionEditForm = createProjectionForm();

  projectionEditForm.onProjectionChange((proj) => {
    projectionForm.setMatrix(proj);
    renderVisualization();
  });

  const viewEditForm = createViewForm();
  viewEditForm.onViewChange((view) => {
    viewForm.setMatrix(view);
    renderVisualization();
  });

  const modelEditForm = createModelForm();
  modelEditForm.onModelChange((model) => {
    modelForm.setMatrix(model);
    renderVisualization();
  });

  renderVisualization();
}

init();
