//* Instead of create the same logic for all the "UPDATE" routes
//* I created this helper, for better readability

//* It compares the form data (sent by the client) to the current data (in the Database)
//* Then, save the changes in the database, and create the record

function flatOldData(obj: any, prefix = '', res: any = {}) {
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof require('mongodb').ObjectId)) {
      flatOldData(val, newKey, res);
    } else {
      res[newKey] = val;
    }
  }
  return res;
}

function normalizeNewData(value: any) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(value) && value !== '') return Number(value);
  return value;
}


export default async () => {

}