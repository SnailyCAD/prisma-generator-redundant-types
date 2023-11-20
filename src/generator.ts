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
    let exportedTypes = "";
    const dataModel = options.dmmf.datamodel;

    // Convert Prisma models to TypeScript interfaces
    for (const model of dataModel.models) {
      exportedTypes += `export interface ${model.name} {\n`;

      // Only convert fields with kind "scalar" and "enum
      const scalarAndEnumFields = model.fields.filter((field) =>
        ["scalar", "enum"].includes(field.kind),
      );

      for (const field of scalarAndEnumFields) {
        // A utility function to convert Prisma types to TypeScript types
        // We'll create this function later.
        const typeScriptType = getTypeScriptType(field.type);
        // Whether the field should be optional
        const nullability = field.isRequired ? "" : "| null";
        // Whether the field should be an array
        const list = field.isList ? "[]" : "";

        exportedTypes += `${field.name}: ${typeScriptType}${nullability}${list}\n`;
      }

      exportedTypes += `}\n\n`;
    }

    for (const enumType of dataModel.enums) {
      exportedTypes += `export const ${enumType.name} = {`;

      for (const enumValue of enumType.values) {
        exportedTypes += `${enumValue.name}: "${enumValue.name}",\n`;
      }

      exportedTypes += "} as const;\n";

      exportedTypes += `export type ${enumType.name} = (typeof ${enumType.name})[keyof typeof ${enumType.name}];\n\n`;
    }

    const outputDir = options.generator.output?.value;
    if (!outputDir) {
      throw new Error("No output directory specified");
    }

    await writeFileSafely(path.join(outputDir, "index.ts"), exportedTypes);
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
