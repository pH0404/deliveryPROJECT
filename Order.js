const mongoose = require('mongoose');


const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true, required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  
  pickupAddress: {
    address: String, 
    coordinates: {   
      lat: { type: Number, required: true }, 
      lng: { type: Number, required: true }  
    },
    contactName: String,  
    contactPhone: String  
  },
  

  deliveryAddress: {
    address: String,
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true }
    },
    contactName: String,
    contactPhone: String
  },
  

  packageDetails: {
    description: String, 
    dimensions: {        
      length: Number,
      width: Number,
      height: Number
    },
  },
  

  payment: {
    amount: { type: Number, required: true },    
    currency: { type: String, default: 'USD' },  
    method: { type: String, enum: ['card', 'cash', 'online'], default: 'cash' },
    status: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' }
  },
  

  timeline: {
    estimatedPickup: Date,
    estimatedDelivery: Date,
    actualPickup: Date,
    actualDelivery: Date      
  },
  
  trackingHistory: [{
    status: String, 
    location: {    
      coordinates: { lat: Number, lng: Number },
      address: String
    },
    timestamp: { type: Date, default: Date.now }, 
    description: String 
  }],
  
  route: {
    polyline: String, 
    distance: Number, 
    duration: Number, 
    optimized: { type: Boolean, default: false } 
  }
}, { timestamps: true }); 


orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD${Date.now()}${count}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);