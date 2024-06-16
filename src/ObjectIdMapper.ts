type IdGenerator = (obj: Object) => string
type IdDecorator = (obj: Object, uniqueId: string) => string

export class ObjectIdMapper {
    readonly idGenerator: IdGenerator
    readonly idDecorator: IdDecorator

    protected readonly idMap = new WeakMap<WeakKey, string>();

    constructor(
        {idGenerator, idDecorator}: {
            idGenerator?: IdGenerator,
            idDecorator?: IdDecorator,
        }
    ) {
        this.idGenerator = idGenerator ?? (() => {
            return crypto.randomUUID()
        })
        this.idDecorator = idDecorator ?? ((_: Object, uniqueId: string) => {
            return uniqueId
        })
    }

    getId(obj: Object) {
        let objectId = this.idMap.get(obj);
        if (objectId) {
            return objectId
        }
        // Assign Unique ID
        objectId = this.idDecorator(obj, this.idGenerator(obj))
        this.idMap.set(obj, objectId)
        return objectId
    }
}

