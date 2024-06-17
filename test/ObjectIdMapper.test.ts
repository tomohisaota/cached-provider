import {ObjectIdMapper} from "../src/ObjectIdMapper";

describe("idGenerator", () => {
    test('default idGenerator generates random ids for random object', () => {
        const idm = new ObjectIdMapper()
        const ids = new Set<string>()
        const max = 1000
        for (let i = 0; i < max; i++) {
            ids.add(idm.idGenerator({}))
        }
        expect(ids.size).toEqual(max)
    });

    test('default idGenerator generates random ids for same object', () => {
        const idm = new ObjectIdMapper()
        const ids = new Set<string>()
        const max = 1000
        const sameObject = {}
        for (let i = 0; i < max; i++) {
            ids.add(idm.idGenerator(sameObject))
        }
        expect(ids.size).toEqual(max)
    });

    test('idGenerator injection', () => {
        const testId = "testId"
        const idm = new ObjectIdMapper({
            idGenerator: () => testId
        })
        expect(idm.idGenerator({})).toEqual(testId)
    });
})

describe("idDecorator", () => {
    test('default idDecorator do nothing', () => {
        const idm = new ObjectIdMapper()
        expect(idm.idDecorator({}, "aaa")).toEqual("aaa")
        expect(idm.idDecorator({}, "bbb")).toEqual("bbb")
    });

    test('idDecorator injection', () => {
        const testId = "testId"
        const idm = new ObjectIdMapper({
            idGenerator: () => testId,
            idDecorator: (_, uniqueId) => `pre_${uniqueId}_post`
        })
        expect(idm.idDecorator({}, testId)).toEqual(`pre_${testId}_post`)
    });
})

describe("getId", () => {
    test('getId generates random ids for random object', () => {
        const idm = new ObjectIdMapper()
        const ids = new Set<string>()
        const max = 1000
        for (let i = 0; i < max; i++) {
            ids.add(idm.getId({}))
        }
        expect(ids.size).toEqual(max)
    });

    test('getId generates same id for same object', () => {
        const idm = new ObjectIdMapper()
        const ids = new Set<string>()
        const max = 1000
        const sameObject = {}
        for (let i = 0; i < max; i++) {
            ids.add(idm.getId(sameObject))
        }
        expect(ids.size).toEqual(1)
    });
})