import {
  createTexture,
  createVBO,
  drawScene,
  initShaders,
  initWebGl,
} from './gl';
import { Matrix4, Vector3 } from './math';

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

const createVectorForm = (el: HTMLElement, initialValue: Vector3) => {
  let vector = initialValue;

  let onChange: (newVector: Vector3) => void = () => {};

  const onVectorChange = (callback: (newVector: Vector3) => void) => {
    onChange = callback;
  };

  const createField = (name: string, key: 'x' | 'y' | 'z') => {
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'input';
    input.placeholder = name;
    input.value = vector[key].toString();
    input.addEventListener('input', () => {
      vector[key] = parseFloat(input.value);
      onChange(vector);
    });

    return input;
  };

  const xField = createField('X', 'x');
  const yField = createField('Y', 'y');
  const zField = createField('Z', 'z');

  el.appendChild(xField);
  el.appendChild(yField);
  el.appendChild(zField);

  return {
    onVectorChange,
    getVector: () => vector,
  };
};

function createViewForm() {
  const eyeForm = createVectorForm(
    document.getElementById('viewCameraPosition')!,
    new Vector3(0, 0, -5)
  );
  const centerForm = createVectorForm(
    document.getElementById('viewCenterPosition')!,
    new Vector3(0, 0, 0)
  );
  const upForm = createVectorForm(
    document.getElementById('viewWorldUp')!,
    new Vector3(0, 1, 0)
  );

  let onChange: (view: Matrix4) => void = () => {};

  const onViewChange = (callback: (view: Matrix4) => void) => {
    onChange = callback;
  };

  const updateView = () => {
    const eye = eyeForm.getVector();
    const center = centerForm.getVector();
    const up = upForm.getVector();

    onChange(Matrix4.lookAt(eye, center, up));
  };

  eyeForm.onVectorChange(updateView);
  centerForm.onVectorChange(updateView);
  upForm.onVectorChange(updateView);

  return {
    onViewChange,
    updateView,
  };
}

function createModelForm() {
  const translationForm = createVectorForm(
    document.getElementById('modelTranslation')!,
    new Vector3(-2.5, -2.5, 0)
  );
  const scalingForm = createVectorForm(
    document.getElementById('modelScaling')!,
    new Vector3(1, 1, 1)
  );
  const rotationForm = createVectorForm(
    document.getElementById('modelRotation')!,
    new Vector3(0, 0, 0)
  );

  let orderString = 'translation,scaling,rotationX,rotationY,rotationZ';

  const orderField = document.getElementById('modelOrder') as HTMLSelectElement;
  orderField.value = orderString;
  orderField.onchange = () => {
    orderString = orderField.value;
    updateModel();
  };

  let onChange: (model: Matrix4) => void = () => {};

  const onModelChange = (callback: (model: Matrix4) => void) => {
    onChange = callback;
  };

  const updateModel = () => {
    const translation = translationForm.getVector();
    const scaling = scalingForm.getVector();
    const rotation = rotationForm.getVector();

    const matrices = {
      translation: Matrix4.translation(
        translation.x,
        translation.y,
        translation.z
      ),
      scaling: Matrix4.scaling(scaling.x, scaling.y, scaling.z),
      rotationX: Matrix4.rotationX(rotation.x),
      rotationY: Matrix4.rotationY(rotation.y),
      rotationZ: Matrix4.rotationZ(rotation.z),
    };

    const order = orderString.split(',');

    let base = Matrix4.identity();

    for (let i = 0; i < order.length; i++) {
      base = base.multiply((matrices as any)[order[i]]);
    }

    onChange(base);
  };

  translationForm.onVectorChange(updateModel);
  scalingForm.onVectorChange(updateModel);
  rotationForm.onVectorChange(updateModel);

  return {
    onModelChange,
    updateModel,
  };
}

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
  const viewForm = createMatrixForm(
    document.getElementById('viewForm')!,
    Matrix4.lookAt(new Vector3(0, 0, -5), new Vector3(), new Vector3(0, 1, 0))
  );
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
