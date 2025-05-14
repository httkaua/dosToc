import mongoose, { Document, Schema } from "mongoose"
import { Request } from "express"

import Users from "../models/UserSchema.js"
import Companies from "../models/CompanySchema.js"
import Leads from "../models/LeadSchema.js"
import Realestates from "../models/RealEstateSchema.js"
import Records, { IRecord } from "../models/RecordSchema.js";

interface ILocalRecord extends ISendedRecord {
    affectedPropertie?: String,
    oldData?: String,
    newData?: String
}

import { ISendedRecord } from "../models/@types_ISendedRecord.js"

// RECORDINFO Model for each record to save. Paste this in all the pages if some data are changed (paste inside the .save().then())

// oldData, newData and affectedPropertie keys are necessary only in updates. Delete that if the record are not a update.

/*
const recordInfo = {
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

// generate new recordID
const generateNewRecordID = async () => {
    try {
        const latestRecord = await Records.findOne().sort({ recordID: -1 }).exec();
        return latestRecord?.recordID ? latestRecord.recordID + 1 : 30000;
    } catch (error) {
        console.error('Erro ao gerar novo recordID:', error);
        throw error;
    }
};

// Generate custom message
const recordMessage = async (recordInfo: ILocalRecord) => {

    const pickCreator = await Users.findOne({ userID: recordInfo.userWhoChanged });

    const creatorName = pickCreator ? `${pickCreator.firstName} ${pickCreator.lastName}` : 'Usuário desconhecido';

    let affectedDataText = '';

    // creating customs affectedDataText
    if (recordInfo.affectedType === "usuário") {
        const pick = await Users.findOne({ userID: recordInfo.affectedData });
        affectedDataText = pick ? `${pick.firstName} ${pick.lastName} | id: ${pick.userID}` : 'Dados desconhecidos';

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

// create and save the record
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
