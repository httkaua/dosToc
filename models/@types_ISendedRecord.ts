import Records, { IRecord } from "./RecordSchema.js"

export type ISendedRecord = Pick<IRecord,
'userWhoChanged' | 'affectedType' | 'affectedPropertie'
| 'oldData' | 'newData'
| 'affectedData' | 'action' | 'category' | 'company'
>;
