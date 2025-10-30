const Courier = require('../models/Courier');
const redis = require('redis');

class LocationService {
  constructor() {
    this.redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    this.redisClient.connect();
  }

  async updateCourierLocation(courierId, location) {
    const { lat, lng, address } = location;
    
    await this.redisClient.set(
      `courier:location:${courierId}`, 
      JSON.stringify({                 
        coordinates: { lat, lng },
        timestamp: new Date(),
        address
      }),
      { EX: 3600 }
    );

    await Courier.findOneAndUpdate(
      { user: courierId },
      {
        currentLocation: {
          coordinates: { lat, lng },
          timestamp: new Date(),
          address
        }
      }
    );

    return { success: true };
  }

  async getNearbyCouriers(location, radius = 5000) {

    
    const couriers = await Courier.find({
      status: 'available',    
      isActive: true,         
      currentLocation: {     
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [location.lng, location.lat] 
          },
          $maxDistance: radius 
        }
      }
    }).populate('user', 'profile name'); 

    return couriers; 
  }

  async getCourierLocation(courierId) {
    const cached = await this.redisClient.get(`courier:location:${courierId}`);
    if (cached) {
      return JSON.parse(cached);
    }


    const courier = await Courier.findOne({ user: courierId });
    return courier?.currentLocation;
  }
}

module.exports = new LocationService();