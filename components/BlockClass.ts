import * as THREE from "three";

// Block states (matching original Stack game)
const BLOCK_STATES = {
  ACTIVE: "active",
  STOPPED: "stopped",
  MISSED: "missed",
} as const;

type BlockState = (typeof BLOCK_STATES)[keyof typeof BLOCK_STATES];

// Interface for block dimensions
interface BlockDimensions {
  width: number;
  height: number;
  depth: number;
}

// Interface for block position
interface BlockPosition {
  x: number;
  y: number;
  z: number;
}

// Interface for return data from place() method
interface PlacementResult {
  plane: "x" | "z";
  direction: number;
  placed?: THREE.Mesh;
  chopped?: THREE.Mesh;
  bonus?: boolean;
}

class Block {
  // Constants
  private readonly MOVE_AMOUNT = 12; // Movement boundary

  // Properties
  public readonly index: number;
  public dimension: BlockDimensions;
  public position: BlockPosition;
  public state: BlockState;
  public mesh?: THREE.Mesh;
  public material?: THREE.MeshToonMaterial;
  public color?: THREE.Color | number;

  // Movement properties
  private readonly workingPlane: "x" | "z";
  private readonly workingDimension: "width" | "depth";
  private speed: number;
  private direction: number;
  private colorOffset: number;

  // Reference to previous block
  private targetBlock: Block | null;

  constructor(targetBlock: Block | null = null) {
    console.log(
      `Creating new block ${targetBlock ? targetBlock.index + 1 : 1}`
    );

    // Set target block reference
    this.targetBlock = targetBlock;

    // Calculate block index
    this.index = (this.targetBlock ? this.targetBlock.index : 0) + 1;

    // Determine working plane (alternates between X and Z axis)
    this.workingPlane = this.index % 2 ? "x" : "z";
    this.workingDimension = this.index % 2 ? "width" : "depth";

    console.log(`Block ${this.index}: Working plane = ${this.workingPlane}`);

    // Set dimensions from target block or defaults
    this.dimension = {
      width: this.targetBlock ? this.targetBlock.dimension.width : 10,
      height: this.targetBlock ? this.targetBlock.dimension.height : 2,
      depth: this.targetBlock ? this.targetBlock.dimension.depth : 10,
    };

    // Set position
    this.position = {
      x: this.targetBlock ? this.targetBlock.position.x : 0,
      y: this.dimension.height * this.index, // Stack vertically
      z: this.targetBlock ? this.targetBlock.position.z : 0,
    };

    // Color generation
    this.colorOffset = this.targetBlock
      ? this.targetBlock.colorOffset
      : Math.round(Math.random() * 100);
    this.generateColor();

    // Set initial state
    this.state = this.index > 1 ? BLOCK_STATES.ACTIVE : BLOCK_STATES.STOPPED;

    // Set movement speed (increases with each level)
    this.speed = -0.1 - this.index * 0.005;
    if (this.speed < -4) this.speed = -4; // Cap maximum speed
    this.direction = this.speed;

    // Set initial position for active blocks BEFORE creating mesh
    if (this.state === BLOCK_STATES.ACTIVE) {
      // Start just inside the boundary, not exactly at it
      this.position[this.workingPlane] =
        Math.random() > 0.5 ? this.MOVE_AMOUNT - 0.5 : -this.MOVE_AMOUNT + 0.5;
      console.log(
        `Block ${this.index} initial position set to ${this.workingPlane}=${
          this.position[this.workingPlane]
        }`
      );
    }

    // Create the Three.js mesh (now with correct position)
    this.createMesh();

    console.log(`Block ${this.index} created:`, {
      dimensions: this.dimension,
      position: this.position,
      state: this.state,
      workingPlane: this.workingPlane,
    });
  }

  // Generate block color (matching original algorithm)
  private generateColor(): void {
    if (!this.targetBlock) {
      // First block is dark
      this.color = 0x333344;
    } else {
      // Generate rainbow colors based on index + offset
      const offset = this.index + this.colorOffset;
      const r = Math.sin(0.3 * offset) * 55 + 400;
      const g = Math.sin(0.3 * offset + 2) * 55 + 200;
      const b = Math.sin(0.3 * offset + 4) * 55 + 200;
      this.color = new THREE.Color(r / 255, g / 255, b / 255);
    }
  }

  // Create the Three.js mesh
  private createMesh(): void {
    // Create geometry
    const geometry = new THREE.BoxGeometry(
      this.dimension.width,
      this.dimension.height,
      this.dimension.depth
    );

    // Don't translate geometry - keep blocks centered for proper positioning

    // Create material
    this.material = new THREE.MeshToonMaterial({
      color: this.color,
      // Note: THREE.FlatShading is deprecated, using default
    });

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);

    // Set mesh position (blocks are now centered)
    this.mesh.position.set(this.position.x, this.position.y, this.position.z);

