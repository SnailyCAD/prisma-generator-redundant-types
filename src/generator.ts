import { generatorHandler, GeneratorOptions } from '@prisma/generator-helper'
import path from 'node:path'

import { writeFileSafely } from './utils/writeFileSafely'
import { genEnum } from './helpers/genEnum'

generatorHandler({
  onManifest() {
    return {
      defaultOutput: './json-schema',
      prettyName: 'Prisma JSON Schema Generator',
    }
  },
  onGenerate: async (options: GeneratorOptions) => {
    let modelStr = ''

    options.dmmf.datamodel.models.forEach((model) => {
      const type = `export interface ${model.name} {
        ${model.fields
          .map((field) => {
            const typeScriptType = getTypeScriptType(field.type)
            const nullable = field.isRequired ? '' : '| null'
            const list = field.isList ? '[]' : ''

            return `${field.name}: ${typeScriptType}${nullable}${list}`
          })
          .join('\n')}
      }`

      modelStr += type + '\n\n'
    })

    options.dmmf.datamodel.enums.forEach((enumType) => {
      const type = genEnum(enumType)

      modelStr += type + '\n\n'
    })

    await writeFileSafely(
      path.join(options.generator.output?.value!, 'index.ts'),
      modelStr,
    )
  },
})

function getTypeScriptType(type: string) {
  switch (type) {
    case 'Decimal':
    case 'Int':
    case 'Float':
    case 'BigInt':
      return 'number'
    case 'DateTime':
      return 'Date'
    case 'Boolean':
      return 'boolean'
    case 'Json':
      return 'any'
    case 'String':
      return 'string'
    default:
      return type
  }
}
