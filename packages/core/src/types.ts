export type ProjectType = "cli" | "library" | "http_server" | "unknown";
export type RunMode = "existing" | "generated";
export type TestStatus = "pass" | "fail" | "skip";

export interface SuitenerConfig {
  target?: string;
  include?: string[];
  exclude?: string[];
}

export interface ResolvedSuitenerConfig {
  root: string;
  target: string;
  include: string[];
  exclude: string[];
}

export interface ScannedFile {
  path: string;
  relativePath: string;
  kind: "source" | "test" | "manifest" | "other";
}

export interface TestCommand {
  command: string;
  args: string[];
  display: string;
  runtime: "bun" | "go" | "cargo" | "shell";
}

export interface ProjectIntrospection {
  name: string;
  root: string;
  target: string;
  projectType: ProjectType;
  files: ScannedFile[];
  testFiles: ScannedFile[];
  packageJson?: Record<string, unknown>;
  testCommand?: TestCommand;
  indicators: string[];
  config: ResolvedSuitenerConfig;
}

export interface TestResult {
  name: string;
  status: TestStatus;
  duration_ms: number;
  error?: string;
}

export interface SuitenerResult {
  run_id: string;
  project_name: string;
  target: string;
  project_type: ProjectType;
  mode: RunMode;
  summary: {
    total: number;
    passed: number;
    failed: number;
    duration_ms: number;
  };
  tests: TestResult[];
  paths?: {
    run: string;
    latest: string;
  };
  generated_files?: string[];
  raw_output?: {
    stdout: string;
    stderr: string;
    exit_code: number | null;
    command?: string;
  };
}

export interface Detector<T> {
  name: string;
  detect(project: ProjectIntrospection): T | Promise<T>;
}

export interface Runner {
  name: string;
  run(project: ProjectIntrospection): Promise<SuitenerResult>;
}

export interface WrapOptions {
  cwd?: string;
  json?: boolean;
  onTestComplete?: (result: SuitenerResult) => void;
}
