//* --- R E C O R D   I N F O ---
//*
//* Below, copy the object model to use
//* Paste this in all the pages if some data are changed (paste inside the .save().then())

//* THE KEYS: oldData, newData and affectedPropertie are necessary only in updates.
//* Delete that if the record are not a update.

//  */ --- C O P Y   B E L O W ---
/*
 const recordInfo: ISendedRecord = {
    userWhoChanged: req.user.userID,
    affectedType: '',
    affectedData: req.user.userID,
    affectedPropertie: key,
    oldData: oldFields[key] !== undefined ? `"${oldFields[key]}"` : "",
    newData: changedFields[key] !== undefined ? `"${changedFields[key]}"` : "",
    action: '',
    category: '',
    company: req.user.company
}
*/

import { Request } from "express"

import Users from "../models/UserSchema.js"
import Companies from "../models/CompanySchema.js"
import Leads from "../models/LeadSchema.js"
import Realestates from "../models/RealEstateSchema.js"
import Records from "../models/RecordSchema.js";
import { ISendedRecord } from "../models/@types_ISendedRecord.js"

interface ILocalRecord extends ISendedRecord {
    affectedPropertie?: String,
    oldData?: String,
    newData?: String
}

const generateNewRecordID = async () => {
    try {
        const latestRecord = await Records.findOne().sort({ recordID: -1 }).exec();
        return latestRecord?.recordID ? latestRecord.recordID + 1 : 30000;
    } catch (error) {
        console.error('Erro ao gerar novo recordID:', error);
        throw error;
    }
};

async function hasSendedErrors (recordInfo: ILocalRecord) {
    const checkError = Object.entries(recordInfo)
    .some(value => value == undefined || null)

    //* Log errors
    checkError == true
    ? Object.entries(recordInfo)
    .forEach((value) => {
        if (value == undefined || null) console.log(value)
    })
    : null

    return checkError
}

//* Generate custom message for better understanding
const recordMessage = async (recordInfo: ILocalRecord) => {

    const check = await hasSendedErrors(recordInfo)
    if (check == true) {
        console.error(`There was an error because user sended errors to record`)
        return
    }

    const pickCreator = await Users.findOne({ userID: recordInfo.userWhoChanged });

    const creatorName = pickCreator ? `${pickCreator.name}` : 'Usuário desconhecido';

    let affectedDataText = '';

    // creating customs affectedDataText
    if (recordInfo.affectedType === "usuário") {
        const pick = await Users.findOne({ userID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.name} | id: ${pick.userID}` : 'Dados desconhecidos';

    } else if (recordInfo.affectedType === "imóvel") {
        const pick = await Realestates.findOne({ realStateID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.realStateID}` : 'Dados desconhecidos';

    } else if (recordInfo.affectedType === "empresa") {
        const pick = await Companies.findOne({ companyID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.name} | tel: ${pick.phone}` : 'Dados desconhecidos';

    } else if (recordInfo.affectedType === "lead") {
        const pick = await Leads.findOne({ leadID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.name} | id: ${pick.leadID}` : 'Dados desconhecidos';
    } else if (recordInfo.affectedType === "lead") {
        const pick = await Leads.findOne({ leadID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.name} | id: ${pick.leadID}` : 'Dados desconhecidos';
    }


    // creating messages
    if (recordInfo.action === "atualizou") {
        return `O usuário ${creatorName} atualizou a propriedade ${recordInfo.affectedPropertie} do(a) ${recordInfo.affectedType} ${affectedDataText}, de ${recordInfo.oldData} para ${recordInfo.newData}.`;

    } else if (recordInfo.action === "retirou") {
        return `O usuário ${creatorName} retirou o membro ${affectedDataText} de sua equipe.`;

    } else {
        return `O usuário ${creatorName} ${recordInfo.action} o(a) ${recordInfo.affectedType} ${affectedDataText}.`;
    }
};

export default async (recordInfo: ILocalRecord, req: Request) => {
    try {
        const newRecord = {...recordInfo,
            recordID: await generateNewRecordID(),
            message: await recordMessage(recordInfo),
            createdAt: new Date()
        }

        const record = new Records(newRecord);
        await record.save();

    } catch (err) {
        console.error('Erro ao criar registro:', err);
        req.flash('errorMsg', `Erro ao criar registro.`)
        throw err;
    }
};