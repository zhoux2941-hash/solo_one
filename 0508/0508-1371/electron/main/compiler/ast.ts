export type ASTNodeType =
  | 'Program'
  | 'DelayNode'
  | 'StringNode'
  | 'KeyNode'
  | 'MouseMoveNode'
  | 'MouseClickNode'
  | 'RepeatNode'
  | 'IfOSNode'
  | 'VarNode'
  | 'IncludeNode'
  | 'AssignmentNode';

export type OSType = 'windows' | 'mac' | 'linux';

export type ModifierKey = 'ctrl' | 'alt' | 'shift' | 'cmd' | 'win' | 'meta';

export interface BaseNode {
  type: ASTNodeType;
  line: number;
  column: number;
}

export interface ProgramNode extends BaseNode {
  type: 'Program';
  body: ASTNode[];
}

export interface DelayNode extends BaseNode {
  type: 'DelayNode';
  value: number;
  unit: 'ms' | 's';
}

export interface StringNode extends BaseNode {
  type: 'StringNode';
  value: string;
}

export interface KeyNode extends BaseNode {
  type: 'KeyNode';
  key: string;
  modifiers: ModifierKey[];
}

export interface MouseMoveNode extends BaseNode {
  type: 'MouseMoveNode';
  x: number | 'current';
  y: number | 'current';
  relative: boolean;
}

export interface MouseClickNode extends BaseNode {
  type: 'MouseClickNode';
  button: 'left' | 'right' | 'middle';
  double: boolean;
}

export interface RepeatNode extends BaseNode {
  type: 'RepeatNode';
  count: number | 'infinite';
  body: ASTNode[];
}

export interface IfOSNode extends BaseNode {
  type: 'IfOSNode';
  os: OSType[];
  consequent: ASTNode[];
  alternate: ASTNode[] | null;
}

export interface VarNode extends BaseNode {
  type: 'VarNode';
  name: string;
}

export interface AssignmentNode extends BaseNode {
  type: 'AssignmentNode';
  name: string;
  value: string | number;
}

export interface IncludeNode extends BaseNode {
  type: 'IncludeNode';
  path: string;
}

export type ASTNode =
  | ProgramNode
  | DelayNode
  | StringNode
  | KeyNode
  | MouseMoveNode
  | MouseClickNode
  | RepeatNode
  | IfOSNode
  | VarNode
  | AssignmentNode
  | IncludeNode;

export interface DSLWarning {
  line: number;
  column: number;
  message: string;
}

export interface DSLError {
  line: number;
  column: number;
  message: string;
}

export interface DSLAnalysisResult {
  ast: ProgramNode | null;
  errors: DSLError[];
  warnings: DSLWarning[];
  variables: Map<string, string | number>;
  includes: string[];
}
