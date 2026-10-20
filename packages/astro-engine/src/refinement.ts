import type { AstroResult } from "@sukara/astro-schema";

type ScalarEvaluator = (milliseconds: number) => Promise<AstroResult<number>>;

export async function refineBracket(
  leftMilliseconds: number,
  rightMilliseconds: number,
  leftValue: number,
  rightValue: number,
  evaluate: ScalarEvaluator,
  toleranceMilliseconds: number,
  maxIterations: number,
): Promise<AstroResult<number>> {
  if (leftValue === 0) return { ok: true, value: leftMilliseconds };
  if (rightValue === 0) return { ok: true, value: rightMilliseconds };
  if (Math.sign(leftValue) === Math.sign(rightValue)) {
    return {
      ok: false,
      error: {
        code: "internal-failure",
        message: "Root refinement requires a bracketed crossing",
        retryable: false,
      },
    };
  }
  let leftMs = leftMilliseconds;
  let rightMs = rightMilliseconds;
  let left = leftValue;
  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    if (rightMs - leftMs <= toleranceMilliseconds)
      return { ok: true, value: Math.round((leftMs + rightMs) / 2) };
    const midpoint = (leftMs + rightMs) / 2;
    const middle = await evaluate(midpoint);
    if (!middle.ok) return middle;
    if (middle.value === 0) return { ok: true, value: Math.round(midpoint) };
    if (Math.sign(middle.value) === Math.sign(left)) {
      leftMs = midpoint;
      left = middle.value;
    } else {
      rightMs = midpoint;
    }
  }
  return {
    ok: false,
    error: {
      code: "search-exhausted",
      message: "Exact-time refinement exceeded its iteration bound",
      retryable: false,
    },
  };
}
