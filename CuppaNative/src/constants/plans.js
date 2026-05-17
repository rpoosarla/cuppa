export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    type: 'Free',
    price: 0,
    dailyLikes: 5,
    dailyMessages: 0,
    canSeeLists: false,
    canLikeFromLists: false,
    hasPremiumModes: false,
  },
  BASIC: {
    name: 'Weekly Spark',
    type: 'Basic',
    price: 99,
    dailyLikes: 10,
    dailyMessages: 10,
    canSeeLists: true,
    canLikeFromLists: false,
    hasPremiumModes: false,
  },
  STANDARD: {
    name: 'Monthly Flame',
    type: 'Standard',
    price: 399,
    dailyLikes: Infinity,
    dailyMessages: Infinity,
    canSeeLists: true,
    canLikeFromLists: true,
    hasPremiumModes: false,
  },
  PREMIUM: {
    name: '6 Month Gold',
    type: 'Premium',
    price: 1999,
    dailyLikes: Infinity,
    dailyMessages: Infinity,
    canSeeLists: true,
    canLikeFromLists: true,
    hasPremiumModes: true,
  },
};

export const getPlanLimits = (planType) => {
  const plan = Object.values(SUBSCRIPTION_PLANS).find(p => p.type === planType) || SUBSCRIPTION_PLANS.FREE;
  return plan;
};
