/**
 * Stripe Plan boundaries configuration.
 * Defines maximum resources allocated for each plan subscription.
 */
export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxTasks: 15,
    maxMembers: 3,
    label: "Free Plan"
  },
  pro: {
    maxProjects: 5,
    maxTasks: 100,
    maxMembers: 10,
    label: "Pro Plan"
  },
  team: {
    maxProjects: Infinity,
    maxTasks: Infinity,
    maxMembers: Infinity,
    label: "Team Plan"
  }
};

export default PLAN_LIMITS;
