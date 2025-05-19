/* --- UPDATE COMPARISION ---
 * Instead of create the same logic for all the "UPDATE" routes
 * I created this helper, for better readability
 * 
 * It compares the form data (sent by the client) to the current data (in the Database)
 * Then, save the changes in the database, and create the record
 */

import { Types } from "mongoose";

/* --- EXPECTED ARGUMENTS
 * oldData: Current MongoDB document
 * newData: express Request
 * changeableKeys? (optional): an array containing each authorized key the user can change, string flat format
 */


function flatOldData(obj: any, prefix = '', res: any = {}) {
  for (const key in obj) {
    const val = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (val !== null &&
        typeof val === 'object' &&
        !Array.isArray(val) &&
        !(val instanceof Date)) {

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


export default (oldData: any, newData: Record<string, any>, changeableKeys?: string[]) => {

    const oldFlatted = flatOldData(oldData)
    //const newNormalized: Record<string, any> = {}

    //for (const key in newData.body) {
    //    newNormalized[key] = normalizeNewData(newData.body[key])
    //}

    console.log(newData)
    //console.log(newNormalized)

    const oldFields: Record<string, any> = {};
    const newFields: Record<string, any> = {};
    
    for (const key in oldFlatted) {
        const oldValue = oldFlatted[key]
        //const newValue = newNormalized[key]

        //if (newValue !== oldValue) {
            //oldFields[key] = oldValue
            //newFields[key] = newValue
       // }

    }

    return {
        old: {
            ...oldFields
        },
        new: {
            ...newFields
        }
    }
}