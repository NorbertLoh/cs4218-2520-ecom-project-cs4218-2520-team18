import fs from "fs";
import path from "path";

const CODERABBIT_YAML_PATH = path.resolve(process.cwd(), ".coderabbit.yaml");

/**
 * Lightweight parser for the specific .coderabbit.yaml structure.
 * Returns a structured object representing the config.
 */
function parseCodeRabbitYaml(content) {
  const lines = content.split("\n");
  const config = { reviews: { path_instructions: [] } };

  let currentPathEntry = null;
  let inInstructions = false;
  let instructionIndent = -1;
  let instructionLines = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();

    // Detect the 'profile' field
    const profileMatch = trimmed.match(/^\s+profile:\s+"?([^"]+)"?\s*$/);
    if (profileMatch) {
      config.reviews.profile = profileMatch[1].replace(/"/g, "").trim();
      continue;
    }

    // Detect start of a new path_instructions entry
    const pathMatch = trimmed.match(/^\s+- path:\s+"?([^"]+)"?\s*$/);
    if (pathMatch) {
      if (currentPathEntry && instructionLines.length > 0) {
        currentPathEntry.instructions = instructionLines.join("\n").trim();
        instructionLines = [];
      }
      currentPathEntry = { path: pathMatch[1].replace(/"/g, "").trim(), instructions: "" };
      config.reviews.path_instructions.push(currentPathEntry);
      inInstructions = false;
      instructionIndent = -1;
      continue;
    }

    // Detect 'instructions: |' block scalar start
    const instrStart = trimmed.match(/^\s+instructions:\s*\|/);
    if (instrStart) {
      inInstructions = true;
      instructionIndent = raw.search(/\S/); // indent of "instructions" key
      instructionLines = [];
      continue;
    }

    // Collect instruction lines
    if (inInstructions && currentPathEntry) {
      const lineIndent = raw.search(/\S/);
      // A line belongs to the block if it's indented more than instructionIndent, or is blank
      if (trimmed === "" || (lineIndent > instructionIndent)) {
        instructionLines.push(trimmed);
      } else {
        // End of block scalar
        currentPathEntry.instructions = instructionLines.join("\n").trim();
        instructionLines = [];
        inInstructions = false;
      }
    }
  }

  // Flush last entry
  if (currentPathEntry && instructionLines.length > 0) {
    currentPathEntry.instructions = instructionLines.join("\n").trim();
  }

  return config;
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

let fileContent;
let config;

beforeAll(() => {
  fileContent = fs.readFileSync(CODERABBIT_YAML_PATH, "utf8");
  config = parseCodeRabbitYaml(fileContent);
});

// ─── Test suite ──────────────────────────────────────────────────────────────

describe(".coderabbit.yaml – file existence and readability", () => {
  test("file exists at the repository root", () => {
    expect(fs.existsSync(CODERABBIT_YAML_PATH)).toBe(true);
  });

  test("file is non-empty", () => {
    expect(fileContent.trim().length).toBeGreaterThan(0);
  });

  test("file content is a valid string", () => {
    expect(typeof fileContent).toBe("string");
  });
});

describe(".coderabbit.yaml – top-level structure", () => {
  test("has a top-level 'reviews' key", () => {
    expect(fileContent).toMatch(/^reviews:/m);
  });

  test("parsed config contains a 'reviews' object", () => {
    expect(config).toHaveProperty("reviews");
    expect(typeof config.reviews).toBe("object");
  });
});

describe(".coderabbit.yaml – reviews.profile", () => {
  test("profile field is present", () => {
    expect(fileContent).toMatch(/profile:/);
  });

  test("profile is set to 'assertive'", () => {
    expect(config.reviews.profile).toBe("assertive");
  });

  test("profile value is a known valid CodeRabbit profile", () => {
    const validProfiles = ["assertive", "chill", "balanced"];
    expect(validProfiles).toContain(config.reviews.profile);
  });

  test("profile value is a non-empty string", () => {
    expect(config.reviews.profile.length).toBeGreaterThan(0);
  });
});

describe(".coderabbit.yaml – reviews.path_instructions structure", () => {
  test("path_instructions key is present in the file", () => {
    expect(fileContent).toMatch(/path_instructions:/);
  });

  test("path_instructions is an array", () => {
    expect(Array.isArray(config.reviews.path_instructions)).toBe(true);
  });

  test("path_instructions contains exactly 3 entries", () => {
    expect(config.reviews.path_instructions).toHaveLength(3);
  });

  test("every path_instructions entry has a 'path' property", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry).toHaveProperty("path");
      expect(typeof entry.path).toBe("string");
    });
  });

  test("every path_instructions entry has a non-empty 'path'", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry.path.trim().length).toBeGreaterThan(0);
    });
  });

  test("every path_instructions entry has an 'instructions' property", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry).toHaveProperty("instructions");
      expect(typeof entry.instructions).toBe("string");
    });
  });

  test("every path_instructions entry has non-trivial instructions (> 50 chars)", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry.instructions.length).toBeGreaterThan(50);
    });
  });

  test("all path_instructions paths are distinct (no duplicates)", () => {
    const paths = config.reviews.path_instructions.map((e) => e.path);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });
});

