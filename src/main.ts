import {
  createTexture,
  createVBO,
  drawScene,
  initShaders,
  initWebGl,
} from './gl';
import { Matrix4 } from './math';

let gl: WebGLRenderingContext | null;
let shaderProgram: WebGLProgram | null;
let modelBuffer: WebGLBuffer | null;
let vertexAttribute: number | null;

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

function createMatrixForm(
  el: HTMLElement,
  initialMatrix: Matrix4 = Matrix4.identity()
) {
  let matrix = initialMatrix;

  let onChange: ((matrix: Matrix4) => void) | null = null;

  const getMatrix = () => matrix;

  const updateMatrixValue = (row: number, col: number, value: number) => {
    matrix.set(row, col, value);
  };

  const createMatrixElement = (row: number, col: number) => {
    const input = document.createElement('input');

    input.type = 'number';
    input.className = 'input';
    input.value = matrix.get(row, col).toString();
    input.addEventListener('input', () => {
      updateMatrixValue(row, col, parseFloat(input.value));

      if (onChange) {
        onChange(matrix);
      }
    });

    return input;
  };

  const setMatrix = (newMatrix: Matrix4) => {
    matrix = newMatrix;

    el.innerHTML = '';
    createForm();
  };

  const createForm = () => {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const div = document.createElement('div');
        div.className = 'cell matrix-row';
        div.appendChild(createMatrixElement(i, j));
        el.appendChild(div);
      }
    }
  };

  const onMatrixChange = (callback: (matrix: Matrix4) => void) => {
    onChange = callback;
  };

  createForm();

  return {
    getMatrix,
    onMatrixChange,
    setMatrix,
  };
}

const createProjectionForm = () => {
  const fovField = document.getElementById('projectionFov') as HTMLInputElement;
  const nearField = document.getElementById(
    'projectionZNear'
  ) as HTMLInputElement;
  const farField = document.getElementById(
    'projectionZFar'
  ) as HTMLInputElement;

  let onChange: (proj: Matrix4) => void = () => {};

  const updateProjection = () => {
    const fov = parseFloat(fovField.value);
    const near = parseFloat(nearField.value);
    const far = parseFloat(farField.value);

    onChange(Matrix4.perspective(fov, CANVAS_WIDTH / CANVAS_HEIGHT, near, far));
  };

  fovField.addEventListener('input', updateProjection);
  nearField.addEventListener('input', updateProjection);
  farField.addEventListener('input', updateProjection);

  fovField.value = '45';
  nearField.value = '0.1';
  farField.value = '100';

  return {
    onProjectionChange: (callback: (proj: Matrix4) => void) => {
      onChange = callback;
    },
    updateProjection,
  };
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

  shaderProgram = shadersResult?.shaderProgram;
  vertexAttribute = shadersResult?.vertexPositionAttribute;
  modelBuffer = createVBO(gl);

  const projectionForm = createMatrixForm(
    document.getElementById('projectionForm')!,
    Matrix4.perspective(45, 800 / 600, 0.1, 100)
  );
  const viewForm = createMatrixForm(document.getElementById('viewForm')!);
  const modelForm = createMatrixForm(
    document.getElementById('modelForm')!,
    Matrix4.translation(-5 / 2, -5 / 2, 0)
  );

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
  };

  projectionForm.onMatrixChange(renderVisualization);
  viewForm.onMatrixChange(renderVisualization);
  modelForm.onMatrixChange(renderVisualization);

  const projectionEditForm = createProjectionForm();

  projectionEditForm.onProjectionChange((proj) => {
    projectionForm.setMatrix(proj);
    renderVisualization();
  });

  renderVisualization();
}

init();