    console.log(
      `Block ${this.index} mesh created at position:`,
      this.mesh.position
    );
  }

  // Reverse movement direction when hitting boundaries
  public reverseDirection(): void {
    const oldDirection = this.direction;
    this.direction = this.direction > 0 ? this.speed : Math.abs(this.speed);
    console.log(
      `Block ${this.index} reversed direction: ${oldDirection} -> ${this.direction} (speed=${this.speed})`
    );
  }

  // Main movement logic (called every frame)
  public tick(): void {
    if (this.state === BLOCK_STATES.ACTIVE) {
      const currentValue = this.position[this.workingPlane];

      // Debug logging to see if tick is being called
      // console.log(
      //   `Block ${this.index} tick: ${this.workingPlane}=${currentValue}, direction=${this.direction}`
      // );

      // Check boundaries and reverse if needed (use >= and <= to handle exact boundary values)
      if (
        currentValue >= this.MOVE_AMOUNT ||
        currentValue <= -this.MOVE_AMOUNT
      ) {
        this.reverseDirection();
      }

      // Update position
      this.position[this.workingPlane] += this.direction;

      // Update mesh position
      if (this.mesh) {
        this.mesh.position[this.workingPlane] =
          this.position[this.workingPlane];
        // console.log(
        //   `Block ${this.index} moved to ${this.workingPlane}=${
        //     this.position[this.workingPlane]
        //   }`
        // );
      } else {
        console.warn(`Mesh not initialized for block ${this.index}`);
      }
    } else {
      console.log(`Block ${this.index} tick called but state is ${this.state}`);
    }
  }

  // Block placement logic with cutting
  public place(): PlacementResult {
    console.log(`Placing block ${this.index}...`);

    this.state = BLOCK_STATES.STOPPED;

    if (!this.targetBlock) {
      // First block - just place it
      return {
        plane: this.workingPlane,
        direction: this.direction,
        placed: this.mesh,
      };
    }

    // Calculate overlap with target block
    let overlap =
      this.targetBlock.dimension[this.workingDimension] -
      Math.abs(
        this.position[this.workingPlane] -
          this.targetBlock.position[this.workingPlane]
      );

    const result: PlacementResult = {
      plane: this.workingPlane,
      direction: this.direction,
    };

    console.log(`Block ${this.index} overlap: ${overlap}`);

    // Check if block missed completely
    if (overlap <= 0) {
      console.log(`Block ${this.index} missed completely!`);
      this.state = BLOCK_STATES.MISSED;
      return result;
    }

    // Check for bonus (nearly perfect placement)
    if (this.dimension[this.workingDimension] - overlap < 0.3) {
      console.log(`Block ${this.index} bonus placement!`);
      overlap = this.dimension[this.workingDimension];
      result.bonus = true;

      // Snap to perfect position
      this.position.x = this.targetBlock.position.x;
      this.position.z = this.targetBlock.position.z;
      this.dimension.width = this.targetBlock.dimension.width;
      this.dimension.depth = this.targetBlock.dimension.depth;
    }

    // Create placed and chopped meshes
    if (overlap > 0) {
      // Calculate the actual overlap region boundaries
      const targetPos = this.targetBlock.position[this.workingPlane];
      const targetSize = this.targetBlock.dimension[this.workingDimension];
      const movingPos = this.position[this.workingPlane];
      const movingSize = this.dimension[this.workingDimension];

      // Calculate overlap region boundaries
      const targetMin = targetPos - targetSize / 2;
      const targetMax = targetPos + targetSize / 2;
      const movingMin = movingPos - movingSize / 2;
      const movingMax = movingPos + movingSize / 2;

      // The actual overlap region
      const overlapMin = Math.max(targetMin, movingMin);
      const overlapMax = Math.min(targetMax, movingMax);

      // Position the placed block at the center of the overlap region
      const placedPosition = (overlapMin + overlapMax) / 2;

      // Calculate chopped dimensions and position
      const choppedDimensions: BlockDimensions = {
        width: this.dimension.width,
        height: this.dimension.height,
        depth: this.dimension.depth,
      };
      choppedDimensions[this.workingDimension] -= overlap;

      // Update block dimensions to placed size
      this.dimension[this.workingDimension] = overlap;

      // Update the block's position to the placed position
      this.position[this.workingPlane] = placedPosition;

      // Create placed block geometry
      const placedGeometry = new THREE.BoxGeometry(
        this.dimension.width,
        this.dimension.height,
        this.dimension.depth
      );
      const placedMesh = new THREE.Mesh(placedGeometry, this.material);

      placedMesh.position.set(
        this.position.x,
        this.position.y,
        this.position.z
      );
      result.placed = placedMesh;

      // Create chopped block if not a bonus
      if (!result.bonus) {
        const choppedGeometry = new THREE.BoxGeometry(
          choppedDimensions.width,
          choppedDimensions.height,
          choppedDimensions.depth
        );
        const choppedMesh = new THREE.Mesh(choppedGeometry, this.material);

        // Calculate chopped block position (the part that was cut off)
        const choppedPosition: BlockPosition = {
          x: this.position.x,
          y: this.position.y,
          z: this.position.z,
        };

        // Position chopped block on the correct side of the overlap
        if (movingPos < targetPos) {
          // Moving block came from the left, chopped piece is on the left
          choppedPosition[this.workingPlane] =
            overlapMin - choppedDimensions[this.workingDimension] / 2;
        } else {
          // Moving block came from the right, chopped piece is on the right
          choppedPosition[this.workingPlane] =
            overlapMax + choppedDimensions[this.workingDimension] / 2;
        }

        choppedMesh.position.set(
          choppedPosition.x,
          choppedPosition.y,
          choppedPosition.z
        );
        result.chopped = choppedMesh;

        console.log(`Block ${this.index} chopped piece created`);
      }

      console.log(`Block ${this.index} placed successfully`);
    }

    return result;
  }

  // Cleanup method
  public dispose(): void {
    if (this.mesh?.geometry) {
      this.mesh.geometry.dispose();
    }
    if (this.material) {
      this.material.dispose();
    }
  }

  // Getters for accessing private properties
  public get STATES() {
    return BLOCK_STATES;
  }

  public get targetBlockRef() {
    return this.targetBlock;
  }
}

export default Block;
