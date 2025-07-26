const Stripe = require('stripe');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_yourkey');

module.exports = stripe; 