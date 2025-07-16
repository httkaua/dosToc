//* ---------- HANDLER 1: UNFLATTER ----------
/**
 * Converts a flat object with keys using point notation into a nested object
 * @param flatObj - Object with flat keys (ex: "address.street", "owner.name")
 * @returns Object with nested structure
 */
function unflattenObject(flatObj: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(flatObj)) {
        const keys = key.split('.');
        let current = result;

        // Navega através das chaves criando objetos aninhados conforme necessário
        for (let i = 0; i < keys.length - 1; i++) {
            const currentKey = keys[i];

            if (!(currentKey in current)) {
                current[currentKey] = {};
            }

            current = current[currentKey];
        }

        // Define o valor na última chave
        const lastKey = keys[keys.length - 1];
        current[lastKey] = value;
    }

    return result;
}

// Exemplo de uso
const flatObject = {
    "address.street": "Rua das Flores, 123",
    "address.neighborhood": "Centro",
    "address.city": "São Paulo",
    "owner.name": "João Silva",
    "owner.phone": "(11) 99999-9999",
    "owner.email": "joao@email.com",
    "property.type": "apartamento",
    "property.rooms": 3,
    "property.area": 80.5,
    "metadata.created": "2024-01-15",
    "metadata.updated": "2024-01-20"
};

const nestedObject = unflattenObject(flatObject);
console.log(JSON.stringify(nestedObject, null, 2));





//* ---------- HANDLER 2: NORMALIZER ----------
/**
 * Converts strange keys, like "true" into true (boolean)
 * @param unevenObj - Object with irregular keys (ex: "true", NaN, undefined, null, "null", "460", etc.)
 * @returns Object with regular keys (strings converts to correct type)
 */
function normalizeObject(unevenObj: Record<string, any>) {

    let newObject: Record<string, any> = {}

    const traverse = (current: any) => {
        for (const value of Object.entries(current)) {



            if (value && typeof value === 'object' && !Array.isArray(value)) {
                traverse(value);
            }
        }
    }

    const normalizedObj = traverse(unevenObj)
    return normalizedObj

}




//* ---------- HANDLER 3: COMPARATOR ----------
type ComparisonResult = {
    differentKeys: Record<string, [any, any]>;
    missingKeys: string[];
};

/**
 * Compares two objects recursively and returns the differences
 * @param oldObj - The first object (source of truth for structure)
 * @param newObj - The second object to compare against
 * @param keyPath - Internal parameter for tracking nested paths
 * @returns Object containing differentKeys with [oldValue, newValue] arrays
 */
function compareObjects(
    oldObj: Record<string, any>,
    newObj: Record<string, any>,
    keyPath: string = ''
): ComparisonResult {
    const result: ComparisonResult = { differentKeys: {}, missingKeys: [] };

    // Helper function to build the full key path for nested objects
    const buildKeyPath = (key: string): string => {
        return keyPath ? `${keyPath}.${key}` : key;
    };

    // Helper function to normalize empty/null values
    const normalizeEmptyValues = (value: any): any => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        return value;
    };

    // Helper function to convert string representations to their actual types
    const convertStringToType = (value: any): any => {
        if (typeof value !== 'string') {
            return value;
        }

        // Convert string booleans
        if (value === 'true') return true;
        if (value === 'false') return false;

        // Convert string null/undefined
        if (value === 'null') return null;
        if (value === 'undefined') return undefined;

        return value;
    };

    // Helper function to fully normalize a value
    const normalizeValue = (value: any): any => {
        const converted = convertStringToType(value);
        return normalizeEmptyValues(converted);
    };

    // Internal function to find missing keys (keys in newObj but not in oldObj)
    const findMissingKeys = (
        oldObject: Record<string, any>,
        newObject: Record<string, any>,
        currentPath: string = ''
    ): string[] => {
        const missing: string[] = [];

        for (const key in newObject) {
            if (newObject.hasOwnProperty(key)) {
                const fullPath = currentPath ? `${currentPath}.${key}` : key;
                const newValue = normalizeValue(newObject[key]);

                if (!(key in oldObject)) {
                    // Only add if the new value is not null/empty
                    if (newValue !== null) {
                        missing.push(fullPath);
                    }
                } else if (
                    typeof oldObject[key] === 'object' &&
                    typeof newObject[key] === 'object' &&
                    oldObject[key] !== null &&
                    newObject[key] !== null &&
                    !Array.isArray(oldObject[key]) &&
                    !Array.isArray(newObject[key])
                ) {
                    // Recursively check nested objects
                    const nestedMissing = findMissingKeys(oldObject[key], newObject[key], fullPath);
                    missing.push(...nestedMissing);
                }
            }
        }

        return missing;
    };

    // Iterate through all keys in the first object
    for (const key in oldObj) {
        if (oldObj.hasOwnProperty(key)) {
            const fullKeyPath = buildKeyPath(key);
            const oldValue = normalizeValue(oldObj[key]);
            const newValue = normalizeValue(newObj[key]);

            // Check if the key exists in the second object
            if (!(key in newObj)) {
                // Only add if the old value is not null/empty
                if (oldValue !== null) {
                    result.differentKeys[fullKeyPath] = [oldObj[key], undefined];
                }
                continue;
            }

            // Skip if both values are null/empty after normalization
            if (oldValue === null && newValue === null) {
                continue;
            }

            // Handle nested objects recursively
            if (
                typeof oldValue === 'object' &&
                typeof newValue === 'object' &&
                oldValue !== null &&
                newValue !== null &&
                !Array.isArray(oldValue) &&
                !Array.isArray(newValue)
            ) {
                const nestedResult = compareObjects(oldValue, newValue, fullKeyPath);
                // Merge nested results into the main result
                Object.assign(result.differentKeys, nestedResult.differentKeys);
                continue;
            }

            // For arrays and primitives, do a comparison
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                result.differentKeys[fullKeyPath] = [oldObj[key], newObj[key]];
            }
        }
    }

    // Find missing keys only at the root level to avoid duplicates
    if (keyPath === '') {
        result.missingKeys = findMissingKeys(oldObj, newObj);
    }

    return result;
}

//* Example usage:
/*
const obj1 = {
  name: "Jhon",
  age: 24,
  active: true,
  description: null,
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: ""
  },
  hobbies: ["reading", "swimming"]
};

const obj2 = {
  name: "John",
  age: 25,
  active: "true",
  description: "",
  address: {
    street: "123 Main St",
    city: "Boston",
    zipCode: null
  },
  hobbies: ["reading", "running"],
  email: "john@example.com"
};

const differences = compareObjects(obj1, obj2);
console.log(differences);
 Output: {
   differentKeys: {
     name: ["Jhon", "John"],
     age: [24, 25],
     "address.city": ["New York", "Boston"],
     hobbies: [["reading", "swimming"], ["reading", "running"]]
   },
   missingKeys: ["email"]
 }

//* Note: active (true vs "true"), description (null vs ""), and zipCode ("" vs null) are not shown as they're equivalent
*/



export { unflattenObject, compareObjects };