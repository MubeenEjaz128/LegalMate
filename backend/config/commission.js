let commissionPercentage = 5; // Default 5%

module.exports = {
  getCommission: () => commissionPercentage,
  setCommission: (value) => { commissionPercentage = value; },
}; 