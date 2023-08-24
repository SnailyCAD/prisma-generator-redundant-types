import { generatorHandler, GeneratorOptions } from "@prisma/generator-helper";
import path from "node:path";

import { writeFileSafely } from "./utils/utils";
import { GENERATOR_NAME } from "./constants";

generatorHandler({
  onManifest() {
    return {
      requiresGenerators: ["prisma-client-js"],
      prettyName: GENERATOR_NAME,
    };
  },
  onGenerate: async (options: GeneratorOptions) => {
    let modelStr = "";

    options.dmmf.datamodel.models.forEach((model) => {
      const type = `export interface ${model.name} {
        ${model.fields
          .filter((v) => ["scalar", "enum"].includes(v.kind))
          .map((field) => {
            const typeScriptType = getTypeScriptType(field.type);
            const nullable = field.isRequired ? "" : "| null";
            const list = field.isList ? "[]" : "";

            return `${field.name}: ${typeScriptType}${nullable}${list}`;
          })
          .join("\n")}
      }`;

      modelStr += `${type}\n\n`;
    });

    options.dmmf.datamodel.enums.forEach((enumType) => {
      const type = `export const ${enumType.name} = {
        ${enumType.values
          .map((value) => {
            return `${value.name}: "${value.name}",`;
          })
          .join("\n")}
      } as const;

export type ${enumType.name} = (typeof ${enumType.name})[keyof typeof ${enumType.name}];`;

      modelStr += `${type}\n\n`;
    });

    const outputDir = options.generator.output?.value;
    if (!outputDir) {
      throw new Error("No output directory specified");
    }

    await writeFileSafely(path.join(outputDir, "index.ts"), modelStr);
  },
});

function getTypeScriptType(type: string) {
  switch (type) {
    case "Decimal":
    case "Int":
    case "Float":
    case "BigInt": {
      return "number";
    }
    case "DateTime": {
      return "Date";
    }
    case "Boolean": {
      return "boolean";
    }
    case "Json": {
      return "any";
    }
    case "String": {
      return "string";
    }
    default: {
      return type;
    }
  }
}
