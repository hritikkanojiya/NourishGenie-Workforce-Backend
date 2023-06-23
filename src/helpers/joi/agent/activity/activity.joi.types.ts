export interface MarkAttandanceType {
    email: string,
    fullName: string,
    activity: string
}

export interface GetTotalAgentActivityType {
    email: string
}

export interface GetAgentActivityType {
    email: string,
    date: {
        to: Date,
        from: Date
    }
}