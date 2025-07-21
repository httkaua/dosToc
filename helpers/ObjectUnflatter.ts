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





//* ---------- HANDLER 2: NORMALIZER ----------
/**
 * Recursively converts string values to their appropriate types in an object
 * @param obj - Any object, array, or primitive value to be converted
 * @returns Object with converted types (strings to numbers, booleans, null, etc.)
 */
function ConvertObjectTypes<T = any>(obj: any): T {
    // If it's not a valid object, return as is
    if (obj === null || obj === undefined) {
        return obj;
    }

    // If it's a string, try to convert it
    if (typeof obj === 'string') {
        return convertString(obj) as T;
    }

    // If it's an array, process each item
    if (Array.isArray(obj)) {
        return obj.map(item => ConvertObjectTypes(item)) as T;
    }

    // If it's an object, process each property
    if (typeof obj === 'object') {
        const result: any = {};

        for (const [key, value] of Object.entries(obj)) {
            result[key] = ConvertObjectTypes(value);
        }

        return result as T;
    }

    // For other types (number, boolean, etc), return as is
    return obj;
}

function convertString(str: string): any {
    // Remove whitespace
    const trimmed = str.trim();

    // Convert 'null' to null
    if (trimmed.toLowerCase() === 'null') {
        return null;
    }

    // Convert 'undefined' to undefined
    if (trimmed.toLowerCase() === 'undefined') {
        return undefined;
    }

    // Convert 'true'/'false' to boolean
    if (trimmed.toLowerCase() === 'true') {
        return true;
    }
    if (trimmed.toLowerCase() === 'false') {
        return false;
    }

    // Try to convert to number
    if (trimmed !== '' && !isNaN(Number(trimmed))) {
        const num = Number(trimmed);
        // Check if it's a valid integer or decimal number
        if (Number.isFinite(num)) {
            return num;
        }
    }

    // Try to convert JSON (objects/arrays as string)
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
            const parsed = JSON.parse(trimmed);
            return ConvertObjectTypes(parsed);
        } catch {
            // If it fails, return the original string
            return str;
        }
    }

    // If couldn't convert, return the original string
    return str;
}

// Example usage:
/*
const example = {
  id: '123',
  name: 'John',
  age: '30',
  active: 'true',
  salary: '2500.50',
  notes: 'null',
  tags: ['tag1', '456', 'false'],
  address: {
    street: 'Street A',
    number: '100',
    active: 'true',
    coordinates: {
      lat: '-23.5505',
      lng: '-46.6333'
    }
  },
  settings: '{"theme": "dark", "notifications": "true"}'
};

const result = ConvertObjectTypes(example);
console.log(result);

/* Expected result:
{
  id: 123,
  name: 'John',
  age: 30,
  active: true,
  salary: 2500.5,
  notes: null,
  tags: ['tag1', 456, false],
  address: {
    street: 'Street A',
    number: 100,
    active: true,
    coordinates: {
      lat: -23.5505,
      lng: -46.6333
    }
  },
  settings: { theme: 'dark', notifications: true }
}
*/




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

        // Convert string numbers
        if (value !== '' && !isNaN(Number(value)) && !isNaN(parseFloat(value))) {
            // Check if it's an integer
            if (Number.isInteger(parseFloat(value))) {
                return parseInt(value, 10);
            }
            // Otherwise it's a float
            return parseFloat(value);
        }

        return value;
    };

    // Helper function to fix type based on original value type
    const fixTypeBasedOnOriginal = (originalValue: any, newValue: any): any => {
        // If original is null/undefined, return converted new value as is
        if (originalValue === null || originalValue === undefined) {
            return convertStringToType(newValue);
        }

        const originalType = typeof originalValue;
        const convertedNewValue = convertStringToType(newValue);

        // If new value is undefined and original is boolean, treat as false
        if (originalType === 'boolean' && (newValue === undefined || newValue === null)) {
            return false;
        }

        // If types match after conversion, return converted value
        if (typeof convertedNewValue === originalType) {
            return convertedNewValue;
        }

        // If original is number and new value is string number, convert it
        if (originalType === 'number' && typeof newValue === 'string') {
            const numValue = convertStringToType(newValue);
            if (typeof numValue === 'number') {
                return numValue;
            }
        }

        // If original is boolean and new value is string boolean, convert it
        if (originalType === 'boolean' && typeof newValue === 'string') {
            if (newValue === 'true') return true;
            if (newValue === 'false') return false;
            // If it's a truthy/falsy string, convert accordingly
            if (newValue === '1' || newValue === 'yes' || newValue === 'on') return true;
            if (newValue === '0' || newValue === 'no' || newValue === 'off') return false;
        }

        return convertedNewValue;
    };

    // Helper function to fully normalize a value
    const normalizeValue = (value: any, originalValue: any = null): any => {
        const converted = originalValue !== null ? fixTypeBasedOnOriginal(originalValue, value) : convertStringToType(value);
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
            const originalOldValue = oldObj[key];
            const originalNewValue = newObj[key];
            const oldValue = normalizeValue(originalOldValue);
            const newValue = normalizeValue(originalNewValue, originalOldValue);

            // Check if the key exists in the second object
            if (!(key in newObj)) {
                // Only add if the old value is not null/empty
                if (oldValue !== null) {
                    result.differentKeys[fullKeyPath] = [originalOldValue, undefined];
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
                const nestedResult = compareObjects(originalOldValue, originalNewValue, fullKeyPath);
                // Merge nested results into the main result
                Object.assign(result.differentKeys, nestedResult.differentKeys);
                continue;
            }

            // For arrays and primitives, do a comparison
            if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                result.differentKeys[fullKeyPath] = [originalOldValue, originalNewValue];
            }
        }
    }

    // Find missing keys only at the root level to avoid duplicates
    if (keyPath === '') {
        result.missingKeys = findMissingKeys(oldObj, newObj);
    }

    return result;
}

// Example usage:
/*
const obj1 = {
  name: "Jhon",
  age: 24,
  active: true,
  price: 420000,
  description: null,
  financeable: true,
  address: {
    street: "123 Main St",
    city: "New York",
    zipCode: ""
  },
  hobbies: ["reading", "swimming"]
};

const obj2 = {
  name: "John",
  age: "25",
  active: "true",
  price: "420000",
  description: "",
  financeable: undefined,
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
     age: [24, "25"],
     financeable: [true, undefined],
     "address.city": ["New York", "Boston"],
     hobbies: [["reading", "swimming"], ["reading", "running"]]
   },
   missingKeys: ["email"]
 }

//* Note: (true vs "true"), (null vs ""), ("" vs null), (478 vs "478") are not shown as they're equivalent here
*/



export { unflattenObject, ConvertObjectTypes, compareObjects };