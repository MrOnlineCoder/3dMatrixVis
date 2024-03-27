import { CANVAS_HEIGHT, CANVAS_WIDTH } from './gl';
import { Matrix4, Vector3 } from './math';

export function createMatrixForm(
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

export const createProjectionForm = () => {
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

  fovField.addEventListener('change', updateProjection);
  nearField.addEventListener('change', updateProjection);
  farField.addEventListener('change', updateProjection);

  fovField.value = '45';
  nearField.value = '0.1';
  farField.value = '100';

  return {
    onProjectionChange: (callback: (proj: Matrix4) => void) => {
      onChange = callback;
    },
    updateProjection,
    getFov: () => parseFloat(fovField.value),
    getNear: () => parseFloat(nearField.value),
    getFar: () => parseFloat(farField.value),
    reset: () => {
      fovField.value = '45';
      nearField.value = '0.1';
      farField.value = '100';
      updateProjection();
    },
  };
};

export const createVectorForm = (el: HTMLElement, initialValue: Vector3) => {
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
    setVector: (newVector: Vector3) => {
      vector = newVector;
      xField.value = newVector.x.toString();
      yField.value = newVector.y.toString();
      zField.value = newVector.z.toString();
    },
  };
};

export function createViewForm() {
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
    getEye: () => eyeForm.getVector(),
    getCenter: () => centerForm.getVector(),
    getUp: () => upForm.getVector(),
    reset: () => {
      eyeForm.setVector(new Vector3(0, 0, -5));
      centerForm.setVector(new Vector3(0, 0, 0));
      upForm.setVector(new Vector3(0, 1, 0));
    },
  };
}

export function createModelForm() {
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
    getOrder: () => orderString.split(','),
    getRotation: () => rotationForm.getVector(),
    getScaling: () => scalingForm.getVector(),
    getTranslation: () => translationForm.getVector(),
    reset: () => {
      translationForm.setVector(new Vector3(-2.5, -2.5, 0));
      scalingForm.setVector(new Vector3(1, 1, 1));
      rotationForm.setVector(new Vector3(0, 0, 0));
    },
  };
}
