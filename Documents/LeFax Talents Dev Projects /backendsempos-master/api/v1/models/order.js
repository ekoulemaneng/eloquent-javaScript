const mongoose = require("mongoose")

const orderSchema = new mongoose.Schema(
    {
        tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
        order_id: { type: String, /* unique: true, */ required: true },
        sale: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
        delivery_employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        delivery_service: String,
        address:String,
        note:String,
        motif_annulation:String,
        pay_model:{ type: String, enum: ['Reglé', 'A la livraison', 'Date fixe'] },
        date_payment:{ type: Date, default: Date.now() },
        exp_fee:Number,
        payment_status:{ type: String, enum: ['Reglé', 'Attente de paiement','Annulé'],default:'Attente de paiement'  },
        payment_type:{ type: String, enum: ['Espèces', 'Orange money','Mtn money','Carte de credit'] },
        delivery_date: { type: Date, default: Date.now() },
        delivery_hour: String,
        delivery_time_period: String,
        tunnel: { type: String, enum: ['website', 'app-android', 'app-ios', 'pos'] },
        status: { type: String, enum: [ 'Non traitée', 'Traitée', 'Livraison en cours', 'Livrée','Annulée'],default:'Non traitée' },
        modifications_history: [
            {
                description: String,
                date: { type: Date, default: Date.now() }
            }
        ]
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('Order', orderSchema)