describe(".coderabbit.yaml – path_instructions glob patterns", () => {
  let paths;

  beforeAll(() => {
    paths = config.reviews.path_instructions.map((e) => e.path);
  });

  test("includes an instruction block for 'src/**'", () => {
    expect(paths).toContain("src/**");
  });

  test("includes an instruction block for 'controllers/**'", () => {
    expect(paths).toContain("controllers/**");
  });

  test("includes an instruction block for 'models/**'", () => {
    expect(paths).toContain("models/**");
  });

  test("every path pattern uses glob wildcard syntax ('**')", () => {
    paths.forEach((p) => {
      expect(p).toContain("**");
    });
  });

  test("every path pattern ends with '/**'", () => {
    paths.forEach((p) => {
      expect(p).toMatch(/\/\*\*$/);
    });
  });
});

describe(".coderabbit.yaml – src/** instruction content", () => {
  let srcInstructions;

  beforeAll(() => {
    const srcEntry = config.reviews.path_instructions.find(
      (e) => e.path === "src/**"
    );
    srcInstructions = srcEntry ? srcEntry.instructions : "";
  });

  test("src/** instructions mention Jest for unit testing", () => {
    expect(srcInstructions).toMatch(/Jest/i);
  });

  test("src/** instructions mention Boundary Value Analysis (BVA)", () => {
    expect(srcInstructions).toMatch(/Boundary Value Analysis/i);
  });

  test("src/** instructions mention Equivalence Partitioning (EP)", () => {
    expect(srcInstructions).toMatch(/Equivalence Partitioning/i);
  });

  test("src/** instructions mention integration tests", () => {
    expect(srcInstructions).toMatch(/integration/i);
  });

  test("src/** instructions mention Supertest for HTTP/API testing", () => {
    expect(srcInstructions).toMatch(/Supertest/i);
  });

  test("src/** instructions mention E2E tests", () => {
    expect(srcInstructions).toMatch(/E2E/i);
  });

  test("src/** instructions mention Playwright for E2E coverage", () => {
    expect(srcInstructions).toMatch(/Playwright/i);
  });

  test("src/** instructions mention Arrange-Act-Assert structure", () => {
    expect(srcInstructions).toMatch(/Arrange-Act-Assert/i);
  });

  test("src/** instructions mention min and max boundary values", () => {
    expect(srcInstructions).toMatch(/\bmin\b/i);
    expect(srcInstructions).toMatch(/\bmax\b/i);
  });

  test("src/** instructions mention status codes for integration tests", () => {
    expect(srcInstructions).toMatch(/status codes/i);
  });
});

describe(".coderabbit.yaml – controllers/** instruction content", () => {
  let ctrlInstructions;

  beforeAll(() => {
    const ctrlEntry = config.reviews.path_instructions.find(
      (e) => e.path === "controllers/**"
    );
    ctrlInstructions = ctrlEntry ? ctrlEntry.instructions : "";
  });

  test("controllers/** instructions mention request validation", () => {
    expect(ctrlInstructions).toMatch(/[Rr]equest validation/i);
  });

  test("controllers/** instructions mention status codes", () => {
    expect(ctrlInstructions).toMatch(/status codes/i);
  });

  test("controllers/** instructions mention response payload", () => {
    expect(ctrlInstructions).toMatch(/response/i);
  });

  test("controllers/** instructions mention service or model dependencies", () => {
    expect(ctrlInstructions).toMatch(/service|model/i);
  });
});

describe(".coderabbit.yaml – models/** instruction content", () => {
  let modelInstructions;

  beforeAll(() => {
    const modelEntry = config.reviews.path_instructions.find(
      (e) => e.path === "models/**"
    );
    modelInstructions = modelEntry ? modelEntry.instructions : "";
  });

  test("models/** instructions mention validation rules", () => {
    expect(modelInstructions).toMatch(/[Vv]alidation/i);
  });

  test("models/** instructions mention boundary constraints", () => {
    expect(modelInstructions).toMatch(/boundary/i);
  });

  test("models/** instructions mention error handling", () => {
    expect(modelInstructions).toMatch(/error/i);
  });

  test("models/** instructions mention query behavior", () => {
    expect(modelInstructions).toMatch(/[Qq]uery/i);
  });

  test("models/** instructions mention persistence or data layer", () => {
    expect(modelInstructions).toMatch(/[Pp]ersistence|data/i);
  });
});

describe(".coderabbit.yaml – regression and negative cases", () => {
  test("profile is NOT an empty string (regression: blank profile)", () => {
    expect(config.reviews.profile).not.toBe("");
  });

  test("profile is NOT null or undefined", () => {
    expect(config.reviews.profile).not.toBeNull();
    expect(config.reviews.profile).not.toBeUndefined();
  });

  test("path_instructions is NOT empty (regression: accidentally cleared list)", () => {
    expect(config.reviews.path_instructions.length).toBeGreaterThan(0);
  });

  test("path_instructions does NOT contain an entry with an empty path", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry.path).not.toBe("");
    });
  });

  test("path_instructions does NOT contain an entry with blank instructions", () => {
    config.reviews.path_instructions.forEach((entry) => {
      expect(entry.instructions.trim()).not.toBe("");
    });
  });

  test("file does not contain Windows-style CRLF line endings", () => {
    expect(fileContent).not.toMatch(/\r\n/);
  });

  test("file does not use tabs for indentation (YAML requires spaces)", () => {
    const linesWithTabs = fileContent
      .split("\n")
      .filter((line) => /^\t/.test(line));
    expect(linesWithTabs).toHaveLength(0);
  });
});