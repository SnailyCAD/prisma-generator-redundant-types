import fs from "node:fs";
import path from "node:path";
import { format } from "prettier";

export async function writeFileSafely(writeLocation: string, content: string) {
  fs.mkdirSync(path.dirname(writeLocation), {
    recursive: true,
  });

  fs.writeFileSync(
    writeLocation,
    await format(content, {
      endOfLine: "auto",
      semi: true,
      trailingComma: "all",
      singleQuote: false,
      printWidth: 100,
      tabWidth: 2,
      parser: "typescript",
    }),
  );
}
