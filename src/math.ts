export class Vector3 {
  constructor(public x = 0, public y = 0, public z = 0) {}

  add(other: Vector3): Vector3 {
    return new Vector3(this.x + other.x, this.y + other.y, this.z + other.z);
  }

  subtract(other: Vector3): Vector3 {
    return new Vector3(this.x - other.x, this.y - other.y, this.z - other.z);
  }

  multiply(scalar: number): Vector3 {
    return new Vector3(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  divide(scalar: number): Vector3 {
    return new Vector3(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  dot(other: Vector3): number {
    return this.x * other.x + this.y * other.y + this.z * other.z;
  }

  cross(other: Vector3): Vector3 {
    return new Vector3(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x
    );
  }

  length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Vector3 {
    return this.divide(this.length());
  }
}

export class Matrix4 {
  private cols: number[][];

  constructor() {
    this.cols = [
      [1, 0, 0, 0],
      [0, 1, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 0, 1],
    ];
  }

  set(row: number, col: number, value: number) {
    this.cols[col][row] = value;
  }

  get(row: number, col: number): number {
    return this.cols[col][row];
  }

  multiply(other: Matrix4): Matrix4 {
    const result = new Matrix4();

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        result.cols[i][j] = 0;

        for (let k = 0; k < 4; k++) {
          result.cols[i][j] += this.cols[i][k] * other.cols[k][j];
        }
      }
    }

    return result;
  }

  toFloatArray(): Float32Array {
    return new Float32Array(this.cols.flat());
  }

  static identity(): Matrix4 {
    return new Matrix4();
  }

  static translation(x: number, y: number, z: number): Matrix4 {
    const result = new Matrix4();

    result.cols[3][0] = x;
    result.cols[3][1] = y;
    result.cols[3][2] = z;

    return result;
  }

  static scaling(x: number, y: number, z: number): Matrix4 {
    const result = new Matrix4();

    result.cols[0][0] = x;
    result.cols[1][1] = y;
    result.cols[2][2] = z;

    return result;
  }

  static rotationX(angle: number): Matrix4 {
    const result = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    result.cols[1][1] = c;
    result.cols[1][2] = -s;
    result.cols[2][1] = s;
    result.cols[2][2] = c;

    return result;
  }

  static rotationY(angle: number): Matrix4 {
    const result = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    result.cols[0][0] = c;
    result.cols[0][2] = s;
    result.cols[2][0] = -s;
    result.cols[2][2] = c;

    return result;
  }

  static rotationZ(angle: number): Matrix4 {
    const result = new Matrix4();
    const c = Math.cos(angle);
    const s = Math.sin(angle);

    result.cols[0][0] = c;
    result.cols[0][1] = -s;
    result.cols[1][0] = s;
    result.cols[1][1] = c;

    return result;
  }

  static perspective(
    fov: number,
    aspect: number,
    near: number,
    far: number
  ): Matrix4 {
    const result = new Matrix4();
    const f = 1.0 / Math.tan(fov / 2.0);

    result.cols[0][0] = f / aspect;
    result.cols[1][1] = f;
    result.cols[2][2] = (far + near) / (near - far);
    result.cols[3][2] = (2 * far * near) / (near - far);
    result.cols[2][3] = -1;

    return result;
  }

  static lookAt(eye: Vector3, center: Vector3, up: Vector3): Matrix4 {
    const result = new Matrix4();
    const f = center.subtract(eye).normalize();
    const s = f.cross(up).normalize();
    const u = s.cross(f);

    result.cols[0][0] = s.x;
    result.cols[0][1] = u.x;
    result.cols[0][2] = -f.x;
    result.cols[0][3] = 0;
    result.cols[1][0] = s.y;
    result.cols[1][1] = u.y;
    result.cols[1][2] = -f.y;
    result.cols[1][3] = 0;
    result.cols[2][0] = s.z;
    result.cols[2][1] = u.z;
    result.cols[2][2] = -f.z;
    result.cols[2][3] = 0;
    result.cols[3][0] = -s.dot(eye);
    result.cols[3][1] = -u.dot(eye);
    result.cols[3][2] = f.dot(eye);
    result.cols[3][3] = 1;

    return result;
  }
}
