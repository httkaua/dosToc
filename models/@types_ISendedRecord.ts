import Records, { IRecord } from "../models/RecordsSchema.js"

export type ISendedRecord = Pick<IRecord,
'userWhoChanged' | 'affectedType' | 'affectedPropertie'
| 'oldData' | 'newData'
| 'affectedData' | 'action' | 'category' | 'company'
>;
