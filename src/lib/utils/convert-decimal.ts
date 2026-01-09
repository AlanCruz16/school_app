import { Decimal } from '@prisma/client/runtime/library'

export const serializeDecimal = <T>(obj: T): T => {
    if (obj === null || obj === undefined) {
        return obj
    }

    if (typeof obj === 'object') {
        if (obj instanceof Decimal) {
            return obj.toNumber() as any
        }

        if (obj instanceof Date) {
            return obj.toISOString() as any
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => serializeDecimal(item)) as any
        }

        const newObj: any = {}
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                newObj[key] = serializeDecimal((obj as any)[key])
            }
        }
        return newObj
    }

    return obj
}
