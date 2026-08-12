/**
 * WebGL2 probe used before mounting the R3F canvas.
 *
 * Three.js r163+ and @react-three/postprocessing read
 * `gl.getContextAttributes().alpha`. A context can exist while that call
 * still returns null (lost context, software GL, embedded browsers), which
 * throws TypeError. The probe must reject that case and release the test
 * context so the real canvas is not starved.
 */

export const WEBGL_CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: true,
  powerPreference: "high-performance",
  failIfMajorPerformanceCaveat: false,
} as const satisfies WebGLContextAttributes;

export function isUsableWebGL2Context(
  gl: unknown,
): gl is WebGL2RenderingContext {
  if (typeof WebGL2RenderingContext === "undefined") {
    return false;
  }
  if (!(gl instanceof WebGL2RenderingContext)) {
    return false;
  }

  try {
    const attrs = gl.getContextAttributes();
    return attrs !== null && typeof attrs.alpha === "boolean";
  } catch {
    return false;
  }
}

function releaseWebGLContext(gl: WebGL2RenderingContext): void {
  gl.getExtension("WEBGL_lose_context")?.loseContext();
}

/**
 * Detect WebGL2 availability before mounting the R3F canvas.
 * Must run in the browser only. Always releases the probe context.
 */
export function detectWebGLSupport(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  let gl: WebGL2RenderingContext | null = null;
  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2", WEBGL_CONTEXT_ATTRIBUTES);
    if (
      typeof WebGL2RenderingContext !== "undefined" &&
      context instanceof WebGL2RenderingContext
    ) {
      gl = context;
    }
    return isUsableWebGL2Context(gl);
  } catch {
    return false;
  } finally {
    if (gl) {
      releaseWebGLContext(gl);
    }
  }
}
