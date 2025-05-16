import mongoose, { Document, ObjectId, Schema, Types } from "mongoose"

export interface ICompany extends Document {
    _id: ObjectId
    companyID: number
    name: string
    document: string
    phone: string
    email: string
    team: {
        owner: Types.ObjectId
        supervisors?: Types.ObjectId[]
        agents?: Types.ObjectId[]
        assistants?: Types.ObjectId[]
    }
    realEstates?: Types.ObjectId[]
    address: {
        locationCode?: string
        street?: string
        streetNumber?: string
        neighborhood?: string
        city?: string
        state?: string
        country?: string
    }
    plan?:
    'free' |
    'single' |
    'business'
    
    settings: {
        TeamPermissions: {
	        SupervisorPermissions: { //* Position index: 4
                deleteUser: Boolean,
                changeQueueOrder: Boolean
            },
            AgentPermissions: { //* Position index: 5
                createRealEstate: Boolean
                deleteRealEstate: Boolean
            },
            AssistantPermissions: { //* Position index: 6
                createRealEstate: Boolean
                deleteRealEstate: Boolean
            }
        },
        Notify: {
            UserInactivity5days: Boolean
            NoRespondLeads: Boolean
            DailySummary: Boolean
            UserTasks: Boolean
            LeadsCriticalUpdate: Boolean
            RealEtateValueUpdate: Boolean
        },
        DeadlineLeadsOption: Boolean
        DeadlineRespondLeads: Number
        MaxLeadsPerAgent: Number
        RealEstateDefaults: {
            DefaultCurrency: String
            ShowTaxFields: Boolean
        }
    }
    leadQueue: Types.ObjectId[]
    agentQueue: Types.ObjectId[]
    createdAt: Date
    updatedAt: Date
    enabled: Boolean
  }

const companySchema = new Schema<ICompany>({
    companyID: {
        type: Number,
        required: true,
        immutable: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50
    },
    document: {
        type: String,
        trim: true,
        maxlength: 50
    },
    phone: { //* E.164 pattern
        type: String,
        required: true,
        unique: true,
        minlength: 8,
        maxlength: 15,
        match: /^\+[0-9]{6,14}$/
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        maxlength: 50,
        match: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    },
    team: {
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'users',
            immutable: true,
            select: false,
            required: true
        },
        supervisors: {
            type: [Schema.Types.ObjectId],
            ref: 'users',
            default: []
        },
        agents: {
            type: [Schema.Types.ObjectId],
            ref: 'users',
            default: []
        },
        assistants: {
            type: [Schema.Types.ObjectId],
            ref: 'users',
            default: []
        }
    },

    realEstates: {
        type: Schema.Types.ObjectId,
        ref: 'users'
    },
    address: {
        locationCode: {
            type: String,
            trim: true,
            maxlength: 20
        },
        street: {
            type: String,
            trim: true,
            maxlength: 50
        },
        streetNumber: {
            type: Number,
            trim: true,
            min: 0,
            max: 99999
        },
        neighborhood: {
            type: String,
            trim: true,
            maxlength: 50
        },
        city: {
            type: String,
            trim: true,
            maxlength: 50
        },
        state: {
            type: String,
            trim: true,
            maxlength: 50
        },
        country: {
            type: String,
            trim: true,
            maxlength: 50
        }
    },

    plan: {
        type: String,
        enum: [
            'free',
            'single',
            'business'
        ]
    },
    settings: {
        TeamPermissions: { 
	        SupervisorPermissions: { //* Position index: 4
                deleteUser: {
                    type: Boolean,
                    default: true
                },
                changeQueueOrder: {
                    type: Boolean,
                    default: true
                }
            },
            AgentPermissions: { //* Position index: 5
                createRealEstate: {
                    type: Boolean,
                    default: false
                },
                deleteRealEstate: {
                    type: Boolean,
                    default: false
                }
            },
            AssistantPermissions: { //* Position index: 6
                createRealEstate: {
                    type: Boolean,
                    default: true
                },
                deleteRealEstate: {
                    type: Boolean,
                    default: false
                }
            }
        },
        Notify: {
            UserInactivity5days: { //* Users who didn't do any login in the last 5 days
                type: Boolean,
                default: true
            },
            NoRespondLeads: { //* Agents who missed the leads by deadline
                type: Boolean,
                default: true
            },
            DailySummary: { //* Quick report about preview day
                type: Boolean,
                default: true
            },
            UserTasks: { //* Tasks the users have been created
                type: Boolean,
                default: true
            },
            LeadsCriticalUpdate: {
                type: Boolean,
                default: true
            },
            RealEtateValueUpdate: { //* Real Estates that had some value field changed
                type: Boolean,
                default: true
            }
        },
        DeadlineLeadsOption: { //* If true, after deadline, the lead will be enter in the queue
            type: Boolean,
            default: true
        },
        DeadlineRespondLeads: { //* In days
            type: Number,
            default: 5,
            min: 0,
            max: 30
        },
        MaxLeadsPerAgent: { //* To avoid leads withholding
            type: Number,
            default: 100,
            min: 0,
            max: 300
        },
        RealEstateDefaults: {
            DefaultCurrency: {
                type: String,
                default: 'BRL'
            },
            ShowTaxFields: { //* In the real estate create and update page
                type: Boolean,
                default: true
            }
        }
    },

    leadQueue: [{
        type: Schema.Types.ObjectId,
        ref: 'leads'
    }],
    agentQueue: [{ //* For the leads distribution
        type: Schema.Types.ObjectId,
        ref: 'users'
    }],
    createdAt: {
        type: Date,
        default: new Date,
        immutable: true
    },
    updatedAt: {
        type: Date,
        default: new Date
    },
    enabled: {
        type: Boolean,
        default: true
    }
});

const Companies = mongoose.model<ICompany>('companies', companySchema)
export default Companies