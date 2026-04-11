import mongoose from "mongoose"

const companyschema = new mongoose.Schema({
    companyName: {
        type: String,
        requier: true
    },
    CompanyURL: {
        type: String,
        requier: true
    },
    emailId: {
        type: String,
        requier: true
    },
    pass: {
        type: String,
        requier: true
    },
    userType: {
        type: String,
        default: "organization"
    }
})


const comp = mongoose.models.companydata || mongoose.model("companydata", companyschema);

export default comp