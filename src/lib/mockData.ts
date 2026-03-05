// Mock data for the church fundraising system
export const MOCK_CHURCH = {
  name: "Grace Community Church",
  annualGoal: 500000,
  totalCollected: 187500,
  currentProject: {
    name: "New Community Center",
    targetAmount: 200000,
    collectedAmount: 78500,
    description: "Building a modern community center for worship, fellowship, and outreach programs.",
  },
};

export const MOCK_GROUPS = [
  { id: "1", name: "Faith Warriors", totalContributed: 52000, memberCount: 24, leaderId: "u1" },
  { id: "2", name: "Living Waters", totalContributed: 45800, memberCount: 18, leaderId: "u2" },
  { id: "3", name: "Kingdom Builders", totalContributed: 38200, memberCount: 21, leaderId: "u3" },
  { id: "4", name: "Shining Stars", totalContributed: 31500, memberCount: 15, leaderId: "u4" },
  { id: "5", name: "Grace Givers", totalContributed: 20000, memberCount: 12, leaderId: "u5" },
];

export const MOCK_USER = {
  id: "u10",
  fullName: "Sarah Kimani",
  phone: "+254712345678",
  category: "Church Member" as const,
  groupId: "1",
  groupName: "Faith Warriors",
  annualGoal: 24000,
  totalContributed: 15600,
  role: "member" as const,
  xp: 2450,
  level: 3,
  streak: 12,
};

export const LEVELS = [
  { level: 1, name: "Seed Sower", minXP: 0, icon: "Sprout" },
  { level: 2, name: "Faithful Giver", minXP: 500, icon: "Leaf" },
  { level: 3, name: "Kingdom Builder", minXP: 2000, icon: "Hammer" },
  { level: 4, name: "Pillar of Faith", minXP: 5000, icon: "Church" },
  { level: 5, name: "Crown Bearer", minXP: 10000, icon: "Crown" },
];

export const BADGES = [
  { id: "first", name: "First Step", description: "Made your first contribution", icon: "Star", earned: true },
  { id: "quarter", name: "25% There", description: "Reached 25% of your goal", icon: "Flame", earned: true },
  { id: "half", name: "Halfway Hero", description: "Reached 50% of your goal", icon: "Target", earned: true },
  { id: "three-quarter", name: "Almost There", description: "Reached 75% of your goal", icon: "Rocket", earned: false },
  { id: "complete", name: "Goal Crusher", description: "Completed your annual goal!", icon: "Trophy", earned: false },
  { id: "streak7", name: "Weekly Warrior", description: "7-day contribution streak", icon: "Gem", earned: true },
  { id: "streak30", name: "Monthly Champion", description: "30-day contribution streak", icon: "Sparkles", earned: false },
];

export const MOCK_CONTRIBUTIONS = [
  { id: "c1", amount: 2000, date: "2026-03-01", project: "General Fund", method: "M-Pesa" },
  { id: "c2", amount: 5000, date: "2026-02-15", project: "New Community Center", method: "M-Pesa" },
  { id: "c3", amount: 1500, date: "2026-02-01", project: "General Fund", method: "Bank" },
  { id: "c4", amount: 3000, date: "2026-01-20", project: "New Community Center", method: "M-Pesa" },
  { id: "c5", amount: 2100, date: "2026-01-05", project: "General Fund", method: "M-Pesa" },
  { id: "c6", amount: 2000, date: "2025-12-15", project: "General Fund", method: "Cash" },
];

export const MOCK_GROUP_MEMBERS = [
  { id: "u10", fullName: "Sarah Kimani", totalContributed: 15600, goalPercent: 65, level: 3 },
  { id: "u11", fullName: "James Ochieng", totalContributed: 12000, goalPercent: 50, level: 2 },
  { id: "u12", fullName: "Mary Wanjiku", totalContributed: 10800, goalPercent: 45, level: 2 },
  { id: "u13", fullName: "Peter Mwangi", totalContributed: 8200, goalPercent: 34, level: 2 },
  { id: "u14", fullName: "Grace Atieno", totalContributed: 5400, goalPercent: 22, level: 1 },
];
